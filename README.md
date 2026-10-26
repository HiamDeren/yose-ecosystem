# Yose Center (Yose Home)

Nền tảng quản lý lớp học của Yose: **note trên lớp**, **tài liệu** và **homework** chia theo từng buổi, theo từng lớp, theo từng học viên, thay cho việc dùng folder Google Drive và file Google Docs. Giai đoạn sau gộp thêm quản lý giáo viên, giờ dạy và lương.

> Repo này là **bản demo**: giao diện đầy đủ cho 3 vai trò, chạy bằng dữ liệu mẫu lưu trong trình duyệt (localStorage). Chưa nối database và Google OAuth thật. Kiến trúc và schema cho bản thật nằm ở [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) và [`prisma/schema.prisma`](prisma/schema.prisma).

## Chạy thử

```bash
npm install
npm run dev
# mở http://localhost:3000
```

Bấm **Tiếp tục với Google**, chọn một tài khoản mẫu:

| Tài khoản | Thấy gì |
|---|---|
| Nguyễn Minh Anh (YS-24017) | Học 1 lớp **1-1** (Speaking IELTS) và 1 lớp **nhóm 12** (Intern Read-Lis). Vào lớp → buổi → note + homework, nộp bài |
| Trần Gia Huy | Lớp **1-2** (Communication) và Intern Read-Lis |
| Trần Mỹ Linh (giáo viên) | Soạn note trước buổi (bản nháp) → công bố → ghi tiếp trên lớp; tải tài liệu buổi học; giao homework kèm file; chấm bài; điểm danh và nhận xét riêng; tự thêm/rút học viên của lớp mình |
| Quản trị Yose | Tổng quan; tab **Quản lý** gồm Lớp học (tạo/sửa lớp, lịch tuần, xếp học viên), Học viên (thêm học viên, mã tự cấp, xếp lớp), Giáo viên (giờ dạy, lương tạm tính) |

Mọi thay đổi (nộp bài, chấm điểm, sửa note, file tải lên) được lưu trong trình duyệt; file mẫu có sẵn chỉ là tên file, không có nội dung. **Đặt lại dữ liệu demo** ở góc dưới sidebar để tạo lại dữ liệu mẫu.

## Cấu trúc

```
app/
  login/                         Đăng nhập (demo: chọn tài khoản mẫu)
  (app)/page.tsx                 Trang chủ theo vai trò
  (app)/classes/[classId]/       Dòng thời gian buổi học của lớp
  (app)/classes/[classId]/sessions/[sessionId]/
                                 Buổi học: tab Note, Homework, Điểm danh
  (app)/homework/                Học viên: tất cả bài tập. GV: bài chờ chấm
  (app)/manage/                  Quản lý: Lớp học, Học viên, Giáo viên (tab Giáo viên chỉ admin)
components/                      UI (note, homework, điểm danh, shell…)
lib/
  types.ts                       Kiểu dữ liệu, khớp 1-1 với prisma/schema.prisma
  store.tsx                      Data layer demo (thay bằng Server Actions khi có DB)
  selectors.ts                   Truy vấn: lớp của account, trạng thái bài, giờ dạy…
  mock-data.ts, lessons.ts       Dữ liệu mẫu
prisma/schema.prisma             Schema PostgreSQL đề xuất (RDS / Aurora)
docs/ARCHITECTURE.md             Idea, phân quyền, stack AWS, lộ trình
```

## Stack

- Next.js 16 (App Router, Cache Components), React 19, Tailwind CSS 4, TypeScript
- Đề xuất cho bản thật: Auth.js (Google) + Prisma + PostgreSQL trên Amazon RDS, file bài nộp trên S3, host bằng AWS Amplify hoặc Vercel

## Bước tiếp theo (MVP)

1. Tạo RDS PostgreSQL, `npm i -D prisma && npm i @prisma/client`, chạy migration từ `prisma/schema.prisma`.
2. Cài Auth.js với Google provider; callback `signIn` chỉ cho Gmail có trong bảng `Account`.
3. Thay các action trong `lib/store.tsx` bằng Server Actions gọi Prisma; kiểm tra quyền ở server.
4. Upload bài nộp lên S3 bằng presigned URL.
5. Script import note cũ từ Google Docs.
