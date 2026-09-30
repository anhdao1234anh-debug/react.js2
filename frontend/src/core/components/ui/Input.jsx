import { cn } from '@/core/lib/cn';

const FIELD_BASE =
  'block w-full rounded-lg border-0 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm ring-1 ring-gray-300 ring-inset placeholder:text-gray-400 focus:ring-2 focus:ring-brand-600 focus:outline-none disabled:bg-gray-100 disabled:text-gray-500';
const FIELD_INVALID = 'ring-red-400 focus:ring-red-500';

const fieldClassName = (invalid, className) => cn(FIELD_BASE, invalid && FIELD_INVALID, className);

/** React 19: `ref` là prop thường -> tương thích trực tiếp với register() của react-hook-form. */
export function Input({ className, invalid, ...props }) {
  return (
    <input
      aria-invalid={invalid || undefined}
      className={fieldClassName(invalid, cn('h-10', className))}
      {...props}
    />
  );
}

export function Textarea({ className, invalid, rows = 4, ...props }) {
  return (
    <textarea
      rows={rows}
      aria-invalid={invalid || undefined}
      className={fieldClassName(invalid, className)}
      {...props}
    />
  );
}

export function Select({ className, invalid, children, ...props }) {
  return (
    <select
      aria-invalid={invalid || undefined}
      className={fieldClassName(invalid, cn('h-10 pr-8', className))}
      {...props}
    >
      {children}
    </select>
  );
}
