import { useState, useEffect, useContext } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '@/hooks/useAuth'
import { ProfileContext } from '@/contexts/ProfileContext'
import { getInsuranceItems, addInsuranceItem, deleteInsuranceItem } from '@/services/profileService'
import { Header } from '@/components/layout/Header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import toast from 'react-hot-toast'

const GRADIENT = 'linear-gradient(135deg, #6C72CC 0%, #4A4FA8 100%)'
const PILL_COLOR = '#6C72CC'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(dateStr) {
  if (!dateStr) return null
  try {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric',
    })
  } catch {
    return dateStr
  }
}

function expiryStatus(dateStr) {
  if (!dateStr) return null
  const diff = Math.ceil((new Date(dateStr) - new Date()) / (1000 * 60 * 60 * 24))
  if (diff < 0) return { label: 'Expired', color: 'text-destructive', bg: 'bg-destructive/10', icon: 'error' }
  if (diff <= 30) return { label: `Expires in ${diff}d`, color: 'text-warning', bg: 'bg-warning/10', icon: 'warning' }
  return { label: `Active · ${formatDate(dateStr)}`, color: 'text-success', bg: 'bg-success/10', icon: 'verified' }
}

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

// ─── InsurancePage ────────────────────────────────────────────────────────────

export function InsurancePage() {
  const { user } = useAuth()
  const { activeProfileId, activeProfile } = useContext(ProfileContext)

  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [showDialog, setShowDialog] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState(null)

  const emptyForm = {
    providerName: '',
    policyNumber: '',
    memberName: '',
    phone: '',
    expiryDate: '',
    notes: '',
  }
  const [form, setForm] = useState(emptyForm)

  const load = () => {
    if (!user || !activeProfileId) return
    setLoading(true)
    getInsuranceItems(user.uid, activeProfileId)
      .then(setItems)
      .catch(() => toast.error('Failed to load insurance'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [user, activeProfileId])

  const resetForm = () => setForm(emptyForm)

  const handleAdd = async () => {
    if (!form.providerName.trim()) {
      toast.error('Provider name is required')
      return
    }
    setSaving(true)
    try {
      await addInsuranceItem(user.uid, activeProfileId, {
        providerName: form.providerName.trim(),
        policyNumber: form.policyNumber.trim(),
        memberName: form.memberName.trim(),
        phone: form.phone.trim(),
        expiryDate: form.expiryDate,
        notes: form.notes.trim(),
      })
      toast.success('Insurance policy added')
      resetForm()
      setShowDialog(false)
      load()
    } catch {
      toast.error('Failed to add insurance')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    setDeletingId(id)
    try {
      await deleteInsuranceItem(user.uid, activeProfileId, id)
      setItems((prev) => prev.filter((i) => i.id !== id))
      toast.success('Removed')
    } catch {
      toast.error('Failed to remove')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="min-h-dvh bg-background">
      <Header title="Insurance Details" showBack />

      <div className="px-4 py-6 max-w-2xl mx-auto">

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

        {/* ── Hero banner ───────────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="rounded-2xl overflow-hidden mb-5"
          style={{ background: GRADIENT }}
        >
          <div className="relative px-5 py-5">
            <div className="absolute -right-6 -top-6 w-28 h-28 rounded-full bg-white/10 pointer-events-none" />
            <div className="absolute -right-2 bottom-0 w-16 h-16 rounded-full bg-white/5 pointer-events-none" />
            <div className="relative flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <span className="material-symbols-outlined text-white filled" style={{ fontSize: '22px' }}>
                    health_and_safety
                  </span>
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white leading-tight">Health Insurance</h2>
                  <p className="text-xs text-white/70 mt-0.5">Insurance policies & coverage</p>
                </div>
              </div>
              <span className="text-xs font-bold text-white bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full">
                {loading ? '—' : items.length} {!loading && items.length === 1 ? 'policy' : 'policies'}
              </span>
            </div>
          </div>
        </motion.div>

        {/* ── Add button ────────────────────────────────────────────────────── */}
        <div className="flex justify-end mb-4">
          <button
            onClick={() => setShowDialog(true)}
            className="press-scale flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all duration-200"
            style={{
              background: GRADIENT,
              boxShadow: `0 4px 14px ${PILL_COLOR}45`,
            }}
          >
            <span className="material-symbols-outlined text-base">add</span>
            Add policy
          </button>
        </div>

        {/* ── Item list ─────────────────────────────────────────────────────── */}
        {loading ? (
          <div className="space-y-3">
            <ItemSkeleton />
            <ItemSkeleton />
          </div>
        ) : items.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-border/60 bg-indigo-50 dark:bg-indigo-950/30 py-14 flex flex-col items-center text-center px-8"
          >
            <div className="w-16 h-16 rounded-2xl bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center mb-4">
              <span className="material-symbols-outlined text-3xl text-indigo-500">health_and_safety</span>
            </div>
            <p className="font-semibold text-foreground mb-1">No insurance policies added</p>
            <p className="text-sm text-muted-foreground mb-6 max-w-xs">
              Add health, life, or vehicle insurance to keep your coverage details accessible.
            </p>
            <button
              onClick={() => setShowDialog(true)}
              className="press-scale flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white"
              style={{ background: GRADIENT, boxShadow: `0 4px 14px ${PILL_COLOR}40` }}
            >
              <span className="material-symbols-outlined text-base">add</span>
              Add first policy
            </button>
          </motion.div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence initial={false}>
              {items.map((item, index) => {
                const status = expiryStatus(item.expiryDate)
                return (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ delay: index * 0.04, duration: 0.22 }}
                  >
                    <div
                      className="rounded-2xl border border-border/60 bg-card border-l-4 border-l-indigo-400 overflow-hidden press-scale"
                      style={{ boxShadow: '0 2px 10px hsl(var(--primary) / 0.05)' }}
                    >
                      <div className="flex items-center gap-4 p-4">
                        <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center flex-shrink-0">
                          <span className="material-symbols-outlined text-base text-indigo-500">health_and_safety</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-foreground text-sm truncate">
                            {item.providerName}
                          </p>
                          {item.policyNumber && (
                            <p className="text-xs text-muted-foreground font-mono tabular-nums truncate mt-0.5">
                              {item.policyNumber}
                            </p>
                          )}
                          {item.memberName && (
                            <p className="text-xs text-muted-foreground truncate mt-0.5">
                              {item.memberName}
                              {item.phone ? ` · ${item.phone}` : ''}
                            </p>
                          )}
                          <div className="flex flex-wrap gap-1.5 mt-1.5">
                            {item.notes && (
                              <span className="text-xs font-medium px-2 py-0.5 rounded-md bg-indigo-100 dark:bg-indigo-900/40 text-indigo-500">
                                {item.notes}
                              </span>
                            )}
                            {status && (
                              <span className={`text-xs font-medium px-2 py-0.5 rounded-md flex items-center gap-1 ${status.bg} ${status.color}`}>
                                <span className="material-symbols-outlined text-[12px]">{status.icon}</span>
                                {status.label}
                              </span>
                            )}
                          </div>
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
                )
              })}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* ── Add Dialog ────────────────────────────────────────────────────────── */}
      <Dialog
        open={showDialog}
        onOpenChange={(open) => {
          setShowDialog(open)
          if (!open) resetForm()
        }}
      >
        <DialogContent className="w-[calc(100%-2rem)] sm:max-w-md p-0 overflow-hidden rounded-2xl gap-0">
          {/* Gradient header */}
          <div className="px-6 pt-6 pb-5 relative" style={{ background: GRADIENT }}>
            <div className="absolute -right-4 -top-4 w-20 h-20 rounded-full bg-white/10 pointer-events-none" />
            <div className="relative flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                <span className="material-symbols-outlined text-white">health_and_safety</span>
              </div>
              <div>
                <DialogTitle className="text-white text-base font-bold leading-tight">
                  Add insurance policy
                </DialogTitle>
                <p className="text-xs text-white/70 mt-0.5">Insurance policies & coverage</p>
              </div>
            </div>
          </div>

          {/* Form body */}
          <div className="px-6 py-4 space-y-3 overflow-y-auto max-h-[60vh]">
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">
                Insurance provider <span className="text-destructive">*</span>
              </Label>
              <Input
                placeholder="e.g. Star Health, HDFC ERGO"
                value={form.providerName}
                onChange={(e) => setForm((p) => ({ ...p, providerName: e.target.value }))}
                className="h-10 rounded-xl"
                autoFocus
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm font-medium">
                Policy number{' '}
                <span className="text-muted-foreground text-xs font-normal">(optional)</span>
              </Label>
              <Input
                placeholder="e.g. HP-2024-00183746"
                value={form.policyNumber}
                onChange={(e) => setForm((p) => ({ ...p, policyNumber: e.target.value }))}
                className="h-10 rounded-xl font-mono"
              />
            </div>

            <div className="flex gap-3">
              <div className="flex-1 space-y-1.5">
                <Label className="text-sm font-medium">
                  Policy holder{' '}
                  <span className="text-muted-foreground text-xs font-normal">(optional)</span>
                </Label>
                <Input
                  placeholder="Name as on policy"
                  value={form.memberName}
                  onChange={(e) => setForm((p) => ({ ...p, memberName: e.target.value }))}
                  className="h-10 rounded-xl"
                />
              </div>
              <div className="flex-1 space-y-1.5">
                <Label className="text-sm font-medium">
                  Helpline{' '}
                  <span className="text-muted-foreground text-xs font-normal">(optional)</span>
                </Label>
                <Input
                  type="tel"
                  placeholder="1800-XXX-XXXX"
                  value={form.phone}
                  onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
                  className="h-10 rounded-xl font-mono"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm font-medium">
                Expiry date{' '}
                <span className="text-muted-foreground text-xs font-normal">(optional)</span>
              </Label>
              <Input
                type="date"
                value={form.expiryDate}
                onChange={(e) => setForm((p) => ({ ...p, expiryDate: e.target.value }))}
                className="h-10 rounded-xl"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm font-medium">
                Coverage notes{' '}
                <span className="text-muted-foreground text-xs font-normal">(optional)</span>
              </Label>
              <Input
                placeholder="e.g. OPD, dental"
                value={form.notes}
                onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
                className="h-10 rounded-xl"
              />
            </div>

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
                style={{ background: GRADIENT, boxShadow: `0 4px 14px ${PILL_COLOR}40` }}
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
    </div>
  )
}
