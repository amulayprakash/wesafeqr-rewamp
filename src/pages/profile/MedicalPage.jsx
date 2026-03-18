import { useState, useEffect, useContext } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '@/hooks/useAuth'
import { ProfileContext } from '@/contexts/ProfileContext'
import {
  getMedicalItems,
  addMedicalItem,
  deleteMedicalItem,
} from '@/services/profileService'
import { Header } from '@/components/layout/Header'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import toast from 'react-hot-toast'

const SECTIONS = [
  { id: 'mediccond', label: 'Conditions', icon: 'monitor_heart', color: 'text-destructive', placeholder: 'e.g. Diabetes Type 2' },
  { id: 'medications', label: 'Medications', icon: 'medication', color: 'text-primary', placeholder: 'e.g. Metformin 500mg' },
  { id: 'allergies', label: 'Allergies', icon: 'warning', color: 'text-amber-600', placeholder: 'e.g. Penicillin' },
  { id: 'vaccinations', label: 'Vaccines', icon: 'vaccines', color: 'text-emerald-600', placeholder: 'e.g. COVID-19 Booster' },
  { id: 'procedures', label: 'Procedures', icon: 'surgical', color: 'text-violet-600', placeholder: 'e.g. Appendectomy 2020' },
]

function MedicalSection({ section, uid, childId }) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [showDialog, setShowDialog] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ name: '', notes: '' })

  const load = () => {
    if (!uid || !childId) return
    setLoading(true)
    getMedicalItems(uid, childId, section.id)
      .then(setItems)
      .catch(() => toast.error('Failed to load'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [uid, childId, section.id])

  const handleAdd = async () => {
    if (!form.name.trim()) {
      toast.error('Please enter a name')
      return
    }
    setSaving(true)
    try {
      await addMedicalItem(uid, childId, section.id, form)
      toast.success('Added!')
      setForm({ name: '', notes: '' })
      setShowDialog(false)
      load()
    } catch {
      toast.error('Failed to add')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    try {
      await deleteMedicalItem(uid, childId, section.id, id)
      setItems((prev) => prev.filter((i) => i.id !== id))
      toast.success('Removed')
    } catch {
      toast.error('Failed to remove')
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {items.length} {section.label.toLowerCase()} recorded
        </p>
        <Button size="sm" variant="outline" onClick={() => setShowDialog(true)} className="gap-1">
          <span className="material-symbols-outlined text-base">add</span>
          Add
        </Button>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1, 2].map((i) => <div key={i} className="h-14 rounded-lg bg-muted animate-pulse" />)}
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-10">
          <span className={`material-symbols-outlined text-5xl ${section.color} opacity-30 mb-3`}>
            {section.icon}
          </span>
          <p className="text-muted-foreground text-sm">No {section.label.toLowerCase()} added yet</p>
        </div>
      ) : (
        <AnimatePresence>
          {items.map((item) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <Card>
                <CardContent className="p-3 flex items-center gap-3">
                  <span className={`material-symbols-outlined ${section.color}`}>
                    {section.icon}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{item.name}</p>
                    {item.notes && (
                      <p className="text-xs text-muted-foreground truncate">{item.notes}</p>
                    )}
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive shrink-0"
                    onClick={() => handleDelete(item.id)}
                  >
                    <span className="material-symbols-outlined text-base">delete</span>
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      )}

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add {section.label.slice(0, -1)}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input
                placeholder={section.placeholder}
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Notes (optional)</Label>
              <Input
                placeholder="Additional details..."
                value={form.notes}
                onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
              />
            </div>
            <div className="flex gap-3 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => setShowDialog(false)}>Cancel</Button>
              <Button className="flex-1" onClick={handleAdd} disabled={saving}>
                {saving ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : 'Save'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export function MedicalPage() {
  const { user } = useAuth()
  const { activeProfileId, activeProfile } = useContext(ProfileContext)

  return (
    <div className="min-h-screen bg-background">
      <Header title="Medical Information" showBack />

      <div className="px-4 py-6">
        {activeProfile && (
          <p className="text-sm text-muted-foreground mb-4">
            Editing: <span className="font-medium text-foreground">{activeProfile.name || 'Profile'}</span>
          </p>
        )}

        <Tabs defaultValue="mediccond">
          <TabsList className="w-full grid grid-cols-5 h-auto mb-6">
            {SECTIONS.map((s) => (
              <TabsTrigger
                key={s.id}
                value={s.id}
                className="flex flex-col gap-1 py-2 text-xs"
              >
                <span className={`material-symbols-outlined text-lg ${s.color}`}>{s.icon}</span>
                <span className="hidden sm:inline">{s.label}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          {SECTIONS.map((s) => (
            <TabsContent key={s.id} value={s.id}>
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className="flex items-center gap-2 mb-4">
                  <span className={`material-symbols-outlined ${s.color}`}>{s.icon}</span>
                  <h2 className="text-lg font-semibold">{s.label}</h2>
                </div>
                <MedicalSection
                  section={s}
                  uid={user?.uid}
                  childId={activeProfileId}
                />
              </motion.div>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </div>
  )
}
