import { cn } from '@/core/lib/cn';

export function Card({ className, children, ...props }) {
  return (
    <div
      className={cn('rounded-xl bg-white shadow-sm ring-1 ring-gray-900/5', className)}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ title, description, action, className }) {
  return (
    <div
      className={cn(
        'flex flex-wrap items-start justify-between gap-4 border-b border-gray-100 px-6 py-4',
        className,
      )}
    >
      <div>
        <h2 className="text-base font-semibold text-gray-900">{title}</h2>
        {description && <p className="mt-1 text-sm text-gray-500">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function CardBody({ className, children }) {
  return <div className={cn('px-6 py-5', className)}>{children}</div>;
}
