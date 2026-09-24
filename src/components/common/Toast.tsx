// Custom lightweight Toast notification dispatcher

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastEventDetail {
  id: string;
  message: string;
  type: ToastType;
}

export const toast = {
  success: (message: string) => dispatchToast(message, 'success'),
  error: (message: string) => dispatchToast(message, 'error'),
  info: (message: string) => dispatchToast(message, 'info'),
  warning: (message: string) => dispatchToast(message, 'warning'),
};

function dispatchToast(message: string, type: ToastType) {
  const detail: ToastEventDetail = {
    id: Math.random().toString(36).substring(2, 9),
    message,
    type,
  };

  window.dispatchEvent(new CustomEvent('eduveda-toast', { detail }));

  // Also show simple floating DOM notification if container exists or create one dynamically
  showFloatingNotification(detail);
}

function showFloatingNotification(detail: ToastEventDetail) {
  if (typeof document === 'undefined') return;

  let container = document.getElementById('eduveda-toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'eduveda-toast-container';
    container.className = 'fixed bottom-5 right-5 z-[9999] flex flex-col gap-2 max-w-sm pointer-events-none';
    document.body.appendChild(container);
  }

  const el = document.createElement('div');
  const bgColors: Record<ToastType, string> = {
    success: 'bg-emerald-900/95 text-emerald-100 border-emerald-700 shadow-emerald-950/40',
    error: 'bg-rose-900/95 text-rose-100 border-rose-700 shadow-rose-950/40',
    info: 'bg-indigo-900/95 text-indigo-100 border-indigo-700 shadow-indigo-950/40',
    warning: 'bg-amber-900/95 text-amber-100 border-amber-700 shadow-amber-950/40',
  };

  const icons: Record<ToastType, string> = {
    success: '✓',
    error: '✕',
    info: 'ℹ',
    warning: '⚠',
  };

  el.className = `p-3.5 rounded-2xl border backdrop-blur-md shadow-lg text-xs font-semibold flex items-center gap-2.5 transition-all duration-300 pointer-events-auto transform translate-y-2 opacity-0 ${bgColors[detail.type]}`;
  el.innerHTML = `
    <span class="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center font-bold text-xs shrink-0">${icons[detail.type]}</span>
    <span class="flex-1">${detail.message}</span>
  `;

  container.appendChild(el);

  // Animate in
  requestAnimationFrame(() => {
    el.classList.remove('translate-y-2', 'opacity-0');
    el.classList.add('translate-y-0', 'opacity-100');
  });

  // Auto remove after 3.5s
  setTimeout(() => {
    el.classList.add('opacity-0', 'translate-y-2');
    setTimeout(() => {
      el.remove();
    }, 300);
  }, 3500);
}
