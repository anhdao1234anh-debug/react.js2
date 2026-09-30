# 02. Kiến trúc tổng quan

## Monorepo với npm workspaces

**Monorepo** (một repo chứa nhiều ứng dụng) giúp chia sẻ tooling (ESLint, Prettier, script) và chạy mọi thứ từ thư mục gốc.

```
.
├── backend/            # REST API - Express 5 (ESM) + MongoDB
├── frontend/           # SPA - React 19 + Vite
├── docs/               # Tài liệu (bạn đang đọc)
├── scripts/            # Script dùng chung: setup, env check/sync, clean
├── package.json        # Root: workspaces + script chung + tooling
├── eslint.config.js    # ESLint flat config cho toàn repo
├── .prettierrc.json    # Prettier cho toàn repo
├── CLAUDE.md           # Hướng dẫn cho Claude Code
└── CHECK_LIST.md       # Theo dõi tiến độ công việc
```

## Nguyên tắc cốt lõi: `core` vs `modules` / `features`

Cả backend lẫn frontend chia làm 2 tầng:

| Tầng                                 | Chứa gì                                                                                                      | Được import từ                             |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------ | ------------------------------------------ |
| **core**                             | Hạ tầng dùng chung, **không chứa nghiệp vụ**: error, validate, logger, http client, UI kit, hook tiện ích... | Mọi nơi                                    |
| **modules** (BE) / **features** (FE) | Nghiệp vụ theo từng tính năng: auth, user, product...                                                        | Chỉ app/route + module khác qua public API |

Quy tắc phụ thuộc: `core` **không bao giờ** import từ `modules/features`. Nhờ vậy, khi dùng source base cho dự án mới chỉ cần giữ `core` + module nền tảng (auth, user) và thay module nghiệp vụ.

```mermaid
flowchart TB
    subgraph FE[frontend/src]
        direction TB
        FApp[app/ + routes/ + layouts/<br/>ghép các feature lại]
        FFeat[features/<br/>auth · users · products · account ...]
        FCore[core/<br/>api · components/ui · hooks · lib · utils]
        FApp --> FFeat --> FCore
        FApp --> FCore
    end
    subgraph BE[backend/src]
        direction TB
        BApp[app.js + server.js]
        BMod[modules/<br/>auth · user · product · health]
        BCore[core/<br/>errors · http · middlewares · rbac · security · oauth · mail ...]
        BCfg[config/<br/>env · constants · permissions]
        BApp --> BMod --> BCore
        BApp --> BCore
        BMod --> BCfg
        BCore --> BCfg
    end
    FCore -- "HTTP JSON /api/v1" --> BApp
```

## Luồng một request (backend)

```mermaid
sequenceDiagram
    autonumber
    participant C as Client (React)
    participant M as Middleware nền
    participant R as Router module
    participant G as Guard<br/>(authenticate / authorize)
    participant V as validate(Zod)
    participant Ctl as Controller
    participant S as Service
    participant Repo as Repository
    participant DB as MongoDB
    participant E as errorHandler

    C->>M: HTTP request
    Note over M: requestId → logger → helmet → cors<br/>→ json parser → cookie → rate limit
    M->>R: /api/v1/<module>/...
    R->>G: kiểm tra token + permission
    G->>V: validate params/query/body
    V->>Ctl: req đã được làm sạch
    Ctl->>S: gọi nghiệp vụ
    S->>Repo: truy vấn
    Repo->>DB: Mongoose
    DB-->>Repo: document
    Repo-->>S: dữ liệu
    S-->>Ctl: kết quả
    Ctl-->>C: { success: true, data, meta }
    Note over G,S: Bất kỳ lỗi nào (throw AppError, ZodError, lỗi DB...)
    G--)E: next(error)
    S--)E: throw
    E-->>C: { success: false, error: { code, message, details }, requestId }
```

**Trách nhiệm từng lớp (backend):**

| Lớp        | Làm gì                                                 | Không làm gì                         |
| ---------- | ------------------------------------------------------ | ------------------------------------ |
| Route      | Khai báo URL + ghép middleware (guard, validate)       | Chứa logic                           |
| Controller | Đọc input đã validate, gọi service, trả response chuẩn | Truy vấn DB, kiểm tra quyền chi tiết |
| Service    | Nghiệp vụ, quy tắc, ném `AppError`                     | Biết về `req`/`res`                  |
| Repository | Truy vấn DB (kế thừa `BaseRepository`)                 | Nghiệp vụ                            |
| Model      | Schema Mongoose, index, plugin                         |                                      |

## Luồng dữ liệu frontend

```mermaid
flowchart LR
    Page[Page<br/>chỉ hiển thị] --> Hook[Custom hook của feature<br/>useProductManagement...]
    Hook --> Q[TanStack Query<br/>useQuery / useMutation]
    Q --> Api[featureApi<br/>productsApi.list...]
    Api --> HTTP[core/api/httpClient<br/>axios + interceptor]
    HTTP -->|"Bearer token<br/>tự refresh khi 401"| BE[(Backend)]
    Q <--> Cache[(Query cache<br/>+ phiên đăng nhập)]
```

- **Page** mỏng: nhận state/hành động từ custom hook.
- **Custom hook** (vd `useProductManagement`) gom: tham số URL, query, mutation, modal, toast.
- **API layer** chỉ lo HTTP, không state.
- **httpClient** tự gắn token, tự refresh, chuẩn hoá lỗi thành `ApiError`.

## Định dạng response chuẩn

```jsonc
// Thành công
{ "success": true, "message": "Tạo sản phẩm thành công", "data": { ... }, "meta": { "page": 1, ... } }

// Lỗi
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",          // máy đọc - frontend xử lý theo code
    "message": "Dữ liệu không hợp lệ",   // người đọc
    "details": [{ "location": "body", "path": "email", "message": "Email không hợp lệ" }]
  },
  "requestId": "a1b2c3..."               // gửi kèm khi báo lỗi để tra log
}
```

## Công nghệ chính

| Nhóm      | Backend                                     | Frontend                                    |
| --------- | ------------------------------------------- | ------------------------------------------- |
| Runtime   | Node.js 22+, **ESM** (`import/export`)      | Vite 8, React 19                            |
| Framework | Express 5                                   | React Router 8 (`createBrowserRouter`)      |
| Dữ liệu   | MongoDB + Mongoose 9                        | TanStack Query 5 + Axios                    |
| Validate  | Zod 4                                       | Zod 4 + react-hook-form                     |
| Bảo mật   | helmet, cors, rate-limit, JWT, scrypt, PKCE | Token trong bộ nhớ, refresh cookie httpOnly |
| UI        | —                                           | Tailwind CSS 4                              |
| Log       | pino (+ pino-pretty khi dev)                | —                                           |
| Test      | Vitest, Supertest, mongodb-memory-server    | Vitest, Testing Library, MSW, jsdom         |
