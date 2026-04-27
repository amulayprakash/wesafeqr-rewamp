import { useState, useEffect, useContext } from 'react'
import { useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '@/hooks/useAuth'
import { ProfileContext } from '@/contexts/ProfileContext'
import { getMedicalItems, addMedicalItem, deleteMedicalItem } from '@/services/profileService'
import { Header } from '@/components/layout/Header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import toast from 'react-hot-toast'

// ─── Section Definitions ─────────────────────────────────────────────────────
const SECTIONS = [
  {
    id: 'mediccond',
    label: 'Conditions',
    singular: 'Condition',
    icon: 'monitor_heart',
    colorClass: 'text-rose-500',
    iconBg: 'bg-rose-100 dark:bg-rose-900/40',
    softBg: 'bg-rose-50 dark:bg-rose-950/30',
    borderLeft: 'border-l-rose-400',
    pillColor: '#F43F5E',
    gradient: 'linear-gradient(135deg, #F43F5E 0%, #BE123C 100%)',
    placeholder: 'e.g. Diabetes Type 2',
    notesLabel: 'Severity / notes',
    notesPlaceholder: 'e.g. Well-controlled with medication',
    dateLabel: 'Diagnosed',
    description: 'Chronic conditions & diagnoses',
  },
  {
    id: 'medications',
    label: 'Medications',
    singular: 'Medication',
    icon: 'medication',
    colorClass: 'text-indigo-500',
    iconBg: 'bg-indigo-100 dark:bg-indigo-900/40',
    softBg: 'bg-indigo-50 dark:bg-indigo-950/30',
    borderLeft: 'border-l-indigo-400',
    pillColor: 'hsl(237 46% 62%)',
    gradient: 'linear-gradient(135deg, hsl(237 46% 62%) 0%, hsl(237 52% 52%) 100%)',
    placeholder: 'e.g. Metformin 500mg',
    notesLabel: 'Frequency / dosage notes',
    notesPlaceholder: 'e.g. Take twice daily with meals',
    dateLabel: 'Started',
    description: 'Prescriptions & supplements',
  },
  {
    id: 'allergies',
    label: 'Allergies',
    singular: 'Allergy',
    icon: 'warning',
    colorClass: 'text-amber-600',
    iconBg: 'bg-amber-100 dark:bg-amber-900/40',
    softBg: 'bg-amber-50 dark:bg-amber-950/30',
    borderLeft: 'border-l-amber-400',
    pillColor: '#D97706',
    gradient: 'linear-gradient(135deg, #F59E0B 0%, #B45309 100%)',
    placeholder: 'e.g. Penicillin',
    notesLabel: 'Reaction / severity',
    notesPlaceholder: 'e.g. Causes hives and swelling',
    dateLabel: 'Identified',
    description: 'Known allergens & reactions',
  },
  {
    id: 'vaccinations',
    label: 'Vaccines',
    singular: 'Vaccine',
    icon: 'vaccines',
    colorClass: 'text-emerald-600',
    iconBg: 'bg-emerald-100 dark:bg-emerald-900/40',
    softBg: 'bg-emerald-50 dark:bg-emerald-950/30',
    borderLeft: 'border-l-emerald-400',
    pillColor: '#059669',
    gradient: 'linear-gradient(135deg, #10B981 0%, #065F46 100%)',
    placeholder: 'e.g. COVID-19 Booster',
    notesLabel: 'Next dose / notes',
    notesPlaceholder: 'e.g. Booster due in 2026',
    dateLabel: 'Administered',
    description: 'Immunization history',
  },
  {
    id: 'procedures',
    label: 'Procedures',
    singular: 'Procedure',
    icon: 'surgical',
    colorClass: 'text-violet-600',
    iconBg: 'bg-violet-100 dark:bg-violet-900/40',
    softBg: 'bg-violet-50 dark:bg-violet-950/30',
    borderLeft: 'border-l-violet-400',
    pillColor: '#7C3AED',
    gradient: 'linear-gradient(135deg, #8B5CF6 0%, #5B21B6 100%)',
    placeholder: 'e.g. Appendectomy',
    notesLabel: 'Hospital / surgeon',
    notesPlaceholder: 'e.g. Apollo Hospital, Dr. Sharma',
    dateLabel: 'Date',
    description: 'Surgeries & procedures',
  },
]

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function ItemSkeleton() {
  return (
    <div className="rounded-2xl border border-border/60 bg-card overflow-hidden animate-pulse">
      <div className="flex items-center gap-4 p-4 border-l-4 border-l-muted">
        <div className="w-10 h-10 rounded-xl bg-muted flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-muted rounded-md w-2/5" />
          <div className="h-3 bg-muted rounded-md w-3/5" />
        </div>
        <div className="w-8 h-8 rounded-xl bg-muted flex-shrink-0" />
      </div>
    </div>
  )
}

// ─── MedicalSection ───────────────────────────────────────────────────────────
function MedicalSection({ section, uid, childId }) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [showDialog, setShowDialog] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState(null)
  const [form, setForm] = useState({
    name: '', notes: '', date: '',
    dosage: '', frequency: '',
    doctorName: '', doctorPhone: '', status: '',
  })

  const load = () => {
    if (!uid || !childId) return
    setLoading(true)
    getMedicalItems(uid, childId, section.id)
      .then(setItems)
      .catch(() => toast.error('Failed to load'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [uid, childId, section.id])

  const resetForm = () => setForm({
    name: '', notes: '', date: '',
    dosage: '', frequency: '',
    doctorName: '', doctorPhone: '', status: '',
  })

  const handleAdd = async () => {
    if (!form.name.trim()) {
      toast.error('Please enter a name')
      return
    }
    setSaving(true)
    try {
      let data = {}
      if (section.id === 'mediccond') {
        data['Medical Name'] = form.name.trim()
        if (form.notes.trim()) data['Medical Notes'] = form.notes.trim()
      } else if (section.id === 'medications') {
        data['medicationName'] = form.name.trim()
        if (form.notes.trim()) data['medicationNotes'] = form.notes.trim()
        if (form.dosage.trim()) data['dosage'] = form.dosage.trim()
        if (form.frequency.trim()) data['frequency'] = form.frequency.trim()
      } else if (section.id === 'allergies') {
        data['Allergy Name'] = form.name.trim()
        if (form.notes.trim()) data['Allergy Notes'] = form.notes.trim()
      } else if (section.id === 'vaccinations') {
        data['Vaccinations Name'] = form.name.trim()
        if (form.notes.trim()) data['Vaccinations Notes'] = form.notes.trim()
        if (form.date) data['Vaccinations Date'] = form.date
      } else if (section.id === 'procedures') {
        data['Procedures Name'] = form.name.trim()
        if (form.notes.trim()) data['Procedures Notes'] = form.notes.trim()
        if (form.date) data['Procedures Date of Procedure'] = form.date
        if (form.doctorName.trim()) data['Procedures Doctor Name'] = form.doctorName.trim()
        if (form.doctorPhone.trim()) data['Procedures Doctor Phone Number'] = form.doctorPhone.trim()
        if (form.status.trim()) data['Procedures Status'] = form.status.trim()
      }
      await addMedicalItem(uid, childId, section.id, data)
      toast.success(`${section.singular} added`)
      resetForm()
      setShowDialog(false)
      load()
    } catch {
      toast.error('Failed to add')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    setDeletingId(id)
    try {
      await deleteMedicalItem(uid, childId, section.id, id)
      setItems((prev) => prev.filter((i) => i.id !== id))
      toast.success('Removed')
    } catch {
      toast.error('Failed to remove')
    } finally {
      setDeletingId(null)
    }
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return null
    try {
      return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
    } catch {
      return dateStr
    }
  }

  return (
    <>
      {/* ── Section hero banner ───────────────────────────────────────────── */}
      <div className="rounded-2xl overflow-hidden mb-5" style={{ background: section.gradient }}>
        <div className="relative px-5 py-5">
          <div className="absolute -right-6 -top-6 w-28 h-28 rounded-full bg-white/10 pointer-events-none" />
          <div className="absolute -right-2 bottom-0 w-16 h-16 rounded-full bg-white/5 pointer-events-none" />
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <span className="material-symbols-outlined text-white" style={{ fontSize: '22px' }}>{section.icon}</span>
              </div>
              <div>
                <h2 className="text-lg font-bold text-white leading-tight">{section.label}</h2>
                <p className="text-xs text-white/70 mt-0.5">{section.description}</p>
              </div>
            </div>
            <span className="text-xs font-bold text-white bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full">
              {loading ? '—' : items.length} {!loading && items.length === 1 ? 'record' : 'records'}
            </span>
          </div>
        </div>
      </div>

      {/* ── Add button ────────────────────────────────────────────────────── */}
      <div className="flex justify-end mb-4">
        <button
          onClick={() => setShowDialog(true)}
          className="press-scale flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all duration-200"
          style={{
            background: section.gradient,
            boxShadow: `0 4px 14px ${section.pillColor}45`,
          }}
        >
          <span className="material-symbols-outlined text-base">add</span>
          Add {section.singular}
        </button>
      </div>

      {/* ── Item list ─────────────────────────────────────────────────────── */}
      {loading ? (
        <div className="space-y-3">
          <ItemSkeleton />
          <ItemSkeleton />
          <ItemSkeleton />
        </div>
      ) : items.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`rounded-2xl border border-border/60 ${section.softBg} py-14 flex flex-col items-center text-center px-8`}
        >
          <div className={`w-16 h-16 rounded-2xl ${section.iconBg} flex items-center justify-center mb-4`}>
            <span className={`material-symbols-outlined text-3xl ${section.colorClass}`}>{section.icon}</span>
          </div>
          <p className="font-semibold text-foreground mb-1">No {section.label.toLowerCase()} added</p>
          <p className="text-sm text-muted-foreground mb-6 max-w-xs">
            Add {section.description.toLowerCase()} to keep your medical record complete.
          </p>
          <button
            onClick={() => setShowDialog(true)}
            className="press-scale flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white"
            style={{ background: section.gradient, boxShadow: `0 4px 14px ${section.pillColor}40` }}
          >
            <span className="material-symbols-outlined text-base">add</span>
            Add first {section.singular.toLowerCase()}
          </button>
        </motion.div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence initial={false}>
            {items.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ delay: index * 0.04, duration: 0.22 }}
              >
                <div
                  className={`rounded-2xl border border-border/60 bg-card border-l-4 ${section.borderLeft} overflow-hidden press-scale`}
                  style={{ boxShadow: '0 2px 10px hsl(var(--primary) / 0.05)' }}
                >
                  <div className="flex items-center gap-4 p-4">
                    <div className={`w-10 h-10 rounded-xl ${section.iconBg} flex items-center justify-center flex-shrink-0`}>
                      <span className={`material-symbols-outlined text-base ${section.colorClass}`}>{section.icon}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-foreground text-sm truncate">{item.name}</p>
                      {item.notes && (
                        <p className="text-xs text-muted-foreground truncate mt-0.5">{item.notes}</p>
                      )}
                      {section.id === 'procedures' && item['Procedures Doctor Name'] && (
                        <p className="text-xs text-muted-foreground truncate mt-0.5">
                          Dr. {item['Procedures Doctor Name']}
                          {item['Procedures Doctor Phone Number'] ? ` · ${item['Procedures Doctor Phone Number']}` : ''}
                        </p>
                      )}
                      {(() => {
                        const hasBadges = item.date
                          || (section.id === 'medications' && (item.dosage || item.frequency))
                          || (section.id === 'procedures' && item['Procedures Status'])
                        if (!hasBadges) return null
                        return (
                          <div className="flex flex-wrap gap-1.5 mt-1.5">
                            {item.date && (
                              <span className={`text-xs font-medium px-2 py-0.5 rounded-md ${section.iconBg} ${section.colorClass}`}>
                                {section.dateLabel}: {formatDate(item.date)}
                              </span>
                            )}
                            {section.id === 'medications' && item.dosage && (
                              <span className={`text-xs font-medium px-2 py-0.5 rounded-md ${section.iconBg} ${section.colorClass}`}>
                                Dosage: {item.dosage}
                              </span>
                            )}
                            {section.id === 'medications' && item.frequency && (
                              <span className={`text-xs font-medium px-2 py-0.5 rounded-md ${section.iconBg} ${section.colorClass}`}>
                                Frequency: {item.frequency}
                              </span>
                            )}
                            {section.id === 'procedures' && item['Procedures Status'] && (
                              <span className={`text-xs font-medium px-2 py-0.5 rounded-md ${section.iconBg} ${section.colorClass}`}>
                                {item['Procedures Status']}
                              </span>
                            )}
                          </div>
                        )
                      })()}
                    </div>
                    <button
                      onClick={() => handleDelete(item.id)}
                      disabled={deletingId === item.id}
                      className="w-8 h-8 rounded-xl flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all duration-200 press-scale flex-shrink-0"
                    >
                      {deletingId === item.id ? (
                        <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <span className="material-symbols-outlined text-base">delete</span>
                      )}
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* ── Add Dialog ────────────────────────────────────────────────────── */}
      <Dialog
        open={showDialog}
        onOpenChange={(open) => {
          setShowDialog(open)
          if (!open) resetForm()
        }}
      >
        <DialogContent className="w-[calc(100%-2rem)] sm:max-w-md p-0 overflow-hidden rounded-2xl gap-0">
          {/* Gradient header */}
          <div className="px-6 pt-6 pb-5" style={{ background: section.gradient }}>
            <div className="absolute -right-4 -top-4 w-20 h-20 rounded-full bg-white/10 pointer-events-none" />
            <div className="relative flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                <span className="material-symbols-outlined text-white">{section.icon}</span>
              </div>
              <div>
                <DialogTitle className="text-white text-base font-bold leading-tight">
                  Add {section.singular}
                </DialogTitle>
                <p className="text-xs text-white/70 mt-0.5">{section.description}</p>
              </div>
            </div>
          </div>

          {/* Form body */}
          <div className="px-6 py-5 space-y-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">
                Name <span className="text-destructive">*</span>
              </Label>
              <Input
                placeholder={section.placeholder}
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                className="h-11 rounded-xl"
                onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                autoFocus
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">
                {section.notesLabel}{' '}
                <span className="text-muted-foreground text-xs font-normal">(optional)</span>
              </Label>
              <Input
                placeholder={section.notesPlaceholder}
                value={form.notes}
                onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
                className="h-11 rounded-xl"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">
                {section.dateLabel}{' '}
                <span className="text-muted-foreground text-xs font-normal">(optional)</span>
              </Label>
              <Input
                type="date"
                value={form.date}
                onChange={(e) => setForm((p) => ({ ...p, date: e.target.value }))}
                className="h-11 rounded-xl"
              />
            </div>

            {section.id === 'medications' && (
              <div className="flex gap-3">
                <div className="flex-1 space-y-2">
                  <Label className="text-sm font-medium">
                    Dosage{' '}
                    <span className="text-muted-foreground text-xs font-normal">(optional)</span>
                  </Label>
                  <Input
                    placeholder="e.g. 500mg"
                    value={form.dosage}
                    onChange={(e) => setForm((p) => ({ ...p, dosage: e.target.value }))}
                    className="h-11 rounded-xl"
                  />
                </div>
                <div className="flex-1 space-y-2">
                  <Label className="text-sm font-medium">
                    Frequency{' '}
                    <span className="text-muted-foreground text-xs font-normal">(optional)</span>
                  </Label>
                  <Input
                    placeholder="e.g. Twice daily"
                    value={form.frequency}
                    onChange={(e) => setForm((p) => ({ ...p, frequency: e.target.value }))}
                    className="h-11 rounded-xl"
                  />
                </div>
              </div>
            )}

            {section.id === 'procedures' && (
              <>
                <div className="flex gap-3">
                  <div className="flex-1 space-y-2">
                    <Label className="text-sm font-medium">
                      Doctor Name{' '}
                      <span className="text-muted-foreground text-xs font-normal">(optional)</span>
                    </Label>
                    <Input
                      placeholder="e.g. Dr. Sharma"
                      value={form.doctorName}
                      onChange={(e) => setForm((p) => ({ ...p, doctorName: e.target.value }))}
                      className="h-11 rounded-xl"
                    />
                  </div>
                  <div className="flex-1 space-y-2">
                    <Label className="text-sm font-medium">
                      Doctor Phone{' '}
                      <span className="text-muted-foreground text-xs font-normal">(optional)</span>
                    </Label>
                    <Input
                      placeholder="+91 98765 43210"
                      value={form.doctorPhone}
                      onChange={(e) => setForm((p) => ({ ...p, doctorPhone: e.target.value }))}
                      className="h-11 rounded-xl"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">
                    Status{' '}
                    <span className="text-muted-foreground text-xs font-normal">(optional)</span>
                  </Label>
                  <Input
                    placeholder="e.g. Completed, Scheduled"
                    value={form.status}
                    onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))}
                    className="h-11 rounded-xl"
                  />
                </div>
              </>
            )}

            <div className="flex gap-3 pt-1">
              <Button
                variant="outline"
                className="flex-1 h-11 rounded-xl"
                onClick={() => setShowDialog(false)}
              >
                Cancel
              </Button>
              <button
                onClick={handleAdd}
                disabled={saving}
                className="press-scale flex-1 h-11 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 disabled:opacity-60 transition-opacity"
                style={{ background: section.gradient, boxShadow: `0 4px 14px ${section.pillColor}40` }}
              >
                {saving ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span className="material-symbols-outlined text-base">save</span>
                    Save
                  </>
                )}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

// ─── MedicalPage ─────────────────────────────────────────────────────────────
export function MedicalPage() {
  const { user } = useAuth()
  const { activeProfileId, activeProfile } = useContext(ProfileContext)
  const location = useLocation()
  const [activeSection, setActiveSection] = useState(
    location.state?.tab ?? 'mediccond'
  )
  const currentSection = SECTIONS.find((s) => s.id === activeSection)

  return (
    <div className="min-h-screen bg-background">
      <Header title="Medical Information" showBack />

      <div className="px-4 py-6 max-w-2xl mx-auto lg:max-w-3xl">

        {/* Profile indicator */}
        {activeProfile && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-5"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-muted text-sm">
              <span className="material-symbols-outlined text-sm text-primary">person</span>
              <span className="text-muted-foreground">Editing:</span>
              <span className="font-semibold text-foreground">{activeProfile.name || 'Profile'}</span>
            </div>
          </motion.div>
        )}

        {/* ── Tab pill selector ─────────────────────────────────────────────── */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-6 -mx-1 px-1" style={{ scrollbarWidth: 'none' }}>
          {SECTIONS.map((s) => {
            const isActive = s.id === activeSection
            return (
              <button
                key={s.id}
                onClick={() => setActiveSection(s.id)}
                className={`press-scale flex-shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-semibold transition-all duration-200 ${
                  isActive
                    ? 'text-white'
                    : 'bg-card border border-border/60 text-muted-foreground hover:text-foreground hover:border-border/80'
                }`}
                style={isActive
                  ? { background: s.gradient, boxShadow: `0 4px 16px ${s.pillColor}35` }
                  : {}
                }
              >
                <span
                  className={`material-symbols-outlined text-base transition-colors ${
                    isActive ? 'text-white' : s.colorClass
                  }`}
                >
                  {s.icon}
                </span>
                <span className="whitespace-nowrap">{s.label}</span>
              </button>
            )
          })}
        </div>

        {/* ── Section content with animated transition ───────────────────── */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeSection}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
          >
            <MedicalSection
              section={currentSection}
              uid={user?.uid}
              childId={activeProfileId}
            />
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}
