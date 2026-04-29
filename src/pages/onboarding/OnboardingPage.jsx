import { useState, useContext } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { setDoc, addDoc, collection, doc, serverTimestamp } from 'firebase/firestore'
import { db } from '@/config/firebase'
import { useAuth } from '@/hooks/useAuth'
import { ProfileContext } from '@/contexts/ProfileContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import toast from 'react-hot-toast'

const RELATIONSHIPS = ['Parent', 'Spouse', 'Sibling', 'Friend', 'Doctor', 'Other']

// ─── LNF-mode simplified onboarding (name + phone + email only) ───────────────
function StepLNFInfo({ onComplete }) {
  const { user } = useAuth()
  const hasEmail = !!user?.email
  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: user?.email || '',
  })
  const [saving, setSaving] = useState(false)
  const set = (f) => (e) => setForm((p) => ({ ...p, [f]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.name.trim()) { toast.error('Name is required'); return }
    if (!form.phone.trim()) { toast.error('Phone number is required'); return }
    if (!hasEmail && !form.email.trim()) { toast.error('Email is required'); return }
    setSaving(true)
    try {
      await setDoc(
        doc(db, 'Users', user.uid),
        { ActiveStatus: true, key: generateUserKey(), uid: user.uid },
        { merge: true }
      )
      const childId = 'child1'
      await setDoc(
        doc(db, 'Users', user.uid, 'ChildList', childId),
        { name: form.name.trim(), relationship: 'Self', createdAt: serverTimestamp() }
      )
      await setDoc(
        doc(db, 'Users', user.uid, 'ChildList', childId, 'data', 'personal_information'),
        {
          ActiveStatus: true,
          QRCodeDocID: '',
          address: '',
          addressCity: '',
          addressCountry: '',
          addressHouse: '',
          addressLocality: '',
          addressPincode: '',
          addressState: '',
          bloodGroup: '',
          childListUid: childId,
          dob: '',
          email: form.email.trim() || user.email || '',
          gender: '',
          height: '',
          heightUnit: 'cm',
          info_type: '',
          name: form.name.trim(),
          origin: 'wesafe-web',
          originalProfilePicUrl: user.photoURL || '',
          phone: form.phone.trim(),
          phoneNumber: form.phone.trim(),
          profilePicUrl: user.photoURL || '',
          qrPasscode: '',
          relation: 'Self',
          selectedFile: '',
          userUid: user.uid,
          weight: '',
          weightUnit: 'kg',
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      )
      onComplete(childId)
    } catch (err) {
      console.error(err)
      toast.error('Failed to save. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <h2 className="text-xl font-bold tracking-tight mb-1">Quick setup</h2>
        <p className="text-sm text-muted-foreground">Just a few details to register your item.</p>
      </div>

      <div className="space-y-3">
        <div>
          <Label htmlFor="lnf-name" className="text-sm font-semibold">
            Full name <span className="text-destructive">*</span>
          </Label>
          <Input
            id="lnf-name"
            value={form.name}
            onChange={set('name')}
            placeholder="Enter your full name"
            className="mt-1.5 h-11 rounded-xl"
            autoFocus
          />
        </div>

        <div>
          <Label htmlFor="lnf-phone" className="text-sm font-semibold">
            Phone number <span className="text-destructive">*</span>
          </Label>
          <div className="flex mt-1.5">
            <span className="inline-flex items-center px-3 rounded-l-xl border border-r-0 border-input bg-muted text-sm text-muted-foreground font-medium">
              +91
            </span>
            <Input
              id="lnf-phone"
              value={form.phone}
              onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value.replace(/\D/g, '').slice(0, 10) }))}
              placeholder="10-digit number"
              inputMode="numeric"
              maxLength={10}
              className="rounded-l-none rounded-r-xl h-11 flex-1"
            />
          </div>
        </div>

        {!hasEmail && (
          <div>
            <Label htmlFor="lnf-email" className="text-sm font-semibold">
              Email <span className="text-destructive">*</span>
            </Label>
            <Input
              id="lnf-email"
              type="email"
              value={form.email}
              onChange={set('email')}
              placeholder="your@email.com"
              className="mt-1.5 h-11 rounded-xl"
            />
          </div>
        )}
      </div>

      <Button
        type="submit"
        disabled={saving}
        className="w-full h-12 rounded-xl font-semibold press-scale mt-2"
        style={{ boxShadow: '0 4px 14px hsl(var(--primary) / 0.3)' }}
      >
        {saving ? (
          <span className="flex items-center gap-2">
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Saving...
          </span>
        ) : (
          <span className="flex items-center gap-2">
            Continue
            <span className="material-symbols-outlined text-lg">arrow_forward</span>
          </span>
        )}
      </Button>
    </form>
  )
}

function generateUserKey() {
  const array = new Uint8Array(48)
  crypto.getRandomValues(array)
  return Array.from(array).map((b) => b.toString(16).padStart(2, '0')).join('')
}

// ─── Step indicator ────────────────────────────────────────────────────────────
function StepDots({ current, total }) {
  return (
    <div className="flex items-center gap-2 justify-center mb-6">
      {Array.from({ length: total }).map((_, i) => (
        <motion.div
          key={i}
          animate={{
            width: i + 1 === current ? 24 : 8,
            backgroundColor: i + 1 <= current ? 'hsl(237 46% 62%)' : 'hsl(var(--muted))',
          }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
          className="h-2 rounded-full"
        />
      ))}
    </div>
  )
}

// ─── Step 1: Basic Info ────────────────────────────────────────────────────────
function StepBasicInfo({ onNext }) {
  const [form, setForm] = useState({ name: '', phone: '', city: '' })
  const set = (f) => (e) => setForm((p) => ({ ...p, [f]: e.target.value }))

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!form.name.trim()) { toast.error('Name is required'); return }
    if (!form.phone.trim()) { toast.error('Phone number is required'); return }
    if (!form.city.trim()) { toast.error('Home city is required'); return }
    onNext({ name: form.name.trim(), phone: form.phone.trim(), city: form.city.trim() })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <h2 className="text-xl font-bold tracking-tight mb-1">Let's get started</h2>
        <p className="text-sm text-muted-foreground">Enter your basic details to set up your account.</p>
      </div>

      <div className="space-y-3">
        <div>
          <Label htmlFor="name" className="text-sm font-semibold">
            Full name <span className="text-destructive">*</span>
          </Label>
          <Input
            id="name"
            value={form.name}
            onChange={set('name')}
            placeholder="Enter your full name"
            className="mt-1.5 h-11 rounded-xl"
            autoFocus
          />
        </div>

        <div>
          <Label htmlFor="phone" className="text-sm font-semibold">
            Phone number <span className="text-destructive">*</span>
          </Label>
          <div className="flex mt-1.5">
            <span className="inline-flex items-center px-3 rounded-l-xl border border-r-0 border-input bg-muted text-sm text-muted-foreground font-medium">
              +91
            </span>
            <Input
              id="phone"
              value={form.phone}
              onChange={set('phone')}
              placeholder="10-digit number"
              inputMode="numeric"
              maxLength={10}
              className="rounded-l-none rounded-r-xl h-11 flex-1"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="city" className="text-sm font-semibold">
            Home city / location <span className="text-destructive">*</span>
          </Label>
          <Input
            id="city"
            value={form.city}
            onChange={set('city')}
            placeholder="e.g. Mumbai"
            className="mt-1.5 h-11 rounded-xl"
          />
        </div>
      </div>

      <Button
        type="submit"
        className="w-full h-12 rounded-xl font-semibold press-scale mt-2"
        style={{ boxShadow: '0 4px 14px hsl(var(--primary) / 0.3)' }}
      >
        <span className="flex items-center gap-2">
          Continue
          <span className="material-symbols-outlined text-lg">arrow_forward</span>
        </span>
      </Button>
    </form>
  )
}

// ─── Step 2: Who are you setting up a profile for? ─────────────────────────────
function StepForWho({ parentInfo, onSelectSelf, onSelectChild }) {
  const [saving, setSaving] = useState(false)
  const { user } = useAuth()

  const handleSelf = async () => {
    setSaving(true)
    try {
      // Create Users/{uid} root document to match existing DB structure
      await setDoc(
        doc(db, 'Users', user.uid),
        { ActiveStatus: true, key: generateUserKey(), uid: user.uid },
        { merge: true }
      )
      // Self profile always uses 'child1' as the fixed document ID
      const childId = 'child1'
      await setDoc(
        doc(db, 'Users', user.uid, 'ChildList', childId),
        { name: parentInfo.name, relationship: 'Self', createdAt: serverTimestamp() }
      )
      await setDoc(
        doc(db, 'Users', user.uid, 'ChildList', childId, 'data', 'personal_information'),
        {
          ActiveStatus: true,
          QRCodeDocID: '',
          address: '',
          addressCity: parentInfo.city,
          addressCountry: '',
          addressHouse: '',
          addressLocality: '',
          addressPincode: '',
          addressState: '',
          bloodGroup: '',
          childListUid: childId,
          dob: '',
          email: user.email || '',
          gender: '',
          height: '',
          heightUnit: 'cm',
          info_type: '',
          name: parentInfo.name,
          origin: 'wesafe-web',
          originalProfilePicUrl: user.photoURL || '',
          phone: parentInfo.phone,
          phoneNumber: parentInfo.phone,
          profilePicUrl: user.photoURL || '',
          qrPasscode: '',
          relation: 'Self',
          selectedFile: '',
          userUid: user.uid,
          weight: '',
          weightUnit: 'kg',
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      )
      onSelectSelf(childId)
    } catch (err) {
      console.error(err)
      toast.error('Failed to save. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold tracking-tight mb-1">Who are you setting up?</h2>
        <p className="text-sm text-muted-foreground">We'll customise the profile accordingly.</p>
      </div>

      <div className="space-y-3">
        <button
          type="button"
          onClick={handleSelf}
          disabled={saving}
          className="w-full flex items-center gap-4 p-4 rounded-2xl border-2 border-transparent bg-muted/60 hover:border-primary/40 hover:bg-primary/5 transition-all text-left group disabled:opacity-50"
        >
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'hsl(var(--primary) / 0.12)' }}
          >
            <span className="material-symbols-outlined text-2xl" style={{ color: 'hsl(var(--primary))' }}>
              person
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-base">Myself</div>
            <div className="text-sm text-muted-foreground">Set up your own emergency profile</div>
          </div>
          {saving ? (
            <span className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin flex-shrink-0" />
          ) : (
            <span className="material-symbols-outlined text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0">
              chevron_right
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={onSelectChild}
          disabled={saving}
          className="w-full flex items-center gap-4 p-4 rounded-2xl border-2 border-transparent bg-muted/60 hover:border-primary/40 hover:bg-primary/5 transition-all text-left group disabled:opacity-50"
        >
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'hsl(350 82% 60% / 0.12)' }}
          >
            <span className="material-symbols-outlined text-2xl" style={{ color: 'hsl(350 82% 60%)' }}>
              child_care
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-base">My Child / Another Person</div>
            <div className="text-sm text-muted-foreground">Create a profile under your account</div>
          </div>
          <span className="material-symbols-outlined text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0">
            chevron_right
          </span>
        </button>
      </div>
    </div>
  )
}

// ─── Step 3 (self path): Emergency Contact ─────────────────────────────────────
function StepSelfEC({ selfId, onBack, onNext }) {
  const [form, setForm] = useState({ ecName: '', ecPhone: '', ecRelationship: '' })
  const [saving, setSaving] = useState(false)
  const { user } = useAuth()
  const set = (f) => (e) => setForm((p) => ({ ...p, [f]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.ecName.trim()) { toast.error('Contact name is required'); return }
    if (!form.ecPhone.trim()) { toast.error('Phone number is required'); return }
    setSaving(true)
    try {
      await addDoc(
        collection(db, 'Users', user.uid, 'ChildList', selfId, 'data', 'emergencycont', 'emergencycont'),
        {
          name: form.ecName.trim(),
          phone: form.ecPhone.trim(),
          relationship: form.ecRelationship || 'Other',
          createdAt: serverTimestamp(),
        }
      )
      onNext()
    } catch (err) {
      console.error(err)
      toast.error('Failed to save. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <h2 className="text-xl font-bold tracking-tight mb-1">Emergency contact</h2>
        <p className="text-sm text-muted-foreground">Who should be called if you're in an emergency?</p>
      </div>

      <div className="space-y-3">
        <div>
          <Label htmlFor="ecName" className="text-sm font-semibold">
            Contact name <span className="text-destructive">*</span>
          </Label>
          <Input
            id="ecName"
            value={form.ecName}
            onChange={set('ecName')}
            placeholder="e.g. Priya Sharma"
            className="mt-1.5 h-11 rounded-xl"
            autoFocus
          />
        </div>

        <div>
          <Label htmlFor="ecPhone" className="text-sm font-semibold">
            Phone number <span className="text-destructive">*</span>
          </Label>
          <div className="flex mt-1.5">
            <span className="inline-flex items-center px-3 rounded-l-xl border border-r-0 border-input bg-muted text-sm text-muted-foreground font-medium">
              +91
            </span>
            <Input
              id="ecPhone"
              value={form.ecPhone}
              onChange={set('ecPhone')}
              placeholder="10-digit number"
              inputMode="numeric"
              maxLength={10}
              className="rounded-l-none rounded-r-xl h-11 flex-1"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="ecRel" className="text-sm font-semibold">Relationship</Label>
          <select
            id="ecRel"
            value={form.ecRelationship}
            onChange={set('ecRelationship')}
            className="mt-1.5 w-full h-11 rounded-xl border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">Select</option>
            {RELATIONSHIPS.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>
      </div>

      <div className="flex gap-3 mt-2">
        <Button type="button" variant="outline" className="h-12 rounded-xl px-4 press-scale" onClick={onBack}>
          <span className="material-symbols-outlined text-lg">arrow_back</span>
        </Button>
        <Button
          type="submit"
          className="flex-1 h-12 rounded-xl font-semibold press-scale"
          disabled={saving}
          style={{ boxShadow: '0 4px 14px hsl(var(--primary) / 0.3)' }}
        >
          {saving ? (
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Saving...
            </span>
          ) : 'Save & Continue'}
        </Button>
      </div>

      <button
        type="button"
        onClick={onNext}
        className="w-full text-center text-sm text-muted-foreground hover:text-foreground transition-colors py-1"
      >
        Skip for now
      </button>
    </form>
  )
}

// ─── Step 3 (child path): Child Name ──────────────────────────────────────────
function StepChildName({ parentInfo, onBack, onNext }) {
  const [childName, setChildName] = useState('')
  const [saving, setSaving] = useState(false)
  const { user } = useAuth()
  const { addProfile } = useContext(ProfileContext)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!childName.trim()) { toast.error('Name is required'); return }
    setSaving(true)
    try {
      // Create Users/{uid} root document
      await setDoc(
        doc(db, 'Users', user.uid),
        { ActiveStatus: true, key: generateUserKey(), uid: user.uid },
        { merge: true }
      )

      // Auto-create parent's own profile (child1) using info from Step 1
      await setDoc(
        doc(db, 'Users', user.uid, 'ChildList', 'child1'),
        { name: parentInfo.name, relationship: 'Self', createdAt: serverTimestamp() }
      )
      await setDoc(
        doc(db, 'Users', user.uid, 'ChildList', 'child1', 'data', 'personal_information'),
        {
          ActiveStatus: true,
          QRCodeDocID: '',
          address: '',
          addressCity: parentInfo.city,
          addressCountry: '',
          addressHouse: '',
          addressLocality: '',
          addressPincode: '',
          addressState: '',
          bloodGroup: '',
          childListUid: 'child1',
          dob: '',
          email: user.email || '',
          gender: '',
          height: '',
          heightUnit: 'cm',
          info_type: '',
          name: parentInfo.name,
          origin: 'wesafe-web',
          originalProfilePicUrl: user.photoURL || '',
          phone: parentInfo.phone,
          phoneNumber: parentInfo.phone,
          profilePicUrl: user.photoURL || '',
          qrPasscode: '',
          relation: 'Self',
          selectedFile: '',
          userUid: user.uid,
          weight: '',
          weightUnit: 'kg',
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      )

      // Create the child profile with generated ID
      const childId = await addProfile({ name: childName.trim(), relationship: 'Child' })
      await setDoc(
        doc(db, 'Users', user.uid, 'ChildList', childId, 'data', 'personal_information'),
        {
          ActiveStatus: true,
          QRCodeDocID: '',
          address: '',
          addressCity: parentInfo.city,
          addressCountry: '',
          addressHouse: '',
          addressLocality: '',
          addressPincode: '',
          addressState: '',
          bloodGroup: '',
          childListUid: childId,
          dob: '',
          email: '',
          gender: '',
          height: '',
          heightUnit: 'cm',
          info_type: '',
          name: childName.trim(),
          origin: 'wesafe-web',
          originalProfilePicUrl: '',
          phone: '',
          phoneNumber: '',
          profilePicUrl: '',
          qrPasscode: '',
          relation: 'Child',
          selectedFile: '',
          userUid: user.uid,
          weight: '',
          weightUnit: 'kg',
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      )
      onNext(childId)
    } catch (err) {
      console.error(err)
      toast.error('Failed to save. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <h2 className="text-xl font-bold tracking-tight mb-1">About the person</h2>
        <p className="text-sm text-muted-foreground">Enter their name to create their emergency profile.</p>
      </div>

      <div className="space-y-3">
        <div>
          <Label htmlFor="childName" className="text-sm font-semibold">
            Full name <span className="text-destructive">*</span>
          </Label>
          <Input
            id="childName"
            value={childName}
            onChange={(e) => setChildName(e.target.value)}
            placeholder="Enter their full name"
            className="mt-1.5 h-11 rounded-xl"
            autoFocus
          />
        </div>

        <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-muted/60 border border-border/40">
          <span className="material-symbols-outlined text-base text-muted-foreground">location_on</span>
          <span className="text-sm text-muted-foreground">
            Location: <span className="font-medium text-foreground">{parentInfo.city}</span>
          </span>
        </div>
      </div>

      <div className="flex gap-3 mt-2">
        <Button type="button" variant="outline" className="h-12 rounded-xl px-4 press-scale" onClick={onBack}>
          <span className="material-symbols-outlined text-lg">arrow_back</span>
        </Button>
        <Button
          type="submit"
          className="flex-1 h-12 rounded-xl font-semibold press-scale"
          disabled={saving}
          style={{ boxShadow: '0 4px 14px hsl(var(--primary) / 0.3)' }}
        >
          {saving ? (
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Saving...
            </span>
          ) : (
            <span className="flex items-center gap-2">
              Continue
              <span className="material-symbols-outlined text-lg">arrow_forward</span>
            </span>
          )}
        </Button>
      </div>
    </form>
  )
}

// ─── Step 4 (child path): Child Emergency Contact ─────────────────────────────
function StepChildEC({ childId, parentInfo, onBack, onNext }) {
  const [useParent, setUseParent] = useState(true)
  const [form, setForm] = useState({ ecName: '', ecPhone: '', ecRelationship: '' })
  const [saving, setSaving] = useState(false)
  const { user } = useAuth()
  const set = (f) => (e) => setForm((p) => ({ ...p, [f]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!useParent) {
      if (!form.ecName.trim()) { toast.error('Contact name is required'); return }
      if (!form.ecPhone.trim()) { toast.error('Phone number is required'); return }
    }
    setSaving(true)
    try {
      const ecData = useParent
        ? { name: parentInfo.name, phone: parentInfo.phone, relationship: 'Parent', createdAt: serverTimestamp() }
        : { name: form.ecName.trim(), phone: form.ecPhone.trim(), relationship: form.ecRelationship || 'Other', createdAt: serverTimestamp() }
      await addDoc(
        collection(db, 'Users', user.uid, 'ChildList', childId, 'data', 'emergencycont', 'emergencycont'),
        ecData
      )
      onNext()
    } catch (err) {
      console.error(err)
      toast.error('Failed to save. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <h2 className="text-xl font-bold tracking-tight mb-1">Emergency contact</h2>
        <p className="text-sm text-muted-foreground">Who should be called if they're in danger?</p>
      </div>

      {/* Toggle */}
      <div className="flex items-center justify-between p-3 rounded-xl bg-muted/60 border border-border/40">
        <div>
          <div className="text-sm font-semibold">Use my contact details</div>
          <div className="text-xs text-muted-foreground">Add yourself as their emergency contact</div>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={useParent}
          onClick={() => setUseParent((v) => !v)}
          className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${useParent ? 'bg-primary' : 'bg-muted-foreground/30'}`}
        >
          <span
            className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${useParent ? 'translate-x-5' : 'translate-x-0'}`}
          />
        </button>
      </div>

      {/* Parent info preview */}
      <AnimatePresence mode="wait">
        {useParent ? (
          <motion.div
            key="parent"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18 }}
            className="p-3 rounded-xl border border-primary/20 bg-primary/5 space-y-1.5"
          >
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-base" style={{ color: 'hsl(var(--primary))' }}>person</span>
              <span className="text-sm font-medium">{parentInfo.name}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-base" style={{ color: 'hsl(var(--primary))' }}>phone</span>
              <span className="text-sm text-muted-foreground">+91 {parentInfo.phone}</span>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="custom"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18 }}
            className="space-y-3"
          >
            <div>
              <Label htmlFor="cEcName" className="text-sm font-semibold">
                Contact name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="cEcName"
                value={form.ecName}
                onChange={set('ecName')}
                placeholder="e.g. Priya Sharma"
                className="mt-1.5 h-11 rounded-xl"
                autoFocus
              />
            </div>
            <div>
              <Label htmlFor="cEcPhone" className="text-sm font-semibold">
                Phone number <span className="text-destructive">*</span>
              </Label>
              <div className="flex mt-1.5">
                <span className="inline-flex items-center px-3 rounded-l-xl border border-r-0 border-input bg-muted text-sm text-muted-foreground font-medium">
                  +91
                </span>
                <Input
                  id="cEcPhone"
                  value={form.ecPhone}
                  onChange={set('ecPhone')}
                  placeholder="10-digit number"
                  inputMode="numeric"
                  maxLength={10}
                  className="rounded-l-none rounded-r-xl h-11 flex-1"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="cEcRel" className="text-sm font-semibold">Relationship</Label>
              <select
                id="cEcRel"
                value={form.ecRelationship}
                onChange={set('ecRelationship')}
                className="mt-1.5 w-full h-11 rounded-xl border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">Select</option>
                {RELATIONSHIPS.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex gap-3 mt-2">
        <Button type="button" variant="outline" className="h-12 rounded-xl px-4 press-scale" onClick={onBack}>
          <span className="material-symbols-outlined text-lg">arrow_back</span>
        </Button>
        <Button
          type="submit"
          className="flex-1 h-12 rounded-xl font-semibold press-scale"
          disabled={saving}
          style={{ boxShadow: '0 4px 14px hsl(var(--primary) / 0.3)' }}
        >
          {saving ? (
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Saving...
            </span>
          ) : 'Save & Continue'}
        </Button>
      </div>

      <button
        type="button"
        onClick={onNext}
        className="w-full text-center text-sm text-muted-foreground hover:text-foreground transition-colors py-1"
      >
        Skip for now
      </button>
    </form>
  )
}

// ─── Done ──────────────────────────────────────────────────────────────────────
function StepDone({ activeChildId, onComplete }) {
  const navigate = useNavigate()

  const handleContinue = () => {
    if (onComplete) {
      onComplete(activeChildId)
    } else {
      navigate('/', { replace: true })
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
      className="text-center py-4 space-y-4"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.1, type: 'spring', stiffness: 260, damping: 18 }}
        className="inline-flex items-center justify-center w-20 h-20 rounded-full mx-auto"
        style={{ background: 'hsl(var(--primary) / 0.12)' }}
      >
        <span className="material-symbols-outlined filled text-5xl" style={{ color: 'hsl(var(--primary))' }}>
          check_circle
        </span>
      </motion.div>

      <div>
        <h2 className="text-2xl font-bold tracking-tight">You're all set!</h2>
        <p className="text-muted-foreground text-sm mt-1.5 max-w-xs mx-auto">
          Your emergency profile is ready. Activate a WeSafe QR code to get full protection.
        </p>
      </div>

      <Button
        onClick={handleContinue}
        className="w-full h-12 rounded-xl font-semibold press-scale"
        style={{ boxShadow: '0 4px 14px hsl(var(--primary) / 0.3)' }}
      >
        <span className="material-symbols-outlined mr-2 text-lg">dashboard</span>
        Go to Dashboard
      </Button>
    </motion.div>
  )
}

// ─── Main page ─────────────────────────────────────────────────────────────────
export function OnboardingPage({ onComplete, lnfMode } = {}) {
  const [step, setStep] = useState(1)
  const [flow, setFlow] = useState(null)        // 'self' | 'child'
  const [parentInfo, setParentInfo] = useState(null)
  const [activeChildId, setActiveChildId] = useState(null)

  const isDone = step === 'done'
  const totalDots = flow === 'child' ? 4 : 3
  const currentDot = typeof step === 'number' ? step : totalDots + 1

  if (lnfMode && onComplete) {
    return (
      <div className="min-h-screen bg-background flex items-start justify-center p-4 pt-8 pb-8 relative overflow-y-auto">
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse 80% 60% at 50% -10%, hsl(var(--primary) / 0.12) 0%, transparent 70%)' }} />
        <div className="w-full max-w-md relative z-10">
          <div className="text-center mb-6">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 260, damping: 20 }}
              className="inline-flex items-center justify-center mb-4"
            >
              <img src="/logo1.png" alt="WeSafe QR" className="w-14 h-14 rounded-[18px]"
                style={{ boxShadow: '0 8px 24px hsl(var(--primary) / 0.3)' }} />
            </motion.div>
            <h1 className="text-lg font-bold text-foreground">Welcome to WeSafe LNF</h1>
            <p className="text-xs text-muted-foreground mt-0.5">Set up your account to register your item</p>
          </div>
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
            className="bg-card rounded-2xl border border-border/60 p-6"
            style={{ boxShadow: '0 8px 32px hsl(var(--primary) / 0.08)' }}
          >
            <StepLNFInfo onComplete={onComplete} />
          </motion.div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex items-start justify-center p-4 pt-8 pb-8 relative overflow-y-auto">
      {/* Ambient blobs */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse 80% 60% at 50% -10%, hsl(var(--primary) / 0.12) 0%, transparent 70%)' }}
      />
      <div
        className="absolute bottom-0 right-0 w-96 h-96 pointer-events-none"
        style={{ background: 'radial-gradient(circle, hsl(350 82% 60% / 0.07) 0%, transparent 70%)', transform: 'translate(30%, 30%)' }}
      />
      <div
        className="absolute top-1/3 -left-20 w-72 h-72 pointer-events-none"
        style={{ background: 'radial-gradient(circle, hsl(var(--primary) / 0.06) 0%, transparent 70%)' }}
      />

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="text-center mb-6">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 260, damping: 20 }}
            className="inline-flex items-center justify-center mb-4"
          >
            <img
              src="/logo1.png"
              alt="WeSafe QR"
              className="w-14 h-14 rounded-[18px]"
              style={{ boxShadow: '0 8px 24px hsl(var(--primary) / 0.3)' }}
            />
          </motion.div>
          <h1 className="text-lg font-bold text-foreground">Welcome to WeSafe QR</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Let's set up your emergency profile</p>
        </div>

        {/* Card */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
          className="bg-card rounded-2xl border border-border/60 p-6"
          style={{ boxShadow: '0 8px 32px hsl(var(--primary) / 0.08)' }}
        >
          {!isDone && <StepDots current={currentDot} total={totalDots} />}

          <AnimatePresence mode="wait">
            <motion.div
              key={String(step)}
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              transition={{ duration: 0.22, ease: 'easeInOut' }}
            >
              {step === 1 && (
                <StepBasicInfo
                  onNext={(info) => { setParentInfo(info); setStep(2) }}
                />
              )}

              {step === 2 && (
                <StepForWho
                  parentInfo={parentInfo}
                  onSelectSelf={(childId) => { setFlow('self'); setActiveChildId(childId); setStep(3) }}
                  onSelectChild={() => { setFlow('child'); setStep(3) }}
                />
              )}

              {step === 3 && flow === 'self' && (
                <StepSelfEC
                  selfId={activeChildId}
                  onBack={() => setStep(2)}
                  onNext={() => setStep('done')}
                />
              )}

              {step === 3 && flow === 'child' && (
                <StepChildName
                  parentInfo={parentInfo}
                  onBack={() => setStep(2)}
                  onNext={(childId) => { setActiveChildId(childId); setStep(4) }}
                />
              )}

              {step === 4 && flow === 'child' && (
                <StepChildEC
                  childId={activeChildId}
                  parentInfo={parentInfo}
                  onBack={() => setStep(3)}
                  onNext={() => setStep('done')}
                />
              )}

              {isDone && <StepDone activeChildId={activeChildId} onComplete={onComplete} />}
            </motion.div>
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  )
}
