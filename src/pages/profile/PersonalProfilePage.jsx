import { useState, useEffect, useContext, useRef } from 'react'
import { motion } from 'framer-motion'
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage'
import { useAuth } from '@/hooks/useAuth'
import { ProfileContext } from '@/contexts/ProfileContext'
import { getPersonalInfo, savePersonalInfo } from '@/services/profileService'
import { storage } from '@/config/firebase'
import { Header } from '@/components/layout/Header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import toast from 'react-hot-toast'

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']
const GENDERS = ['Male', 'Female', 'Other', 'Prefer not to say']
const HEIGHT_UNITS = ['cm', 'ft']
const WEIGHT_UNITS = ['kg', 'lbs']

// Completion is based on the key user-facing fields
const COMPLETION_FIELDS = ['name', 'dob', 'gender', 'bloodGroup', 'height', 'weight', 'phone', 'addressCity']
function calcCompletion(form) {
  const filled = COMPLETION_FIELDS.filter((f) => form[f] && String(form[f]).trim() !== '').length
  return Math.round((filled / COMPLETION_FIELDS.length) * 100)
}

function getInitials(name) {
  return (name || '?').split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
}

function bloodGroupColor(bg) {
  if (!bg) return { bg: 'bg-muted', text: 'text-muted-foreground' }
  if (bg.startsWith('O')) return { bg: 'bg-rose-100 dark:bg-rose-900/30', text: 'text-rose-700 dark:text-rose-400' }
  if (bg.startsWith('A')) return { bg: 'bg-indigo-100 dark:bg-indigo-900/30', text: 'text-indigo-700 dark:text-indigo-400' }
  if (bg.startsWith('B')) return { bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-700 dark:text-amber-400' }
  return { bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-700 dark:text-emerald-400' }
}

function FieldSkeleton() {
  return <div className="h-10 bg-muted animate-pulse rounded-xl" />
}

const EMPTY_FORM = {
  name: '',
  dob: '',
  gender: '',
  bloodGroup: '',
  height: '',
  heightUnit: 'cm',
  weight: '',
  weightUnit: 'kg',
  phone: '',
  phoneNumber: '',
  email: '',
  address: '',
  addressHouse: '',
  addressLocality: '',
  addressCity: '',
  addressState: '',
  addressPincode: '',
  addressCountry: '',
  photoURL: '',
}

export function PersonalProfilePage() {
  const { user } = useAuth()
  const { activeProfileId, activeProfile } = useContext(ProfileContext)
  const [form, setForm] = useState(EMPTY_FORM)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [photoUploading, setPhotoUploading] = useState(false)
  const fileInputRef = useRef(null)

  useEffect(() => {
    if (!user || !activeProfileId) return
    setLoading(true)
    getPersonalInfo(user.uid, activeProfileId)
      .then((data) => setForm((prev) => ({ ...prev, ...data })))
      .catch(() => toast.error('Failed to load profile'))
      .finally(() => setLoading(false))
  }, [user, activeProfileId])

  const handleChange = (field, value) => setForm((prev) => ({ ...prev, [field]: value }))

  const handleSave = async () => {
    if (!user || !activeProfileId) return
    setSaving(true)
    try {
      await savePersonalInfo(user.uid, activeProfileId, form)
      toast.success('Profile saved!')
    } catch {
      toast.error('Failed to save profile')
    } finally {
      setSaving(false)
    }
  }

  const handlePhotoChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file || !user || !activeProfileId) return
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file')
      return
    }
    setPhotoUploading(true)
    try {
      const path = `Users/${user.uid}/ChildList/${activeProfileId}/profilePhoto`
      const fileRef = storageRef(storage, path)
      await uploadBytes(fileRef, file)
      const url = await getDownloadURL(fileRef)
      setForm((prev) => ({ ...prev, photoURL: url }))
      await savePersonalInfo(user.uid, activeProfileId, { photoURL: url })
      toast.success('Photo updated!')
    } catch {
      toast.error('Failed to upload photo')
    } finally {
      setPhotoUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const pct = calcCompletion(form)
  const bgColor = bloodGroupColor(form.bloodGroup)

  // ── Desktop: Basic Info section ───────────────────────────────────────────────
  const basicInfoSection = (
    <div className="space-y-5">
      {/* Full Name */}
      <div className="space-y-2">
        <Label htmlFor="name">Full Name</Label>
        {loading ? <FieldSkeleton /> : (
          <Input id="name" placeholder="Enter full name" value={form.name}
            onChange={(e) => handleChange('name', e.target.value)} className="h-11 rounded-xl" />
        )}
      </div>

      {/* DOB + Gender */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="dob">Date of Birth</Label>
          {loading ? <FieldSkeleton /> : (
            <Input id="dob" type="date" value={form.dob}
              onChange={(e) => handleChange('dob', e.target.value)} className="h-11 rounded-xl" />
          )}
        </div>
        <div className="space-y-2">
          <Label>Gender</Label>
          {loading ? <FieldSkeleton /> : (
            <Select value={form.gender} onValueChange={(v) => handleChange('gender', v)}>
              <SelectTrigger className="h-11 rounded-xl"><SelectValue placeholder="Select gender" /></SelectTrigger>
              <SelectContent>{GENDERS.map((g) => <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent>
            </Select>
          )}
        </div>
      </div>

      {/* Blood Group + Height (with unit) + Weight (with unit) */}
      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label>Blood Group</Label>
          {loading ? <FieldSkeleton /> : (
            <Select value={form.bloodGroup} onValueChange={(v) => handleChange('bloodGroup', v)}>
              <SelectTrigger className="h-11 rounded-xl"><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent>{BLOOD_GROUPS.map((bg) => <SelectItem key={bg} value={bg}>{bg}</SelectItem>)}</SelectContent>
            </Select>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="height">Height</Label>
          {loading ? <FieldSkeleton /> : (
            <div className="flex gap-2">
              <Input id="height" type="number" placeholder="175" value={form.height}
                onChange={(e) => handleChange('height', e.target.value)} className="h-11 rounded-xl flex-1 min-w-0" />
              <Select value={form.heightUnit || 'cm'} onValueChange={(v) => handleChange('heightUnit', v)}>
                <SelectTrigger className="h-11 rounded-xl w-16 flex-shrink-0"><SelectValue /></SelectTrigger>
                <SelectContent>{HEIGHT_UNITS.map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="weight">Weight</Label>
          {loading ? <FieldSkeleton /> : (
            <div className="flex gap-2">
              <Input id="weight" type="number" placeholder="70" value={form.weight}
                onChange={(e) => handleChange('weight', e.target.value)} className="h-11 rounded-xl flex-1 min-w-0" />
              <Select value={form.weightUnit || 'kg'} onValueChange={(v) => handleChange('weightUnit', v)}>
                <SelectTrigger className="h-11 rounded-xl w-16 flex-shrink-0"><SelectValue /></SelectTrigger>
                <SelectContent>{WEIGHT_UNITS.map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          )}
        </div>
      </div>
    </div>
  )

  // ── Desktop: Contact & Address section ────────────────────────────────────────
  const contactSection = (
    <div className="space-y-5">
      {/* Phone + Email — 2 col */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="phone">Phone</Label>
          {loading ? <FieldSkeleton /> : (
            <Input id="phone" type="tel" placeholder="+91 98765 43210" value={form.phone}
              onChange={(e) => handleChange('phone', e.target.value)} className="h-11 rounded-xl" />
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          {loading ? <FieldSkeleton /> : (
            <Input id="email" type="email" placeholder="you@example.com" value={form.email}
              onChange={(e) => handleChange('email', e.target.value)} className="h-11 rounded-xl" />
          )}
        </div>
      </div>

      {/* House + Locality — 2 col */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="addressHouse">House / Flat No.</Label>
          {loading ? <FieldSkeleton /> : (
            <Input id="addressHouse" placeholder="e.g. B-204" value={form.addressHouse}
              onChange={(e) => handleChange('addressHouse', e.target.value)} className="h-11 rounded-xl" />
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="addressLocality">Locality / Street</Label>
          {loading ? <FieldSkeleton /> : (
            <Input id="addressLocality" placeholder="e.g. Indira Nagar" value={form.addressLocality}
              onChange={(e) => handleChange('addressLocality', e.target.value)} className="h-11 rounded-xl" />
          )}
        </div>
      </div>

      {/* City + State + Pincode — 3 col */}
      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="addressCity">City</Label>
          {loading ? <FieldSkeleton /> : (
            <Input id="addressCity" placeholder="Lucknow" value={form.addressCity}
              onChange={(e) => handleChange('addressCity', e.target.value)} className="h-11 rounded-xl" />
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="addressState">State</Label>
          {loading ? <FieldSkeleton /> : (
            <Input id="addressState" placeholder="Uttar Pradesh" value={form.addressState}
              onChange={(e) => handleChange('addressState', e.target.value)} className="h-11 rounded-xl" />
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="addressPincode">Pincode</Label>
          {loading ? <FieldSkeleton /> : (
            <Input id="addressPincode" placeholder="226001" value={form.addressPincode}
              onChange={(e) => handleChange('addressPincode', e.target.value)} className="h-11 rounded-xl" />
          )}
        </div>
      </div>

      {/* Country — full width */}
      <div className="space-y-2">
        <Label htmlFor="addressCountry">Country</Label>
        {loading ? <FieldSkeleton /> : (
          <Input id="addressCountry" placeholder="India" value={form.addressCountry}
            onChange={(e) => handleChange('addressCountry', e.target.value)} className="h-11 rounded-xl" />
        )}
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-background">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handlePhotoChange}
      />
      <Header title="Personal Profile" showBack />

      {/* ══ MOBILE LAYOUT ════════════════════════════════════════════════════════ */}
      <div className="lg:hidden px-4 py-6 space-y-4">
        {activeProfile && (
          <p className="text-sm text-muted-foreground">
            Editing: <span className="font-medium text-foreground">{activeProfile.name || 'Profile'}</span>
          </p>
        )}

        {/* Profile Preview Card — mobile */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="overflow-hidden">
            {/* Gradient header */}
            <div className="relative bg-gradient-to-br from-primary via-indigo-600 to-violet-700 px-5 pt-6 pb-14">
              <div className="absolute -top-4 -right-4 w-20 h-20 bg-white/5 rounded-full pointer-events-none" />
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={photoUploading}
                  className="relative w-16 h-16 rounded-2xl border-4 border-background shadow-xl overflow-visible focus:outline-none"
                >
                  <div className="w-full h-full rounded-xl overflow-hidden">
                    {form.photoURL ? (
                      <img src={form.photoURL} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-white/30 to-white/10 flex items-center justify-center">
                        <span className="text-xl font-black text-white">{getInitials(form.name)}</span>
                      </div>
                    )}
                  </div>
                  {/* Camera badge — always visible */}
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-background flex items-center justify-center shadow-md">
                    {photoUploading
                      ? <div className="w-3 h-3 border-[1.5px] border-primary border-t-transparent rounded-full animate-spin" />
                      : <span className="material-symbols-outlined filled text-primary" style={{ fontSize: '12px' }}>photo_camera</span>
                    }
                  </div>
                </button>
              </div>
            </div>
            <CardContent className="pt-12 pb-5 px-5 text-center">
              <h2 className="text-lg font-bold truncate mb-1">
                {form.name || <span className="text-muted-foreground text-sm">Your Name</span>}
              </h2>
              {form.bloodGroup ? (
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-bold ${bgColor.bg} ${bgColor.text} mb-3`}>
                  <span className="material-symbols-outlined filled" style={{ fontSize: '13px' }}>bloodtype</span>
                  {form.bloodGroup}
                </span>
              ) : (
                <span className="inline-block px-3 py-1 rounded-full text-xs bg-muted text-muted-foreground mb-3">
                  No blood group set
                </span>
              )}
              {(form.height || form.weight) && (
                <div className="flex justify-center gap-6 mb-4">
                  {form.height && (
                    <div className="text-center">
                      <p className="text-base font-bold">{form.height} <span className="text-xs font-normal text-muted-foreground">{form.heightUnit}</span></p>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wide">height</p>
                    </div>
                  )}
                  {form.height && form.weight && <div className="w-px bg-border" />}
                  {form.weight && (
                    <div className="text-center">
                      <p className="text-base font-bold">{form.weight} <span className="text-xs font-normal text-muted-foreground">{form.weightUnit}</span></p>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wide">weight</p>
                    </div>
                  )}
                </div>
              )}
              <div className="grid grid-cols-2 gap-y-2 gap-x-3 text-left border-t border-border pt-3 mt-1">
                {[
                  { icon: 'cake', label: 'DOB', value: form.dob ? new Date(form.dob).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : null },
                  { icon: 'wc', label: 'Gender', value: form.gender || null },
                  { icon: 'call', label: 'Phone', value: form.phone || null },
                  { icon: 'location_city', label: 'City', value: form.addressCity || null },
                ].map((row) => (
                  <div key={row.label} className="flex items-center gap-2 min-w-0">
                    <div className="w-6 h-6 rounded-md bg-muted flex items-center justify-center flex-shrink-0">
                      <span className="material-symbols-outlined text-muted-foreground" style={{ fontSize: '12px' }}>{row.icon}</span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] text-muted-foreground leading-none">{row.label}</p>
                      <p className="text-xs font-medium truncate mt-0.5">
                        {row.value || <span className="text-muted-foreground italic">Not set</span>}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              {/* Completion bar */}
              <div className="mt-4 pt-3 border-t border-border">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Profile completeness</span>
                  <span className="text-xs font-bold text-primary">{pct}%</span>
                </div>
                <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-primary to-violet-500 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                  />
                </div>
                {pct < 100 && (
                  <p className="text-[10px] text-muted-foreground mt-1">
                    {COMPLETION_FIELDS.length - COMPLETION_FIELDS.filter((f) => form[f] && String(form[f]).trim() !== '').length} field{COMPLETION_FIELDS.length - COMPLETION_FIELDS.filter((f) => form[f] && String(form[f]).trim() !== '').length !== 1 ? 's' : ''} remaining
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Basic Information */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}>
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">person</span>
                Basic Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Full Name</Label>
                <Input placeholder="Enter full name" value={form.name}
                  onChange={(e) => handleChange('name', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Date of Birth</Label>
                <Input type="date" value={form.dob}
                  onChange={(e) => handleChange('dob', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Gender</Label>
                <Select value={form.gender} onValueChange={(v) => handleChange('gender', v)}>
                  <SelectTrigger><SelectValue placeholder="Select gender" /></SelectTrigger>
                  <SelectContent>{GENDERS.map((g) => <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Blood Group</Label>
                <Select value={form.bloodGroup} onValueChange={(v) => handleChange('bloodGroup', v)}>
                  <SelectTrigger><SelectValue placeholder="Select blood group" /></SelectTrigger>
                  <SelectContent>{BLOOD_GROUPS.map((bg) => <SelectItem key={bg} value={bg}>{bg}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Height</Label>
                  <div className="flex gap-2">
                    <Input type="number" placeholder="175" value={form.height}
                      onChange={(e) => handleChange('height', e.target.value)} className="flex-1 min-w-0" />
                    <Select value={form.heightUnit || 'cm'} onValueChange={(v) => handleChange('heightUnit', v)}>
                      <SelectTrigger className="w-16 flex-shrink-0"><SelectValue /></SelectTrigger>
                      <SelectContent>{HEIGHT_UNITS.map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Weight</Label>
                  <div className="flex gap-2">
                    <Input type="number" placeholder="70" value={form.weight}
                      onChange={(e) => handleChange('weight', e.target.value)} className="flex-1 min-w-0" />
                    <Select value={form.weightUnit || 'kg'} onValueChange={(v) => handleChange('weightUnit', v)}>
                      <SelectTrigger className="w-16 flex-shrink-0"><SelectValue /></SelectTrigger>
                      <SelectContent>{WEIGHT_UNITS.map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Contact Details */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">contact_phone</span>
                Contact Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input type="tel" placeholder="+91 98765 43210" value={form.phone}
                  onChange={(e) => handleChange('phone', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input type="email" placeholder="you@example.com" value={form.email}
                  onChange={(e) => handleChange('email', e.target.value)} />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Address */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">home</span>
                Address
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>House / Flat No.</Label>
                  <Input placeholder="B-204" value={form.addressHouse}
                    onChange={(e) => handleChange('addressHouse', e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Locality / Street</Label>
                  <Input placeholder="Indira Nagar" value={form.addressLocality}
                    onChange={(e) => handleChange('addressLocality', e.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>City</Label>
                  <Input placeholder="Lucknow" value={form.addressCity}
                    onChange={(e) => handleChange('addressCity', e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>State</Label>
                  <Input placeholder="Uttar Pradesh" value={form.addressState}
                    onChange={(e) => handleChange('addressState', e.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Pincode</Label>
                  <Input placeholder="226001" value={form.addressPincode}
                    onChange={(e) => handleChange('addressPincode', e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Country</Label>
                  <Input placeholder="India" value={form.addressCountry}
                    onChange={(e) => handleChange('addressCountry', e.target.value)} />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Button onClick={handleSave} disabled={saving || loading} className="w-full h-12">
            {saving ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <><span className="material-symbols-outlined mr-2">save</span>Save Profile</>
            )}
          </Button>
        </motion.div>
      </div>

      {/* ══ DESKTOP LAYOUT ═══════════════════════════════════════════════════════ */}
      <div className="hidden lg:block">
        <div className="max-w-6xl mx-auto px-8 py-8">

          {/* Page title row */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl font-bold">Personal Profile</h1>
              {activeProfile && (
                <p className="text-sm text-muted-foreground mt-0.5">
                  Editing profile for{' '}
                  <span className="font-semibold text-foreground">{activeProfile.name || 'Profile'}</span>
                </p>
              )}
            </div>
            <Button onClick={handleSave} disabled={saving || loading} className="h-11 px-8 gap-2 shadow-md shadow-primary/20">
              {saving ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <><span className="material-symbols-outlined filled" style={{ fontSize: '18px' }}>save</span>Save Profile</>
              )}
            </Button>
          </div>

          <div className="grid grid-cols-3 gap-8 items-start">

            {/* ── LEFT: Profile Preview Card (sticky) ─────────────────────── */}
            <div className="col-span-1 sticky top-24">
              <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
                <Card className="overflow-hidden">
                  {/* Gradient header */}
                  <div className="relative bg-gradient-to-br from-primary via-indigo-600 to-violet-700 px-6 pt-8 pb-16">
                    <div className="absolute -top-6 -right-6 w-24 h-24 bg-white/5 rounded-full" />
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={photoUploading}
                        className="relative w-20 h-20 rounded-2xl border-4 border-background shadow-xl overflow-visible focus:outline-none"
                      >
                        <div className="w-full h-full rounded-xl overflow-hidden">
                          {form.photoURL ? (
                            <img src={form.photoURL} alt="Profile" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-white/30 to-white/10 flex items-center justify-center">
                              <span className="text-2xl font-black text-white">{getInitials(form.name)}</span>
                            </div>
                          )}
                        </div>
                        {/* Camera badge — always visible */}
                        <div className="absolute -bottom-1.5 -right-1.5 w-6 h-6 rounded-full bg-background flex items-center justify-center shadow-md">
                          {photoUploading
                            ? <div className="w-3.5 h-3.5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                            : <span className="material-symbols-outlined filled text-primary" style={{ fontSize: '14px' }}>photo_camera</span>
                          }
                        </div>
                      </button>
                    </div>
                  </div>

                  <CardContent className="pt-14 pb-6 px-6 text-center">
                    <h2 className="text-xl font-bold truncate mb-1">
                      {form.name || <span className="text-muted-foreground">Your Name</span>}
                    </h2>

                    {form.bloodGroup ? (
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-bold ${bgColor.bg} ${bgColor.text} mb-4`}>
                        <span className="material-symbols-outlined filled" style={{ fontSize: '14px' }}>bloodtype</span>
                        {form.bloodGroup}
                      </span>
                    ) : (
                      <span className="inline-block px-3 py-1 rounded-full text-xs bg-muted text-muted-foreground mb-4">
                        No blood group set
                      </span>
                    )}

                    {(form.height || form.weight) && (
                      <div className="flex justify-center gap-6 mb-5">
                        {form.height && (
                          <div className="text-center">
                            <p className="text-lg font-bold">{form.height} <span className="text-xs font-normal text-muted-foreground">{form.heightUnit}</span></p>
                            <p className="text-xs text-muted-foreground">height</p>
                          </div>
                        )}
                        {form.height && form.weight && <div className="w-px bg-border" />}
                        {form.weight && (
                          <div className="text-center">
                            <p className="text-lg font-bold">{form.weight} <span className="text-xs font-normal text-muted-foreground">{form.weightUnit}</span></p>
                            <p className="text-xs text-muted-foreground">weight</p>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="space-y-2 text-left border-t border-border pt-4 mt-2">
                      {[
                        { icon: 'cake', label: 'Date of Birth', value: form.dob ? new Date(form.dob).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : null },
                        { icon: 'wc', label: 'Gender', value: form.gender || null },
                        { icon: 'call', label: 'Phone', value: form.phone || null },
                        { icon: 'mail', label: 'Email', value: form.email || null },
                        { icon: 'location_city', label: 'City', value: form.addressCity || null },
                      ].map((row) => (
                        <div key={row.label} className="flex items-start gap-3">
                          <div className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center flex-shrink-0 mt-0.5">
                            <span className="material-symbols-outlined text-muted-foreground" style={{ fontSize: '14px' }}>{row.icon}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-muted-foreground">{row.label}</p>
                            <p className="text-sm font-medium truncate">
                              {row.value || <span className="text-muted-foreground italic text-xs">Not set</span>}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Completion bar */}
                    <div className="mt-5 pt-4 border-t border-border">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Completeness</span>
                        <span className="text-xs font-bold text-primary">{pct}%</span>
                      </div>
                      <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                        <motion.div
                          className="h-full bg-gradient-to-r from-primary to-violet-500 rounded-full"
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ duration: 0.8, ease: 'easeOut' }}
                        />
                      </div>
                      {pct < 100 && (
                        <p className="text-xs text-muted-foreground mt-2">
                          {COMPLETION_FIELDS.length - COMPLETION_FIELDS.filter((f) => form[f] && String(form[f]).trim() !== '').length} field{COMPLETION_FIELDS.length - COMPLETION_FIELDS.filter((f) => form[f] && String(form[f]).trim() !== '').length !== 1 ? 's' : ''} remaining
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {/* ── RIGHT: Form Sections ─────────────────────────────────────── */}
            <div className="col-span-2 space-y-6">

              {/* Basic Information */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
                <Card>
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                        <span className="material-symbols-outlined filled text-indigo-600 dark:text-indigo-400" style={{ fontSize: '18px' }}>person</span>
                      </div>
                      <div>
                        <p className="text-base font-semibold">Basic Information</p>
                        <p className="text-xs font-normal text-muted-foreground">Identity and physical details</p>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>{basicInfoSection}</CardContent>
                </Card>
              </motion.div>

              {/* Contact Details */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                <Card>
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                        <span className="material-symbols-outlined filled text-emerald-600 dark:text-emerald-400" style={{ fontSize: '18px' }}>contact_phone</span>
                      </div>
                      <div>
                        <p className="text-base font-semibold">Contact Details</p>
                        <p className="text-xs font-normal text-muted-foreground">Phone, email and address</p>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>{contactSection}</CardContent>
                </Card>
              </motion.div>

              {/* Bottom save */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                className="flex justify-end"
              >
                <Button onClick={handleSave} disabled={saving || loading} className="h-11 px-10 gap-2 shadow-md shadow-primary/20">
                  {saving ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <><span className="material-symbols-outlined filled" style={{ fontSize: '18px' }}>save</span>Save Profile</>
                  )}
                </Button>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
