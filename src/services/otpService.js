import { doc, getDoc, setDoc, updateDoc, serverTimestamp, Timestamp } from 'firebase/firestore'
import { db } from '@/config/firebase'
import { sendOTPToAllContacts } from './whatsappService'

async function hashOTP(otp) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(otp))
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('')
}

function generateOTP() {
  return Math.floor(1000 + Math.random() * 9000).toString()
}

function maskPhone(phone) {
  const normalized = String(phone).replace(/[\s\-\+\(\)]/g, '')
  const digits = normalized.startsWith('91') && normalized.length > 10 ? normalized.slice(2) : normalized
  return '••••••' + digits.slice(-4)
}

function generateUUID() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0
    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16)
  })
}

export async function createAndSendOTP({ passcode, uid, childId, contacts, profileName }) {
  const otp = generateOTP()
  const hashedOTP = await hashOTP(otp)
  const requestId = generateUUID()

  try {
    await setDoc(doc(db, 'otpRequests', requestId), {
      hashedOTP,
      passcode,
      uid,
      childId,
      expiresAt: Timestamp.fromMillis(Date.now() + 10 * 60 * 1000),
      used: false,
      createdAt: serverTimestamp(),
    })
  } catch (err) {
    console.error('[OTP] Firestore write failed:', err)
    throw new Error('firestore_denied')
  }

  const waSent = await sendOTPToAllContacts(contacts, otp, profileName)
    .then(() => true)
    .catch(err => { console.error('[OTP] WhatsApp send failed:', err); return false })

  return { requestId, waSent }
}

export async function verifyOTPCode(requestId, inputOTP) {
  const snap = await getDoc(doc(db, 'otpRequests', requestId))
  if (!snap.exists()) throw new Error('OTP not found')
  const data = snap.data()
  if (data.used) throw new Error('OTP already used')
  if (data.expiresAt.toDate() < new Date()) throw new Error('OTP expired')
  const inputHash = await hashOTP(inputOTP)
  if (inputHash !== data.hashedOTP) throw new Error('Invalid OTP')
  await updateDoc(doc(db, 'otpRequests', requestId), { used: true })
}
