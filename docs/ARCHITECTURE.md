# Yose Center: idea và kiến trúc

## 1. Bài toán

Hiện tại note trên lớp và homework nằm rải rác trong Google Docs. Yose Center gom lại thành một nơi:

- **Học viên** đăng nhập bằng Gmail đã điền trong form đăng ký, thấy đúng các lớp mình học (ví dụ 1 lớp 1-1 và 1 lớp nhóm *Intern Read-Lis*). Vào mỗi lớp là danh sách buổi học; mỗi buổi có **note trên lớp** (nội dung, bảng từ vựng, nhận xét riêng) và **homework** để nộp.
- **Giáo viên** viết note sau buổi học, giao bài, điểm danh, chấm bài.
- **Admin** quản lý học viên (mã học viên), lớp, sĩ số; giai đoạn sau thêm giờ dạy và lương giáo viên.

## 2. Ba dạng lớp

| Loại | Sĩ số tối đa | Ghi chú |
|---|---|---|
| 1-1 | 1 | Note gần như là note riêng; nhận xét cá nhân mỗi buổi |
| 1-2 | 2 | Note chung, nhận xét riêng từng người |
| Nhóm | 12 | Nhiều level (Intern, Pre-Intermediate…), note chung, có điểm danh |

Cả ba dùng **chung một mô hình**: `ClassGroup.type` chỉ quyết định sĩ số và cách hiển thị. Không tách bảng, nên báo cáo và tính lương sau này chỉ cần 1 truy vấn.

## 3. Phân cấp dữ liệu

```
Account (Gmail) ─┬─ Student (mã YS-xxxxx) ── Enrollment ──┐
                 └─ Teacher ─────────────────────────────┐ │
                                                         ▼ ▼
                                                     ClassGroup (1-1 | 1-2 | Nhóm 12)
                                                         │
                                                     ClassSession (Buổi 1..n, ngày giờ, thời lượng, GV dạy)
                                                         ├─ SessionNote (note chung + bảng từ vựng)
                                                         ├─ StudentRemark (điểm danh + nhận xét từng HV)
                                                         └─ Homework ── Submission (bài nộp, điểm, feedback)
```

Schema đầy đủ: [`prisma/schema.prisma`](../prisma/schema.prisma).

## 4. Phân quyền

| Hành động | Học viên | Giáo viên | Admin |
|---|---|---|---|
| Xem lớp | Lớp mình được ghi danh | Lớp mình dạy | Tất cả |
| Xem note buổi học | Có | Có | Có |
| Sửa note, giao homework | Không | Lớp mình dạy | Có |
| Nộp bài | Bài của mình | Không | Không |
| Chấm bài, điểm danh | Không | Lớp mình dạy | Có |
| Quản lý học viên, lớp, lương | Không | Không | Có |

Kiểm tra quyền **luôn ở server** (Server Action / Route Handler), UI chỉ ẩn nút.

## 5. Stack đề xuất

| Lớp | Chọn | Vì sao |
|---|---|---|
| Frontend + backend | **Next.js 16 (App Router)**: Server Components, Server Actions, Route Handlers | Một codebase, không cần dựng backend riêng ở giai đoạn đầu. Khi module lương lớn lên vẫn tách ra service riêng được. |
| Đăng nhập | **Auth.js v5 (Google provider)** hoặc Better Auth | Callback `signIn` chặn Gmail không có trong bảng `Account`. Học viên không phải tạo mật khẩu. |
| Database | **PostgreSQL trên Amazon RDS** (hoặc Aurora Serverless v2) | Dữ liệu quan hệ rõ (học viên ↔ lớp ↔ buổi ↔ bài nộp); tính lương là `SUM(durationMin) GROUP BY teacher, month`, SQL làm rất gọn. DynamoDB sẽ khó với các truy vấn chéo kiểu này. |
| ORM | **Prisma** (hoặc Drizzle) | Type-safe, migration rõ ràng. |
| File bài nộp | **Amazon S3** + presigned URL | Học viên upload thẳng lên S3, server chỉ cấp URL. |
| Hosting | **AWS Amplify Hosting** (hỗ trợ Next.js SSR) hoặc Vercel + RDS | Nếu muốn mọi thứ trong AWS thì Amplify; nhanh nhất thì Vercel. |
| Email nhắc bài | Amazon SES + EventBridge Scheduler | Nhắc homework sắp tới hạn. |

## 6. Luồng đăng nhập Google

1. Admin tạo học viên từ form đăng ký (Google Form → import, hoặc form trong app). Gmail trong form được lưu vào `Account`.
2. Học viên bấm "Tiếp tục với Google".
3. Callback `signIn` của Auth.js: nếu `email` không có trong `Account` → từ chối, hiện "Gmail này chưa được đăng ký, liên hệ trung tâm".
4. Callback `session` gắn `role` và `studentId`/`teacherId` vào session.

```ts
// auth.ts (production)
export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [Google],
  callbacks: {
    async signIn({ user }) {
      return !!(await db.account.findUnique({ where: { email: user.email! } }));
    },
    async session({ session }) {
      const acc = await db.account.findUnique({
        where: { email: session.user.email },
        include: { student: true, teacher: true },
      });
      return { ...session, role: acc?.role, studentId: acc?.student?.id, teacherId: acc?.teacher?.id };
    },
  },
});
```

## 7. Chuyển dữ liệu từ Google Docs

Mỗi Google Doc hiện tại thường là "1 lớp, nhiều buổi". Hướng import:

1. Đọc doc qua Google Docs API, tách theo heading "Buổi X" / "Lesson X".
2. Mỗi phần thành 1 `ClassSession` + `SessionNote`; bảng trong doc thành `vocab`.
3. Phần "Homework" trong doc thành `Homework`.
4. Chạy 1 lần bằng script `scripts/import-gdocs.ts`, kiểm tra tay rồi mới bật cho học viên.

## 8. Lộ trình

| Giai đoạn | Nội dung |
|---|---|
| 0. Demo (repo này) | UI đầy đủ 3 vai trò với mock data, lưu localStorage |
| 1. MVP | Postgres + Prisma, Auth.js Google, CRUD note/homework, upload S3 |
| 2. Vận hành | Import Google Docs, sinh lịch buổi học tự động từ `schedule`, nhắc bài qua email |
| 3. Giáo viên & lương | Giờ dạy từ `ClassSession` (đã có `teacherId` + `durationMin`), dạy thay, bảng `Payroll` theo tháng, duyệt và xuất phiếu lương |
