import { createContext, useCallback, useContext, useMemo, useState } from 'react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toast, setToast] = useState(null);

  const showToast = useCallback((message, type = 'info') => {
    setToast({ message, type });
    window.setTimeout(() => setToast(null), 4000);
  }, []);

  const value = useMemo(() => ({ showToast }), [showToast]);

  const tone =
    toast?.type === 'error'
      ? 'border-rose-500/50 bg-rose-950/90 text-rose-100'
      : toast?.type === 'success'
        ? 'border-emerald-500/50 bg-emerald-950/90 text-emerald-100'
        : 'border-slate-600 bg-slate-900/95 text-slate-100';

  return (
    <ToastContext.Provider value={value}>
      {children}
      {toast && (
        <div className="pointer-events-none fixed bottom-6 right-6 z-50 max-w-sm">
          <div className={`rounded-xl border px-4 py-3 text-sm shadow-2xl ${tone}`}>
            {toast.message}
          </div>
        </div>
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
