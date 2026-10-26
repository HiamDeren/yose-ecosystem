// Domain types — mirror prisma/schema.prisma 1:1 so the demo store can be
// swapped for a real API without touching the UI.

export type Role = "student" | "teacher" | "admin";

/** 1-1, 1-2 hoặc lớp nhóm tối đa 12 người */
export type ClassType = "ONE_ON_ONE" | "ONE_ON_TWO" | "GROUP";

export const CLASS_CAPACITY: Record<ClassType, number> = {
  ONE_ON_ONE: 1,
  ONE_ON_TWO: 2,
  GROUP: 12,
};

export interface Account {
  id: string;
  email: string; // Gmail dùng để đăng nhập Google
  name: string;
  role: Role;
  /** studentId hoặc teacherId gắn với account */
  profileId?: string;
}

export interface Student {
  id: string;
  code: string; // Mã học viên, vd YS-24017
  fullName: string;
  email: string;
  phone?: string;
  joinedAt: string; // ISO date
}

export interface Teacher {
  id: string;
  fullName: string;
  email: string;
  /** Dùng cho module lương sau này */
  hourlyRate?: number;
}

export interface Weekday {
  day: 0 | 1 | 2 | 3 | 4 | 5 | 6; // 0 = Chủ nhật
  start: string; // "19:30"
  durationMin: number;
}

export interface ClassGroup {
  id: string;
  code: string;
  name: string;
  type: ClassType;
  level: string;
  /** Mô tả ngắn: mục tiêu, đối tượng của lớp */
  description?: string;
  teacherId: string;
  schedule: Weekday[];
  totalSessions: number;
  startDate: string;
  status: "active" | "finished" | "upcoming";
}

export interface Enrollment {
  studentId: string;
  classId: string;
  joinedAt: string;
  status: "active" | "paused" | "left";
}

export interface ClassSession {
  id: string;
  classId: string;
  index: number; // Buổi số mấy
  date: string; // ISO datetime bắt đầu
  durationMin: number;
  topic: string;
  teacherId: string; // GV dạy buổi này (có thể khác GV chính nếu dạy thay)
  status: "scheduled" | "done" | "cancelled";
}

export interface VocabItem {
  word: string;
  partOfSpeech: string;
  meaningVi: string;
  definitionEn: string;
  example?: string;
}

/**
 * Note của buổi học, thay cho file Google Docs mỗi buổi.
 * GV soạn trước (bản nháp, HV chưa thấy) → công bố → ghi tiếp ngay trên lớp.
 */
export interface SessionNote {
  sessionId: string;
  /** HTML do trình soạn TipTap sinh ra. Production nên lưu JSON của TipTap (jsonb). */
  html: string;
  vocab: VocabItem[];
  updatedAt: string;
  authorId: string;
  /** undefined = bản nháp, học viên chưa thấy */
  publishedAt?: string;
}

/** "note": ảnh chèn trong nội dung note (ownerId = sessionId), không hiện ở danh sách tài liệu */
export type AttachmentOwner = "session" | "homework" | "submission" | "note";

/**
 * File đính kèm, thay cho folder Google Drive.
 * Demo: nội dung file nằm trong IndexedDB của trình duyệt (lib/file-store.ts).
 * Production: nằm trên S3, `id` chính là S3 key.
 */
export interface Attachment {
  id: string;
  ownerType: AttachmentOwner;
  ownerId: string;
  name: string;
  size: number;
  mime: string;
  uploadedAt: string;
  uploaderId: string;
  /** Tệp mẫu của demo, không có nội dung thật */
  sample?: boolean;
}

export type AttendanceStatus = "present" | "late" | "absent" | "excused";

/** Nhận xét + điểm danh riêng từng học viên trong 1 buổi */
export interface StudentRemark {
  sessionId: string;
  studentId: string;
  attendance: AttendanceStatus;
  comment?: string;
}

export interface Homework {
  id: string;
  sessionId: string;
  title: string;
  instructions: string;
  dueAt: string;
  /** null = cả lớp; có giá trị = giao riêng cho các học viên này */
  assigneeIds: string[] | null;
}

export interface Submission {
  id: string;
  homeworkId: string;
  studentId: string;
  content: string;
  link?: string;
  submittedAt: string;
  status: "submitted" | "reviewed";
  score?: number;
  feedback?: string;
}

export interface YoseData {
  accounts: Account[];
  students: Student[];
  teachers: Teacher[];
  classes: ClassGroup[];
  enrollments: Enrollment[];
  sessions: ClassSession[];
  notes: SessionNote[];
  remarks: StudentRemark[];
  homework: Homework[];
  submissions: Submission[];
  attachments: Attachment[];
}

export type HomeworkState = "todo" | "overdue" | "submitted" | "reviewed";
