import { cn } from '@/core/lib/cn';

export function EmptyState({ title, description, action, className }) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 px-6 py-12 text-center',
        className,
      )}
    >
      <p className="text-base font-semibold text-gray-900">{title}</p>
      {description && <p className="mt-1 max-w-sm text-sm text-gray-500">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
