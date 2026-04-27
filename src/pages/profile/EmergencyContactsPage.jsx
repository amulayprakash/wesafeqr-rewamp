import { useState, useEffect, useContext } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '@/hooks/useAuth'
import { ProfileContext } from '@/contexts/ProfileContext'
import {
  getEmergencyContacts,
  addEmergencyContact,
  deleteEmergencyContact,
} from '@/services/profileService'
import { Header } from '@/components/layout/Header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import toast from 'react-hot-toast'

const RELATIONSHIPS = ['Spouse', 'Parent', 'Sibling', 'Child', 'Friend', 'Colleague', 'Doctor', 'Other']

const SLOT_COLORS = [
  '#10B981',
  '#6C72CC',
  '#F59E0B',
  '#06B6D4',
  '#8B5CF6',
  '#F03758',
]

const RELATIONSHIP_COLORS = {
  Spouse:    '#F03758',
  Parent:    '#6C72CC',
  Sibling:   '#8B5CF6',
  Child:     '#F59E0B',
  Friend:    '#10B981',
  Colleague: '#06B6D4',
  Doctor:    '#10B981',
  Other:     '#94a3b8',
}

const TIPS = [
  { icon: 'verified_user', text: 'Add at least 3 contacts for full coverage' },
  { icon: 'call',          text: 'Contacts can be called directly from this page' },
  { icon: 'qr_code_2',     text: 'They appear when your QR is scanned in an emergency' },
]

const RECOMMENDED = 3

function getInitials(name) {
  if (!name) return '?'
  return name.trim().split(/\s+/).map((n) => n[0]).join('').toUpperCase().slice(0, 2)
}

function formatPhone(phone) {
  if (!phone) return ''
  const digits = phone.replace(/\D/g, '')
  if (digits.length === 10) return `${digits.slice(0, 5)} ${digits.slice(5)}`
  return phone
}

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
}
const fadeUp = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.23, 1, 0.32, 1] } },
}

// ── Coverage banner — shown on both mobile and desktop ────────────────────────
function CoverageBanner({ count }) {
  const filled = Math.min(count, RECOMMENDED)
  const statusText = count === 0
    ? 'No contacts added yet'
    : count >= RECOMMENDED
    ? 'Good coverage'
    : `${RECOMMENDED - count} more recommended`

  return (
    <div className="flex items-center gap-3 py-1">
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-semibold text-foreground">{count} / {RECOMMENDED} contacts</p>
          <span
            className="text-[10px] font-semibold px-2 py-0.5 rounded-md"
            style={{
              background: count >= RECOMMENDED ? '#10B98115' : '#F59E0B15',
              color: count >= RECOMMENDED ? '#10B981' : '#F59E0B',
            }}
          >
            {statusText}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          {Array.from({ length: RECOMMENDED }).map((_, i) => (
            <div
              key={i}
              className="h-1.5 flex-1 rounded-full transition-all duration-500"
              style={{
                background: i < filled ? '#10B981' : '#10B98120',
                boxShadow: i < filled ? '0 0 4px #10B98166' : 'none',
              }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Tips card — shown on both layouts ─────────────────────────────────────────
function TipsCard() {
  return (
    <div
      className="rounded-2xl border border-border/60 bg-card overflow-hidden"
      style={{ boxShadow: '0 1px 4px hsl(var(--foreground)/0.04)' }}
    >
      <div className="px-4 pt-4 pb-1">
        <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mb-3">
          How it works
        </p>
        <div className="space-y-3 pb-3">
          {TIPS.map((tip, i) => (
            <div key={i} className="flex items-start gap-3">
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                style={{ background: '#10B98112' }}
              >
                <span className="material-symbols-outlined filled" style={{ fontSize: '14px', color: '#10B981' }}>
                  {tip.icon}
                </span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed pt-1">{tip.text}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Relationship legend ────────────────────────────────────────────────────────
function RelationshipLegend() {
  return (
    <div
      className="rounded-2xl border border-border/60 bg-card p-4"
      style={{ boxShadow: '0 1px 4px hsl(var(--foreground)/0.04)' }}
    >
      <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mb-3">
        Relationship key <span className="normal-case font-medium tracking-normal">(optional)</span>
      </p>
      <div className="grid grid-cols-2 gap-y-2 gap-x-3">
        {Object.entries(RELATIONSHIP_COLORS)
          .filter(([r]) => r !== 'Other')
          .map(([rel, color]) => (
            <div key={rel} className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full shrink-0" style={{ background: color }} />
              <span className="text-xs text-muted-foreground">{rel}</span>
            </div>
          ))}
      </div>
    </div>
  )
}

// ── Contact card ──────────────────────────────────────────────────────────────
function ContactCard({ contact, index, onDelete }) {
  const color = SLOT_COLORS[index % SLOT_COLORS.length]
  const relColor = RELATIONSHIP_COLORS[contact.relationship] || RELATIONSHIP_COLORS.Other

  return (
    <motion.div variants={fadeUp}>
      <div
        className="rounded-2xl border border-border/60 bg-card overflow-hidden relative group"
        style={{ boxShadow: `0 2px 8px ${color}12` }}
        onMouseEnter={e => e.currentTarget.style.boxShadow = `0 6px 24px ${color}22, 0 2px 8px ${color}12`}
        onMouseLeave={e => e.currentTarget.style.boxShadow = `0 2px 8px ${color}12`}
      >
        <div
          className="absolute top-0 left-0 right-0 h-[3px]"
          style={{ background: `linear-gradient(90deg, ${color}, ${color}00)` }}
        />
        <div className="flex items-center gap-4 p-4 pt-5">
          <div
            className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 font-bold"
            style={{ background: `${color}18`, color }}
          >
            {contact.name
              ? <span className="text-[13px] font-bold leading-none">{getInitials(contact.name)}</span>
              : <span className="material-symbols-outlined filled" style={{ fontSize: '20px' }}>person</span>
            }
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-0.5">
              <p className="font-semibold text-[15px] leading-snug truncate">
                {contact.name || 'Unknown contact'}
              </p>
              {contact.relationship && (
                <span
                  className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-semibold tracking-wide shrink-0"
                  style={{ background: `${relColor}15`, color: relColor }}
                >
                  {contact.relationship}
                </span>
              )}
            </div>
            <p className="text-sm tabular-nums" style={{ color: `${color}99` }}>
              {formatPhone(contact.phone)}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <a href={`tel:${contact.phone}`}>
              <button
                className="flex items-center justify-center w-9 h-9 rounded-xl transition-all duration-150 hover:scale-105 active:scale-95"
                style={{ background: '#10B98118', color: '#10B981' }}
                aria-label={`Call ${contact.name}`}
              >
                <span className="material-symbols-outlined filled" style={{ fontSize: '18px' }}>call</span>
              </button>
            </a>
            <button
              className="flex items-center justify-center w-9 h-9 rounded-xl transition-all duration-150 hover:scale-105 active:scale-95"
              style={{ background: '#F0375812', color: '#F03758' }}
              onClick={() => onDelete(contact.id)}
              aria-label={`Remove ${contact.name}`}
            >
              <span className="material-symbols-outlined filled" style={{ fontSize: '18px' }}>delete</span>
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

function CardSkeleton() {
  return (
    <div className="rounded-2xl border border-border/60 bg-card overflow-hidden h-[76px]">
      <div className="h-[3px] w-1/3 bg-muted animate-pulse" />
      <div className="flex items-center gap-4 p-4 pt-3">
        <div className="w-11 h-11 rounded-2xl bg-muted animate-pulse shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="w-36 h-3.5 bg-muted animate-pulse rounded-full" />
          <div className="w-24 h-2.5 bg-muted animate-pulse rounded-full" />
        </div>
        <div className="flex gap-2">
          <div className="w-9 h-9 rounded-xl bg-muted animate-pulse" />
          <div className="w-9 h-9 rounded-xl bg-muted animate-pulse" />
        </div>
      </div>
    </div>
  )
}

// ── Main Component ─────────────────────────────────────────────────────────────
export function EmergencyContactsPage() {
  const { user } = useAuth()
  const { activeProfileId } = useContext(ProfileContext)
  const [contacts, setContacts] = useState([])
  const [loading, setLoading] = useState(true)
  const [showDialog, setShowDialog] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ name: '', phone: '', relationship: '' })

  const load = () => {
    if (!user || !activeProfileId) return
    setLoading(true)
    getEmergencyContacts(user.uid, activeProfileId)
      .then(setContacts)
      .catch(() => toast.error('Failed to load contacts'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [user, activeProfileId])

  const handleAdd = async () => {
    if (!form.name || !form.phone) {
      toast.error('Name and phone are required')
      return
    }
    setSaving(true)
    try {
      await addEmergencyContact(user.uid, activeProfileId, {
        'Emergency Contact Name': form.name,
        'Emergency Contact Number': form.phone,
        'Emergency Contact Relation': form.relationship,
        trusted: 'true',
      })
      toast.success('Contact added')
      setForm({ name: '', phone: '', relationship: '' })
      setShowDialog(false)
      load()
    } catch {
      toast.error('Failed to add contact')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (contactId) => {
    try {
      await deleteEmergencyContact(user.uid, activeProfileId, contactId)
      toast.success('Contact removed')
      setContacts((prev) => prev.filter((c) => c.id !== contactId))
    } catch {
      toast.error('Failed to remove contact')
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Header
        title="Emergency contacts"
        showBack
        rightAction={
          <Button
            size="sm"
            onClick={() => setShowDialog(true)}
            className="gap-1.5 h-8 px-3 rounded-xl text-xs font-semibold"
          >
            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>add</span>
            Add
          </Button>
        }
      />

      {/* ── Mobile layout ─────────────────────────────────────────────────────── */}
      <div className="lg:hidden px-4 py-5 space-y-4">

        {/* Coverage banner — always visible */}
        {!loading && <CoverageBanner count={contacts.length} />}

        {/* Contact list or empty state */}
        {loading ? (
          <div className="space-y-3">
            <CardSkeleton />
            <CardSkeleton />
          </div>
        ) : contacts.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: [0.23, 1, 0.32, 1] }}
            className="flex flex-col items-center text-center py-10 px-6"
          >
            <div className="w-16 h-16 rounded-3xl flex items-center justify-center mb-4"
              style={{ background: '#10B98112' }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '32px', color: '#10B98166' }}>
                contact_emergency
              </span>
            </div>
            <h3 className="text-[17px] font-bold mb-2 tracking-tight">No emergency contacts</h3>
            <p className="text-sm text-muted-foreground mb-6 max-w-xs text-balance leading-relaxed">
              Add people who should be notified if you're in an emergency.
            </p>
            <Button onClick={() => setShowDialog(true)} className="gap-2 rounded-xl px-5">
              <span className="material-symbols-outlined filled" style={{ fontSize: '18px' }}>person_add</span>
              Add first contact
            </Button>
          </motion.div>
        ) : (
          <>
            <p className="text-[13px] font-bold text-foreground">
              {contacts.length} {contacts.length === 1 ? 'contact' : 'contacts'} saved
            </p>
            <AnimatePresence mode="popLayout">
              <motion.div variants={container} initial="hidden" animate="show" className="space-y-3">
                {contacts.map((contact, index) => (
                  <ContactCard key={contact.id} contact={contact} index={index} onDelete={handleDelete} />
                ))}
              </motion.div>
            </AnimatePresence>
          </>
        )}

        {/* Tips + legend — always visible below the list */}
        {!loading && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.35 }}
            className="space-y-3 pt-2"
          >
            <TipsCard />
            <RelationshipLegend />
          </motion.div>
        )}
      </div>

      {/* ── Desktop layout ────────────────────────────────────────────────────── */}
      <div className="hidden lg:block">
        <div className="max-w-5xl mx-auto px-8 py-8">

          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: [0.23, 1, 0.32, 1] }}
            className="flex items-center justify-between mb-8"
          >
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Emergency contacts</h1>
              <p className="text-sm text-muted-foreground mt-1">
                People to notify when your QR is scanned in an emergency
              </p>
            </div>
            <Button onClick={() => setShowDialog(true)} className="gap-2 rounded-xl px-5">
              <span className="material-symbols-outlined filled" style={{ fontSize: '18px' }}>person_add</span>
              Add contact
            </Button>
          </motion.div>

          <div className="grid grid-cols-3 gap-7 items-start">
            {/* Left: contact list */}
            <div className="col-span-2">
              {loading ? (
                <div className="space-y-3">
                  <CardSkeleton />
                  <CardSkeleton />
                </div>
              ) : contacts.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex flex-col items-center text-center py-20 px-6"
                >
                  <div className="w-20 h-20 rounded-3xl flex items-center justify-center mb-5"
                    style={{ background: '#10B98112' }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '40px', color: '#10B98166' }}>
                      contact_emergency
                    </span>
                  </div>
                  <h3 className="text-[17px] font-bold mb-2 tracking-tight">No emergency contacts</h3>
                  <p className="text-sm text-muted-foreground mb-7 max-w-xs text-balance leading-relaxed">
                    Add people who should be notified if you're in an emergency.
                  </p>
                  <Button onClick={() => setShowDialog(true)} className="gap-2 rounded-xl px-5">
                    <span className="material-symbols-outlined filled" style={{ fontSize: '18px' }}>person_add</span>
                    Add first contact
                  </Button>
                </motion.div>
              ) : (
                <>
                  <p className="text-[13px] font-bold text-foreground mb-3">
                    {contacts.length} {contacts.length === 1 ? 'contact' : 'contacts'} saved
                  </p>
                  <AnimatePresence mode="popLayout">
                    <motion.div variants={container} initial="hidden" animate="show" className="space-y-3">
                      {contacts.map((contact, index) => (
                        <ContactCard key={contact.id} contact={contact} index={index} onDelete={handleDelete} />
                      ))}
                    </motion.div>
                  </AnimatePresence>
                </>
              )}
            </div>

            {/* Right: sidebar */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1, duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
              className="col-span-1 space-y-5"
            >
              {!loading && <CoverageBanner count={contacts.length} />}
              <TipsCard />
              <RelationshipLegend />
            </motion.div>
          </div>
        </div>
      </div>

      {/* Add Contact Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="rounded-2xl mx-4 sm:mx-auto w-auto sm:w-full">
          <DialogHeader>
            <DialogTitle className="text-[17px] font-bold tracking-tight">
              Add emergency contact
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-1">
            <div className="space-y-1.5">
              <Label htmlFor="cname" className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Full name
              </Label>
              <Input
                id="cname"
                placeholder="Arjun Sharma"
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                className="rounded-xl"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cphone" className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Phone number
              </Label>
              <Input
                id="cphone"
                type="tel"
                placeholder="+91 98765 43210"
                value={form.phone}
                onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
                className="rounded-xl"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Relationship
              </Label>
              <Select
                value={form.relationship}
                onValueChange={(v) => setForm((p) => ({ ...p, relationship: v }))}
              >
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder="Select relationship" />
                </SelectTrigger>
                <SelectContent>
                  {RELATIONSHIPS.map((r) => (
                    <SelectItem key={r} value={r}>{r}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-3 pt-1">
              <Button variant="outline" className="flex-1 rounded-xl" onClick={() => setShowDialog(false)}>
                Cancel
              </Button>
              <Button className="flex-1 rounded-xl" onClick={handleAdd} disabled={saving}>
                {saving ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : 'Save contact'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
