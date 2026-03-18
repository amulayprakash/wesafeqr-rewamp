import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { Header } from '@/components/layout/Header'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'

const vehicles = [
  { id: 1, name: 'Honda City', licensePlate: 'MH 01 AB 1234', color: '#4F46E5', type: 'Car', status: 'active', allowCalls: true, allowMessages: true },
  { id: 2, name: 'Royal Enfield Classic', licensePlate: 'MH 02 CD 5678', color: '#8B0000', type: 'Motorcycle', status: 'inactive', allowCalls: false, allowMessages: true },
]

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } }
const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }

export function VehiclesPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header
        title="My Vehicles"
        showBack
        rightAction={
          <Link to="/vehicles/add">
            <Button size="sm" className="gap-1.5">
              <span className="material-symbols-outlined text-lg">add</span>
              Add
            </Button>
          </Link>
        }
      />

      <div className="px-4 py-6 max-w-2xl mx-auto lg:px-6 lg:py-8">
        <p className="text-sm text-muted-foreground mb-6">
          Manage your vehicle QR codes. When scanned, people can contact you about your vehicle.
        </p>

        <motion.div variants={container} initial="hidden" animate="show" className="space-y-4">
          {vehicles.map((vehicle) => {
            const isActive = vehicle.status === 'active'
            const vehicleIcon = vehicle.type === 'Car' ? 'directions_car' : 'two_wheeler'
            return (
              <motion.div key={vehicle.id} variants={item}>
                <Card className="overflow-hidden hover:shadow-md transition-shadow">
                  {/* Gradient header strip */}
                  <div
                    className="h-1.5 w-full"
                    style={{ background: `linear-gradient(to right, ${vehicle.color}, ${vehicle.color}88)` }}
                  />
                  <CardContent className="p-5">
                    {/* Vehicle identity */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-4">
                        <div
                          className="w-12 h-12 rounded-xl flex items-center justify-center"
                          style={{ backgroundColor: vehicle.color + '18' }}
                        >
                          <span className="material-symbols-outlined filled" style={{ color: vehicle.color, fontSize: '26px' }}>
                            {vehicleIcon}
                          </span>
                        </div>
                        <div>
                          <h3 className="font-bold leading-tight">{vehicle.name}</h3>
                          {/* Styled license plate */}
                          <div className="inline-flex items-center gap-1.5 mt-1.5 px-2.5 py-1 rounded-lg bg-muted border border-border">
                            <span className="material-symbols-outlined text-muted-foreground" style={{ fontSize: '12px' }}>
                              confirmation_number
                            </span>
                            <span className="text-xs font-mono font-semibold tracking-widest text-foreground">
                              {vehicle.licensePlate}
                            </span>
                          </div>
                        </div>
                      </div>
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${isActive ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' : 'bg-muted text-muted-foreground'}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-emerald-500' : 'bg-muted-foreground'}`} />
                        {isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>

                    {/* Contact settings */}
                    <div className="bg-muted/50 rounded-xl p-3 mb-4 space-y-3">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Contact Permissions</p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-muted-foreground" style={{ fontSize: '18px' }}>call</span>
                          <span className="text-sm font-medium">Allow Calls</span>
                        </div>
                        <Switch checked={vehicle.allowCalls} />
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-muted-foreground" style={{ fontSize: '18px' }}>sms</span>
                          <span className="text-sm font-medium">Allow Messages</span>
                        </div>
                        <Switch checked={vehicle.allowMessages} />
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="flex-1 h-9">
                        <span className="material-symbols-outlined text-base mr-1.5">qr_code_2</span>
                        View QR
                      </Button>
                      <Button variant="outline" size="sm" className="flex-1 h-9">
                        <span className="material-symbols-outlined text-base mr-1.5">edit</span>
                        Edit
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
        </motion.div>

        {vehicles.length === 0 && (
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-muted mb-4">
              <span className="material-symbols-outlined text-4xl text-muted-foreground/50">directions_car</span>
            </div>
            <h3 className="text-lg font-semibold mb-2">No Vehicles</h3>
            <p className="text-muted-foreground text-sm mb-4">Add your first vehicle to get a QR code.</p>
            <Link to="/vehicles/add">
              <Button>
                <span className="material-symbols-outlined mr-2">add</span>
                Add Vehicle
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
