import { createContext, useState, useEffect, useContext, useCallback } from 'react'
import {
  collection,
  doc,
  onSnapshot,
  setDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
} from 'firebase/firestore'

function generateChildId() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let id = 'child'
  for (let i = 0; i < 10; i++) {
    id += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return id
}
import { db } from '@/config/firebase'
import { AuthContext } from './AuthContext'

export const ProfileContext = createContext(null)

export function ProfileProvider({ children }) {
  const { user, loading: authLoading } = useContext(AuthContext)
  const [profiles, setProfiles] = useState([])
  const [activeProfileId, setActiveProfileId] = useState(null)
  const [loadingProfiles, setLoadingProfiles] = useState(true)

  // Listen to child profiles in real-time
  useEffect(() => {
    // Don't do anything until Firebase Auth has fully resolved.
    // This prevents a brief window where user is null / profiles is empty
    // while auth is still initializing, which would incorrectly trigger onboarding.
    if (authLoading) return

    if (!user) {
      setProfiles([])
      setActiveProfileId(null)
      setLoadingProfiles(false)
      return
    }

    setLoadingProfiles(true) // reset while waiting for first snapshot

    const colRef = collection(db, 'Users', user.uid, 'ChildList')
    const unsubscribe = onSnapshot(colRef, (snapshot) => {
      const list = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }))
      setProfiles(list)
      setLoadingProfiles(false)
      // Auto-select first profile if none active
      setActiveProfileId((prev) => {
        if (prev && list.find((p) => p.id === prev)) return prev
        return list[0]?.id || null
      })
    })

    return () => unsubscribe()
  }, [user, authLoading])

  const activeProfile = profiles.find((p) => p.id === activeProfileId) || null

  const switchProfile = useCallback((childId) => {
    setActiveProfileId(childId)
  }, [])

  const addProfile = useCallback(
    async (data) => {
      if (!user) return
      const childId = generateChildId()
      const docRef = doc(db, 'Users', user.uid, 'ChildList', childId)
      await setDoc(docRef, {
        ...data,
        createdAt: serverTimestamp(),
      })
      return childId
    },
    [user]
  )

  const updateProfile = useCallback(
    async (childId, data) => {
      if (!user) return
      const docRef = doc(db, 'Users', user.uid, 'ChildList', childId)
      await updateDoc(docRef, data)
    },
    [user]
  )

  const deleteProfile = useCallback(
    async (childId) => {
      if (!user) return
      const docRef = doc(db, 'Users', user.uid, 'ChildList', childId)
      await deleteDoc(docRef)
      // If we deleted the active profile, the onSnapshot will auto-select the next one
    },
    [user]
  )

  return (
    <ProfileContext.Provider
      value={{
        profiles,
        activeProfile,
        activeProfileId,
        loadingProfiles,
        switchProfile,
        addProfile,
        updateProfile,
        deleteProfile,
      }}
    >
      {children}
    </ProfileContext.Provider>
  )
}
