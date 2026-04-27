import {
  collection,
  query,
  orderBy,
  limit,
  getDocs,
  addDoc,
  updateDoc,
  doc,
  serverTimestamp,
  where,
  writeBatch,
  getCountFromServer,
} from 'firebase/firestore'
import { db } from '@/config/firebase'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function alertsRef(uid, childId) {
  return collection(db, 'Users', uid, 'ChildList', childId, 'alerts')
}

// ─── Read ─────────────────────────────────────────────────────────────────────

// Fetch alerts for a specific child profile
export async function getChildAlerts(uid, childId, maxResults = 50) {
  const q = query(alertsRef(uid, childId), orderBy('createdAt', 'desc'), limit(maxResults))
  const snap = await getDocs(q)
  return snap.docs.map((d) => ({ id: d.id, childId, ...d.data() }))
}

// Aggregate alerts across all children under a user
export async function getUserAlerts(uid, maxResults = 50) {
  try {
    const childListRef = collection(db, 'Users', uid, 'ChildList')
    const childSnap = await getDocs(childListRef)
    if (childSnap.empty) return []

    const perChild = await Promise.all(
      childSnap.docs.map((childDoc) => getChildAlerts(uid, childDoc.id, maxResults))
    )

    return perChild
      .flat()
      .sort((a, b) => {
        const ta = a.createdAt?.toMillis?.() ?? 0
        const tb = b.createdAt?.toMillis?.() ?? 0
        return tb - ta
      })
      .slice(0, maxResults)
  } catch {
    return []
  }
}

export async function getUnreadCount(uid) {
  try {
    const childListRef = collection(db, 'Users', uid, 'ChildList')
    const childSnap = await getDocs(childListRef)
    if (childSnap.empty) return 0

    const counts = await Promise.all(
      childSnap.docs.map(async (childDoc) => {
        const q = query(alertsRef(uid, childDoc.id), where('isRead', '==', false))
        const snap = await getCountFromServer(q)
        return snap.data().count
      })
    )
    return counts.reduce((sum, c) => sum + c, 0)
  } catch {
    return 0
  }
}

// ─── Write ────────────────────────────────────────────────────────────────────

export async function createAlert(uid, childId, { type, title, description, icon, metadata = {} }) {
  try {
    await addDoc(alertsRef(uid, childId), {
      type,
      title,
      description,
      icon: icon || 'notifications',
      isRead: false,
      metadata,
      createdAt: serverTimestamp(),
    })
  } catch {
    // Non-critical — best effort
  }
}

export async function markAlertRead(uid, childId, alertId) {
  const ref = doc(db, 'Users', uid, 'ChildList', childId, 'alerts', alertId)
  await updateDoc(ref, { isRead: true })
}

export async function markAllAlertsRead(uid) {
  try {
    const childListRef = collection(db, 'Users', uid, 'ChildList')
    const childSnap = await getDocs(childListRef)
    if (childSnap.empty) return

    await Promise.all(
      childSnap.docs.map(async (childDoc) => {
        const snap = await getDocs(
          query(alertsRef(uid, childDoc.id), where('isRead', '==', false))
        )
        if (snap.empty) return
        const batch = writeBatch(db)
        snap.docs.forEach((d) => batch.update(d.ref, { isRead: true }))
        await batch.commit()
      })
    )
  } catch {
    // Non-critical — best effort
  }
}
