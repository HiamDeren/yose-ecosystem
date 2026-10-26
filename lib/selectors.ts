import type {
  Account,
  ClassGroup,
  ClassSession,
  Homework,
  HomeworkState,
  Submission,
  YoseData,
} from "./types";

export function classesForAccount(d: YoseData, acc: Account): ClassGroup[] {
  if (acc.role === "admin") return d.classes;
  if (acc.role === "teacher") return d.classes.filter((c) => c.teacherId === acc.profileId);
  const ids = new Set(
    d.enrollments
      .filter((e) => e.studentId === acc.profileId && e.status === "active")
      .map((e) => e.classId),
  );
  return d.classes.filter((c) => ids.has(c.id));
}

export function canAccessClass(d: YoseData, acc: Account, classId: string) {
  return classesForAccount(d, acc).some((c) => c.id === classId);
}

export function sessionsOf(d: YoseData, classId: string): ClassSession[] {
  return d.sessions
    .filter((s) => s.classId === classId)
    .sort((a, b) => a.index - b.index);
}

export function rosterOf(d: YoseData, classId: string) {
  const ids = d.enrollments
    .filter((e) => e.classId === classId && e.status === "active")
    .map((e) => e.studentId);
  return d.students.filter((s) => ids.includes(s.id));
}

export function homeworkOfSession(d: YoseData, sessionId: string, studentId?: string): Homework[] {
  return d.homework.filter(
    (h) =>
      h.sessionId === sessionId &&
      (!studentId || h.assigneeIds === null || h.assigneeIds.includes(studentId)),
  );
}

export function submissionOf(d: YoseData, homeworkId: string, studentId: string): Submission | undefined {
  return d.submissions.find((s) => s.homeworkId === homeworkId && s.studentId === studentId);
}

export function homeworkState(
  d: YoseData,
  hw: Homework,
  studentId: string,
  now = Date.now(),
): HomeworkState {
  const sub = submissionOf(d, hw.id, studentId);
  if (sub?.status === "reviewed") return "reviewed";
  if (sub) return "submitted";
  return new Date(hw.dueAt).getTime() < now ? "overdue" : "todo";
}

export interface PendingItem {
  hw: Homework;
  session: ClassSession;
  cls: ClassGroup;
  state: HomeworkState;
}

/** Tất cả homework của 1 học viên, kèm trạng thái */
export function homeworkForStudent(d: YoseData, studentId: string): PendingItem[] {
  const classIds = new Set(
    d.enrollments.filter((e) => e.studentId === studentId).map((e) => e.classId),
  );
  const out: PendingItem[] = [];
  for (const hw of d.homework) {
    const session = d.sessions.find((s) => s.id === hw.sessionId);
    if (!session || !classIds.has(session.classId)) continue;
    if (hw.assigneeIds && !hw.assigneeIds.includes(studentId)) continue;
    const cls = d.classes.find((c) => c.id === session.classId)!;
    out.push({ hw, session, cls, state: homeworkState(d, hw, studentId) });
  }
  return out.sort((a, b) => a.hw.dueAt.localeCompare(b.hw.dueAt));
}

export function progressOf(d: YoseData, cls: ClassGroup) {
  const list = sessionsOf(d, cls.id);
  const done = list.filter((s) => s.status === "done").length;
  const next = list.find((s) => s.status === "scheduled");
  return { done, total: cls.totalSessions, next, last: [...list].reverse().find((s) => s.status === "done") };
}

/** Bài nộp đang chờ giáo viên chấm trong các lớp của GV */
export function awaitingReview(d: YoseData, classIds: string[]) {
  const sessionIds = new Set(d.sessions.filter((s) => classIds.includes(s.classId)).map((s) => s.id));
  const hwIds = new Set(d.homework.filter((h) => sessionIds.has(h.sessionId)).map((h) => h.id));
  return d.submissions.filter((s) => hwIds.has(s.homeworkId) && s.status === "submitted");
}

/** Giờ dạy thực tế trong khoảng thời gian — nền móng cho module lương */
export function teachingHours(d: YoseData, teacherId: string, from: Date, to: Date) {
  const done = d.sessions.filter(
    (s) =>
      s.teacherId === teacherId &&
      s.status === "done" &&
      new Date(s.date) >= from &&
      new Date(s.date) < to,
  );
  const minutes = done.reduce((sum, s) => sum + s.durationMin, 0);
  return { sessions: done.length, hours: minutes / 60 };
}

/* ───────────── phân quyền ───────────── */

export const isAdmin = (acc?: Account | null) => acc?.role === "admin";
export const isStaff = (acc?: Account | null) => acc?.role === "admin" || acc?.role === "teacher";

/** Ai được thêm/rút học viên của lớp: admin, hoặc giáo viên phụ trách lớp đó */
export function canManageRoster(d: YoseData, acc: Account | null | undefined, classId: string) {
  if (!acc) return false;
  if (acc.role === "admin") return true;
  return acc.role === "teacher" && d.classes.some((c) => c.id === classId && c.teacherId === acc.profileId);
}
