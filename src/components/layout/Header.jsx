import { useNavigate } from 'react-router-dom'
import { cn } from '@/lib/utils'

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
      "sticky top-0 lg:top-16 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border",
      className
    )}>
      <div className="flex items-center justify-between h-14 px-4">
        {/* Left side - Back button or logo */}
        <div className="flex items-center gap-3">
          {showBack ? (
            <button
              onClick={handleBack}
              className="flex items-center justify-center w-10 h-10 -ml-2 rounded-lg hover:bg-accent transition-colors"
            >
              <span className="material-symbols-outlined text-xl">arrow_back_ios</span>
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-2xl">qr_code_2</span>
              <span className="font-semibold text-lg">WeSafe QR</span>
            </div>
          )}

          {showBack && title && (
            <h1 className="text-lg font-semibold">{title}</h1>
          )}
        </div>

        {/* Right side - Actions */}
        <div className="flex items-center gap-2">
          {rightAction}
        </div>
      </div>
    </header>
  )
}
