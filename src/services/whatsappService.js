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
      `📍 *Location*\n` +
      `View on Google Maps: https://maps.google.com/?q=${lat},${lng}\n\n` +
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

export async function sendOTPToAllContacts(contacts, otp, profileName) {
  if (!contacts?.length) return

  // Format OTP digits with spaces for easy reading (e.g. 847291 → 8 4 7 2 9 1)
  const otpSpaced = otp.split('').join(' ')

  const sends = contacts.map(c => {
    const phone = c.phone || c['Emergency Contact Number']
    const name = c.name || c['Emergency Contact Name'] || 'there'
    if (!phone) return Promise.resolve()

    const message =
      `🔐 *Medical Access OTP — WeSafe*\n\n` +
      `Hello ${name},\n\n` +
      `Someone is requesting access to *${profileName}*'s medical information.\n\n` +
      `━━━━━━━━━━━━━━━━\n` +
      `🔑 *Your OTP Code:*\n\n` +
      `*${otpSpaced}*\n` +
      `━━━━━━━━━━━━━━━━\n\n` +
      `Share this 4-digit code *only* with the person you trust who has scanned the QR.\n\n` +
      `⏱ Valid for *30 minutes* • One-time use only\n\n` +
      `_WeSafe — Protecting lives through smart emergency info_`

    return sendWhatsApp(phone, message).catch(() => {})
  })

  await Promise.allSettled(sends)
}

export async function sendCombinedAlert(contacts, profileName, lat, lng, otp) {
  if (!contacts?.length) return

  const now = new Date()
  const time = now.toLocaleString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: 'numeric', minute: '2-digit', hour12: true,
  })

  const otpSpaced = String(otp).split('').join(' ')

  const locationBlock =
    lat != null && lng != null
      ? `📍 *Scanner's Location*\n` +
        `View on Google Maps: https://maps.google.com/?q=${lat},${lng}\n\n`
      : `📍 Location data could not be obtained.\n\n`

  const sends = contacts.map(c => {
    const phone = c.phone || c['Emergency Contact Number']
    const name = c.name || c['Emergency Contact Name'] || 'there'
    if (!phone) return Promise.resolve()

    const message =
      `🚨 *ALERT — ${profileName}'s WeSafe Safety QR Scanned*\n\n` +
      `${profileName}'s safety QR has been scanned. The scanner's location and a medical access code are below.\n\n` +
      `Hello ${name},\n\n` +
      locationBlock +
      `🔐 *Medical Access OTP*\n` +
      `Share this code *only* with the person who scanned the QR if you trust them.\n\n` +
      `━━━━━━━━━━━━━━━━\n` +
      `🔑 *Code:* *${otpSpaced}*\n` +
      `━━━━━━━━━━━━━━━━\n\n` +
      `⏱ Valid for *30 minutes* • One-time use only\n\n` +
      `🕐 Scanned at: ${time}\n\n` +
      `_WeSafe — Protecting lives through smart emergency info_`

    return sendWhatsApp(phone, message).catch(() => {})
  })

  await Promise.allSettled(sends)
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

export async function sendSOSAlert(contacts, profileName, lat, lng) {
  if (!contacts?.length) return

  const now = new Date()
  const time = now.toLocaleString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: 'numeric', minute: '2-digit', hour12: true,
  })

  const locationBlock =
    lat != null && lng != null
      ? `📍 *Current Location*\n` +
        `View on Google Maps: https://maps.google.com/?q=${lat},${lng}\n` +
        `Get Directions: https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}\n\n`
      : `📍 Location data could not be obtained. Please contact them directly.\n\n`

  const message =
    `🆘 *SOS EMERGENCY — ${profileName} needs immediate help!*\n\n` +
    `⚠️ *${profileName} has personally triggered an SOS alert via WeSafe.*\n\n` +
    `${profileName} may be injured, in danger, or unable to call for help. ` +
    `Please respond immediately.\n\n` +
    locationBlock +
    `🕐 SOS triggered at: ${time}\n\n` +
    `Please try calling ${profileName} right away. If there is no response, ` +
    `send help to their location or call emergency services (112).\n\n` +
    `_This alert was manually triggered by ${profileName} using the WeSafe SOS service — not a QR scan._\n` +
    `_WeSafe — Protecting lives through smart emergency info_`

  const sends = contacts.map(c => {
    const phone = c.phone || c['Emergency Contact Number']
    if (!phone) return Promise.resolve()
    return sendWhatsApp(phone, message).catch(() => {})
  })
  await Promise.allSettled(sends)
}
