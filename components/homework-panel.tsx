"use client";

import { useState } from "react";
import { dateLong, dateShort, dueLabel, time } from "@/lib/format";
import { homeworkOfSession, homeworkState, rosterOf, submissionOf } from "@/lib/selectors";
import { useStore } from "@/lib/store";
import type { ClassGroup, ClassSession, Homework, Student, Submission } from "@/lib/types";
import {
  AttachmentList,
  AudioRecorder,
  FileDrop,
  PendingList,
  UploadArea,
  useAttachments,
  type PendingFile,
} from "./attachments";
import { IconCheck, IconLink, IconPen, IconPlus, IconTrash } from "./icons";
import { Avatar, Button, Empty, HomeworkStatus, inputCls } from "./ui";

export function HomeworkPanel({ session, cls }: { session: ClassSession; cls: ClassGroup }) {
  const { account } = useStore();
  if (account?.role === "student") return <StudentHomework session={session} studentId={account.profileId!} />;
  return <TeacherHomework session={session} cls={cls} />;
}

/* ───────────── Học viên ───────────── */

function StudentHomework({ session, studentId }: { session: ClassSession; studentId: string }) {
  const { data } = useStore();
  const list = homeworkOfSession(data, session.id, studentId);
  if (!list.length) {
    return <Empty>Buổi này không có homework.</Empty>;
  }
  return (
    <div className="space-y-5">
      {list.map((hw) => (
        <StudentHomeworkCard key={hw.id} hw={hw} studentId={studentId} />
      ))}
    </div>
  );
}

function StudentHomeworkCard({ hw, studentId }: { hw: Homework; studentId: string }) {
  const { data, submitHomework, addAttachment } = useStore();
  const sub = submissionOf(data, hw.id, studentId);
  const state = homeworkState(data, hw, studentId);
  const hwFiles = useAttachments("homework", hw.id);
  const subFiles = useAttachments("submission", sub?.id ?? "");
  const [editing, setEditing] = useState(!sub);
  const [content, setContent] = useState(sub?.content ?? "");
  const [link, setLink] = useState(sub?.link ?? "");
  const [pending, setPending] = useState<PendingFile[]>([]);
  const [sending, setSending] = useState(false);
  const [justSent, setJustSent] = useState(false);

  const addPending = (blob: Blob, name: string) =>
    setPending((p) => [...p, { key: crypto.randomUUID(), blob, name }]);
  const canSend = !!content.trim() || pending.length > 0 || subFiles.length > 0;

  return (
    <article className="overflow-hidden rounded-xl border border-rule bg-surface shadow-card">
      <div className="p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <h3 className="text-lg font-semibold tracking-tight">{hw.title}</h3>
          <HomeworkStatus state={state} score={sub?.score} />
        </div>
        <p className="mt-1 text-sm text-muted">
          Hạn nộp {time(hw.dueAt)}, {dateLong(hw.dueAt)}
          {(state === "todo" || state === "overdue") && (
            <span className={state === "overdue" ? "text-danger" : "text-ink-soft"}> ({dueLabel(hw.dueAt)})</span>
          )}
        </p>
        <p className="mt-4 max-w-prose font-serif text-[1.02rem] leading-relaxed text-ink">{hw.instructions}</p>
        {hwFiles.length > 0 && (
          <div className="mt-4">
            <div className="mb-1.5 text-xs font-medium text-muted">File giáo viên gửi kèm</div>
            <AttachmentList items={hwFiles} />
          </div>
        )}
      </div>

      {sub?.status === "reviewed" && (
        <div className="border-t border-rule bg-ok-soft/60 px-5 py-4">
          <div className="flex items-baseline gap-3">
            <span className="text-3xl font-semibold tabular-nums text-ok">{sub.score}</span>
            <span className="text-sm text-ink-soft">điểm</span>
          </div>
          {sub.feedback && <p className="mt-1 text-sm text-ink">{sub.feedback}</p>}
        </div>
      )}

      <div className="border-t border-rule bg-surface-2 px-5 py-4">
        {sub && !editing ? (
          <div className="text-sm">
            <div className="flex items-center gap-2 text-muted">
              <IconCheck size={16} className="text-ok" />
              {justSent ? "Đã nộp bài" : "Bạn đã nộp"} lúc {time(sub.submittedAt)} ngày {dateShort(sub.submittedAt)}
            </div>
            {sub.content && <p className="mt-2 whitespace-pre-wrap text-ink">{sub.content}</p>}
            {subFiles.length > 0 && (
              <div className="mt-3">
                <AttachmentList items={subFiles} />
              </div>
            )}
            {sub.link && (
              <a
                href={sub.link}
                target="_blank"
                rel="noreferrer"
                className="mt-1 inline-flex items-center gap-1 text-brand hover:underline"
              >
                <IconLink size={14} /> {sub.link}
              </a>
            )}
            {sub.status !== "reviewed" && (
              <Button variant="ghost" className="mt-3" onClick={() => setEditing(true)}>
                <IconPen size={15} /> Sửa bài nộp
              </Button>
            )}
          </div>
        ) : (
          <form
            className="space-y-4"
            onSubmit={async (e) => {
              e.preventDefault();
              if (!canSend) return;
              setSending(true);
              const id = submitHomework(hw.id, content.trim(), link.trim());
              if (id) for (const f of pending) await addAttachment("submission", id, f.blob, f.name);
              setPending([]);
              setSending(false);
              setEditing(false);
              setJustSent(true);
            }}
          >
            <div className="space-y-2">
              <span className="block text-sm font-medium">File bài làm</span>
              {subFiles.length > 0 && <AttachmentList items={subFiles} canRemove />}
              <PendingList files={pending} onRemove={(k) => setPending((p) => p.filter((f) => f.key !== k))} />
              <FileDrop
                label="Kéo thả ảnh chụp bài làm, file Word, PDF…"
                onFiles={(files) => files.forEach((f) => addPending(f, f.name))}
              />
              <AudioRecorder
                onRecorded={(blob) => {
                  const d = new Date();
                  addPending(blob, `ghi-am-${d.getHours()}h${String(d.getMinutes()).padStart(2, "0")}.webm`);
                }}
              />
            </div>
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium">
                Bài làm dạng chữ <span className="font-normal text-muted">(không bắt buộc nếu đã có file)</span>
              </span>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={5}
                placeholder="Gõ bài làm hoặc ghi chú cho giáo viên"
                className={inputCls}
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium">
                Link <span className="font-normal text-muted">(nếu bài nằm ở nơi khác, vd video YouTube)</span>
              </span>
              <input
                type="url"
                value={link}
                onChange={(e) => setLink(e.target.value)}
                placeholder="https://"
                className={inputCls}
              />
            </label>
            <div className="flex gap-2">
              <Button type="submit" disabled={!canSend || sending}>
                {sending ? "Đang nộp…" : sub ? "Nộp lại" : "Nộp bài"}
              </Button>
              {sub && (
                <Button type="button" variant="ghost" onClick={() => setEditing(false)}>
                  Hủy
                </Button>
              )}
            </div>
          </form>
        )}
      </div>
    </article>
  );
}

/* ───────────── Giáo viên ───────────── */

function defaultDue(session: ClassSession) {
  const d = new Date(new Date(session.date).getTime() + 2 * 86_400_000);
  d.setHours(23, 0, 0, 0);
  const off = d.getTimezoneOffset() * 60_000;
  return new Date(d.getTime() - off).toISOString().slice(0, 16);
}

function TeacherHomework({ session, cls }: { session: ClassSession; cls: ClassGroup }) {
  const { data, addHomework, addAttachment } = useStore();
  const list = homeworkOfSession(data, session.id);
  const roster = rosterOf(data, cls.id);
  const [adding, setAdding] = useState(list.length === 0);

  return (
    <div className="space-y-6">
      {list.map((hw) => (
        <TeacherHomeworkCard key={hw.id} hw={hw} roster={roster} />
      ))}

      {adding ? (
        <HomeworkForm
          session={session}
          roster={roster}
          canTarget={cls.type !== "ONE_ON_ONE"}
          onCancel={list.length ? () => setAdding(false) : undefined}
          onSave={async (hw, files) => {
            const id = addHomework({ ...hw, sessionId: session.id });
            for (const f of files) await addAttachment("homework", id, f, f.name);
            setAdding(false);
          }}
        />
      ) : (
        <Button variant="ghost" onClick={() => setAdding(true)}>
          <IconPlus size={16} /> Giao thêm bài
        </Button>
      )}
    </div>
  );
}

function HomeworkForm({
  session,
  roster,
  canTarget,
  initial,
  onSave,
  onCancel,
}: {
  session: ClassSession;
  roster: Student[];
  canTarget: boolean;
  initial?: Homework;
  onSave: (hw: Omit<Homework, "id" | "sessionId">, files: File[]) => void;
  onCancel?: () => void;
}) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [instructions, setInstructions] = useState(initial?.instructions ?? "");
  const [due, setDue] = useState(() => {
    if (!initial) return defaultDue(session);
    const d = new Date(initial.dueAt);
    return new Date(d.getTime() - d.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
  });
  const [targets, setTargets] = useState<string[] | null>(initial?.assigneeIds ?? null);
  const [files, setFiles] = useState<File[]>([]);

  return (
    <form
      className="space-y-4 rounded-xl border border-rule bg-surface p-5 shadow-card"
      onSubmit={(e) => {
        e.preventDefault();
        onSave({
          title: title.trim(),
          instructions: instructions.trim(),
          dueAt: new Date(due).toISOString(),
          assigneeIds: targets && targets.length ? targets : null,
        }, files);
      }}
    >
      <h3 className="font-semibold">{initial ? "Sửa homework" : "Giao homework"}</h3>
      <label className="block">
        <span className="mb-1.5 block text-sm font-medium">Tiêu đề</span>
        <input required value={title} onChange={(e) => setTitle(e.target.value)} className={inputCls} placeholder="Vd: Note completion: Shopping" />
      </label>
      <label className="block">
        <span className="mb-1.5 block text-sm font-medium">Hướng dẫn</span>
        <textarea required rows={4} value={instructions} onChange={(e) => setInstructions(e.target.value)} className={inputCls} />
      </label>
      {!initial && (
        <div className="space-y-2">
          <span className="block text-sm font-medium">File kèm bài</span>
          <PendingList
            files={files.map((f, i) => ({ key: `${i}-${f.name}`, blob: f, name: f.name }))}
            onRemove={(k) => setFiles((l) => l.filter((f, i) => `${i}-${f.name}` !== k))}
          />
          <FileDrop label="Đề bài, file nghe, answer sheet…" onFiles={(fs) => setFiles((l) => [...l, ...fs])} />
        </div>
      )}
      <label className="block max-w-xs">
        <span className="mb-1.5 block text-sm font-medium">Hạn nộp</span>
        <input type="datetime-local" required value={due} onChange={(e) => setDue(e.target.value)} className={inputCls} />
      </label>
      {canTarget && (
        <fieldset>
          <legend className="mb-1.5 text-sm font-medium">Giao cho</legend>
          <div className="flex flex-wrap gap-2">
            <Chip active={targets === null} onClick={() => setTargets(null)}>
              Cả lớp
            </Chip>
            {roster.map((s) => {
              const on = targets?.includes(s.id) ?? false;
              return (
                <Chip
                  key={s.id}
                  active={on}
                  onClick={() =>
                    setTargets((t) => {
                      const cur = t ?? [];
                      const next = on ? cur.filter((x) => x !== s.id) : [...cur, s.id];
                      return next.length ? next : null;
                    })
                  }
                >
                  {s.fullName}
                </Chip>
              );
            })}
          </div>
        </fieldset>
      )}
      <div className="flex gap-2">
        <Button type="submit">{initial ? "Lưu thay đổi" : "Giao bài"}</Button>
        {onCancel && (
          <Button type="button" variant="ghost" onClick={onCancel}>
            Hủy
          </Button>
        )}
      </div>
    </form>
  );
}

function Chip({ active, children, onClick }: { active: boolean; children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`rounded-full border px-3 py-1 text-sm transition ${
        active ? "border-brand bg-brand-soft text-brand" : "border-rule text-ink-soft hover:bg-surface-2"
      }`}
    >
      {children}
    </button>
  );
}

function TeacherHomeworkCard({ hw, roster }: { hw: Homework; roster: Student[] }) {
  const { data, updateHomework, deleteHomework } = useStore();
  const session = data.sessions.find((s) => s.id === hw.sessionId)!;
  const cls = data.classes.find((c) => c.id === session.classId)!;
  const [editing, setEditing] = useState(false);
  const hwFiles = useAttachments("homework", hw.id);
  const [confirmDel, setConfirmDel] = useState(false);
  const assigned = hw.assigneeIds ? roster.filter((s) => hw.assigneeIds!.includes(s.id)) : roster;
  const subs = assigned.map((s) => ({ student: s, sub: submissionOf(data, hw.id, s.id) }));
  const submitted = subs.filter((x) => x.sub).length;

  if (editing) {
    return (
      <HomeworkForm
        session={session}
        roster={roster}
        canTarget={cls.type !== "ONE_ON_ONE"}
        initial={hw}
        onCancel={() => setEditing(false)}
        onSave={(patch) => {
          updateHomework(hw.id, patch);
          setEditing(false);
        }}
      />
    );
  }

  return (
    <article className="overflow-hidden rounded-xl border border-rule bg-surface shadow-card">
      <div className="flex flex-wrap items-start justify-between gap-3 p-5">
        <div className="min-w-0">
          <h3 className="text-lg font-semibold tracking-tight">{hw.title}</h3>
          <p className="mt-1 text-sm text-muted">
            Hạn {time(hw.dueAt)} ngày {dateShort(hw.dueAt)}.{" "}
            {hw.assigneeIds ? `Giao riêng ${assigned.length} học viên.` : "Giao cả lớp."} Đã nộp{" "}
            <b className="font-semibold text-ink tabular-nums">
              {submitted}/{assigned.length}
            </b>
            .
          </p>
          <p className="mt-3 max-w-prose text-sm leading-relaxed text-ink-soft">{hw.instructions}</p>
        </div>
        <div className="flex gap-1">
          <Button variant="ghost" onClick={() => setEditing(true)}>
            <IconPen size={15} /> Sửa
          </Button>
            {confirmDel ? (
            <>
              <Button variant="danger" onClick={() => deleteHomework(hw.id)}>
                Xóa bài và bài nộp
              </Button>
              <Button variant="ghost" onClick={() => setConfirmDel(false)}>
                Hủy
              </Button>
            </>
          ) : (
            <Button variant="danger" onClick={() => setConfirmDel(true)} aria-label="Xóa homework">
              <IconTrash size={15} />
            </Button>
          )}
        </div>
      </div>
      <div className="space-y-2 px-5 pb-5">
        <AttachmentList items={hwFiles} canRemove />
        <UploadArea ownerType="homework" ownerId={hw.id} label="Thêm file cho bài này" />
      </div>
      <ul className="divide-y divide-rule border-t border-rule">
        {subs.map(({ student, sub }) => (
          <SubmissionRow key={student.id} student={student} sub={sub} />
        ))}
      </ul>
    </article>
  );
}

function SubmissionRow({ student, sub }: { student: Student; sub?: Submission }) {
  const { reviewSubmission } = useStore();
  const files = useAttachments("submission", sub?.id ?? "");
  const [open, setOpen] = useState(false);
  const [score, setScore] = useState(sub?.score?.toString() ?? "");
  const [feedback, setFeedback] = useState(sub?.feedback ?? "");

  return (
    <li className="px-5 py-3">
      <div className="flex items-center gap-3">
        <Avatar name={student.fullName} size={28} tone="plain" />
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-medium">{student.fullName}</div>
          <div className="text-xs text-muted">
            {student.code}
            {sub && `, nộp ${time(sub.submittedAt)} ${dateShort(sub.submittedAt)}`}
            {files.length > 0 && `, ${files.length} file`}
          </div>
        </div>
        {!sub ? (
          <span className="text-xs text-muted">Chưa nộp</span>
        ) : (
          <>
            <span className="hidden sm:inline">
              <HomeworkStatus state={sub.status === "reviewed" ? "reviewed" : "submitted"} score={sub.score} />
            </span>
            <Button variant="ghost" className="px-2.5 py-1.5" onClick={() => setOpen((v) => !v)} aria-expanded={open}>
              {sub.status === "reviewed" ? "Xem" : "Chấm"}
            </Button>
          </>
        )}
      </div>
      {sub && open && (
        <form
          className="mt-3 space-y-3 rounded-lg bg-surface-2 p-4 sm:ml-10"
          onSubmit={(e) => {
            e.preventDefault();
            reviewSubmission(sub.id, score === "" ? undefined : Number(score), feedback.trim());
            setOpen(false);
          }}
        >
          {sub.content && <p className="whitespace-pre-wrap text-sm text-ink">{sub.content}</p>}
          {files.length > 0 && <AttachmentList items={files} />}
          {sub.link && (
            <a href={sub.link} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-sm text-brand hover:underline">
              <IconLink size={14} /> {sub.link}
            </a>
          )}
          <div className="grid gap-2 sm:grid-cols-[6rem_1fr_auto]">
            <input
              aria-label="Điểm"
              type="number"
              min={0}
              max={10}
              step={0.5}
              value={score}
              onChange={(e) => setScore(e.target.value)}
              placeholder="Điểm"
              className={inputCls}
            />
            <input
              aria-label="Nhận xét"
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Nhận xét cho học viên"
              className={inputCls}
            />
            <Button type="submit">Lưu điểm</Button>
          </div>
        </form>
      )}
    </li>
  );
}
