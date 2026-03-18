import {
  doc,
  getDoc,
  setDoc,
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from '@/config/firebase'

// ─── Personal Information ───────────────────────────────────────────────────

export async function getPersonalInfo(uid, childId) {
  const ref = doc(
    db,
    'Users', uid,
    'ChildList', childId,
    'data', 'personal_information'
  )
  const snap = await getDoc(ref)
  return snap.exists() ? snap.data() : {}
}

export async function savePersonalInfo(uid, childId, data) {
  const ref = doc(
    db,
    'Users', uid,
    'ChildList', childId,
    'data', 'personal_information'
  )
  await setDoc(ref, { ...data, updatedAt: serverTimestamp() }, { merge: true })
}

// ─── Emergency Contacts ──────────────────────────────────────────────────────

export async function getEmergencyContacts(uid, childId) {
  const colRef = collection(
    db,
    'Users', uid,
    'ChildList', childId,
    'data', 'emergencycont', 'emergencycont'
  )
  const snap = await getDocs(colRef)
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
}

export async function addEmergencyContact(uid, childId, contact) {
  const colRef = collection(
    db,
    'Users', uid,
    'ChildList', childId,
    'data', 'emergencycont', 'emergencycont'
  )
  const docRef = await addDoc(colRef, {
    ...contact,
    createdAt: serverTimestamp(),
  })
  return docRef.id
}

export async function updateEmergencyContact(uid, childId, contactId, data) {
  const ref = doc(
    db,
    'Users', uid,
    'ChildList', childId,
    'data', 'emergencycont', 'emergencycont', contactId
  )
  await updateDoc(ref, data)
}

export async function deleteEmergencyContact(uid, childId, contactId) {
  const ref = doc(
    db,
    'Users', uid,
    'ChildList', childId,
    'data', 'emergencycont', 'emergencycont', contactId
  )
  await deleteDoc(ref)
}

// ─── Medical Sub-collections ─────────────────────────────────────────────────

function medicalColRef(uid, childId, section) {
  return collection(
    db,
    'Users', uid,
    'ChildList', childId,
    'data', section, section
  )
}

function medicalDocRef(uid, childId, section, docId) {
  return doc(
    db,
    'Users', uid,
    'ChildList', childId,
    'data', section, section, docId
  )
}

export async function getMedicalItems(uid, childId, section) {
  const snap = await getDocs(medicalColRef(uid, childId, section))
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
}

export async function addMedicalItem(uid, childId, section, data) {
  const colRef = medicalColRef(uid, childId, section)
  const docRef = await addDoc(colRef, { ...data, createdAt: serverTimestamp() })
  return docRef.id
}

export async function updateMedicalItem(uid, childId, section, docId, data) {
  await updateDoc(medicalDocRef(uid, childId, section, docId), data)
}

export async function deleteMedicalItem(uid, childId, section, docId) {
  await deleteDoc(medicalDocRef(uid, childId, section, docId))
}

// ─── Insurance ───────────────────────────────────────────────────────────────

export async function getInsurance(uid, childId) {
  const ref = doc(
    db,
    'Users', uid,
    'ChildList', childId,
    'data', 'insurance'
  )
  const snap = await getDoc(ref)
  return snap.exists() ? snap.data() : {}
}

export async function saveInsurance(uid, childId, data) {
  const ref = doc(
    db,
    'Users', uid,
    'ChildList', childId,
    'data', 'insurance'
  )
  await setDoc(ref, { ...data, updatedAt: serverTimestamp() }, { merge: true })
}
