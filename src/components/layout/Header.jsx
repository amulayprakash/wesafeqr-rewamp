import { useNavigate } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { LanguagePicker } from '@/components/ui/LanguagePicker'

export function Header({
  title,
  showBack = false,
  onBack,
  rightAction,
  className
}) {
  const navigate = useNavigate()

  const handleBack = () => {
    if (onBack) {
      onBack()
    } else {
      navigate(-1)
    }
  }

  return (
    <header className={cn(
      "sticky top-0 lg:top-16 z-40",
      "bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/70",
      "border-b border-border/60",
      !showBack && "lg:hidden",
      className
    )}
      style={{ boxShadow: '0 1px 0 hsl(var(--border) / 0.6), 0 2px 8px hsl(var(--foreground) / 0.03)' }}
    >
      <div className="flex items-center justify-between h-14 px-4">
        {/* Left: back button or logo */}
        <div className="flex items-center gap-3">
          {showBack ? (
            <button
              onClick={handleBack}
              className="flex items-center justify-center w-9 h-9 -ml-1.5 rounded-xl hover:bg-accent active:scale-95 transition-all duration-150"
              aria-label="Go back"
            >
              <span className="material-symbols-outlined text-[20px]">arrow_back_ios</span>
            </button>
          ) : (
            <div className="flex items-center gap-2.5">
              <div className="relative">
                <img
                  src="/logo1.png"
                  alt="WeSafe QR"
                  className="w-7 h-7 rounded-lg object-cover"
                  style={{ boxShadow: '0 2px 8px hsl(var(--primary) / 0.3)' }}
                />
              </div>
              <span className="font-bold text-[17px] tracking-tight">WeSafe QR</span>
            </div>
          )}

          {showBack && title && (
            <h1 className="text-[17px] font-semibold tracking-tight">{title}</h1>
          )}
        </div>

        {/* Right: actions */}
        <div className="flex items-center gap-2">
          <LanguagePicker />
          {rightAction}
        </div>
      </div>
    </header>
  )
}
