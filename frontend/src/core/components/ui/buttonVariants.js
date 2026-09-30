import { cn } from '@/core/lib/cn';

const VARIANTS = {
  primary: 'bg-brand-600 text-white shadow-sm hover:bg-brand-700',
  secondary: 'bg-white text-gray-900 shadow-sm ring-1 ring-gray-300 ring-inset hover:bg-gray-50',
  ghost: 'text-gray-700 hover:bg-gray-100',
  danger: 'bg-red-600 text-white shadow-sm hover:bg-red-700',
  link: 'h-auto px-0 text-brand-600 hover:underline',
};

const SIZES = {
  sm: 'h-8 px-3 text-sm',
  md: 'h-10 px-4 text-sm',
  lg: 'h-11 px-5 text-base',
  icon: 'size-9',
};

/**
 * Class của Button - dùng cho phần tử khác (Link, <a>) muốn trông giống Button.
 * @param {{ variant?: keyof VARIANTS, size?: keyof SIZES, className?: string }} [options]
 */
export function buttonVariants({ variant = 'primary', size = 'md', className } = {}) {
  return cn(
    'inline-flex items-center justify-center gap-2 rounded-lg font-medium whitespace-nowrap transition-colors disabled:cursor-not-allowed disabled:opacity-60',
    SIZES[size],
    VARIANTS[variant],
    className,
  );
}
