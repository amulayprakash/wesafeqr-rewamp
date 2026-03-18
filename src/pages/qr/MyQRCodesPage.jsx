import { useState } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { Header } from '@/components/layout/Header'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'

const qrCodes = [
  { id: 1, name: 'Medical ID Card', status: 'active', location: 'Home Office', lastScanned: '2h ago', type: 'wesafe' },
  { id: 2, name: 'Emergency Travel Hub', status: 'inactive', location: 'Travel Profile', created: 'May 12, 2024', type: 'wesafe' },
  { id: 3, name: 'Leather Wallet', status: 'secured', itemId: 'WS-4421', type: 'lostfound' },
  { id: 4, name: 'Office Laptop', status: 'secured', itemId: 'WS-8890', type: 'lostfound' },
  { id: 5, name: 'Honda City', status: 'active', licensePlate: 'MH 01 AB 1234', type: 'vehicle' },
]

const typeConfig = {
  wesafe:    { iconBg: 'bg-indigo-100 dark:bg-indigo-900/30', iconColor: 'text-indigo-600 dark:text-indigo-400', label: 'WeSafe', cardGrad: 'from-indigo-500/5 to-transparent' },
  lostfound: { iconBg: 'bg-amber-100 dark:bg-amber-900/30',  iconColor: 'text-amber-600 dark:text-amber-400',  label: 'Lost & Found', cardGrad: 'from-amber-500/5 to-transparent' },
  vehicle:   { iconBg: 'bg-emerald-100 dark:bg-emerald-900/30', iconColor: 'text-emerald-600 dark:text-emerald-400', label: 'Vehicle', cardGrad: 'from-emerald-500/5 to-transparent' },
}

const statusConfig = {
  active:   { dot: 'bg-emerald-500', text: 'text-emerald-700 dark:text-emerald-400', bg: 'bg-emerald-100 dark:bg-emerald-900/30', label: 'Active' },
  secured:  { dot: 'bg-emerald-500', text: 'text-emerald-700 dark:text-emerald-400', bg: 'bg-emerald-100 dark:bg-emerald-900/30', label: 'Secured' },
  inactive: { dot: 'bg-muted-foreground', text: 'text-muted-foreground', bg: 'bg-muted', label: 'Inactive' },
}

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } }
const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }

export function MyQRCodesPage() {
  const [activeTab, setActiveTab] = useState('all')

  const filteredQRs = activeTab === 'all' ? qrCodes : qrCodes.filter((qr) => qr.type === activeTab)

  return (
    <div className="min-h-screen bg-background">
      <Header
        title="My QR Codes"
        showBack
        rightAction={
          <Link to="/qr-codes/activate">
            <Button size="sm" className="gap-1.5">
              <span className="material-symbols-outlined text-lg">add</span>
              Add New
            </Button>
          </Link>
        }
      />

      <div className="px-4 py-6 max-w-2xl mx-auto lg:px-6 lg:py-8">
        {/* Pill Tabs */}
        <Tabs defaultValue="all" className="mb-6">
          <TabsList className="w-full rounded-xl p-1 h-auto">
            <TabsTrigger value="all" onClick={() => setActiveTab('all')} className="flex-1 rounded-lg text-sm">All</TabsTrigger>
            <TabsTrigger value="wesafe" onClick={() => setActiveTab('wesafe')} className="flex-1 rounded-lg text-sm">WeSafe</TabsTrigger>
            <TabsTrigger value="lostfound" onClick={() => setActiveTab('lostfound')} className="flex-1 rounded-lg text-sm">Lost & Found</TabsTrigger>
            <TabsTrigger value="vehicle" onClick={() => setActiveTab('vehicle')} className="flex-1 rounded-lg text-sm">Vehicles</TabsTrigger>
          </TabsList>
        </Tabs>

        <p className="text-xs text-muted-foreground mb-4">
          {filteredQRs.length} QR code{filteredQRs.length !== 1 ? 's' : ''}
        </p>

        <motion.div variants={container} initial="hidden" animate="show" className="space-y-3">
          {filteredQRs.map((qr) => {
            const tcfg = typeConfig[qr.type] || typeConfig.wesafe
            const scfg = statusConfig[qr.status] || statusConfig.inactive
            return (
              <motion.div key={qr.id} variants={item}>
                <Card className={`bg-gradient-to-r ${tcfg.cardGrad} hover:border-primary/40 hover:shadow-md transition-all cursor-pointer`}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`flex items-center justify-center w-11 h-11 rounded-xl ${tcfg.iconBg}`}>
                          <span className={`material-symbols-outlined filled ${tcfg.iconColor}`}>qr_code_2</span>
                        </div>
                        <div>
                          <h3 className="font-semibold leading-tight">{qr.name}</h3>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {qr.location || qr.itemId || qr.licensePlate || 'No location'}
                          </p>
                        </div>
                      </div>
                      {/* Status badge */}
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${scfg.bg} ${scfg.text}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${scfg.dot}`} />
                        {scfg.label}
                      </span>
                    </div>

                    <p className="text-xs text-muted-foreground mb-3">
                      {qr.lastScanned && `Last scanned ${qr.lastScanned}`}
                      {qr.created && `Created ${qr.created}`}
                    </p>

                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="flex-1 h-9">
                        <span className="material-symbols-outlined text-base mr-1.5">share</span>
                        Share
                      </Button>
                      <Button variant="outline" size="sm" className="flex-1 h-9">
                        <span className="material-symbols-outlined text-base mr-1.5">settings</span>
                        Manage
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
        </motion.div>

        {filteredQRs.length === 0 && (
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-muted mb-4">
              <span className="material-symbols-outlined text-4xl text-muted-foreground/50">qr_code_2</span>
            </div>
            <h3 className="text-lg font-semibold mb-2">No QR Codes</h3>
            <p className="text-muted-foreground text-sm mb-4">Get started by adding your first QR code.</p>
            <Link to="/qr-codes/activate">
              <Button>
                <span className="material-symbols-outlined mr-2">add</span>
                Add QR Code
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
