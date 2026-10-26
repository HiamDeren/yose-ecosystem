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
import type {
  Account,
  Attachment,
  AttachmentOwner,
  Homework,
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

const DATA_KEY = "yose-center-demo-v2";
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
    };
  }, [ready, now, data, account, signIn, signInByEmail, signOut]);

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used inside <StoreProvider>");
  return ctx;
}
