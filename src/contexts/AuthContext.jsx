import { createContext, useState, useEffect, useRef } from 'react'
import {
  onAuthStateChanged,
  signInWithPopup,
  GoogleAuthProvider,
  signInWithPhoneNumber,
  RecaptchaVerifier,
  signOut as firebaseSignOut,
} from 'firebase/auth'
import { auth } from '@/config/firebase'

export const AuthContext = createContext(null)

const googleProvider = new GoogleAuthProvider()

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const confirmationResultRef = useRef(null)
  const recaptchaVerifierRef = useRef(null)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user)
      setLoading(false)
    })
    return () => unsubscribe()
  }, [])

  const signInWithGoogle = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider)
      return result.user
    } catch (error) {
      console.error('Google sign in error:', error)
      throw error
    }
  }

  const sendOTP = async (phoneNumber) => {
    try {
      // Clear any previous verifier to avoid "already rendered" errors
      if (recaptchaVerifierRef.current) {
        recaptchaVerifierRef.current.clear()
        recaptchaVerifierRef.current = null
      }
      recaptchaVerifierRef.current = new RecaptchaVerifier(auth, 'recaptcha-container', {
        size: 'invisible',
      })
      const confirmation = await signInWithPhoneNumber(auth, '+91' + phoneNumber, recaptchaVerifierRef.current)
      confirmationResultRef.current = confirmation
    } catch (error) {
      if (recaptchaVerifierRef.current) {
        recaptchaVerifierRef.current.clear()
        recaptchaVerifierRef.current = null
      }
      console.error('Send OTP error:', error)
      throw error
    }
  }

  const verifyOTP = async (code) => {
    if (!confirmationResultRef.current) {
      throw new Error('No OTP was sent. Please request a new OTP.')
    }
    try {
      const result = await confirmationResultRef.current.confirm(code)
      return result.user
    } catch (error) {
      console.error('Verify OTP error:', error)
      throw error
    }
  }

  const signOut = async () => {
    try {
      await firebaseSignOut(auth)
    } catch (error) {
      console.error('Sign out error:', error)
      throw error
    }
  }

  const value = {
    user,
    loading,
    signInWithGoogle,
    sendOTP,
    verifyOTP,
    signOut,
    isAuthenticated: !!user,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
