# Yose Center (app: Yose Home): idea và kiến trúc

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

## 7. Thay cho Google Docs và Google Drive

### Luồng hiện tại và luồng mới

| Hiện tại (Google) | Trong Yose Home |
|---|---|
| GV tạo folder Drive cho lớp, cấp quyền từng học viên | Lớp có sẵn khi admin mở lớp; học viên ghi danh là thấy, không cấp quyền thủ công |
| Trước buổi học, GV tạo file Docs soạn nội dung | Tab **Note trên lớp** của buổi: GV bấm *Soạn bài*, note ở trạng thái **bản nháp** (học viên chưa thấy) |
| Lúc dạy, GV ghi thẳng vào file Docs đã soạn | Mở lại trình soạn (*Ghi trên lớp*), tự lưu sau mỗi lần gõ, có bút dạ quang để đánh dấu lỗi hay gặp. Bấm **Công bố** để học viên thấy |
| File nghe, bài đọc, slide nằm rải trong Drive | **Tài liệu buổi học**: kéo thả file vào buổi đó |
| Folder homework, mỗi buổi ghi đề vào 1 file | Homework gắn với buổi, có hạn nộp, file đề kèm theo, học viên nộp file/ảnh/ghi âm ngay trong app, GV chấm điểm và nhận xét |

### Các phương án đã cân nhắc

| Phương án | Ưu | Nhược |
|---|---|---|
| A. Giữ Google, app chỉ nhúng/link Docs và Drive (Drive API) | Ít thay đổi thói quen | Vẫn phụ thuộc Google, quản lý quyền vẫn rời rạc, không chấm bài/nhắc hạn được |
| B. Lai: app là nơi chính, cho phép đính kèm link Docs | Chuyển dần | Dữ liệu vẫn tách 2 nơi, khó tìm kiếm, khó báo cáo |
| **C. Tự chủ hoàn toàn (đang làm)**: trình soạn trong app + file trên S3 | Một nơi duy nhất, quyền theo lớp, có trạng thái nháp/công bố, tìm kiếm và thống kê được, sẵn sàng cho module lương | Phải tự làm editor và lưu file (đã giải quyết bằng TipTap + S3), cần 1 lần import dữ liệu cũ |

### Kỹ thuật

- **Trình soạn:** [TipTap](https://tiptap.dev) (nền ProseMirror), các chức năng chính của Google Docs:
  - kiểu đoạn (Văn bản, Tiêu đề 1–3), cỡ chữ, đậm/nghiêng/gạch chân/gạch ngang, chỉ số trên/dưới, xóa định dạng;
  - màu chữ và màu nền (bảng màu dùng token theo theme nên đọc được ở cả giao diện sáng và tối);
  - căn trái/giữa/phải/đều, danh sách chấm, danh sách số, checklist, trích dẫn, đường kẻ ngang, link;
  - **bảng**: chèn bằng lưới chọn kích thước, thêm/xóa hàng cột, gộp/tách ô, bật tắt hàng tiêu đề, kéo mép cột để đổi độ rộng;
  - **ảnh**: tải lên, dán (Ctrl+V) hoặc kéo thả thẳng vào note, hoặc chèn từ link; chọn cỡ Nhỏ/Vừa/Toàn khổ và căn lề. Ảnh lớn được thu nhỏ trên trình duyệt (cạnh dài 1600px, WebP) trước khi lưu. Ảnh lưu như một `Attachment` loại `NOTE_IMAGE`, trong note chỉ giữ `data-file-id`, không nhét base64;
  - hoàn tác/làm lại, đếm số từ, tự lưu. Production lưu `editor.getJSON()` vào cột `jsonb`, mỗi lần lưu tạo `NoteRevision` (lịch sử phiên bản như Docs). Muốn nhiều người cùng sửa realtime thì thêm Hocuspocus/Yjs sau, không cần đổi schema.
- **Lưu file:** S3, key dạng `classes/{classId}/sessions/{sessionId}/{uuid}-{tên file}`. Trình duyệt xin **presigned PUT URL** từ server rồi upload thẳng lên S3 (server không phải chuyển tiếp file). Xem/tải bằng **presigned GET URL** hết hạn sau vài phút, chỉ cấp khi người xin có quyền với lớp. Có thể đặt CloudFront phía trước.
- **Giới hạn:** 25 MB mỗi file (video dài nên để YouTube không công khai và dán link), chỉ nhận PDF, Office, ảnh, âm thanh, MP4. Lifecycle S3 chuyển file của lớp đã kết thúc sang Glacier sau 12 tháng.
- **Ghi âm bài nói:** dùng MediaRecorder ngay trên trình duyệt, nộp thành file `.webm`, không cần app khác.
- **Xuất file:** khi cần gửi ra ngoài, xuất note sang PDF hoặc .docx từ JSON của TipTap.
- **Bản demo:** nội dung file lưu trong IndexedDB của trình duyệt (`lib/file-store.ts`), chỉ để trải nghiệm luồng; thay 3 hàm `putFile/getFile/deleteFile` bằng gọi S3 là xong.

## 8. Chuyển dữ liệu từ Google Docs

Hiện tại mỗi lớp là 1 folder Drive, mỗi buổi 1 file Docs, cộng 1 folder homework. Hướng import (chạy 1 lần):

1. GV/admin chọn folder lớp; script dùng Drive API liệt kê file theo thứ tự tên/ngày tạo, ghép với `ClassSession` theo số buổi.
2. Mỗi file Docs: xuất HTML qua Drive API (`files.export`), chuyển sang JSON của TipTap → `SessionNote` (đánh dấu đã công bố); bảng từ vựng trong doc → `vocab`.
3. File không phải Docs (PDF, mp3, slide) → tải về và đẩy lên S3 thành `Attachment` của buổi.
4. Folder homework → `Homework` của buổi tương ứng.
5. Kiểm tra tay vài lớp rồi mới mở cho học viên. Sau đó Drive chỉ còn là kho lưu trữ cũ.

## 9. Lộ trình

| Giai đoạn | Nội dung |
|---|---|
| 0. Demo (repo này) | UI đầy đủ 3 vai trò với mock data, lưu localStorage |
| 1. MVP | Postgres + Prisma, Auth.js Google, note bằng TipTap (lưu JSON + lịch sử), upload S3 bằng presigned URL |
| 2. Vận hành | Import từ Google Drive/Docs, sinh lịch buổi học tự động từ `schedule`, nhắc bài qua email, xuất note PDF/.docx |
| 3. Giáo viên & lương | Giờ dạy từ `ClassSession` (đã có `teacherId` + `durationMin`), dạy thay, bảng `Payroll` theo tháng, duyệt và xuất phiếu lương |
