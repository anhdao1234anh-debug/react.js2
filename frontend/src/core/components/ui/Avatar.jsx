import { cn } from '@/core/lib/cn';
import { getInitials } from '@/core/utils/format';

export function Avatar({ name, src, className }) {
  if (src) {
    return (
      <img src={src} alt={name} className={cn('size-9 rounded-full object-cover', className)} />
    );
  }
  return (
    <span
      aria-hidden="true"
      className={cn(
        'inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-brand-100 text-sm font-semibold text-brand-700',
        className,
      )}
    >
      {getInitials(name)}
    </span>
  );
}
