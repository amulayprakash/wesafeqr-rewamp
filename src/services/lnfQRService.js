import {
  doc,
  getDoc,
  getDocs,
  addDoc,
  collection,
  serverTimestamp,
  writeBatch,
} from 'firebase/firestore'
import { db } from '@/config/firebase'

export async function checkLNFQRStatus(passcode) {
  const ref = doc(db, 'lnfQR', passcode)
  const snap = await getDoc(ref)

  if (!snap.exists()) {
    return { exists: false, consumed: false, storedUid: null, qrType: null }
  }

  const data = snap.data()
  const consumed = data.Consumed === true || data.productMapped === true

  return {
    exists: true,
    consumed,
    storedUid: data.UserID || null,
    qrType: data.qrType || null,
    ...data,
  }
}

// itemPayload for lostAndFound: { type, itemType, itemTypeName?, description, ownerName, wordFromOwner }
// itemPayload for cars:         { type, vehicleType, vehicleNumber, ownerName, wordFromOwner }
export async function connectLNFQRToProfile(uid, childId, passcode, itemPayload) {
  const lnfRef = doc(db, 'lnfQR', passcode)

  // Pre-check: read current state
  const existing = await getDoc(lnfRef)
  if (!existing.exists()) throw new Error('LNF QR code not found.')

  const qrData = existing.data()
  const alreadyConsumed = qrData.Consumed === true || qrData.productMapped === true

  if (alreadyConsumed && qrData.UserID && !qrData.UserID.startsWith(uid + ' ')) {
    throw new Error('This QR code is already linked to another account.')
  }

  // Create Items document (auto-ID, cannot be inside writeBatch)
  const itemsColRef = collection(db, 'Items')
  const itemDocRef = await addDoc(itemsColRef, {
    ...itemPayload,
    qrPasscode: passcode,
    uid,
    childId,
    createdAt: serverTimestamp(),
  })
  const newDocId = itemDocRef.id

  // Batch the remaining two writes atomically
  const batch = writeBatch(db)
  const compoundUid = uid + ' ' + childId.replace(/^child/, '')

  // snapshot — public display data written to the lnfQR doc so the landing
  // page can render even if the Items document is later deleted or unavailable.
  const publicSnapshot = qrData.qrType === 'cars'
    ? {
        vehicleType: itemPayload.vehicleType || '',
        vehicleNumber: itemPayload.vehicleNumber || '',
        name: itemPayload.ownerName || itemPayload.vehicleType || '',
        wordFromOwner: itemPayload.wordFromOwner || '',
        ownerName: itemPayload.ownerName || '',
      }
    : {
        itemType: itemPayload.itemType || '',
        itemTypeName: itemPayload.itemTypeName || '',
        description: itemPayload.description || '',
        name: itemPayload.ownerName || itemPayload.itemType || '',
        wordFromOwner: itemPayload.wordFromOwner || '',
        ownerName: itemPayload.ownerName || '',
      }

  batch.update(lnfRef, {
    UserID: compoundUid,
    Consumed: true,
    productMapped: true,
    productId: newDocId,
    ...publicSnapshot,
  })

  // Derive a human-readable display name from the item payload
  const displayName = qrData.qrType === 'cars'
    ? (itemPayload.vehicleNumber || itemPayload.vehicleType || 'Vehicle')
    : (itemPayload.itemType === 'Other' ? (itemPayload.itemTypeName || 'Item') : (itemPayload.itemType || 'Lost & Found Item'))

  // type must match MyQRCodesPage typeConfig keys: 'lostfound' | 'vehicle'
  const displayType = qrData.qrType === 'cars' ? 'vehicle' : 'lostfound'

  const profileLnfRef = doc(db, 'Users', uid, 'ChildList', childId, 'lnfqr', passcode)
  batch.set(profileLnfRef, {
    passcode,
    qrType: qrData.qrType || null,
    Label: qrData.Label || '',
    PIN: qrData.PIN || '',
    URL: qrData.URL || '',
    itemDocId: newDocId,
    type: displayType,
    name: displayName,
    connectedAt: serverTimestamp(),
    ownerName: itemPayload.ownerName || '',
    // Store key item fields for quick display in QR list
    ...(qrData.qrType === 'cars'
      ? { vehicleType: itemPayload.vehicleType, vehicleNumber: itemPayload.vehicleNumber }
      : { itemType: itemPayload.itemType, description: itemPayload.description }),
  })

  await batch.commit()
  return { itemDocId: newDocId }
}

export async function getProfileLNFQRs(uid, childId) {
  const colRef = collection(db, 'Users', uid, 'ChildList', childId, 'lnfqr')
  const snap = await getDocs(colRef)
  return snap.docs.map((d) => ({ id: d.id, childId, ...d.data() }))
}

export async function getAllProfilesLNFQRs(uid, profiles) {
  if (!profiles?.length) return []
  const results = await Promise.all(
    profiles.map((p) =>
      getProfileLNFQRs(uid, p.id).then((qrs) =>
        qrs.map((qr) => ({ ...qr, profileName: p.name || p.id, profileId: p.id }))
      )
    )
  )
  return results.flat()
}
