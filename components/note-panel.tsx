"use client";

import { useState } from "react";
import { dateShort, time } from "@/lib/format";
import { useStore } from "@/lib/store";
import type { ClassGroup, ClassSession, VocabItem } from "@/lib/types";
import { IconPen, IconPlus, IconTrash } from "./icons";
import { RichText } from "./rich-text";
import { ATTENDANCE_LABEL, AttendanceDot, Button, Empty, inputCls } from "./ui";

export function NotePanel({ session, cls }: { session: ClassSession; cls: ClassGroup }) {
  const { data, account } = useStore();
  const [editing, setEditing] = useState(false);
  const note = data.notes.find((n) => n.sessionId === session.id);
  const staff = account?.role !== "student";
  const studentId = staff ? undefined : account?.profileId;
  const remark = studentId
    ? data.remarks.find((r) => r.sessionId === session.id && r.studentId === studentId)
    : undefined;
  const author = note && data.teachers.find((t) => t.id === note.authorId);

  if (editing) return <NoteEditor session={session} onDone={() => setEditing(false)} />;

  if (!note) {
    return staff ? (
      <Empty>
        <p>Buổi này chưa có note.</p>
        <Button className="mt-4" onClick={() => setEditing(true)}>
          <IconPen size={16} /> Viết note buổi học
        </Button>
      </Empty>
    ) : (
      <Empty>
        {session.status === "scheduled"
          ? "Buổi học chưa diễn ra. Note sẽ có sau khi giáo viên cập nhật."
          : "Giáo viên chưa cập nhật note cho buổi này."}
      </Empty>
    );
  }

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

      <article
        className="margin-line relative rounded-xl border border-rule bg-surface py-6 pl-12 pr-5 shadow-card sm:pl-16 sm:pr-8"
        style={{ ["--margin-x" as string]: "2.25rem" }}
      >
        <RichText source={note.content} />
        <footer className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-rule pt-4 text-xs text-muted">
          <span>
            Cập nhật {time(note.updatedAt)} ngày {dateShort(note.updatedAt)}
            {author ? ` bởi ${author.fullName}` : ""}
          </span>
          {staff && (
            <Button variant="ghost" onClick={() => setEditing(true)}>
              <IconPen size={15} /> Sửa note
            </Button>
          )}
        </footer>
      </article>

      {note.vocab.length > 0 && (
        <section>
          <h2 className="mb-3 text-[0.95rem] font-semibold">
            Từ vựng <span className="font-normal text-muted">{note.vocab.length} từ</span>
          </h2>
          <VocabTable items={note.vocab} />
        </section>
      )}

      {cls.type === "GROUP" && staff && (
        <p className="text-xs text-muted">Note này hiển thị cho cả {cls.name}. Nhận xét riêng nằm ở tab Điểm danh.</p>
      )}
    </div>
  );
}

function VocabTable({ items }: { items: VocabItem[] }) {
  return (
    <div className="overflow-hidden rounded-xl border border-rule bg-surface">
      <table className="w-full text-sm">
        <thead className="hidden sm:table-header-group">
          <tr className="border-b border-rule bg-surface-2 text-left text-xs text-muted">
            <th className="px-4 py-2.5 font-medium">Từ</th>
            <th className="px-4 py-2.5 font-medium">Nghĩa</th>
            <th className="px-4 py-2.5 font-medium">Definition in English</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-rule">
          {items.map((v, i) => (
            <tr key={i} className="block px-4 py-3 sm:table-row sm:p-0">
              <td className="block align-top sm:table-cell sm:px-4 sm:py-3">
                <span className="font-serif text-[1.05rem] font-semibold text-ink">{v.word}</span>{" "}
                <span className="text-xs italic text-muted">({v.partOfSpeech})</span>
                {v.example && <div className="mt-1 font-serif text-[0.85rem] italic text-ink-soft">{v.example}</div>}
              </td>
              <td className="block align-top text-ink sm:table-cell sm:px-4 sm:py-3">{v.meaningVi}</td>
              <td className="block align-top text-ink-soft sm:table-cell sm:px-4 sm:py-3">{v.definitionEn}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const blankVocab = (): VocabItem => ({ word: "", partOfSpeech: "", meaningVi: "", definitionEn: "" });

function NoteEditor({ session, onDone }: { session: ClassSession; onDone: () => void }) {
  const { data, saveNote } = useStore();
  const existing = data.notes.find((n) => n.sessionId === session.id);
  const [content, setContent] = useState(
    existing?.content ?? "## Nội dung chính\n- \n\n## Lưu ý cho buổi sau\n- ",
  );
  const [vocab, setVocab] = useState<VocabItem[]>(existing?.vocab.length ? existing.vocab : [blankVocab()]);

  const update = (i: number, patch: Partial<VocabItem>) =>
    setVocab((list) => list.map((v, j) => (j === i ? { ...v, ...patch } : v)));

  return (
    <form
      className="space-y-8"
      onSubmit={(e) => {
        e.preventDefault();
        saveNote(session.id, content, vocab.filter((v) => v.word.trim()));
        onDone();
      }}
    >
      <div className="grid gap-4 lg:grid-cols-2">
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium">Nội dung note</span>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={14}
            className={`${inputCls} font-mono text-[0.85rem] leading-relaxed`}
          />
          <span className="mt-1 block text-xs text-muted">
            Dùng &quot;## &quot; cho tiêu đề, &quot;- &quot; cho gạch đầu dòng, **đậm**, *nghiêng*.
          </span>
        </label>
        <div>
          <span className="mb-1.5 block text-sm font-medium">Xem trước</span>
          <div className="min-h-[14rem] rounded-lg border border-rule bg-surface p-4">
            <RichText source={content} />
          </div>
        </div>
      </div>

      <fieldset>
        <legend className="mb-2 text-sm font-medium">Từ vựng</legend>
        <div className="space-y-2">
          {vocab.map((v, i) => (
            <div key={i} className="grid gap-2 rounded-lg border border-rule bg-surface p-2 sm:grid-cols-[1.1fr_0.5fr_1fr_1.6fr_auto]">
              <input aria-label="Từ" placeholder="Từ" value={v.word} onChange={(e) => update(i, { word: e.target.value })} className={inputCls} />
              <input aria-label="Loại từ" placeholder="n, v, adj" value={v.partOfSpeech} onChange={(e) => update(i, { partOfSpeech: e.target.value })} className={inputCls} />
              <input aria-label="Nghĩa tiếng Việt" placeholder="Nghĩa" value={v.meaningVi} onChange={(e) => update(i, { meaningVi: e.target.value })} className={inputCls} />
              <input aria-label="Definition in English" placeholder="Definition in English" value={v.definitionEn} onChange={(e) => update(i, { definitionEn: e.target.value })} className={inputCls} />
              <button
                type="button"
                onClick={() => setVocab((l) => l.filter((_, j) => j !== i))}
                className="grid h-9 w-9 place-items-center rounded-lg text-muted hover:bg-danger-soft hover:text-danger"
                aria-label={`Xóa từ ${v.word || i + 1}`}
              >
                <IconTrash size={16} />
              </button>
            </div>
          ))}
        </div>
        <Button type="button" variant="ghost" className="mt-2" onClick={() => setVocab((l) => [...l, blankVocab()])}>
          <IconPlus size={16} /> Thêm từ
        </Button>
      </fieldset>

      <div className="flex gap-2">
        <Button type="submit">Lưu note</Button>
        <Button type="button" variant="ghost" onClick={onDone}>
          Hủy
        </Button>
      </div>
    </form>
  );
}
