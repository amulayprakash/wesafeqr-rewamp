import { useState, useContext } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ProfileContext } from '@/contexts/ProfileContext'
import { Header } from '@/components/layout/Header'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import toast from 'react-hot-toast'

// Deterministic avatar gradient from name
const avatarGradients = [
  'from-indigo-500 to-violet-500',
  'from-rose-500 to-pink-500',
  'from-emerald-500 to-teal-500',
  'from-amber-500 to-orange-500',
  'from-cyan-500 to-sky-500',
]
function getGradient(name = '') {
  const idx = name.charCodeAt(0) % avatarGradients.length
  return avatarGradients[idx] || avatarGradients[0]
}

export function ChildProfilesPage() {
  const { profiles, activeProfileId, switchProfile, addProfile, loadingProfiles } = useContext(ProfileContext)
  const [showDialog, setShowDialog] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ name: '', relation: '' })

  const handleAdd = async () => {
    if (!form.name.trim()) {
      toast.error('Name is required')
      return
    }
    setSaving(true)
    try {
      await addProfile({ name: form.name, relation: form.relation })
      toast.success('Profile added!')
      setForm({ name: '', relation: '' })
      setShowDialog(false)
    } catch {
      toast.error('Failed to add profile')
    } finally {
      setSaving(false)
    }
  }

  const getInitials = (name) =>
    (name || 'P').split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)

  return (
    <div className="min-h-screen bg-background">
      <Header
        title="Manage Profiles"
        showBack
        rightAction={
          <Button size="sm" onClick={() => setShowDialog(true)} className="gap-1">
            <span className="material-symbols-outlined text-lg">add</span>
            Add
          </Button>
        }
      />

      <div className="px-4 py-6 max-w-2xl mx-auto lg:px-6 lg:py-8">
        <p className="text-sm text-muted-foreground mb-5">
          Each profile has its own QR codes, medical info and emergency contacts.
        </p>

        {loadingProfiles ? (
          <div className="space-y-3">
            {[1, 2].map((i) => <div key={i} className="h-20 rounded-2xl bg-muted animate-pulse" />)}
          </div>
        ) : profiles.length === 0 ? (
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-muted mb-4">
              <span className="material-symbols-outlined text-4xl text-muted-foreground/30">family_restroom</span>
            </div>
            <h3 className="text-lg font-semibold mb-2">No Profiles Yet</h3>
            <p className="text-muted-foreground text-sm mb-6">Create a profile for yourself or a family member.</p>
            <Button onClick={() => setShowDialog(true)}>
              <span className="material-symbols-outlined mr-2">add</span>
              Create Profile
            </Button>
          </div>
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
            <AnimatePresence>
              {profiles.map((profile) => {
                const isActive = profile.id === activeProfileId
                const gradient = getGradient(profile.name)
                return (
                  <motion.div
                    key={profile.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                  >
                    <Card className={`overflow-hidden transition-all hover:shadow-md ${isActive ? 'border-primary shadow-sm' : 'hover:border-primary/40'}`}>
                      {/* Active indicator strip */}
                      {isActive && <div className="h-1 w-full bg-gradient-to-r from-primary to-violet-500" />}
                      <CardContent className={`p-4 flex items-center gap-4 ${isActive ? 'bg-primary/3' : ''}`}>
                        <Avatar className="h-12 w-12 ring-2 ring-border flex-shrink-0">
                          <AvatarFallback className={`bg-gradient-to-br ${gradient} text-white font-bold text-sm`}>
                            {getInitials(profile.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-semibold truncate">{profile.name || 'Unnamed'}</p>
                            {isActive && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-semibold">
                                <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                                Active
                              </span>
                            )}
                          </div>
                          {profile.relation && (
                            <p className="text-sm text-muted-foreground mt-0.5">{profile.relation}</p>
                          )}
                        </div>
                        {!isActive && (
                          <Button size="sm" variant="outline" onClick={() => switchProfile(profile.id)} className="flex-shrink-0">
                            Switch
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </motion.div>
        )}
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Profile</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label>Full Name</Label>
              <Input
                placeholder="e.g. Yash Gupta"
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Relation (optional)</Label>
              <Input
                placeholder="e.g. Myself, Son, Wife"
                value={form.relation}
                onChange={(e) => setForm((p) => ({ ...p, relation: e.target.value }))}
              />
            </div>
            <div className="flex gap-3 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => setShowDialog(false)}>Cancel</Button>
              <Button className="flex-1" onClick={handleAdd} disabled={saving}>
                {saving ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : 'Create Profile'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
