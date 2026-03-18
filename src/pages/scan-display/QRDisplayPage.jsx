import { useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'

// This is a public page - no authentication required
export function QRDisplayPage() {
  const { passcode } = useParams()

  const profileData = {
    name: 'Yash Vardhan',
    bloodGroup: 'O+ POS',
    allergies: ['Penicillin'],
    conditions: ['Diabetic'],
    emergencyContact: {
      name: 'Emergency Contact',
      phone: '+91 ****890',
    },
    medicalNotes:
      'Carries insulin in backpack side pocket. In case of emergency, administer glucose first.',
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Emergency banner */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden bg-gradient-to-r from-destructive to-rose-700 text-white"
      >
        {/* Pulsing ring behind icon */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 rounded-full bg-white/5 animate-ping" style={{ animationDuration: '3s' }} />
        <div className="relative flex flex-col items-center justify-center gap-2 py-6 px-4">
          <div className="flex items-center gap-2">
            {/* Pulsing dot */}
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-white" />
            </span>
            <span className="text-white font-bold text-sm uppercase tracking-widest">Emergency Information</span>
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-white" />
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined filled text-white" style={{ fontSize: '22px' }}>medical_services</span>
            <h1 className="text-2xl font-bold">WeSafe QR</h1>
          </div>
          <p className="text-white/75 text-xs">Scan verified — data access granted</p>
        </div>
      </motion.div>

      <div className="px-4 py-6 max-w-md mx-auto">
        {/* Blood group hero card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="mb-4"
        >
          <Card className="border-destructive/20 overflow-hidden">
            <div className="h-1 bg-gradient-to-r from-destructive to-rose-500" />
            <CardContent className="p-6 text-center">
              {/* Blood group circle */}
              <div className="relative inline-flex items-center justify-center w-24 h-24 rounded-full bg-destructive/10 border-4 border-destructive/20 mb-4">
                <span className="text-2xl font-black text-destructive leading-none">
                  {profileData.bloodGroup}
                </span>
              </div>
              <h2 className="text-2xl font-bold mb-1">{profileData.name}</h2>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-destructive/10 text-destructive text-sm font-semibold">
                <span className="material-symbols-outlined filled" style={{ fontSize: '14px' }}>bloodtype</span>
                Blood Group: {profileData.bloodGroup}
              </span>
            </CardContent>
          </Card>
        </motion.div>

        {/* Critical alerts */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-2 mb-4"
        >
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">Critical Alerts</p>
          {profileData.allergies.map((allergy, index) => (
            <div key={index} className="flex items-center gap-3 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-800">
              <div className="w-9 h-9 rounded-lg bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center flex-shrink-0">
                <span className="material-symbols-outlined text-amber-600 filled" style={{ fontSize: '18px' }}>warning</span>
              </div>
              <div>
                <p className="font-bold text-amber-800 dark:text-amber-200 text-sm">{allergy} Allergy</p>
                <p className="text-amber-700 dark:text-amber-300 text-xs">Do not administer</p>
              </div>
            </div>
          ))}
          {profileData.conditions.map((condition, index) => (
            <div key={index} className="flex items-center gap-3 p-4 bg-destructive/5 rounded-xl border border-destructive/20">
              <div className="w-9 h-9 rounded-lg bg-destructive/10 flex items-center justify-center flex-shrink-0">
                <span className="material-symbols-outlined text-destructive filled" style={{ fontSize: '18px' }}>emergency</span>
              </div>
              <div>
                <p className="font-bold text-destructive text-sm">{condition}</p>
                <p className="text-destructive/70 text-xs">Known medical condition</p>
              </div>
            </div>
          ))}
        </motion.div>

        {/* Emergency contact */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-4"
        >
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <span className="material-symbols-outlined text-primary filled" style={{ fontSize: '16px' }}>contact_emergency</span>
                </div>
                Emergency Contact
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-xl font-bold mb-1">{profileData.emergencyContact.phone}</p>
              <p className="text-sm text-muted-foreground mb-4">{profileData.emergencyContact.name}</p>
              <div className="flex gap-2">
                <Button className="flex-1 gap-2">
                  <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>call</span>
                  Call Contact
                </Button>
                <Button variant="outline" className="flex-1 gap-2">
                  <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>sms</span>
                  Message
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Medical notes */}
        {profileData.medicalNotes && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mb-4"
          >
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <span className="material-symbols-outlined text-primary filled" style={{ fontSize: '16px' }}>description</span>
                  </div>
                  Medical Notes
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-sm text-muted-foreground leading-relaxed">{profileData.medicalNotes}</p>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-6 text-center"
        >
          <Separator className="mb-4" />
          <p className="text-xs text-muted-foreground">Protected by WeSafe QR • Scan ID: {passcode}</p>
          <p className="text-xs text-muted-foreground mt-1">Information visible based on owner's privacy settings</p>
        </motion.div>
      </div>
    </div>
  )
}
