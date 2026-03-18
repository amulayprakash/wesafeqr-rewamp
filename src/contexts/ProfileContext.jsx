import { createContext, useState, useEffect, useContext, useCallback } from 'react'
import {
  collection,
  doc,
  onSnapshot,
  addDoc,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from '@/config/firebase'
import { AuthContext } from './AuthContext'

export const ProfileContext = createContext(null)

export function ProfileProvider({ children }) {
  const { user } = useContext(AuthContext)
  const [profiles, setProfiles] = useState([])
  const [activeProfileId, setActiveProfileId] = useState(null)
  const [loadingProfiles, setLoadingProfiles] = useState(true)

  // Listen to child profiles in real-time
  useEffect(() => {
    if (!user) {
      setProfiles([])
      setActiveProfileId(null)
      setLoadingProfiles(false)
      return
    }

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
  }, [user])

  const activeProfile = profiles.find((p) => p.id === activeProfileId) || null

  const switchProfile = useCallback((childId) => {
    setActiveProfileId(childId)
  }, [])

  const addProfile = useCallback(
    async (data) => {
      if (!user) return
      const colRef = collection(db, 'Users', user.uid, 'ChildList')
      const docRef = await addDoc(colRef, {
        ...data,
        createdAt: serverTimestamp(),
      })
      return docRef.id
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
      }}
    >
      {children}
    </ProfileContext.Provider>
  )
}
