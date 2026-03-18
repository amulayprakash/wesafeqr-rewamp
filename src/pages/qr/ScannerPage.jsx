import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Html5QrcodeScanner } from 'html5-qrcode'
import { Header } from '@/components/layout/Header'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import toast from 'react-hot-toast'

const steps = [
  { icon: 'photo_camera', label: 'Allow camera access when prompted' },
  { icon: 'center_focus_strong', label: 'Point at any WeSafe QR code' },
  { icon: 'person', label: 'View emergency profile instantly' },
]

export function ScannerPage() {
  const [scanning, setScanning] = useState(false)
  const [lastResult, setLastResult] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    let scanner = null

    if (scanning) {
      scanner = new Html5QrcodeScanner(
        'qr-reader',
        { fps: 10, qrbox: { width: 250, height: 250 }, aspectRatio: 1 },
        false
      )

      scanner.render(
        (decodedText) => {
          setLastResult(decodedText)
          setScanning(false)
          scanner.clear()
          if (decodedText.includes('wesafeqr.com/qr/')) {
            const passcode = decodedText.split('/qr/')[1]
            navigate(`/qr/${passcode}`)
          } else {
            toast.success('QR Code scanned!')
          }
        },
        (errorMessage) => {
          console.log('QR scan error:', errorMessage)
        }
      )
    }

    return () => {
      if (scanner) {
        scanner.clear().catch(console.error)
      }
    }
  }, [scanning, navigate])

  return (
    <div className="min-h-screen bg-background">
      <Header title="Scan QR Code" showBack />

      <div className="px-4 py-6 max-w-2xl mx-auto lg:px-6 lg:py-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          {!scanning ? (
            <div className="space-y-6">
              {/* Main scan card */}
              <Card className="overflow-hidden">
                <CardContent className="p-8 text-center">
                  {/* Animated scanner icon */}
                  <div className="relative inline-flex items-center justify-center mb-8">
                    {/* Pulse rings */}
                    <span className="absolute w-28 h-28 rounded-full bg-primary/10 animate-ping" style={{ animationDuration: '2s' }} />
                    <span className="absolute w-24 h-24 rounded-full bg-primary/15 animate-ping" style={{ animationDuration: '2s', animationDelay: '0.5s' }} />
                    {/* Icon container */}
                    <div className="relative w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-indigo-700 flex items-center justify-center shadow-lg shadow-primary/30">
                      <span className="material-symbols-outlined filled text-white" style={{ fontSize: '38px' }}>
                        qr_code_scanner
                      </span>
                    </div>
                  </div>

                  <h2 className="text-2xl font-bold mb-2">Scan a QR Code</h2>
                  <p className="text-muted-foreground text-sm mb-8 max-w-xs mx-auto leading-relaxed">
                    Point your camera at a WeSafe QR code to instantly view the profile or item information.
                  </p>

                  <Button onClick={() => setScanning(true)} size="lg" className="w-full max-w-xs h-12 gap-2 shadow-md shadow-primary/20">
                    <span className="material-symbols-outlined">photo_camera</span>
                    Start Scanning
                  </Button>
                </CardContent>
              </Card>

              {/* Steps */}
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3 text-center">
                  How it works
                </p>
                <div className="space-y-2">
                  {steps.map((step, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -16 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2 + i * 0.1 }}
                      className="flex items-center gap-4 p-4 bg-card rounded-xl border"
                    >
                      <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <span className="material-symbols-outlined text-primary" style={{ fontSize: '18px' }}>{step.icon}</span>
                      </div>
                      <div className="flex items-center gap-3 flex-1">
                        <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center flex-shrink-0">
                          {i + 1}
                        </span>
                        <p className="text-sm font-medium">{step.label}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-4 p-3 bg-primary/5 rounded-xl border border-primary/20">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <span className="material-symbols-outlined text-primary" style={{ fontSize: '18px' }}>radio_button_checked</span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold">Scanning active</p>
                    <p className="text-xs text-muted-foreground">Align QR code within the frame</p>
                  </div>
                  <span className="w-2 h-2 bg-emerald-500 rounded-full ml-auto animate-pulse" />
                </div>
                <div id="qr-reader" className="rounded-xl overflow-hidden" style={{ width: '100%' }} />
                <Button onClick={() => setScanning(false)} variant="outline" className="w-full mt-4">
                  Cancel
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Last result */}
          {lastResult && !scanning && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-4">
              <Card className="border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/20">
                <CardContent className="p-4 flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                    <span className="material-symbols-outlined text-emerald-600 filled" style={{ fontSize: '18px' }}>check_circle</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm mb-1">Last Scanned Result</h3>
                    <p className="text-xs text-muted-foreground break-all">{lastResult}</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  )
}
