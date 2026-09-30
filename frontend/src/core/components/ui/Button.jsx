import { buttonVariants } from './buttonVariants';
import { Spinner } from './Spinner';

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled,
  className,
  children,
  type = 'button',
  ...props
}) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={buttonVariants({ variant, size, className })}
      {...props}
    >
      {loading && <Spinner className="size-4" label="Đang xử lý" />}
      {children}
    </button>
  );
}
