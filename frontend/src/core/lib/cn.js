import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Ghép className có điều kiện + gộp class Tailwind xung đột (class sau thắng).
 * @example cn('px-2 py-1', isActive && 'bg-brand-600', 'px-4') // "py-1 bg-brand-600 px-4"
 */
export const cn = (...inputs) => twMerge(clsx(inputs));
