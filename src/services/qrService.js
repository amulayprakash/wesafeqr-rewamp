import {
  doc,
  getDoc,
  setDoc,
  collection,
  getDocs,
  addDoc,
  updateDoc,
  serverTimestamp,
  query,
  where,
  orderBy,
  limit,
  writeBatch,
} from 'firebase/firestore'
import { db } from '@/config/firebase'

// ─── Get a single QR code by passcode (public) ───────────────────────────────
// Normalises both the new format (uid + childId fields) and the legacy format
// where ownership is stored as UserID: "{uid} {suffix}" (e.g. "GXEf4... 1").
export async function getQRCode(passcode) {
  const ref = doc(db, 'QRCode', passcode)
  const snap = await getDoc(ref)
  if (!snap.exists()) return null
  const data = snap.data()

  // Resolve uid + childId from either format
  let uid = data.uid
  let childId = data.childId
  if (!uid && data.UserID) {
    const parts = data.UserID.trim().split(' ')
    uid = parts[0]
    const suffix = parts.slice(1).join('') || '1'
    childId = 'child' + suffix
  }

  // Treat as active if new status === 'active' OR legacy Consumed/consumed === true
  const isActive = data.status === 'active' || data.Consumed === true || data.consumed === true

  return { passcode, ...data, uid, childId, isActive }
}

// ─── Get all QR codes owned by a user ────────────────────────────────────────
export async function getUserQRCodes(uid) {
  const colRef = collection(db, 'QRCode')
  const q = query(colRef, where('uid', '==', uid))
  const snap = await getDocs(q)
  return snap.docs.map((d) => ({ passcode: d.id, ...d.data() }))
}

// ─── Activate (link) a QR code passcode to a user profile ───────────────────
// Throws if the QR is already claimed by another account.
export async function activateQRCode(uid, childId, passcode, { name, type }) {
  const ref = doc(db, 'QRCode', passcode)
  const existing = await getDoc(ref)

  if (existing.exists()) {
    const data = existing.data()
    if (data.uid && data.uid !== uid) {
      throw new Error('This QR code is already linked to another account.')
    }
  }

  await setDoc(
    ref,
    {
      uid,
      childId,
      name,
      type,        // 'wesafe' | 'lostfound' | 'vehicle'
      status: 'active',
      activatedAt: serverTimestamp(),
      lastScanned: null,
    },
    { merge: true }
  )
}

// ─── Check QR status without modifying it (for activation flow) ──────────────
// Uses exact Firestore field names: Consumed, UserMapped, UserID
export async function checkQRStatus(passcode) {
  const ref = doc(db, 'QRCode', passcode)
  const snap = await getDoc(ref)
  if (!snap.exists()) return { exists: false, consumed: false, storedUid: null }
  const data = snap.data()
  const consumed = data.Consumed === true || data.UserMapped === true
  return { exists: true, consumed, storedUid: data.UserID || null, ...data }
}

// ─── Connect a QR code to a user profile (URL-based activation flow) ─────────
// Updates QRCode doc using exact existing field names: Consumed, UserID, UserMapped
// compound UserID: "{uid} {childId minus 'child' prefix}"
//   child1 → "abc123 1",  childXYZ456 → "abc123 XYZ456"
// Also writes to Users/{uid}/ChildList/{childId}/wesafeqr/{passcode} for profile-linked listing
export async function connectQRToProfile(uid, childId, passcode) {
  const compoundUid = uid + ' ' + childId.replace(/^child/, '')
  const ref = doc(db, 'QRCode', passcode)

  const existing = await getDoc(ref)
  if (!existing.exists()) throw new Error('QR code not found.')

  const qrData = existing.data()
  const alreadyConsumed = qrData.Consumed === true || qrData.UserMapped === true
  if (alreadyConsumed && qrData.UserID && !qrData.UserID.startsWith(uid + ' ') && qrData.UserID !== uid) {
    throw new Error('This QR code is already linked to another account.')
  }

  const batch = writeBatch(db)

  // 1. Update QRCode document — only touch ownership fields, preserve all others
  batch.update(ref, {
    UserID: compoundUid,
    Consumed: true,
    UserMapped: true,
  })

  // 2. Write into profile's wesafeqr subcollection (doc ID = passcode)
  //    Stores display info so MyQRCodesPage can list without extra fetches
  const profileQRRef = doc(db, 'Users', uid, 'ChildList', childId, 'wesafeqr', passcode)
  batch.set(profileQRRef, {
    passcode,
    Passcode: qrData.Passcode || passcode,
    Label: qrData.Label || '',
    PIN: qrData.PIN || '',
    URL: qrData.URL || '',
    type: 'wesafe',
    connectedAt: serverTimestamp(),
  })

  await batch.commit()
}

// ─── Fetch all wesafe QRs linked to a specific profile ───────────────────────
// Reads from Users/{uid}/ChildList/{childId}/wesafeqr subcollection
export async function getProfileWeSafeQRs(uid, childId) {
  const colRef = collection(db, 'Users', uid, 'ChildList', childId, 'wesafeqr')
  const snap = await getDocs(colRef)
  return snap.docs.map((d) => ({ id: d.id, childId, ...d.data() }))
}

// ─── Fetch wesafe QRs across all profiles for a user ─────────────────────────
export async function getAllProfilesWeSafeQRs(uid, profiles) {
  if (!profiles?.length) return []
  const results = await Promise.all(
    profiles.map((p) => getProfileWeSafeQRs(uid, p.id).then((qrs) =>
      qrs.map((qr) => ({ ...qr, profileName: p.name || p.id, profileId: p.id }))
    ))
  )
  return results.flat()
}

// ─── Update QR code metadata ──────────────────────────────────────────────────
export async function updateQRCode(passcode, data) {
  const ref = doc(db, 'QRCode', passcode)
  await updateDoc(ref, { ...data, updatedAt: serverTimestamp() })
}

// ─── Record a scan event (updates lastScanned timestamp on QR doc) ───────────
export async function recordScan(passcode) {
  const ref = doc(db, 'QRCode', passcode)
  await updateDoc(ref, { lastScanned: serverTimestamp() }).catch(() => {})
}

// ─── Log a scan to the top-level qrcodescans collection ──────────────────────
// Fields match the original WeSafe backend format exactly.
export async function logScanToQRCodeScans({ userID, passcode, dob, latitude, longitude, ipAddress, permissionGiven, name, uid }) {
  try {
    const now = new Date()
    // Legacy format has a leading space, e.g. " 29 Sep 2023 11:09 AM"
    const datetime = ' ' + now.toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    })
    const smstext = `Alert - ${name || ''} WeSafe safety QR scanned. Click for details https://wesafeqr.com/qr/${passcode}/${uid}/no`
    await addDoc(collection(db, 'qrcodescans'), {
      UserID: userID || '',
      address: '',
      datetime,
      dob: dob || '',
      ip_address: ipAddress || '',
      latitude: latitude != null ? String(latitude) : '',
      longitude: longitude != null ? String(longitude) : '',
      permission_given: permissionGiven ? 'Yes' : 'No',
      qrcode: passcode,
      recipients: '',
      smstext,
      timestamp: Date.now(),
    })
  } catch {
    // Non-critical — best effort
  }
}

// ─── Get scan logs for a single QR code from qrcodescans ────────────────────
export async function getQRScans(passcode, maxResults = 50) {
  const q = query(
    collection(db, 'qrcodescans'),
    where('qrcode', '==', passcode),
    orderBy('timestamp', 'desc'),
    limit(maxResults)
  )
  const snap = await getDocs(q)
  return snap.docs.map((d) => ({ id: d.id, passcode, scannedAt: d.data().timestamp, ...d.data() }))
}

// ─── Get all scan logs across all of a user's QR codes ───────────────────────
export async function getAllUserScans(uid) {
  const qrCodes = await getUserQRCodes(uid)
  if (!qrCodes.length) return []

  const passcodes = qrCodes.map((qr) => qr.passcode)
  const qrByPasscode = Object.fromEntries(qrCodes.map((qr) => [qr.passcode, qr]))

  // Firestore 'in' supports up to 30 values; batch if needed
  const chunks = []
  for (let i = 0; i < passcodes.length; i += 30) chunks.push(passcodes.slice(i, i + 30))

  const allScans = (
    await Promise.all(
      chunks.map(async (chunk) => {
        const q = query(
          collection(db, 'qrcodescans'),
          where('qrcode', 'in', chunk),
          orderBy('timestamp', 'desc'),
          limit(100)
        )
        const snap = await getDocs(q)
        return snap.docs.map((d) => {
          const data = d.data()
          const qr = qrByPasscode[data.qrcode] || {}
          return { id: d.id, passcode: data.qrcode, scannedAt: data.timestamp, qrName: qr.name, qrType: qr.type, ...data }
        })
      })
    )
  ).flat()

  return allScans.sort((a, b) => (b.timestamp ?? 0) - (a.timestamp ?? 0))
}
