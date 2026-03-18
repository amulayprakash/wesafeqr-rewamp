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
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import toast from 'react-hot-toast'

const RELATIONSHIPS = ['Spouse', 'Parent', 'Sibling', 'Child', 'Friend', 'Colleague', 'Doctor', 'Other']

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
      await addEmergencyContact(user.uid, activeProfileId, form)
      toast.success('Contact added!')
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
        title="Emergency Contacts"
        showBack
        rightAction={
          <Button size="sm" onClick={() => setShowDialog(true)} className="gap-1">
            <span className="material-symbols-outlined text-lg">add</span>
            Add
          </Button>
        }
      />

      <div className="px-4 py-6">
        {loading ? (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="h-20 rounded-xl bg-muted animate-pulse" />
            ))}
          </div>
        ) : contacts.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16"
          >
            <span className="material-symbols-outlined text-6xl text-muted-foreground/40 mb-4">
              contact_emergency
            </span>
            <h3 className="text-lg font-semibold mb-2">No Emergency Contacts</h3>
            <p className="text-muted-foreground text-sm mb-6">
              Add people who should be contacted in an emergency.
            </p>
            <Button onClick={() => setShowDialog(true)}>
              <span className="material-symbols-outlined mr-2">add</span>
              Add Contact
            </Button>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-3"
          >
            <AnimatePresence>
              {contacts.map((contact) => (
                <motion.div
                  key={contact.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                >
                  <Card>
                    <CardContent className="p-4 flex items-center gap-4">
                      <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 shrink-0">
                        <span className="material-symbols-outlined text-primary">person</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold truncate">{contact.name}</p>
                        <p className="text-sm text-muted-foreground">{contact.phone}</p>
                        {contact.relationship && (
                          <p className="text-xs text-muted-foreground">{contact.relationship}</p>
                        )}
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <a href={`tel:${contact.phone}`}>
                          <Button size="icon" variant="outline" className="h-9 w-9">
                            <span className="material-symbols-outlined text-base">call</span>
                          </Button>
                        </a>
                        <Button
                          size="icon"
                          variant="outline"
                          className="h-9 w-9 text-destructive hover:text-destructive"
                          onClick={() => handleDelete(contact.id)}
                        >
                          <span className="material-symbols-outlined text-base">delete</span>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>

      {/* Add Contact Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Emergency Contact</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label htmlFor="cname">Full Name</Label>
              <Input
                id="cname"
                placeholder="Contact name"
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cphone">Phone Number</Label>
              <Input
                id="cphone"
                type="tel"
                placeholder="+91 98765 43210"
                value={form.phone}
                onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Relationship</Label>
              <Select
                value={form.relationship}
                onValueChange={(v) => setForm((p) => ({ ...p, relationship: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select relationship" />
                </SelectTrigger>
                <SelectContent>
                  {RELATIONSHIPS.map((r) => (
                    <SelectItem key={r} value={r}>{r}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-3 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => setShowDialog(false)}>
                Cancel
              </Button>
              <Button className="flex-1" onClick={handleAdd} disabled={saving}>
                {saving ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : 'Save Contact'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
