import { cn } from '@/core/lib/cn';

const COLORS = {
  gray: 'bg-gray-100 text-gray-700 ring-gray-500/20',
  brand: 'bg-brand-50 text-brand-700 ring-brand-600/20',
  green: 'bg-green-50 text-green-700 ring-green-600/20',
  red: 'bg-red-50 text-red-700 ring-red-600/20',
  amber: 'bg-amber-50 text-amber-800 ring-amber-600/20',
};

export function Badge({ color = 'gray', className, children }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset',
        COLORS[color],
        className,
      )}
    >
      {children}
    </span>
  );
}
