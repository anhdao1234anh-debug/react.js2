import { Card, CardBody } from '@/core/components/ui';

const STACK = [
  [
    'Frontend',
    'React 19, React Router (createBrowserRouter), TanStack Query, react-hook-form, Zod, Axios, Tailwind CSS',
  ],
  ['Backend', 'Node.js (ESM), Express 5, MongoDB/Mongoose, Zod, JWT, OAuth 2.0, Pino'],
  [
    'Chất lượng',
    'Vitest, Testing Library, MSW, Supertest, MongoDB Memory Server, ESLint, Prettier',
  ],
];

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Giới thiệu</h1>
      <p className="text-gray-600">
        Đây là source base fullstack dùng làm điểm khởi đầu cho nhiều dự án: các tính năng dùng
        chung (xác thực, phân quyền, xử lý lỗi, validate, phân trang...) nằm trong <code>core</code>
        , tính năng nghiệp vụ nằm trong từng module độc lập.
      </p>
      <Card>
        <CardBody>
          <dl className="divide-y divide-gray-100">
            {STACK.map(([label, value]) => (
              <div key={label} className="grid gap-1 py-3 sm:grid-cols-4">
                <dt className="font-medium text-gray-900">{label}</dt>
                <dd className="text-sm text-gray-600 sm:col-span-3">{value}</dd>
              </div>
            ))}
          </dl>
        </CardBody>
      </Card>
    </div>
  );
}
