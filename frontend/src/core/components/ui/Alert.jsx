import { cn } from '@/core/lib/cn';

const VARIANTS = {
  info: 'bg-blue-50 text-blue-800 ring-blue-200',
  success: 'bg-green-50 text-green-800 ring-green-200',
  warning: 'bg-amber-50 text-amber-800 ring-amber-200',
  error: 'bg-red-50 text-red-800 ring-red-200',
};

export function Alert({ variant = 'info', title, children, action, className }) {
  return (
    <div
      role={variant === 'error' ? 'alert' : 'status'}
      className={cn('rounded-lg px-4 py-3 text-sm ring-1 ring-inset', VARIANTS[variant], className)}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          {title && <p className="font-semibold">{title}</p>}
          {children && <div className={cn(title && 'mt-1')}>{children}</div>}
        </div>
        {action}
      </div>
    </div>
  );
}
