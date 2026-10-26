"use client";

import Highlight from "@tiptap/extension-highlight";
import { Placeholder } from "@tiptap/extensions";
import { EditorContent, useEditor, useEditorState, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import type { ReactNode } from "react";

// Trình soạn note thay cho Google Docs. Lưu HTML trong demo;
// production nên lưu editor.getJSON() vào cột jsonb.

const extensions = (placeholder?: string) => [
  StarterKit.configure({
    heading: { levels: [2, 3] },
    link: { openOnClick: false, autolink: true, HTMLAttributes: { rel: "noreferrer", target: "_blank" } },
  }),
  Highlight,
  Placeholder.configure({ placeholder: placeholder ?? "Bắt đầu soạn nội dung buổi học…" }),
];

/** Chỉ đọc: học viên xem note */
export function NoteContent({ html }: { html: string }) {
  const editor = useEditor(
    {
      extensions: extensions(),
      content: html,
      editable: false,
      immediatelyRender: false,
      editorProps: { attributes: { class: "prose-note" } },
    },
    [html],
  );
  return <EditorContent editor={editor} />;
}

export function NoteEditor({
  initialHtml,
  onChange,
  placeholder,
}: {
  initialHtml: string;
  onChange: (html: string) => void;
  placeholder?: string;
}) {
  const editor = useEditor({
    extensions: extensions(placeholder),
    content: initialHtml,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: "prose-note min-h-[18rem] px-5 py-4 focus:outline-none sm:px-7",
        "aria-label": "Nội dung note buổi học",
      },
    },
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
  });

  return (
    <div className="overflow-hidden rounded-xl border border-rule bg-surface shadow-card focus-within:border-brand">
      {editor && <Toolbar editor={editor} />}
      <EditorContent editor={editor} />
    </div>
  );
}

function Toolbar({ editor }: { editor: Editor }) {
  const s = useEditorState({
    editor,
    selector: ({ editor: e }) => ({
      h2: e.isActive("heading", { level: 2 }),
      h3: e.isActive("heading", { level: 3 }),
      bold: e.isActive("bold"),
      italic: e.isActive("italic"),
      underline: e.isActive("underline"),
      highlight: e.isActive("highlight"),
      bullet: e.isActive("bulletList"),
      ordered: e.isActive("orderedList"),
      quote: e.isActive("blockquote"),
      canUndo: e.can().undo(),
      canRedo: e.can().redo(),
    }),
  });
  const c = () => editor.chain().focus();

  return (
    <div
      role="toolbar"
      aria-label="Định dạng"
      className="flex flex-wrap items-center gap-0.5 border-b border-rule bg-surface-2 px-2 py-1.5"
    >
      <Tool label="Tiêu đề" active={s.h2} onClick={() => c().toggleHeading({ level: 2 }).run()}>
        <span className="text-[0.8rem] font-semibold">H2</span>
      </Tool>
      <Tool label="Tiêu đề nhỏ" active={s.h3} onClick={() => c().toggleHeading({ level: 3 }).run()}>
        <span className="text-[0.75rem] font-semibold">H3</span>
      </Tool>
      <Sep />
      <Tool label="In đậm" active={s.bold} onClick={() => c().toggleBold().run()}>
        <b>B</b>
      </Tool>
      <Tool label="In nghiêng" active={s.italic} onClick={() => c().toggleItalic().run()}>
        <i className="font-serif">I</i>
      </Tool>
      <Tool label="Gạch chân" active={s.underline} onClick={() => c().toggleUnderline().run()}>
        <u>U</u>
      </Tool>
      <Tool label="Bút dạ quang" active={s.highlight} onClick={() => c().toggleHighlight().run()}>
        <span className="hl px-0.5 text-[0.8rem] font-semibold">ab</span>
      </Tool>
      <Sep />
      <Tool label="Danh sách" active={s.bullet} onClick={() => c().toggleBulletList().run()}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden>
          <path d="M9 6h11M9 12h11M9 18h11" />
          <circle cx="4.5" cy="6" r="1" fill="currentColor" />
          <circle cx="4.5" cy="12" r="1" fill="currentColor" />
          <circle cx="4.5" cy="18" r="1" fill="currentColor" />
        </svg>
      </Tool>
      <Tool label="Danh sách đánh số" active={s.ordered} onClick={() => c().toggleOrderedList().run()}>
        <span className="text-[0.75rem] font-semibold tabular-nums">1.</span>
      </Tool>
      <Tool label="Trích dẫn" active={s.quote} onClick={() => c().toggleBlockquote().run()}>
        <span className="font-serif text-lg leading-none">“</span>
      </Tool>
      <Sep />
      <Tool label="Hoàn tác" disabled={!s.canUndo} onClick={() => c().undo().run()}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M9 14 4 9l5-5" />
          <path d="M4 9h10a6 6 0 0 1 0 12h-3" />
        </svg>
      </Tool>
      <Tool label="Làm lại" disabled={!s.canRedo} onClick={() => c().redo().run()}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="m15 14 5-5-5-5" />
          <path d="M20 9H10a6 6 0 0 0 0 12h3" />
        </svg>
      </Tool>
    </div>
  );
}

function Tool({
  label,
  active,
  disabled,
  onClick,
  children,
}: {
  label: string;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      aria-pressed={active}
      disabled={disabled}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className={`grid h-8 min-w-8 place-items-center rounded-md px-1.5 text-ink-soft transition hover:bg-surface hover:text-ink disabled:opacity-35 ${
        active ? "bg-brand-soft text-brand" : ""
      }`}
    >
      {children}
    </button>
  );
}

const Sep = () => <span className="mx-1 h-5 w-px bg-rule" aria-hidden />;
