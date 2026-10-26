# Yose Center (tên hiển thị trong app: **Yose Home**)

@AGENTS.md

Trả lời và trao đổi bằng **tiếng Việt**. Code, tên biến, commit message kỹ thuật có thể tiếng Anh; chữ trên giao diện luôn là tiếng Việt.

## Dự án là gì

Nền tảng cho trung tâm tiếng Anh Yose, thay cho việc ghi note và homework bằng Google Docs. Mọi thứ chia theo **lớp → buổi học → học viên**.

- 3 loại lớp: **1-1**, **1-2**, **nhóm tối đa 12 người** (nhiều level: Intern, Pre-Intermediate…). Một học viên có thể học nhiều lớp cùng lúc (vd 1 lớp 1-1 và lớp nhóm "Intern Read-Lis").
- Mỗi học viên có **mã riêng** (vd `YS-24017`) gắn với **Gmail** điền trong form đăng ký. Đăng nhập bằng Google; Gmail chưa đăng ký thì không vào được.
- Mục tiêu lớn: **bỏ phụ thuộc Google Docs/Drive**. Trước đây GV tạo folder Drive mỗi lớp, cấp quyền từng học viên, mỗi buổi 1 file Docs soạn trước rồi ghi tiếp lúc dạy, cộng folder homework. Nay tất cả nằm trong app (xem `docs/ARCHITECTURE.md` mục 7).
- Mỗi buổi học có:
  - note soạn bằng trình soạn TipTap: **bản nháp** (GV soạn trước, HV chưa thấy) → **công bố** → GV mở lại để **ghi trên lớp** (tự lưu, có bút dạ quang); kèm bảng từ vựng có cột *Definition in English*;
  - **tài liệu buổi học** (file đính kèm: PDF, mp3, slide…);
  - điểm danh + nhận xét riêng từng học viên;
  - homework: file đề kèm theo, học viên nộp file/ảnh/**ghi âm ngay trên trình duyệt**/chữ/link, GV chấm điểm.
- Vai trò: **Admin** (chỉ 1–2 tài khoản, cấp/thu ở Quản lý > Giáo viên > Tài khoản quản trị), **Giáo viên**, **Học viên**. Bảng quyền đầy đủ ở `docs/ARCHITECTURE.md` mục 4. Giáo viên tự thêm/rút học viên của lớp mình (chọn từ danh sách có sẵn, không tạo học viên mới); danh sách giáo viên, giờ dạy, lương chỉ admin thấy. Admin có tab **Quản lý** chia theo đối tượng **Lớp – Học viên – Giáo viên**: lớp nhóm theo trạng thái (Đang chạy / Sắp khai giảng / Đã kết thúc) kèm tổng quan theo trình độ; học viên thấy đang học lớp nào, xếp lớp có kiểm tra sĩ số; giáo viên kèm giờ dạy và lương tạm tính.
- **Giai đoạn sau:** gộp quản lý giáo viên, giờ dạy, lương vào cùng app. Vì vậy `ClassSession` đã lưu `teacherId` (người thực dạy, kể cả dạy thay) và `durationMin`; schema có sẵn bảng `Payroll`.

Repo `HiamDeren/yose-classroom` là repo khác (nơi chủ dự án lưu tài liệu theo lớp của mình), **không đụng vào**.

## Trạng thái hiện tại: bản demo

- UI đầy đủ cho cả 3 vai trò, chạy bằng **mock data trong localStorage** (key `yose-center-demo-v4`; đổi shape dữ liệu thì tăng version). Nội dung file đính kèm lưu trong **IndexedDB** (`lib/file-store.ts`); file mẫu có `sample: true`, không có nội dung. Chưa có database, chưa có S3, chưa có Google OAuth thật (nút "Tiếp tục với Google" mở danh sách tài khoản mẫu).
- `npm run dev` là chạy được, không cần biến môi trường.
- Chi tiết idea, phân quyền, stack, lộ trình: `docs/ARCHITECTURE.md`. Schema đề xuất: `prisma/schema.prisma` (Prisma **chưa cài**).

## Stack và quyết định đã chốt

- Next.js 16.4 (App Router, Turbopack, `cacheComponents` + `partialPrefetching` bật), React 19, Tailwind CSS 4 (cấu hình qua `@theme inline` trong `app/globals.css`), TypeScript.
- Bản thật đề xuất: Next.js làm luôn backend (Server Actions / Route Handlers) + **Auth.js v5 Google** (callback `signIn` chỉ cho Gmail có trong bảng `Account`) + **Prisma + PostgreSQL trên Amazon RDS / Aurora Serverless v2** + **S3** (presigned URL) cho file bài nộp + host bằng AWS Amplify hoặc Vercel. Chọn Postgres vì dữ liệu quan hệ và tính lương là `SUM(durationMin) GROUP BY teacher, month`.
- Một mô hình `ClassGroup` cho cả 3 loại lớp; `type` chỉ quyết định sĩ số (`CLASS_CAPACITY`) và cách hiển thị. Không tách bảng theo loại lớp.

## Cấu trúc code

```
app/login/                                   Đăng nhập (demo)
app/(app)/layout.tsx                         AppShell: chặn chưa đăng nhập, sidebar/bottom nav theo vai trò
app/(app)/page.tsx                           Trang chủ theo vai trò (components/dashboards.tsx)
app/(app)/classes/[classId]/                 Dòng thời gian buổi học (components/class-view.tsx)
app/(app)/classes/[classId]/sessions/[sessionId]/
                                             Buổi học, tab qua ?tab=note|homework|attendance (components/session-view.tsx)
app/(app)/homework/                          Học viên: mọi bài tập; GV: hàng chờ chấm
app/(app)/manage/{classes,students,teachers}/
                                             Quản lý, sub-tab Lớp / Học viên / Giáo viên (components/manage/*).
                                             Panel chi tiết mở bằng ?id=<id> hoặc ?id=new. Giáo viên vào được
                                             Lớp (lớp mình dạy) + Học viên; tab Giáo viên chỉ admin
lib/types.ts                                 Kiểu domain, khớp 1-1 với prisma/schema.prisma
lib/store.tsx                                StoreProvider + useStore(): data, account, now, mọi action ghi
lib/selectors.ts                             Truy vấn thuần: lớp theo account, quyền, trạng thái bài, giờ dạy
lib/file-store.ts                            Kho file demo (IndexedDB); production thay bằng S3 presigned URL
lib/levels.ts                                Danh mục trình độ (Intern → IELTS 6.0+) kèm mô tả
lib/schedule.ts                              Sinh buổi học từ lịch tuần (dùng khi tạo lớp / đổi lịch)
lib/mock-data.ts, lib/lessons.ts             Sinh dữ liệu mẫu tương đối theo ngày hiện tại
components/rich-editor.tsx                   TipTap kiểu Google Docs: NoteEditor (thanh công cụ: kiểu đoạn, cỡ chữ, màu, link,
                                             ảnh, bảng, căn lề, checklist…) và NoteContent (chỉ đọc)
components/editor/note-image.tsx             Node ảnh: lưu data-file-id (Attachment ownerType "note"), thu nhỏ ảnh trước khi lưu
components/note-panel.tsx                    Tab Note: trạng thái nháp/công bố, workspace tự lưu, tài liệu buổi học
components/attachments.tsx                   AttachmentList, FileDrop, UploadArea, AudioRecorder, PendingList
components/homework-panel.tsx                Giao bài (kèm file), nộp bài (file/ghi âm/chữ/link), chấm bài
```

## Quy ước quan trọng

- **Mọi thao tác ghi đi qua action trong `lib/store.tsx`.** Khi nối DB, chỉ thay thân action bằng Server Action/fetch; UI không đổi. Kiểm tra quyền phải chuyển về server, UI chỉ ẩn nút.
- **Render phải thuần** (React Compiler lint bật): không gọi `Date.now()` / `new Date()` trong render. Dùng `now` lấy từ `useStore()`.
- Page trong segment động là server component mỏng: `generateStaticParams()` (từ mock data) + `<Suspense>` bọc client view dùng `useParams()` / `useSearchParams()`. ID mock ổn định (`c-rl`, `c-rl-b3`…) nên generateStaticParams luôn khớp.
- `STATIC_EXPORT=1 npm run build` xuất bản tĩnh vào `out/`. Chế độ này tự tắt `cacheComponents` vì static export không hỗ trợ PPR.
- Trước khi dùng API Next.js nào lạ, đọc docs trong `node_modules/next/dist/docs/` (xem AGENTS.md). Ví dụ: `middleware` đã đổi tên thành `proxy`.
- `useEditor` của TipTap luôn đặt `immediatelyRender: false` (tránh lỗi hydration trong Next).
- Màu trong note (màu chữ, màu nền) lưu dạng `var(--tx-*)` / `var(--hl-*)`, định nghĩa ở `app/globals.css` cho cả sáng và tối. Không lưu mã hex cứng vào nội dung note.
- Ảnh trong note: node `image` có `fileId` và không có `src`; `parseHTML` phải nhận `img[data-file-id]`, nếu không ảnh sẽ mất khi mở lại note.
- Viewer artifact/iframe chặn `confirm()`; xác nhận xóa làm bằng nút trong giao diện (đã làm vậy cho file và homework).
- Kiểm tra trước khi commit: `npx eslint .` và `npm run build` phải sạch.
- **Deploy:** Vercel tự deploy nhánh `main`. Gói Hobby chặn deploy nếu tác giả commit không phải chủ project, nên commit phải đứng tên `HiamDeren <93184692+HiamDeren@users.noreply.github.com>` (đặt `git config user.name/user.email` trong repo trước khi commit).

## Thiết kế

- Trang buổi học trên màn `lg+` vừa khít khung (`SessionView` là flex cột `h-full`): tiêu đề, tab, thanh trạng thái note và điều hướng buổi đứng yên; chỉ nội dung tab cuộn. Ở `xl`, `Columns` trong note-panel chia 2 cột cuộn riêng (note | từ vựng + tài liệu). Thêm khối mới vào tab thì giữ chuỗi `min-h-0 flex-1` để không làm vỡ khung cuộn.
- Bố cục: shell cao đúng màn hình (`h-dvh overflow-hidden`), chỉ `<main id="app-scroll">` cuộn; đổi trang thì AppShell tự cuộn main về đầu. Phần tử sticky (thanh công cụ editor, cột phải trang buổi học, danh sách học viên ở trang lớp) dùng `top-0` theo khung cuộn này.
- Thanh cuộn mảnh theo theme (`--scroll-thumb`); dải tab cuộn ngang dùng class `no-scrollbar` và gạch chân bằng `shadow-[inset_0_-1px_0_var(--rule)]` (không dùng `-mb-px`, vì sẽ sinh thanh cuộn dọc).
- Ảnh trong note: nhấp đúp mở trình xem (`components/editor/image-viewer.tsx`, phát sự kiện `yose:view-image`). Trong ô bảng, ảnh xếp cạnh nhau: CSS đặt trên lớp bọc `.node-image` của ReactNodeViewRenderer, không phải `.note-image`.
- Sidebar desktop thu thành thanh icon 4rem, rê chuột/focus thì mở 15.5rem đè lên nội dung; nút ghim (lưu `yose-sidebar-pinned`) thì luôn mở và đẩy nội dung. Biến CSS `--rail` quyết định padding trái của nội dung. Nội dung trang full width, không đặt max-width; trang buổi học chia 2 cột từ `xl` (note | từ vựng + tài liệu).
- Chủ đề "sổ tay lớp học": mực xanh trên giấy lạnh. Màu là CSS token trong `app/globals.css` (light + dark qua `prefers-color-scheme` và `data-theme`), dùng qua class Tailwind như `bg-surface`, `text-ink`, `text-muted`, `border-rule`, `bg-brand`.
- Màu theo loại lớp: `t11` (1-1, tím), `t12` (1-2, xanh ngọc), `tg` (nhóm, hồng). Dùng `ClassTypeBadge` và `TYPE_BAR` trong `components/ui.tsx`.
- Class `.hl` (vệt bút dạ quang vàng) **chỉ dùng cho việc cần làm** (bài chưa nộp, bài chờ chấm, buổi chưa có note). Class `.margin-line` (đường lề đỏ của vở) dùng cho dòng thời gian buổi học và trang note.
- Font: Be Vietnam Pro (UI), Source Serif 4 (nội dung note, hướng dẫn bài tập).
- Chữ giao diện: viết hoa đầu câu, câu ngắn, không thêm nhãn viết hoa toàn bộ, nút ghi rõ hành động ("Nộp bài", "Lưu điểm", "Giao bài").

## Bước tiếp theo (MVP)

1. Tạo RDS PostgreSQL, cài Prisma, migrate từ `prisma/schema.prisma` (đã có `Attachment`, `NoteRevision`, `SessionNote.doc` jsonb + `publishedAt`), viết seed từ `lib/mock-data.ts`.
2. Cài Auth.js v5 Google provider; `signIn` callback chặn Gmail lạ; `session` callback gắn `role`, `studentId`, `teacherId`.
3. Thay action trong `lib/store.tsx` bằng Server Actions dùng Prisma, kèm kiểm tra quyền ở server.
4. S3: route xin presigned PUT/GET URL có kiểm tra quyền theo lớp, thay `lib/file-store.ts`. Note lưu `editor.getJSON()` thay vì HTML.
5. Script import từ Google Drive/Docs (docs/ARCHITECTURE.md mục 8).
6. Sinh lịch buổi học tự động từ `ClassGroup.schedule`.
7. Giai đoạn 2: module giáo viên và lương (bảng `Payroll`, duyệt, dạy thay).

Câu hỏi còn mở: giữ app ở gốc repo hay chuyển `yose-ecosystem` thành monorepo (`apps/center`, `apps/teacher`, `packages/db`). Hiện đang để ở gốc.
