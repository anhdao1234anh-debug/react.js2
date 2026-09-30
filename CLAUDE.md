# CLAUDE.md

Fullstack source base (monorepo, npm workspaces): `backend/` (Express 5 ESM + MongoDB/Mongoose + Zod), `frontend/` (React 19 + Vite + React Router 8 + TanStack Query + react-hook-form + Zod + Axios + Tailwind v4), `docs/` (tiếng Việt), `scripts/` (setup/env/clean).
Chi tiết từng phần: `backend/CLAUDE.md`, `frontend/CLAUDE.md`, `docs/README.md`. Tiến độ: `CHECK_LIST.md`.

## Commands (chạy ở root)

```bash
npm run dev            # env:check + BE (8000) + FE (5173) song song
npm test               # scripts + backend + frontend (vitest run, không watch)
npm run test:be        # hoặc: npm run test -w backend -- tests/integration/users.test.js
npm run test:fe        # hoặc: npm run test -w frontend -- src/features/products
npm run lint           # ESLint toàn repo; lint:fix để tự sửa
npm run format         # Prettier; format:check để kiểm tra
npm run check          # env:check + lint + format:check + test — PHẢI xanh trước khi báo cáo xong
npm run env:check      # so .env với .env.example; env:sync để bổ sung biến thiếu
npm run build          # build frontend
npm run seed           # tạo superAdmin (-- --samples: thêm sản phẩm mẫu)
```

## Kiến trúc & quy tắc bắt buộc

- `core/` = hạ tầng dùng chung, **không** import từ `modules/` (BE) hay `features/` (FE). Nghiệp vụ nằm trong module/feature.
- Backend: route → `validate(zod)` → controller mỏng (`asyncHandlers`) → service (ném `AppError`) → repository (`extends BaseRepository`) → model. Response luôn qua `sendSuccess/sendCreated/sendPaginated/sendNoContent`.
- Frontend: page mỏng → custom hook điều phối (`useXxxManagement`) → hook dữ liệu (TanStack Query) → `xxxApi` → `core/api/httpClient`. Form dùng `useFormMutation` + Zod. Feature khác chỉ import qua `features/<x>/index.js`.
- Không đọc `process.env` / `import.meta.env` trực tiếp — dùng `env` từ `backend/src/config/env.js` / `frontend/src/core/config/env.js`.
- Không hard-code URL (dùng `PATHS`), query key (`xxxKeys`), permission (`PERMISSIONS`), mã lỗi (`ErrorCodes`).
- Backend không dùng `console` trong `src/` (dùng `logger`). Backend import luôn có đuôi `.js`, dùng alias `#config/* #core/* #modules/* #tests/*`. Frontend alias `@/`.
- Comment, message người dùng, docs: **tiếng Việt**; tên biến/hàm: tiếng Anh.
- RBAC: 3 role `member < admin < superAdmin`. Ma trận ở `backend/src/config/permissions.js`; FE mirror hằng số ở `frontend/src/core/constants/rbac.js` nhưng quyền thực lấy từ `user.permissions` do server trả về.

## Quy trình khi làm task

1. Đọc `CHECK_LIST.md`, đánh dấu mục đang làm.
2. Code + **viết test đầy đủ** (BE: happy path, 401, 403 theo role, 422, 404; FE: hook + page với MSW).
3. Thêm biến môi trường ⇒ cập nhật Zod schema **và** `.env.example` (block đủ `Ý nghĩa / Cách tạo / Mức độ`) rồi `npm run env:sync`; cập nhật `docs/06-environment.md`. Test sẽ fail nếu schema và example lệch nhau.
4. Thêm/sửa endpoint ⇒ cập nhật `docs/09-api-reference.md`; thay đổi kiến trúc ⇒ cập nhật docs liên quan (tiếng Việt, giữ thuật ngữ tiếng Anh kèm chú thích, dùng Mermaid khi có luồng).
5. Chạy `npm run check` — phải xanh.
6. **Tắt mọi tiến trình chạy nền** (dev server, vitest watch, node) trước khi báo cáo: không để `npm run dev` treo; nếu đã chạy nền thì dừng và kiểm tra lại không còn process `node`/`mongod` của dự án.
7. Cập nhật `CHECK_LIST.md` (đánh dấu xong, ghi chú ngày).

## Lưu ý kỹ thuật dễ sai

- Express 5: `req.query` là getter chỉ đọc (middleware `validate` đã xử lý); wildcard route phải đặt tên (`/*splat`).
- Mongoose 9: dùng `{ returnDocument: 'after' }` thay `{ new: true }`; pre-hook dùng async, không `next()`.
- Zod 4: `z.email()`, `z.url()`, `z.stringbool()`, `{ error: '...' }` thay `required_error`. `z.coerce.number('')` = 0 ⇒ preprocess `''` → `undefined` cho field bắt buộc.
- React Router 8: `RouterProvider` import từ `react-router/dom`; mọi thứ khác từ `react-router` (không còn `react-router-dom`).
- Default param JS: truyền `undefined` tường minh vẫn kích hoạt giá trị mặc định (vd `sanitizeRedirectPath(x, null)` chứ không `undefined`).
- Trang tiêu thụ token 1 lần (magic link, verify email) dùng `useRunOnce` vì StrictMode chạy effect 2 lần.
- Test backend cần MongoDB in-memory (lần đầu tải binary ~800MB). Không chạy test với DB thật.
- `backend/.env` chứa secret thật (MongoDB Atlas) — không in giá trị ra log/terminal, không commit.
