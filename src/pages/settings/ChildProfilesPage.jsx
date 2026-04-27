import { useState, useContext } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { setDoc, doc, serverTimestamp } from 'firebase/firestore'
import { db } from '@/config/firebase'
import { useAuth } from '@/hooks/useAuth'
import { ProfileContext } from '@/contexts/ProfileContext'
import { Header } from '@/components/layout/Header'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
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
  const { user } = useAuth()
  const { profiles, activeProfileId, switchProfile, addProfile, updateProfile, deleteProfile, loadingProfiles } = useContext(ProfileContext)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [editTarget, setEditTarget] = useState(null) // profile object to rename
  const [editForm, setEditForm] = useState({ name: '', relation: '' })
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({ name: '', relation: '' })

  const handleAdd = async () => {
    if (!form.name.trim()) {
      toast.error('Name is required')
      return
    }
    setSaving(true)
    try {
      // Create the ChildList document with child+alphanumeric ID
      const childId = await addProfile({ name: form.name.trim(), relation: form.relation })
      // Write personal_information with the full schema
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
          email: user.email || '',
          gender: '',
          height: '',
          heightUnit: 'cm',
          info_type: '',
          name: form.name.trim(),
          origin: 'wesafe-web',
          originalProfilePicUrl: user.photoURL || '',
          phone: '',
          phoneNumber: '',
          profilePicUrl: user.photoURL || '',
          qrPasscode: '',
          relation: form.relation || '',
          selectedFile: '',
          userUid: user.uid,
          weight: '',
          weightUnit: 'kg',
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      )
      toast.success('Profile added!')
      setForm({ name: '', relation: '' })
      setShowAddDialog(false)
    } catch {
      toast.error('Failed to add profile')
    } finally {
      setSaving(false)
    }
  }

  const handleSwitch = (profile) => {
    switchProfile(profile.id)
    toast.success(`Switched to ${profile.name || 'profile'}`)
  }

  const openEdit = (profile) => {
    setEditTarget(profile)
    setEditForm({ name: profile.name || '', relation: profile.relation || profile.relationship || '' })
  }

  const handleEditSave = async () => {
    if (!editForm.name.trim()) { toast.error('Name is required'); return }
    setEditing(true)
    try {
      await updateProfile(editTarget.id, { name: editForm.name.trim(), relation: editForm.relation })
      toast.success('Profile updated!')
      setEditTarget(null)
    } catch {
      toast.error('Failed to update profile')
    } finally {
      setEditing(false)
    }
  }

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await deleteProfile(deleteTarget.id)
      toast.success(`${deleteTarget.name || 'Profile'} deleted`)
      setDeleteTarget(null)
    } catch {
      toast.error('Failed to delete profile')
    } finally {
      setDeleting(false)
    }
  }

  const getInitials = (name) =>
    (name || 'P').split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)

  const isLastProfile = profiles.length <= 1

  return (
    <div className="min-h-screen bg-background">
      <Header
        title="Manage Profiles"
        showBack
        rightAction={
          <Button size="sm" onClick={() => setShowAddDialog(true)} className="gap-1">
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
            <Button onClick={() => setShowAddDialog(true)}>
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
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.22 }}
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
                          {(profile.relation || profile.relationship) && (
                            <p className="text-sm text-muted-foreground mt-0.5">{profile.relation || profile.relationship}</p>
                          )}
                        </div>

                        <div className="flex items-center gap-2 flex-shrink-0">
                          {/* Switch button — only for non-active profiles */}
                          {!isActive && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleSwitch(profile)}
                              className="gap-1 press-scale"
                            >
                              <span className="material-symbols-outlined text-base">swap_horiz</span>
                              Switch
                            </Button>
                          )}

                          {/* Edit / rename button */}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => openEdit(profile)}
                            title="Rename profile"
                            className="text-muted-foreground hover:text-foreground hover:bg-accent press-scale"
                          >
                            <span className="material-symbols-outlined text-base">edit</span>
                          </Button>

                          {/* Delete button — disabled for last profile */}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setDeleteTarget(profile)}
                            disabled={isLastProfile}
                            title={isLastProfile ? 'Cannot delete the only profile' : `Delete ${profile.name}`}
                            className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 press-scale disabled:opacity-30"
                          >
                            <span className="material-symbols-outlined text-base">delete</span>
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                )
              })}
            </AnimatePresence>

            {isLastProfile && (
              <p className="text-xs text-muted-foreground text-center pt-1">
                At least one profile must exist — deletion is disabled.
              </p>
            )}
          </motion.div>
        )}
      </div>

      {/* ── Add Profile Dialog ──────────────────────────────────────────── */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Profile</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label>Full Name</Label>
              <Input
                placeholder="e.g. Priya Gupta"
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
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
              <Button variant="outline" className="flex-1" onClick={() => setShowAddDialog(false)}>Cancel</Button>
              <Button className="flex-1" onClick={handleAdd} disabled={saving}>
                {saving ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : 'Create Profile'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Edit / Rename Dialog ───────────────────────────────────────── */}
      <Dialog open={!!editTarget} onOpenChange={(open) => !open && setEditTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Profile</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label>Full Name</Label>
              <Input
                placeholder="e.g. Yash Gupta"
                value={editForm.name}
                onChange={(e) => setEditForm((p) => ({ ...p, name: e.target.value }))}
                onKeyDown={(e) => e.key === 'Enter' && handleEditSave()}
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label>Relation (optional)</Label>
              <Input
                placeholder="e.g. Myself, Son, Wife"
                value={editForm.relation}
                onChange={(e) => setEditForm((p) => ({ ...p, relation: e.target.value }))}
              />
            </div>
            <div className="flex gap-3 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => setEditTarget(null)} disabled={editing}>
                Cancel
              </Button>
              <Button className="flex-1" onClick={handleEditSave} disabled={editing}>
                {editing ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : 'Save Changes'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Delete Confirmation Dialog ──────────────────────────────────── */}
      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Profile</DialogTitle>
          </DialogHeader>
          <div className="pt-2 space-y-4">
            <div className="flex items-start gap-3 p-3 rounded-xl bg-destructive/8 border border-destructive/20">
              <span className="material-symbols-outlined text-destructive mt-0.5" style={{ fontSize: '20px' }}>warning</span>
              <p className="text-sm text-foreground">
                Are you sure you want to delete{' '}
                <span className="font-semibold">{deleteTarget?.name || 'this profile'}</span>?
                {' '}All associated data (medical info, emergency contacts, QR links) will be permanently removed.
              </p>
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                className="flex-1"
                onClick={handleDeleteConfirm}
                disabled={deleting}
              >
                {deleting ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <><span className="material-symbols-outlined mr-1.5 text-base">delete</span>Delete</>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
