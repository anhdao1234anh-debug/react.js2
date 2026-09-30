# Frontend — CLAUDE.md

React 19 + Vite 8 + React Router 8 (`createBrowserRouter`) + TanStack Query 5 + react-hook-form + Zod 4 + Axios + Tailwind CSS 4. Alias `@` = `src/`. Docs: `docs/05-frontend.md`.

## Bản đồ nhanh

| Cần làm               | Xem / sửa                                                                                                                        |
| --------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| Thêm trang            | `routes/paths.js` (PATHS) + `routes/routes.jsx` (`lazy: page(() => import(...))`, page **default export**)                       |
| Trang cần quyền       | Bọc route bằng `<RequirePermission permission={PERMISSIONS.X} />` (layout route) trong nhánh `dashboard`                         |
| Ẩn/hiện UI theo quyền | `<Can permission=...>` hoặc `useAuth().can(...)`                                                                                 |
| Gọi API               | `features/<x>/api/<x>Api.js` dùng `httpClient` + `unwrap` / `unwrapPage` / `unwrapMessage`                                       |
| Query/mutation        | `features/<x>/hooks/use<X>.js` + key factory `<x>Keys.js`; mutation xong `invalidateQueries`                                     |
| Logic trang           | Hook điều phối `use<X>Management` (dùng `useListParams`, `useDisclosure`, `toast`)                                               |
| Form                  | `useFormMutation({ schema, mutation hoặc mutationFn, defaultValues, transform, onSuccess })` + `TextField {...register('x')}`    |
| Loading/error         | `<QueryState query={q}>{(data) => ...}</QueryState>`                                                                             |
| UI                    | `@/core/components/ui` (Button, TextField, Modal, ConfirmDialog, Card, Alert, Badge, Pagination...), `buttonVariants()` cho Link |
| Phiên đăng nhập       | `useAuth()`; ghi phiên qua `applySession` / `patchSessionUser` / `clearSession` (`features/auth/lib/session.js`)                 |
| Env                   | `core/config/env.js` (Zod) + `.env.example` (test `core/config/env.test.js`)                                                     |

## Quy tắc

- `core/` không import `features/`; feature khác import qua `features/<x>/index.js`.
- File component chỉ export component (ESLint `react-refresh/only-export-components`) — hằng số/hàm đặt file `.js` riêng.
- Không lưu token vào localStorage; access token chỉ ở `tokenStore` (bộ nhớ).
- Request không được tự refresh khi 401 (login, register, verify...) truyền `NO_AUTH_REFRESH`.
- `redirectTo` luôn qua `safeRedirectPath()`.
- Thao tác chỉ được chạy 1 lần khi mount (tiêu thụ token) dùng `useRunOnce`.

## Test

- `npm test` (trong `frontend/`) hoặc `npm run test:fe`. File đơn: `npx vitest run src/features/products`.
- MSW: handler mặc định `src/test/msw/handlers.js` (chưa đăng nhập); ghi đè bằng `server.use(http.get(apiUrl('/x'), () => ok(data)))`. Request chưa mock ⇒ test fail.
- Render: `renderWithProviders(<Page/>, { route, path, session })`, `renderRoutes({ routes, initialEntries, session })`, `renderHookWithProviders(() => useX())`. `session`: `undefined` = app tự refresh, `null` = khách, `buildUser({ role })`.
- Truy vấn theo vai trò/nhãn (`getByRole`, `getByLabelText`), kiểm tra điều hướng qua `screen.findByTestId('location')`.
