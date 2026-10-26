"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { clearFiles, deleteFile, putFile } from "./file-store";
import { buildMockData } from "./mock-data";
import { generateSessions } from "./schedule";
import { canManageRoster } from "./selectors";
import type {
  Account,
  Attachment,
  AttachmentOwner,
  ClassGroup,
  Homework,
  Student,
  Teacher,
  StudentRemark,
  Submission,
  VocabItem,
  YoseData,
} from "./types";

/**
 * Demo data layer. Mọi thao tác ghi đi qua các action bên dưới, nên khi có
 * backend thật chỉ cần thay phần thân action bằng Server Action / fetch API,
 * UI giữ nguyên.
 */

const DATA_KEY = "yose-center-demo-v4";
const ACCOUNT_KEY = "yose-center-account";

interface StoreValue {
  ready: boolean;
  /** Thời điểm hiện tại, cập nhật mỗi phút (giữ render thuần) */
  now: number;
  data: YoseData;
  account: Account | null;
  signIn: (accountId: string) => void;
  signInByEmail: (email: string) => Account | null;
  signOut: () => void;
  saveNote: (sessionId: string, html: string, vocab: VocabItem[]) => void;
  setNotePublished: (sessionId: string, published: boolean) => void;
  addHomework: (hw: Omit<Homework, "id">) => string;
  updateHomework: (id: string, patch: Partial<Homework>) => void;
  deleteHomework: (id: string) => void;
  /** Trả về id bài nộp để gắn file đính kèm */
  submitHomework: (homeworkId: string, content: string, link?: string) => string | undefined;
  addAttachment: (ownerType: AttachmentOwner, ownerId: string, file: Blob, name: string) => Promise<Attachment>;
  removeAttachment: (id: string) => void;
  reviewSubmission: (id: string, score: number | undefined, feedback: string) => void;
  setRemark: (sessionId: string, studentId: string, patch: Partial<StudentRemark>) => void;
  resetDemo: () => void;
  /* ── Quản lý (admin). Trả về id mới, hoặc chuỗi lỗi khi không hợp lệ ── */
  createClass: (input: Omit<ClassGroup, "id">) => { id?: string; error?: string };
  updateClass: (id: string, patch: Partial<Omit<ClassGroup, "id">>) => { error?: string };
  enroll: (studentId: string, classId: string) => { error?: string };
  unenroll: (studentId: string, classId: string) => void;
  createStudent: (input: Pick<Student, "fullName" | "email" | "phone">) => { id?: string; error?: string };
  updateStudent: (id: string, patch: Partial<Pick<Student, "fullName" | "email" | "phone">>) => { error?: string };
  createTeacher: (input: Omit<Teacher, "id">) => { id?: string; error?: string };
  updateTeacher: (id: string, patch: Partial<Omit<Teacher, "id">>) => { error?: string };
  /** Tài khoản quản trị (chỉ admin) */
  addAdmin: (name: string, email: string) => { error?: string };
  removeAdmin: (accountId: string) => { error?: string };
}

const StoreContext = createContext<StoreValue | null>(null);

function safeGet(key: string) {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}
function safeSet(key: string, value: string | null) {
  try {
    if (value === null) window.localStorage.removeItem(key);
    else window.localStorage.setItem(key, value);
  } catch {
    /* storage có thể bị chặn (private mode) — demo vẫn chạy trong bộ nhớ */
  }
}

const EMPTY: YoseData = {
  accounts: [],
  students: [],
  teachers: [],
  classes: [],
  enrollments: [],
  sessions: [],
  notes: [],
  remarks: [],
  homework: [],
  submissions: [],
  attachments: [],
};

export function StoreProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<YoseData>(EMPTY);
  const [accountId, setAccountId] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [now, setNow] = useState(0);

  // Load một lần trên client (localStorage không tồn tại lúc prerender)
  useEffect(() => {
    let loaded: YoseData | null = null;
    const raw = safeGet(DATA_KEY);
    if (raw) {
      try {
        loaded = JSON.parse(raw) as YoseData;
      } catch {
        loaded = null;
      }
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect -- hydrate from storage once
    setData(loaded ?? buildMockData());
    setAccountId(safeGet(ACCOUNT_KEY));
    setNow(Date.now());
    setReady(true);
    const t = window.setInterval(() => setNow(Date.now()), 60_000);
    return () => window.clearInterval(t);
  }, []);

  useEffect(() => {
    if (ready) safeSet(DATA_KEY, JSON.stringify(data));
  }, [data, ready]);

  const account = useMemo(
    () => data.accounts.find((a) => a.id === accountId) ?? null,
    [data.accounts, accountId],
  );

  const signIn = useCallback((id: string) => {
    setAccountId(id);
    safeSet(ACCOUNT_KEY, id);
  }, []);

  const signInByEmail = useCallback(
    (email: string) => {
      const acc = data.accounts.find((a) => a.email.toLowerCase() === email.toLowerCase()) ?? null;
      if (acc) signIn(acc.id);
      return acc;
    },
    [data.accounts, signIn],
  );

  const signOut = useCallback(() => {
    setAccountId(null);
    safeSet(ACCOUNT_KEY, null);
  }, []);

  const value = useMemo<StoreValue>(() => {
    const stamp = () => new Date().toISOString();
    const studentId = account?.role === "student" ? account.profileId : undefined;

    return {
      ready,
      now,
      data,
      account,
      signIn,
      signInByEmail,
      signOut,
      saveNote: (sessionId, html, vocab) =>
        setData((d) => {
          const prev = d.notes.find((n) => n.sessionId === sessionId);
          const others = d.notes.filter((n) => n.sessionId !== sessionId);
          return {
            ...d,
            notes: [
              ...others,
              {
                sessionId,
                html,
                vocab,
                updatedAt: stamp(),
                authorId: account?.profileId ?? "",
                publishedAt: prev?.publishedAt,
              },
            ],
          };
        }),
      setNotePublished: (sessionId, published) =>
        setData((d) => ({
          ...d,
          notes: d.notes.map((n) =>
            n.sessionId === sessionId ? { ...n, publishedAt: published ? stamp() : undefined } : n,
          ),
        })),
      addHomework: (hw) => {
        const id = `hw-${crypto.randomUUID().slice(0, 8)}`;
        setData((d) => ({ ...d, homework: [...d.homework, { ...hw, id }] }));
        return id;
      },
      updateHomework: (id, patch) =>
        setData((d) => ({
          ...d,
          homework: d.homework.map((h) => (h.id === id ? { ...h, ...patch } : h)),
        })),
      deleteHomework: (id) =>
        setData((d) => {
          const subIds = new Set(d.submissions.filter((s) => s.homeworkId === id).map((s) => s.id));
          const gone = d.attachments.filter(
            (a) => (a.ownerType === "homework" && a.ownerId === id) || (a.ownerType === "submission" && subIds.has(a.ownerId)),
          );
          gone.forEach((a) => void deleteFile(a.id));
          return {
            ...d,
            homework: d.homework.filter((h) => h.id !== id),
            submissions: d.submissions.filter((s) => s.homeworkId !== id),
            attachments: d.attachments.filter((a) => !gone.includes(a)),
          };
        }),
      submitHomework: (homeworkId, content, link) => {
        if (!studentId) return undefined;
        const id =
          data.submissions.find((s) => s.homeworkId === homeworkId && s.studentId === studentId)?.id ??
          `sub-${crypto.randomUUID().slice(0, 8)}`;
        setData((d) => {
          const existing = d.submissions.find(
            (s) => s.homeworkId === homeworkId && s.studentId === studentId,
          );
          const next: Submission = {
            id,
            homeworkId,
            studentId,
            content,
            link: link || undefined,
            submittedAt: stamp(),
            status: "submitted",
          };
          return {
            ...d,
            submissions: existing
              ? d.submissions.map((s) => (s.id === existing.id ? next : s))
              : [...d.submissions, next],
          };
        });
        return id;
      },
      addAttachment: async (ownerType, ownerId, file, name) => {
        const att: Attachment = {
          id: `att-${crypto.randomUUID()}`,
          ownerType,
          ownerId,
          name,
          size: file.size,
          mime: file.type || "application/octet-stream",
          uploadedAt: stamp(),
          uploaderId: account?.profileId ?? account?.id ?? "",
        };
        await putFile(att.id, file);
        setData((d) => ({ ...d, attachments: [...d.attachments, att] }));
        return att;
      },
      removeAttachment: (id) => {
        void deleteFile(id);
        setData((d) => ({ ...d, attachments: d.attachments.filter((a) => a.id !== id) }));
      },
      reviewSubmission: (id, score, feedback) =>
        setData((d) => ({
          ...d,
          submissions: d.submissions.map((s) =>
            s.id === id ? { ...s, status: "reviewed", score, feedback } : s,
          ),
        })),
      setRemark: (sessionId, sid, patch) =>
        setData((d) => {
          const found = d.remarks.find((r) => r.sessionId === sessionId && r.studentId === sid);
          const base: StudentRemark = found ?? { sessionId, studentId: sid, attendance: "present" };
          const next = { ...base, ...patch };
          return {
            ...d,
            remarks: found
              ? d.remarks.map((r) => (r === found ? next : r))
              : [...d.remarks, next],
          };
        }),
      resetDemo: () => {
        void clearFiles();
        setData(buildMockData());
      },

      createClass: (input) => {
        if (data.classes.some((c) => c.code.toLowerCase() === input.code.trim().toLowerCase()))
          return { error: `Mã lớp ${input.code} đã tồn tại.` };
        const id = `c-${crypto.randomUUID().slice(0, 6)}`;
        const cls: ClassGroup = { ...input, code: input.code.trim(), id };
        const sessions = generateSessions(cls, { now: Date.now() });
        setData((d) => ({ ...d, classes: [...d.classes, cls], sessions: [...d.sessions, ...sessions] }));
        return { id };
      },
      updateClass: (id, patch) => {
        if (
          patch.code &&
          data.classes.some((c) => c.id !== id && c.code.toLowerCase() === patch.code!.trim().toLowerCase())
        )
          return { error: `Mã lớp ${patch.code} đã tồn tại.` };
        const enrolled = data.enrollments.filter((e) => e.classId === id && e.status === "active").length;
        if (patch.type && patch.type !== "GROUP" && enrolled > (patch.type === "ONE_ON_ONE" ? 1 : 2))
          return { error: `Lớp đang có ${enrolled} học viên, nhiều hơn sĩ số tối đa của loại lớp này.` };
        setData((d) => {
          const old = d.classes.find((c) => c.id === id);
          if (!old) return d;
          const next = { ...old, ...patch };
          const reschedule =
            JSON.stringify(old.schedule) !== JSON.stringify(next.schedule) ||
            old.startDate !== next.startDate ||
            old.totalSessions !== next.totalSessions ||
            old.teacherId !== next.teacherId;
          let sessions = d.sessions;
          if (reschedule) {
            // Giữ buổi đã học; sinh lại các buổi chưa học. Id buổi = {lớp}-b{số buổi}
            // nên note nháp, homework, tài liệu của buổi chưa học vẫn bám theo số buổi.
            const done = d.sessions
              .filter((s) => s.classId === id && s.status === "done")
              .sort((a, b) => a.index - b.index);
            const last = done[done.length - 1];
            const regenerated = generateSessions(next, {
              fromIndex: done.length,
              from: last ? new Date(last.date) : undefined,
              now: Date.now(),
              topic: (i) => d.sessions.find((s) => s.id === `${id}-b${i}`)?.topic ?? `Buổi ${i}`,
            });
            sessions = [...d.sessions.filter((s) => s.classId !== id), ...done, ...regenerated];
          }
          return { ...d, classes: d.classes.map((c) => (c.id === id ? next : c)), sessions };
        });
        return {};
      },
      enroll: (sid, classId) => {
        const cls = data.classes.find((c) => c.id === classId);
        if (!cls) return { error: "Không tìm thấy lớp." };
        // Production: kiểm tra lại ở server
        if (!canManageRoster(data, account, classId)) return { error: "Bạn chỉ xếp được học viên vào lớp mình phụ trách." };
        const active = data.enrollments.filter((e) => e.classId === classId && e.status === "active");
        if (active.some((e) => e.studentId === sid)) return { error: "Học viên đã ở trong lớp này." };
        const cap = cls.type === "ONE_ON_ONE" ? 1 : cls.type === "ONE_ON_TWO" ? 2 : 12;
        if (active.length >= cap) return { error: `${cls.name} đã đủ ${cap} học viên.` };
        setData((d) => ({
          ...d,
          enrollments: [
            ...d.enrollments.filter((e) => !(e.classId === classId && e.studentId === sid)),
            { studentId: sid, classId, joinedAt: stamp(), status: "active" },
          ],
        }));
        return {};
      },
      unenroll: (sid, classId) =>
        canManageRoster(data, account, classId) &&
        setData((d) => ({
          ...d,
          enrollments: d.enrollments.filter((e) => !(e.classId === classId && e.studentId === sid)),
        })),
      createStudent: (input) => {
        const email = input.email.trim().toLowerCase();
        if (data.accounts.some((a) => a.email.toLowerCase() === email))
          return { error: "Gmail này đã gắn với một tài khoản khác." };
        const yy = String(new Date().getFullYear()).slice(-2);
        const seq = Math.max(0, ...data.students.map((x) => Number(x.code.slice(-3)) || 0)) + 1;
        const id = `s-${crypto.randomUUID().slice(0, 6)}`;
        const st: Student = {
          id,
          code: `YS-${yy}${String(seq).padStart(3, "0")}`,
          fullName: input.fullName.trim(),
          email,
          phone: input.phone?.trim() || undefined,
          joinedAt: stamp(),
        };
        setData((d) => ({
          ...d,
          students: [...d.students, st],
          accounts: [...d.accounts, { id: `acc-${id}`, email, name: st.fullName, role: "student", profileId: id }],
        }));
        return { id };
      },
      updateStudent: (id, patch) => {
        const email = patch.email?.trim().toLowerCase();
        if (email && data.accounts.some((a) => a.email.toLowerCase() === email && a.profileId !== id))
          return { error: "Gmail này đã gắn với một tài khoản khác." };
        setData((d) => ({
          ...d,
          students: d.students.map((x) => (x.id === id ? { ...x, ...patch, ...(email ? { email } : {}) } : x)),
          accounts: d.accounts.map((a) =>
            a.profileId === id
              ? { ...a, ...(email ? { email } : {}), ...(patch.fullName ? { name: patch.fullName } : {}) }
              : a,
          ),
        }));
        return {};
      },
      createTeacher: (input) => {
        const email = input.email.trim().toLowerCase();
        if (data.accounts.some((a) => a.email.toLowerCase() === email))
          return { error: "Email này đã gắn với một tài khoản khác." };
        const id = `t-${crypto.randomUUID().slice(0, 6)}`;
        const t: Teacher = { ...input, id, email, fullName: input.fullName.trim() };
        setData((d) => ({
          ...d,
          teachers: [...d.teachers, t],
          accounts: [...d.accounts, { id: `acc-${id}`, email, name: t.fullName, role: "teacher", profileId: id }],
        }));
        return { id };
      },
      addAdmin: (name, rawEmail) => {
        if (account?.role !== "admin") return { error: "Chỉ quản trị viên được cấp quyền." };
        const email = rawEmail.trim().toLowerCase();
        if (data.accounts.some((a) => a.email.toLowerCase() === email))
          return { error: "Email này đã có tài khoản. Dùng một email riêng cho tài khoản quản trị." };
        setData((d) => ({
          ...d,
          accounts: [...d.accounts, { id: `acc-adm-${crypto.randomUUID().slice(0, 6)}`, email, name: name.trim(), role: "admin" }],
        }));
        return {};
      },
      removeAdmin: (accountId) => {
        if (account?.role !== "admin") return { error: "Chỉ quản trị viên được thu quyền." };
        if (accountId === account.id) return { error: "Không thể tự thu quyền của chính bạn." };
        if (data.accounts.filter((a) => a.role === "admin").length <= 1) return { error: "Cần giữ ít nhất 1 tài khoản quản trị." };
        setData((d) => ({ ...d, accounts: d.accounts.filter((a) => a.id !== accountId) }));
        return {};
      },
      updateTeacher: (id, patch) => {
        const email = patch.email?.trim().toLowerCase();
        if (email && data.accounts.some((a) => a.email.toLowerCase() === email && a.profileId !== id))
          return { error: "Email này đã gắn với một tài khoản khác." };
        setData((d) => ({
          ...d,
          teachers: d.teachers.map((x) => (x.id === id ? { ...x, ...patch, ...(email ? { email } : {}) } : x)),
          accounts: d.accounts.map((a) =>
            a.profileId === id
              ? { ...a, ...(email ? { email } : {}), ...(patch.fullName ? { name: patch.fullName } : {}) }
              : a,
          ),
        }));
        return {};
      },
    };
  }, [ready, now, data, account, signIn, signInByEmail, signOut]);

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used inside <StoreProvider>");
  return ctx;
}
