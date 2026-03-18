import { useState, useEffect, useContext } from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '@/hooks/useAuth'
import { ProfileContext } from '@/contexts/ProfileContext'
import { getInsurance, saveInsurance } from '@/services/profileService'
import { Header } from '@/components/layout/Header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import toast from 'react-hot-toast'

export function InsurancePage() {
  const { user } = useAuth()
  const { activeProfileId } = useContext(ProfileContext)
  const [form, setForm] = useState({
    providerName: '',
    policyNumber: '',
    groupNumber: '',
    memberName: '',
    phone: '',
    expiryDate: '',
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!user || !activeProfileId) return
    setLoading(true)
    getInsurance(user.uid, activeProfileId)
      .then((data) => setForm((prev) => ({ ...prev, ...data })))
      .catch(() => toast.error('Failed to load insurance'))
      .finally(() => setLoading(false))
  }, [user, activeProfileId])

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleSave = async () => {
    if (!user || !activeProfileId) return
    setSaving(true)
    try {
      await saveInsurance(user.uid, activeProfileId, form)
      toast.success('Insurance details saved!')
    } catch {
      toast.error('Failed to save')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Header title="Insurance Details" showBack />

      <div className="px-4 py-6 space-y-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">health_and_safety</span>
                Health Insurance
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="providerName">Insurance Provider</Label>
                <Input
                  id="providerName"
                  placeholder="e.g. Star Health, HDFC ERGO"
                  value={form.providerName}
                  onChange={(e) => handleChange('providerName', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="policyNumber">Policy Number</Label>
                <Input
                  id="policyNumber"
                  placeholder="Enter policy number"
                  value={form.policyNumber}
                  onChange={(e) => handleChange('policyNumber', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="groupNumber">Group / Member ID</Label>
                <Input
                  id="groupNumber"
                  placeholder="Enter group number"
                  value={form.groupNumber}
                  onChange={(e) => handleChange('groupNumber', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="memberName">Policy Holder Name</Label>
                <Input
                  id="memberName"
                  placeholder="Name as on policy"
                  value={form.memberName}
                  onChange={(e) => handleChange('memberName', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="insPhone">Insurance Helpline</Label>
                <Input
                  id="insPhone"
                  type="tel"
                  placeholder="1800-XXX-XXXX"
                  value={form.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="expiryDate">Policy Expiry Date</Label>
                <Input
                  id="expiryDate"
                  type="date"
                  value={form.expiryDate}
                  onChange={(e) => handleChange('expiryDate', e.target.value)}
                />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Button onClick={handleSave} disabled={saving || loading} className="w-full h-12">
            {saving ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <span className="material-symbols-outlined mr-2">save</span>
                Save Insurance Details
              </>
            )}
          </Button>
        </motion.div>
      </div>
    </div>
  )
}
