import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle, XCircle, AlertTriangle, X } from 'lucide-react'
import { cn } from '@/lib/utils'

type ToastType = 'success' | 'error' | 'warn'

interface Toast {
  id: number
  message: string
  type: ToastType
}

interface ToastContextValue {
  addToast: (message: string, type?: ToastType) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

let toastId = 0

const icons = {
  success: CheckCircle,
  error: XCircle,
  warn: AlertTriangle,
}

const styles = {
  success: 'border-sage-400/40 bg-sage-100 text-sage-500',
  error: 'border-blood-300/50 bg-blood-100 text-blood-700',
  warn: 'border-gold/40 bg-gold/10 text-gold',
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const addToast = useCallback((message: string, type: ToastType = 'success') => {
    const id = ++toastId
    setToasts((prev) => [...prev, { id, message, type }])
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000)
  }, [])

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div className="fixed top-4 left-1/2 z-[100] flex -translate-x-1/2 flex-col gap-2 pointer-events-none">
        <AnimatePresence>
          {toasts.map((toast) => {
            const Icon = icons[toast.type]
            return (
              <motion.div
                key={toast.id}
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className={cn(
                  'pointer-events-auto flex items-center gap-3 rounded-xl border px-4 py-3 shadow-lg font-body text-sm min-w-[280px] max-w-md',
                  styles[toast.type],
                )}
              >
                <Icon size={16} className="shrink-0" />
                <span className="flex-1">{toast.message}</span>
                <button
                  type="button"
                  onClick={() => setToasts((p) => p.filter((t) => t.id !== toast.id))}
                  className="opacity-60 hover:opacity-100"
                >
                  <X size={14} />
                </button>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}
