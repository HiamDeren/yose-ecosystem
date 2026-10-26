"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { dateShort, time } from "@/lib/format";
import { useStore } from "@/lib/store";
import type { ClassGroup, ClassSession, SessionNote, VocabItem } from "@/lib/types";
import { AttachmentList, UploadArea, useAttachments } from "./attachments";
import { IconPen, IconPlus, IconTrash } from "./icons";
import { NoteContent, NoteEditor } from "./rich-editor";
import { ATTENDANCE_LABEL, AttendanceDot, Button, Empty, SectionTitle, inputCls } from "./ui";

const TEMPLATE =
  "<h2>Kế hoạch buổi học</h2><ol><li><p></p></li></ol><h2>Nội dung chính</h2><ul><li><p></p></li></ul><h2>Ghi trên lớp</h2><p></p>";

export function NotePanel({ session, cls }: { session: ClassSession; cls: ClassGroup }) {
  const { account } = useStore();
  return account?.role === "student" ? (
    <StudentNote session={session} studentId={account.profileId!} />
  ) : (
    <TeacherNote session={session} cls={cls} />
  );
}

/* ───────────── Học viên ───────────── */

function StudentNote({ session, studentId }: { session: ClassSession; studentId: string }) {
  const { data } = useStore();
  const note = data.notes.find((n) => n.sessionId === session.id);
  const materials = useAttachments("session", session.id);
  const remark = data.remarks.find((r) => r.sessionId === session.id && r.studentId === studentId);
  const visible = note?.publishedAt ? note : undefined;

  return (
    <div className="space-y-8">
      {remark?.comment && (
        <div className="rounded-xl border border-rule bg-surface p-4 sm:p-5">
          <div className="flex items-center gap-2 text-xs text-muted">
            <AttendanceDot status={remark.attendance} /> {ATTENDANCE_LABEL[remark.attendance]}
            <span className="ml-1">Nhận xét riêng cho bạn</span>
          </div>
          <p className="mt-2 font-serif text-[1.05rem] leading-relaxed text-ink">{remark.comment}</p>
        </div>
      )}

      <Columns
        main={
          visible ? (
            <NoteSheet note={visible} />
          ) : (
            <Empty>
              {session.status === "scheduled"
                ? "Giáo viên sẽ công bố note khi buổi học bắt đầu."
                : "Giáo viên chưa công bố note cho buổi này."}
            </Empty>
          )
        }
        side={
          <>
            {visible && visible.vocab.length > 0 && <Vocab items={visible.vocab} />}
            <section>
              <SectionTitle aside={materials.length ? `${materials.length} file` : undefined}>
                Tài liệu buổi học
              </SectionTitle>
              <AttachmentList items={materials} empty="Buổi này chưa có tài liệu." />
            </section>
          </>
        }
      />
    </div>
  );
}

/* ───────────── Giáo viên ───────────── */

function TeacherNote({ session, cls }: { session: ClassSession; cls: ClassGroup }) {
  const { data, now, saveNote, setNotePublished } = useStore();
  const note = data.notes.find((n) => n.sessionId === session.id);
  const materials = useAttachments("session", session.id);
  const [editing, setEditing] = useState(false);
  const start = new Date(session.date).getTime();
  const live = now >= start && now <= start + session.durationMin * 60_000;

  const materialsBlock = (
    <section>
      <SectionTitle aside={materials.length ? `${materials.length} file` : undefined}>Tài liệu buổi học</SectionTitle>
      <div className="space-y-3">
        <AttachmentList items={materials} canRemove />
        <UploadArea ownerType="session" ownerId={session.id} label="Thêm bài đọc, file nghe, slide…" />
        <p className="text-xs text-muted">Học viên của {cls.name} thấy tài liệu ngay khi tải lên.</p>
      </div>
    </section>
  );

  const begin = () => {
    if (!note) saveNote(session.id, TEMPLATE, []);
    setEditing(true);
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-rule bg-surface px-4 py-3 shadow-card">
        <NoteStatus note={note} live={live} />
        <div className="ml-auto flex flex-wrap gap-2">
          {editing ? (
            <Button onClick={() => setEditing(false)}>Xong</Button>
          ) : (
            <Button variant={note ? "ghost" : "primary"} onClick={begin}>
              <IconPen size={15} />
              {!note ? "Soạn bài" : live ? "Ghi trên lớp" : "Mở trình soạn"}
            </Button>
          )}
          {note &&
            (note.publishedAt ? (
              <Button variant="ghost" onClick={() => setNotePublished(session.id, false)}>
                Ẩn khỏi học viên
              </Button>
            ) : (
              <Button onClick={() => setNotePublished(session.id, true)}>Công bố cho học viên</Button>
            ))}
        </div>
      </div>

      {editing && note ? (
        <Workspace key={session.id} note={note} materials={materialsBlock} />
      ) : (
        <Columns
          main={
            note ? (
              <NoteSheet note={note} />
            ) : (
              <Empty>
                Chưa có note. Bấm <b className="font-medium text-ink">Soạn bài</b> để soạn trước buổi học; học viên chỉ
                thấy khi bạn công bố. Lúc dạy, mở lại để ghi tiếp ngay trên lớp.
              </Empty>
            )
          }
          side={
            <>
              {note && note.vocab.length > 0 && <Vocab items={note.vocab} />}
              {materialsBlock}
            </>
          }
        />
      )}
    </div>
  );
}

function NoteStatus({ note, live }: { note?: SessionNote; live: boolean }) {
  return (
    <div className="min-w-0 text-sm">
      <div className="flex flex-wrap items-center gap-2">
        {live && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-danger-soft px-2 py-0.5 text-xs font-semibold text-danger">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-danger" aria-hidden /> Đang trong giờ học
          </span>
        )}
        {!note ? (
          <span className="font-medium text-ink">Chưa soạn</span>
        ) : note.publishedAt ? (
          <span className="font-medium text-ok">Đã công bố cho học viên</span>
        ) : (
          <span className="hl font-medium text-ink">Bản nháp, học viên chưa thấy</span>
        )}
      </div>
      {note && (
        <div className="mt-0.5 text-xs text-muted">
          Lưu lần cuối {time(note.updatedAt)} ngày {dateShort(note.updatedAt)}
          {note.publishedAt && `, công bố ${time(note.publishedAt)} ${dateShort(note.publishedAt)}`}
        </div>
      )}
    </div>
  );
}

/** Soạn + tự lưu, giống cảm giác Google Docs */
function Workspace({ note, materials }: { note: SessionNote; materials: ReactNode }) {
  const { saveNote } = useStore();
  const [html, setHtml] = useState(note.html);
  const [vocab, setVocab] = useState<VocabItem[]>(note.vocab.length ? note.vocab : [blankVocab()]);
  const [saved, setSaved] = useState<"saved" | "saving">("saved");
  const first = useRef(true);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    const t = window.setTimeout(() => {
      saveNote(
        note.sessionId,
        html,
        vocab.filter((v) => v.word.trim()),
      );
      setSaved("saved");
    }, 700);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- autosave theo nội dung
  }, [html, vocab]);

  const update = (i: number, patch: Partial<VocabItem>) => {
    setSaved("saving");
    setVocab((list) => list.map((v, j) => (j === i ? { ...v, ...patch } : v)));
  };

  return (
    <Columns
      main={
        <div>
          <div className="mb-2 flex items-center justify-between text-xs text-muted">
            <span>Bút dạ quang để đánh dấu chỗ học viên hay sai. Mọi thay đổi tự lưu.</span>
            <span aria-live="polite">{saved === "saving" ? "Đang lưu…" : "Đã lưu"}</span>
          </div>
          <NoteEditor
            initialHtml={note.html}
            onChange={(h) => {
              setSaved("saving");
              setHtml(h);
            }}
          />
        </div>
      }
      side={
        <>
          <fieldset>
            <legend className="mb-2 text-[0.95rem] font-semibold">Từ vựng</legend>
            <div className="space-y-2">
              {vocab.map((v, i) => (
                <div
                  key={i}
                  className="grid grid-cols-[1fr_5.5rem_auto] gap-2 rounded-lg border border-rule bg-surface p-2"
                >
                  <input
                    aria-label="Từ"
                    placeholder="Từ"
                    value={v.word}
                    onChange={(e) => update(i, { word: e.target.value })}
                    className={inputCls}
                  />
                  <input
                    aria-label="Loại từ"
                    placeholder="n, v, adj"
                    value={v.partOfSpeech}
                    onChange={(e) => update(i, { partOfSpeech: e.target.value })}
                    className={inputCls}
                  />
                  <input
                    aria-label="Nghĩa tiếng Việt"
                    placeholder="Nghĩa"
                    value={v.meaningVi}
                    onChange={(e) => update(i, { meaningVi: e.target.value })}
                    className={`${inputCls} col-span-3 row-start-2`}
                  />
                  <input
                    aria-label="Definition in English"
                    placeholder="Definition in English"
                    value={v.definitionEn}
                    onChange={(e) => update(i, { definitionEn: e.target.value })}
                    className={`${inputCls} col-span-3 row-start-3`}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setSaved("saving");
                      setVocab((l) => l.filter((_, j) => j !== i));
                    }}
                    className="grid h-9 w-9 place-items-center rounded-lg text-muted hover:bg-danger-soft hover:text-danger"
                    aria-label={`Xóa từ ${v.word || i + 1}`}
                  >
                    <IconTrash size={16} />
                  </button>
                </div>
              ))}
            </div>
            <Button
              type="button"
              variant="ghost"
              className="mt-2"
              onClick={() => setVocab((l) => [...l, blankVocab()])}
            >
              <IconPlus size={16} /> Thêm từ
            </Button>
          </fieldset>
          {materials}
        </>
      }
    />
  );
}

/** Màn rộng: note bên trái, từ vựng + tài liệu bên phải */
function Columns({ main, side }: { main: ReactNode; side: ReactNode }) {
  return (
    <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_26rem] 2xl:grid-cols-[minmax(0,1fr)_30rem]">
      <div className="min-w-0">{main}</div>
      <div className="min-w-0 space-y-8">{side}</div>
    </div>
  );
}

const blankVocab = (): VocabItem => ({ word: "", partOfSpeech: "", meaningVi: "", definitionEn: "" });

/* ───────────── dùng chung ───────────── */

function NoteSheet({ note }: { note: SessionNote }) {
  const { data } = useStore();
  const author = data.teachers.find((t) => t.id === note.authorId);
  return (
    <article
      className="margin-line relative rounded-xl border border-rule bg-surface py-6 pl-12 pr-5 shadow-card sm:pl-16 sm:pr-8"
      style={{ ["--margin-x" as string]: "2.25rem" }}
    >
      <NoteContent html={note.html} />
      <footer className="mt-6 border-t border-rule pt-4 text-xs text-muted">
        Cập nhật {time(note.updatedAt)} ngày {dateShort(note.updatedAt)}
        {author ? ` bởi ${author.fullName}` : ""}
      </footer>
    </article>
  );
}

function Vocab({ items }: { items: VocabItem[] }) {
  return (
    <section>
      <SectionTitle aside={`${items.length} từ`}>Từ vựng</SectionTitle>
      <ul className="divide-y divide-rule overflow-hidden rounded-xl border border-rule bg-surface">
        {items.map((v, i) => (
          <li key={i} className="px-4 py-3">
            <div>
              <span className="font-serif text-[1.05rem] font-semibold text-ink">{v.word}</span>{" "}
              <span className="text-xs italic text-muted">({v.partOfSpeech})</span>
              <span className="ml-2 text-sm text-ink">{v.meaningVi}</span>
            </div>
            <div className="mt-0.5 text-sm text-ink-soft">{v.definitionEn}</div>
            {v.example && <div className="mt-1 font-serif text-[0.85rem] italic text-muted">{v.example}</div>}
          </li>
        ))}
      </ul>
    </section>
  );
}
