import React, { createContext, useContext, useState, useCallback } from 'react';
import {
  CheckCircle2,
  AlertCircle,
  Info,
  AlertTriangle,
  X,
} from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastItem {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  duration?: number;
}

interface ToastContextValue {
  toasts: ToastItem[];
  showToast: (type: ToastType, message: string, title?: string, duration?: number) => void;
  success: (message: string, title?: string, duration?: number) => void;
  error: (message: string, title?: string, duration?: number) => void;
  warning: (message: string, title?: string, duration?: number) => void;
  info: (message: string, title?: string, duration?: number) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (type: ToastType, message: string, title?: string, duration = 4500) => {
      const id = `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const newToast: ToastItem = {
        id,
        type,
        message,
        title:
          title ||
          (type === 'success'
            ? 'Success / सफल'
            : type === 'error'
            ? 'Error / त्रुटि'
            : type === 'warning'
            ? 'Warning / चेतावनी'
            : 'Notice / सूचना'),
        duration,
      };

      setToasts((prev) => [...prev, newToast]);

      if (duration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, duration);
      }
    },
    [removeToast]
  );

  const success = useCallback(
    (message: string, title?: string, duration?: number) => {
      showToast('success', message, title, duration);
    },
    [showToast]
  );

  const error = useCallback(
    (message: string, title?: string, duration = 6000) => {
      showToast('error', message, title, duration);
    },
    [showToast]
  );

  const warning = useCallback(
    (message: string, title?: string, duration?: number) => {
      showToast('warning', message, title, duration);
    },
    [showToast]
  );

  const info = useCallback(
    (message: string, title?: string, duration?: number) => {
      showToast('info', message, title, duration);
    },
    [showToast]
  );

  return (
    <ToastContext.Provider
      value={{ toasts, showToast, success, error, warning, info, removeToast }}
    >
      {children}
      {/* Universal Floating Toast Container */}
      <div className="fixed bottom-5 right-5 z-[999999] flex flex-col gap-2.5 max-w-sm sm:max-w-md w-full pointer-events-none px-4">
        {toasts.map((t) => {
          const isSuccess = t.type === 'success';
          const isError = t.type === 'error';
          const isWarning = t.type === 'warning';
          const isInfo = t.type === 'info';

          const bgClass = isSuccess
            ? 'bg-slate-900 border-emerald-500/50 text-white shadow-emerald-950/30'
            : isError
            ? 'bg-slate-900 border-rose-500/50 text-white shadow-rose-950/30'
            : isWarning
            ? 'bg-slate-900 border-amber-500/50 text-white shadow-amber-950/30'
            : 'bg-slate-900 border-blue-500/50 text-white shadow-blue-950/30';

          const icon = isSuccess ? (
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          ) : isError ? (
            <div className="w-8 h-8 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0">
              <AlertCircle className="w-5 h-5" />
            </div>
          ) : isWarning ? (
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
          ) : (
            <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
              <Info className="w-5 h-5" />
            </div>
          );

          return (
            <div
              key={t.id}
              role="alert"
              className={`pointer-events-auto p-4 rounded-2xl border shadow-2xl backdrop-blur-xl transition-all duration-300 transform translate-y-0 opacity-100 flex items-start gap-3 ${bgClass}`}
            >
              {icon}
              <div className="flex-1 min-w-0 pr-2">
                <h4 className="font-extrabold text-xs tracking-tight text-white mb-0.5">
                  {t.title}
                </h4>
                <p className="text-xs text-slate-300 font-medium leading-relaxed break-words">
                  {t.message}
                </p>
              </div>
              <button
                onClick={() => removeToast(t.id)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition shrink-0 cursor-pointer"
                aria-label="Close notification"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
