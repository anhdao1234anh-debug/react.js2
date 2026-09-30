import { cn } from '@/core/lib/cn';
import { toast, useToasts } from '@/core/lib/toast';

const STYLES = {
  success: 'border-green-500',
  error: 'border-red-500',
  info: 'border-brand-500',
};

/** Vùng hiển thị toast - đặt 1 lần ở RootLayout. */
export function Toaster() {
  const toasts = useToasts();

  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed inset-x-4 bottom-4 z-[60] flex flex-col items-end gap-2 sm:left-auto sm:w-96"
    >
      {toasts.map((item) => (
        <div
          key={item.id}
          role={item.type === 'error' ? 'alert' : 'status'}
          className={cn(
            'pointer-events-auto w-full rounded-lg border-l-4 bg-white px-4 py-3 shadow-lg ring-1 ring-gray-900/5',
            STYLES[item.type],
          )}
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-gray-900">{item.title}</p>
              {item.description && (
                <p className="mt-0.5 text-sm text-gray-600">{item.description}</p>
              )}
            </div>
            <button
              type="button"
              onClick={() => toast.dismiss(item.id)}
              className="text-gray-400 hover:text-gray-600"
              aria-label="Đóng thông báo"
            >
              ✕
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
