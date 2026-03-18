import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import toast from 'react-hot-toast'

const features = [
  { icon: 'medical_services', label: 'Emergency Info', color: 'text-rose-500', bg: 'bg-rose-100 dark:bg-rose-900/30' },
  { icon: 'family_restroom',  label: 'Child Profiles', color: 'text-indigo-500', bg: 'bg-indigo-100 dark:bg-indigo-900/30' },
  { icon: 'inventory_2',      label: 'Lost & Found',   color: 'text-amber-500', bg: 'bg-amber-100 dark:bg-amber-900/30' },
]

export function LoginPage() {
  const [phone, setPhone] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const { signInWithGoogle } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const from = location.state?.from?.pathname || '/'

  const handleGoogleSignIn = async () => {
    setIsLoading(true)
    try {
      await signInWithGoogle()
      toast.success('Welcome to WeSafe QR!')
      navigate(from, { replace: true })
    } catch (error) {
      toast.error('Sign in failed. Please try again.')
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSendOTP = () => {
    if (!phone || phone.length < 10) {
      toast.error('Please enter a valid phone number')
      return
    }
    toast('OTP feature coming soon!', { icon: '📱' })
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative background blobs */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-primary/8 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-0 translate-x-1/3 translate-y-1/3 w-80 h-80 rounded-full bg-violet-500/8 blur-3xl pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10"
      >
        {/* Logo + headline */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.15, type: 'spring' }}
            className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-violet-600 mb-5 shadow-xl shadow-primary/25"
          >
            <span className="material-symbols-outlined text-white filled" style={{ fontSize: '38px' }}>qr_code_2</span>
          </motion.div>

          <h1 className="text-3xl font-bold text-foreground mb-2">WeSafe QR</h1>
          <p className="text-muted-foreground text-sm leading-relaxed max-w-xs mx-auto">
            Protecting what matters most. Quick access to emergency info, child profiles and other QR services.
          </p>
        </div>

        {/* Feature highlights */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="flex justify-center gap-4 mb-8"
        >
          {features.map((f, i) => (
            <div key={i} className="flex flex-col items-center gap-2">
              <div className={`w-11 h-11 rounded-xl ${f.bg} flex items-center justify-center`}>
                <span className={`material-symbols-outlined filled ${f.color}`} style={{ fontSize: '20px' }}>{f.icon}</span>
              </div>
              <span className="text-xs text-muted-foreground font-medium text-center leading-tight">{f.label}</span>
            </div>
          ))}
        </motion.div>

        {/* Auth card */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-card border border-border rounded-2xl p-6 shadow-sm"
        >
          {/* Google Sign In */}
          <Button
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            className="w-full h-12 text-base gap-3 shadow-sm"
            size="lg"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
            )}
            Sign in with Google
          </Button>

          {/* Divider */}
          <div className="flex items-center gap-4 my-5">
            <Separator className="flex-1" />
            <span className="text-muted-foreground text-xs">or</span>
            <Separator className="flex-1" />
          </div>

          {/* OTP Login */}
          <div className="space-y-4">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Login via OTP</h2>

            <div className="space-y-2">
              <Label htmlFor="phone" className="text-sm">Phone Number</Label>
              <div className="flex gap-2">
                <div className="flex items-center justify-center w-16 h-11 rounded-xl border border-input bg-muted text-muted-foreground text-sm font-medium">
                  +91
                </div>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="Enter phone number"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="flex-1 h-11 rounded-xl"
                />
              </div>
            </div>

            <Button onClick={handleSendOTP} variant="outline" className="w-full h-11 gap-2">
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>sms</span>
              Send OTP
            </Button>
          </div>
        </motion.div>

        {/* Footer */}
        <p className="text-xs text-muted-foreground text-center mt-6">
          By continuing, you agree to our{' '}
          <a href="/legal/terms" className="text-primary hover:underline">Terms of Service</a>
          {' '}and{' '}
          <a href="/legal/privacy" className="text-primary hover:underline">Privacy Policy</a>.
        </p>
      </motion.div>
    </div>
  )
}
