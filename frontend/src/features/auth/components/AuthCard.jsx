import { Card } from '@/core/components/ui';

/** Khung chung cho các trang auth. */
export function AuthCard({ title, description, children, footer }) {
  return (
    <Card className="w-full max-w-md p-8">
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">{title}</h1>
        {description && <p className="mt-2 text-sm text-gray-600">{description}</p>}
      </div>
      {children}
      {footer && <div className="mt-6 text-center text-sm text-gray-600">{footer}</div>}
    </Card>
  );
}

export function AuthDivider({ text = 'hoặc' }) {
  return (
    <div className="my-6 flex items-center gap-3 text-xs text-gray-400 uppercase">
      <span className="h-px flex-1 bg-gray-200" />
      {text}
      <span className="h-px flex-1 bg-gray-200" />
    </div>
  );
}
