# Fullstack Source Base

Source base tái sử dụng cho nhiều dự án có chung nền tảng tính năng.

| Phần        | Công nghệ                                                                                                               |
| ----------- | ----------------------------------------------------------------------------------------------------------------------- |
| `backend/`  | Node.js 22+ (ESM), Express 5, MongoDB/Mongoose 9, Zod 4, JWT, OAuth 2.0 (Google, GitHub), pino                          |
| `frontend/` | React 19, Vite 8, React Router 8 (`createBrowserRouter`), TanStack Query 5, react-hook-form, Zod, Axios, Tailwind CSS 4 |
| `docs/`     | Tài liệu tiếng Việt kèm sơ đồ Mermaid                                                                                   |

**Tính năng sẵn có:** đăng nhập 3 phương thức (email/mật khẩu, OAuth, magic link) · refresh token rotation + quản lý thiết bị · RBAC 3 role (member / admin / superAdmin) · kiến trúc `core` + module/feature · validate Zod 2 đầu · xử lý lỗi thống nhất · test đầy đủ (Vitest, Supertest, MongoDB in-memory, Testing Library, MSW) · ESLint + Prettier · quản lý env có kiểm tra đồng bộ.

## Bắt đầu

```bash
npm install
npm run setup          # tạo .env từ .env.example + tự sinh secret
# điền MONGODB_URI trong backend/.env
npm run seed           # tạo tài khoản superAdmin
npm run dev            # http://localhost:5173 (API: http://localhost:8000/api/v1)
```

## Lệnh chính

| Lệnh                | Mô tả                                      |
| ------------------- | ------------------------------------------ |
| `npm run dev`       | Chạy backend + frontend                    |
| `npm test`          | Toàn bộ test                               |
| `npm run check`     | env + lint + format + test (như CI)        |
| `npm run lint`      | ESLint                                     |
| `npm run format`    | Prettier                                   |
| `npm run env:check` | Kiểm tra `.env` đồng bộ với `.env.example` |
| `npm run build`     | Build frontend                             |

Xem đầy đủ tại [docs/01-getting-started.md](docs/01-getting-started.md).

## Tài liệu

- [docs/README.md](docs/README.md) — mục lục
- [CHECK_LIST.md](CHECK_LIST.md) — tiến độ & các phase tiếp theo (Mail, Cache, Cron, File R2)
- [CLAUDE.md](CLAUDE.md) — hướng dẫn cho Claude Code
