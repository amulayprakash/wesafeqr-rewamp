import { useState } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { Header } from '@/components/layout/Header'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

const items = [
  { id: 1, name: 'Leather Wallet',   status: 'secured', itemId: 'WS-4421', image: null },
  { id: 2, name: 'Office Laptop',    status: 'secured', itemId: 'WS-8890', image: null },
  { id: 3, name: 'House Keys',       status: 'lost',    itemId: 'WS-1022', image: null },
  { id: 4, name: 'Travel Backpack',  status: 'secured', itemId: 'WS-1209', image: null },
]

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } }
const itemVariant = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }

export function ItemsPage() {
  const [searchQuery, setSearchQuery] = useState('')

  const filteredItems = items.filter((i) =>
    i.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const securedCount = items.filter((i) => i.status === 'secured').length
  const lostCount = items.filter((i) => i.status === 'lost').length

  return (
    <div className="min-h-screen bg-background">
      <Header
        title="My Protected Items"
        rightAction={
          <Link to="/settings" className="flex items-center justify-center w-10 h-10 rounded-lg hover:bg-accent transition-colors">
            <span className="material-symbols-outlined">person</span>
          </Link>
        }
      />

      <div className="px-4 py-6 max-w-2xl mx-auto lg:px-6 lg:py-8">
        {/* Header info */}
        <div className="mb-5">
          <h1 className="text-xl font-bold mb-1">My Protected Items</h1>
          <p className="text-sm text-muted-foreground">Manage your secured belongings</p>
        </div>

        {/* Stats chips */}
        <div className="flex items-center gap-3 mb-5">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-sm font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            {securedCount} Secured
          </span>
          {lostCount > 0 && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-destructive/10 text-destructive text-sm font-semibold">
              <span className="w-2 h-2 rounded-full bg-destructive" />
              {lostCount} Lost
            </span>
          )}
          <span className="text-xs text-muted-foreground ml-auto">{items.length} total</span>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" style={{ fontSize: '20px' }}>
            search
          </span>
          <Input
            placeholder="Search items..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-11 rounded-xl"
          />
        </div>

        {/* Items list */}
        <motion.div variants={container} initial="hidden" animate="show" className="space-y-3">
          {filteredItems.map((itemData) => {
            const isLost = itemData.status === 'lost'
            return (
              <motion.div key={itemData.id} variants={itemVariant}>
                <Card className={`border-l-4 overflow-hidden hover:shadow-md transition-all ${isLost ? 'border-l-destructive' : 'border-l-emerald-400'}`}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className={`flex items-center justify-center w-12 h-12 rounded-xl flex-shrink-0 ${isLost ? 'bg-destructive/10' : 'bg-emerald-100 dark:bg-emerald-900/30'}`}>
                          <span className={`material-symbols-outlined ${isLost ? 'text-destructive' : 'text-emerald-600 dark:text-emerald-400'}`}>
                            inventory_2
                          </span>
                        </div>
                        <div>
                          <h3 className="font-semibold">{itemData.name}</h3>
                          <p className="text-xs text-muted-foreground mt-0.5 font-mono">ID: {itemData.itemId}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${isLost ? 'bg-destructive/10 text-destructive' : 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${isLost ? 'bg-destructive' : 'bg-emerald-500'}`} />
                          {isLost ? 'Lost' : 'Secured'}
                        </span>
                        <Button variant="outline" size="sm" className="h-8 text-xs hidden sm:flex">
                          {isLost ? 'Cancel Report' : 'Report Lost'}
                        </Button>
                      </div>
                    </div>
                    {/* Mobile action */}
                    <Button variant="outline" size="sm" className="w-full mt-3 h-8 text-xs sm:hidden">
                      {isLost ? 'Cancel Report' : 'Report Lost'}
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
        </motion.div>

        {filteredItems.length === 0 && (
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-muted mb-4">
              <span className="material-symbols-outlined text-4xl text-muted-foreground/50">inventory_2</span>
            </div>
            <h3 className="text-lg font-semibold mb-2">No Items Found</h3>
            <p className="text-muted-foreground text-sm">
              {searchQuery ? 'No items match your search.' : 'Start protecting your items by adding them.'}
            </p>
          </div>
        )}
      </div>

      {/* FAB */}
      <Link to="/items/add">
        <motion.button
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.3, type: 'spring' }}
          className="fixed bottom-24 right-4 lg:bottom-8 w-14 h-14 bg-primary text-primary-foreground rounded-2xl shadow-lg shadow-primary/30 flex items-center justify-center hover:bg-primary/90 hover:shadow-primary/40 transition-all"
        >
          <span className="material-symbols-outlined text-2xl">add</span>
        </motion.button>
      </Link>
    </div>
  )
}
