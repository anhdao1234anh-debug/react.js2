import { useEffect, useId } from 'react';
import { cn } from '@/core/lib/cn';

/** Modal đơn giản: đóng bằng phím Esc hoặc click nền. */
export function Modal({ open, onClose, title, description, children, footer, className }) {
  const titleId = useId();

  useEffect(() => {
    if (!open) return undefined;
    const onKeyDown = (event) => {
      if (event.key === 'Escape') onClose?.();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center">
      <div className="fixed inset-0 bg-gray-900/50" aria-hidden="true" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={cn(
          'relative max-h-[90svh] w-full max-w-lg overflow-y-auto rounded-xl bg-white shadow-xl',
          className,
        )}
      >
        <div className="border-b border-gray-100 px-6 py-4">
          <h2 id={titleId} className="text-lg font-semibold text-gray-900">
            {title}
          </h2>
          {description && <p className="mt-1 text-sm text-gray-500">{description}</p>}
        </div>
        <div className="px-6 py-5">{children}</div>
        {footer && (
          <div className="flex justify-end gap-3 border-t border-gray-100 px-6 py-4">{footer}</div>
        )}
      </div>
    </div>
  );
}
