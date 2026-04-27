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

function toDateString(val) {
  if (!val) return ''
  // Firestore Timestamp
  if (typeof val?.toDate === 'function') {
    return val.toDate().toISOString().slice(0, 10)
  }
  // Already YYYY-MM-DD
  if (typeof val === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(val)) return val
  // DD/MM/YYYY or DD-MM-YYYY
  const dmy = typeof val === 'string' && val.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/)
  if (dmy) return `${dmy[3]}-${dmy[2].padStart(2, '0')}-${dmy[1].padStart(2, '0')}`
  // Fallback: try Date parse
  const d = new Date(val)
  return isNaN(d.getTime()) ? '' : d.toISOString().slice(0, 10)
}

export async function getPersonalInfo(uid, childId) {
  const ref = doc(
    db,
    'Users', uid,
    'ChildList', childId,
    'data', 'personal_information'
  )
  const snap = await getDoc(ref)
  if (!snap.exists()) return {}
  const raw = snap.data()
  // Normalise legacy field names from the old WeSafe app
  return {
    ...raw,
    name:           raw.name || raw['Name'] || raw['Full Name'] || raw['fullName'] || '',
    dob:            toDateString(raw.dob || raw['Date of Birth'] || raw['DOB'] || raw['dateOfBirth'] || ''),
    gender:         raw.gender || raw['Gender'] || '',
    bloodGroup:     raw.bloodGroup || raw['Blood Group'] || raw['blood_group'] || raw['bloodgroup'] || '',
    height:         raw.height || raw['Height'] || '',
    heightUnit:     raw.heightUnit || raw['Height Unit'] || 'cm',
    weight:         raw.weight || raw['Weight'] || '',
    weightUnit:     raw.weightUnit || raw['Weight Unit'] || 'kg',
    phone:          raw.phone || raw['Phone'] || raw['Phone Number'] || raw['phoneNumber'] || raw['Mobile'] || raw['Mobile Number'] || '',
    email:          raw.email || raw['Email'] || raw['Email Address'] || '',
    addressHouse:   raw.addressHouse || raw['House'] || raw['House No'] || raw['Flat No'] || '',
    addressLocality:raw.addressLocality || raw['Locality'] || raw['Street'] || raw['Address Line 1'] || '',
    addressCity:    raw.addressCity || raw['City'] || raw['city'] || '',
    addressState:   raw.addressState || raw['State'] || raw['state'] || '',
    addressPincode: raw.addressPincode || raw['Pincode'] || raw['PIN'] || raw['ZIP'] || '',
    addressCountry: raw.addressCountry || raw['Country'] || raw['country'] || '',
    photoURL:       raw.photoURL || raw['Photo URL'] || raw['profilePhoto'] || raw.profilePicUrl || raw.originalProfilePicUrl || '',
  }
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
  return snap.docs.map((d) => {
    const raw = d.data()
    // Normalise legacy field names (space-separated) to new camelCase names
    return {
      id: d.id,
      name: raw.name || raw['Emergency Contact Name'] || '',
      phone: raw.phone || raw['Emergency Contact Number'] || '',
      relationship: raw.relationship || raw['Emergency Contact Relation'] || '',
      ...raw,
    }
  })
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
  return snap.docs.map((d) => {
    const raw = d.data()
    // Normalise legacy field names from the old WeSafe app
    const name = raw.name
      || raw['Medical Name']
      || raw['Medication Name'] || raw.medicationName
      || raw['Allergy Name']
      || raw['Vaccine Name'] || raw['Vaccination Name'] || raw['Vaccinations Name']
      || raw['Procedure Name'] || raw['Procedures Name']
      || ''
    const notes = raw.notes
      || raw['Medical Notes']
      || raw['Medication Notes'] || raw.medicationNotes
      || raw['Allergy Notes']
      || raw['Vaccine Notes'] || raw['Vaccination Notes'] || raw['Vaccinations Notes']
      || raw['Procedure Notes'] || raw['Procedures Notes']
      || ''
    const date = raw.date
      || raw['Vaccinations Date']
      || raw['Procedures Date of Procedure']
      || ''
    return { id: d.id, ...raw, name, notes, date }
  })
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

function insuranceColRef(uid, childId) {
  return collection(
    db,
    'Users', uid,
    'ChildList', childId,
    'data', 'insurance', 'insurance'
  )
}

function insuranceDocRef(uid, childId, docId) {
  return doc(
    db,
    'Users', uid,
    'ChildList', childId,
    'data', 'insurance', 'insurance', docId
  )
}

export async function getInsuranceItems(uid, childId) {
  const snap = await getDocs(insuranceColRef(uid, childId))
  return snap.docs.map((d) => {
    const raw = d.data()
    return {
      id: d.id,
      providerName: raw.providerName || raw.insurancename || '',
      policyNumber: raw.policyNumber || raw.policynumber || '',
      memberName: raw.memberName || '',
      phone: raw.phone || '',
      expiryDate: raw.expiryDate || '',
      notes: raw.notes || raw.insurancenotes || '',
      ...raw,
    }
  })
}

export async function getInsurance(uid, childId) {
  const items = await getInsuranceItems(uid, childId)
  return items[0] ?? {}
}

export async function addInsuranceItem(uid, childId, data) {
  const colRef = insuranceColRef(uid, childId)
  const docRef = await addDoc(colRef, { ...data, createdAt: serverTimestamp() })
  return docRef.id
}

export async function deleteInsuranceItem(uid, childId, docId) {
  await deleteDoc(insuranceDocRef(uid, childId, docId))
}
