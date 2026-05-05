const WHATSAPP_TOKEN = import.meta.env.VITE_WHATSAPP_USER_ID
const WHATSAPP_BASE = 'https://wts.vision360solutions.co.in/api/sendText'

function normalizePhone(phone) {
  let d = String(phone).replace(/[\s\-\+\(\)]/g, '')
  if (d.startsWith('91') && d.length > 10) d = d.slice(2)
  return d
}

function buildMessage(profileName, lat, lng) {
  const now = new Date()
  const time = now.toLocaleString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: 'numeric', minute: '2-digit', hour12: true,
  })

  if (lat != null && lng != null) {
    return (
      `🚨 *ALERT — ${profileName}'s WeSafe Safety QR Scanned*\n\n` +
      `${profileName}'s WeSafe safety QR code has just been scanned by someone nearby.\n\n` +
      `📍 *Location & Directions*\n` +
      `View on Google Maps: https://maps.google.com/?q=${lat},${lng}\n` +
      `Get Directions: https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}\n\n` +
      `🕐 Scanned at: ${time}\n\n` +
      `_This is an automated safety alert from WeSafe._`
    )
  }

  return (
    `🚨 *ALERT — ${profileName}'s WeSafe Safety QR Scanned*\n\n` +
    `${profileName}'s WeSafe safety QR code has just been scanned. Location data is unavailable.\n\n` +
    `🕐 Scanned at: ${time}\n\n` +
    `_This is an automated safety alert from WeSafe._`
  )
}

async function sendWhatsApp(phone, message) {
  const normalized = normalizePhone(phone)
  if (!normalized || normalized.length < 7) return
  const url = `${WHATSAPP_BASE}?token=${WHATSAPP_TOKEN}&phone=91${normalized}&message=${encodeURIComponent(message)}`
  await fetch(url)
}

export async function sendEmergencyQRAlerts(contacts, profileName, lat, lng) {
  if (!contacts?.length) return
  const message = buildMessage(profileName, lat, lng)
  const sends = contacts.map(c => {
    const phone = c.phone || c['Emergency Contact Number']
    if (!phone) return Promise.resolve()
    return sendWhatsApp(phone, message).catch(() => {})
  })
  await Promise.allSettled(sends)
}
