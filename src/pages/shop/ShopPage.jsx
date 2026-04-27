import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { Header } from '@/components/layout/Header'

const IMAGES = [
  '/corosel/1.webp', '/corosel/2.webp', '/corosel/3.webp',
  '/corosel/4.webp', '/corosel/5.webp', '/corosel/6.webp',
  '/corosel/7.webp', '/corosel/8.webp', '/corosel/9.webp',
]

const FEATURES = [
  { icon: 'qr_code_2',        labelKey: 'shop.feat_qr',      descKey: 'shop.feat_qr_desc',      color: '#6366f1', bg: 'from-indigo-500/20 to-indigo-500/5' },
  { icon: 'medical_services', labelKey: 'shop.feat_medical', descKey: 'shop.feat_medical_desc', color: '#ef4444', bg: 'from-rose-500/20 to-rose-500/5' },
  { icon: 'devices',          labelKey: 'shop.feat_attach',  descKey: 'shop.feat_attach_desc',  color: '#f59e0b', bg: 'from-amber-500/20 to-amber-500/5' },
  { icon: 'lock',             labelKey: 'shop.feat_privacy', descKey: 'shop.feat_privacy_desc', color: '#10b981', bg: 'from-emerald-500/20 to-emerald-500/5' },
]

const USE_CASES = [
  { icon: 'smartphone',       key: 'Phone' },
  { icon: 'account_balance_wallet', key: 'Wallet' },
  { icon: 'directions_bike',  key: 'Helmet' },
  { icon: 'luggage',          key: 'Bag' },
  { icon: 'key',              key: 'Keys' },
  { icon: 'watch',            key: 'Watch' },
]

export function ShopPage() {
  const { t } = useTranslation()
  const [current, setCurrent] = useState(0)
  const [direction, setDirection] = useState(1)
  const [touchStart, setTouchStart] = useState(null)

  const go = useCallback((next) => {
    const n = (next + IMAGES.length) % IMAGES.length
    setDirection(next > current ? 1 : -1)
    setCurrent(n)
  }, [current])

  useEffect(() => {
    const t = setInterval(() => go(current + 1), 4500)
    return () => clearInterval(t)
  }, [current, go])

  return (
    <div className="min-h-screen bg-background pb-28">
      <Header title={t('shop.title')} showBack />

      {/* ── Hero Carousel ─────────────────────────────────────────────── */}
      <div className="relative w-full overflow-hidden"
        style={{ background: 'linear-gradient(180deg, hsl(var(--muted)) 0%, hsl(var(--background)) 100%)' }}
        onTouchStart={(e) => setTouchStart(e.touches[0].clientX)}
        onTouchEnd={(e) => {
          if (touchStart === null) return
          const diff = touchStart - e.changedTouches[0].clientX
          if (Math.abs(diff) > 40) go(diff > 0 ? current + 1 : current - 1)
          setTouchStart(null)
        }}
      >
        {/* Ambient glow behind image */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/4 w-64 h-64 bg-primary/15 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-48 h-48 bg-amber-400/10 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-lg mx-auto px-6 pt-6 pb-2">
          {/* Main image */}
          <div className="relative rounded-3xl overflow-hidden shadow-2xl shadow-black/20 aspect-square bg-muted">
            <AnimatePresence initial={false} custom={direction}>
              <motion.img
                key={current}
                src={IMAGES[current]}
                alt={`WeSafe QR Sticker ${current + 1}`}
                custom={direction}
                variants={{
                  enter:  (d) => ({ x: d > 0 ? '100%' : '-100%', opacity: 0, scale: 0.97 }),
                  center: { x: 0, opacity: 1, scale: 1 },
                  exit:   (d) => ({ x: d > 0 ? '-100%' : '100%', opacity: 0, scale: 0.97 }),
                }}
                initial="enter" animate="center" exit="exit"
                transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
                className="absolute inset-0 w-full h-full object-cover"
                draggable={false}
              />
            </AnimatePresence>

            {/* Prev / Next */}
            {[{ dir: -1, side: 'left-3', icon: 'chevron_left' }, { dir: 1, side: 'right-3', icon: 'chevron_right' }].map(({ dir, side, icon }) => (
              <button key={icon} onClick={() => go(current + dir)}
                className={`absolute ${side} top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/30 hover:bg-black/55 backdrop-blur-sm flex items-center justify-center transition-all z-10 border border-white/20`}
              >
                <span className="material-symbols-outlined text-white" style={{ fontSize: '20px' }}>{icon}</span>
              </button>
            ))}

            {/* Counter chip */}
            <div className="absolute top-3 right-3 z-10 bg-black/40 backdrop-blur-sm text-white text-xs font-semibold px-2.5 py-1 rounded-full border border-white/15">
              {current + 1} / {IMAGES.length}
            </div>
          </div>

          {/* Dot strip */}
          <div className="flex justify-center gap-1.5 mt-4 mb-2">
            {IMAGES.map((_, i) => (
              <button key={i} onClick={() => go(i)}
                className="transition-all duration-300 rounded-full"
                style={{
                  width: i === current ? 22 : 7,
                  height: 7,
                  background: i === current ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground)/0.3)',
                }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* ── Product Info ──────────────────────────────────────────────── */}
      <div className="max-w-2xl mx-auto px-4 lg:px-6 mt-6 space-y-7">

        {/* Title block */}
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex-1">
              <h1 className="text-2xl font-extrabold leading-tight tracking-tight">{t('shop.product_name')}</h1>
              <p className="text-sm text-muted-foreground mt-1 font-medium">{t('shop.product_subtitle')}</p>
            </div>
            <span className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 text-xs font-bold border border-emerald-200 dark:border-emerald-800">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              {t('shop.in_stock')}
            </span>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">{t('shop.description')}</p>

          <a
            href="https://www.wesafeqr.com/shop"
            target="_blank" rel="noopener noreferrer"
            className="mt-4 flex items-center justify-center h-12 rounded-xl font-bold text-sm gap-2 text-primary-foreground shadow-lg transition-all hover:opacity-90 active:scale-95"
            style={{ background: 'linear-gradient(135deg, hsl(var(--primary)) 0%, #7c3aed 100%)' }}
          >
            <span className="material-symbols-outlined filled" style={{ fontSize: '18px' }}>shopping_cart</span>
            {t('shop.buy_now')}
          </a>
        </motion.div>

        {/* Attach to anything — icon strip */}
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="rounded-2xl border bg-gradient-to-br from-primary/5 via-background to-background overflow-hidden p-4"
        >
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">Attach To Anything</p>
          <div className="grid grid-cols-6 gap-2">
            {USE_CASES.map(({ icon, key }) => (
              <div key={key} className="flex flex-col items-center gap-1.5">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <span className="material-symbols-outlined text-primary filled" style={{ fontSize: '20px' }}>{icon}</span>
                </div>
                <span className="text-[10px] text-muted-foreground font-medium">{key}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* What's included */}
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <div className="rounded-2xl border overflow-hidden">
            <div className="bg-muted/60 px-4 py-3 border-b">
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{t('shop.whats_included')}</p>
            </div>
            <div className="divide-y divide-border">
              {[
                { text: t('shop.include_1'), icon: 'crop_square', note: '1.7" × 1.25"' },
                { text: t('shop.include_2'), icon: 'crop_square', note: '1.1" × 1.75"' },
                { text: t('shop.include_3'), icon: 'vpn_key', note: null },
              ].map(({ text, icon, note }, i) => (
                <div key={i} className="flex items-center gap-3 px-4 py-3.5">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <span className="material-symbols-outlined text-primary" style={{ fontSize: '16px' }}>{icon}</span>
                  </div>
                  <span className="text-sm font-medium flex-1">{text}</span>
                  {note && <span className="text-xs text-muted-foreground font-mono bg-muted px-2 py-0.5 rounded-md">{note}</span>}
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Key Features — 2×2 grid */}
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">{t('shop.key_features')}</p>
          <div className="grid grid-cols-2 gap-3">
            {FEATURES.map((f) => (
              <div key={f.labelKey}
                className={`rounded-2xl border bg-gradient-to-br ${f.bg} p-4 relative overflow-hidden`}
              >
                <div className="absolute -bottom-3 -right-3 w-14 h-14 rounded-full opacity-10"
                  style={{ background: f.color }} />
                <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3 shadow-sm"
                  style={{ background: f.color + '22', border: `1px solid ${f.color}33` }}>
                  <span className="material-symbols-outlined filled" style={{ fontSize: '20px', color: f.color }}>{f.icon}</span>
                </div>
                <p className="font-bold text-sm leading-tight mb-1">{t(f.labelKey)}</p>
                <p className="text-xs text-muted-foreground leading-snug">{t(f.descKey)}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* How it works — 3 step strip */}
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">How It Works</p>
          <div className="flex gap-0 rounded-2xl overflow-hidden border">
            {[
              { n: '1', icon: 'local_shipping', label: 'Order & Receive' },
              { n: '2', icon: 'link',           label: 'Activate in App' },
              { n: '3', icon: 'qr_code_scanner', label: 'Others Scan & Help' },
            ].map(({ n, icon, label }, i, arr) => (
              <div key={n} className={`flex-1 flex flex-col items-center gap-2 p-3.5 text-center ${i < arr.length - 1 ? 'border-r border-border' : ''}`}>
                <div className="relative">
                  <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="material-symbols-outlined text-primary" style={{ fontSize: '18px' }}>{icon}</span>
                  </div>
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-primary text-primary-foreground text-[9px] font-black flex items-center justify-center">{n}</span>
                </div>
                <p className="text-[11px] font-semibold leading-tight text-muted-foreground">{label}</p>
              </div>
            ))}
          </div>
        </motion.div>

      </div>

    </div>
  )
}
