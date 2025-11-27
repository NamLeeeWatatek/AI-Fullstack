'use client'

import { Toast, toast as hotToast } from 'react-hot-toast'
import { FiX, FiCheck, FiAlertCircle, FiInfo } from 'react-icons/fi'

interface CustomToastProps {
  t: Toast
  message: string
  type?: 'success' | 'error' | 'info' | 'warning'
}

export function CustomToast({ t, message, type = 'info' }: CustomToastProps) {
  const getIcon = () => {
    switch (type) {
      case 'success':
        return <FiCheck className="w-5 h-5 text-green-500" />
      case 'error':
        return <FiAlertCircle className="w-5 h-5 text-red-500" />
      case 'warning':
        return <FiAlertCircle className="w-5 h-5 text-amber-500" />
      default:
        return <FiInfo className="w-5 h-5 text-blue-500" />
    }
  }

  return (
    <div
      className={`
        flex items-center gap-3 p-4 rounded-xl border shadow-lg
        bg-background/95 backdrop-blur-lg
        ${t.visible ? 'animate-enter' : 'animate-leave'}
      `}
      style={{
        maxWidth: '420px',
      }}
    >
      {/* Icon */}
      <div className="flex-shrink-0">{getIcon()}</div>

      {/* Message */}
      <div className="flex-1 text-sm font-medium">{message}</div>

      {/* Close Button */}
      <button
        onClick={() => hotToast.dismiss(t.id)}
        className="flex-shrink-0 p-1 rounded-lg hover:bg-muted/50 transition-colors"
        aria-label="Close"
      >
        <FiX className="w-4 h-4 text-muted-foreground" />
      </button>
    </div>
  )
}

// Helper functions for easy usage
export const customToast = {
  success: (message: string, options?: any) => {
    return hotToast.custom(
      (t) => <CustomToast t={t} message={message} type="success" />,
      { duration: 3000, ...options }
    )
  },
  error: (message: string, options?: any) => {
    return hotToast.custom(
      (t) => <CustomToast t={t} message={message} type="error" />,
      { duration: 5000, ...options }
    )
  },
  info: (message: string, options?: any) => {
    return hotToast.custom(
      (t) => <CustomToast t={t} message={message} type="info" />,
      { duration: 4000, ...options }
    )
  },
  warning: (message: string, options?: any) => {
    return hotToast.custom(
      (t) => <CustomToast t={t} message={message} type="warning" />,
      { duration: 4000, ...options }
    )
  },
}
