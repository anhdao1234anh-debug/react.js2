import { Spinner } from '@/core/components/ui';

export function PageLoader({ label = 'Đang tải...' }) {
  return (
    <div className="flex min-h-[40svh] items-center justify-center gap-3 text-gray-500">
      <Spinner className="size-6 text-brand-600" label={label} />
      <span className="text-sm">{label}</span>
    </div>
  );
}
