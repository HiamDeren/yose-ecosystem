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

export interface SessionNote {
  sessionId: string;
  /** Markdown đơn giản: "## ", "- ", **bold** */
  content: string;
  vocab: VocabItem[];
  updatedAt: string;
  authorId: string;
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
}

export type HomeworkState = "todo" | "overdue" | "submitted" | "reviewed";
