import {
  doc,
  getDoc,
  setDoc,
  collection,
  getDocs,
  updateDoc,
  serverTimestamp,
  query,
  where,
} from 'firebase/firestore'
import { db } from '@/config/firebase'

// ─── Get a single QR code by passcode (public) ───────────────────────────────
export async function getQRCode(passcode) {
  const ref = doc(db, 'QRCode', passcode)
  const snap = await getDoc(ref)
  return snap.exists() ? { passcode, ...snap.data() } : null
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

// ─── Update QR code metadata ──────────────────────────────────────────────────
export async function updateQRCode(passcode, data) {
  const ref = doc(db, 'QRCode', passcode)
  await updateDoc(ref, { ...data, updatedAt: serverTimestamp() })
}

// ─── Record a scan event ──────────────────────────────────────────────────────
export async function recordScan(passcode) {
  const ref = doc(db, 'QRCode', passcode)
  await updateDoc(ref, { lastScanned: serverTimestamp() }).catch(() => {
    // Non-critical — ignore if QR doc doesn't exist yet
  })
}
