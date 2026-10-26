"use client";

import Highlight from "@tiptap/extension-highlight";
import { TaskItem, TaskList } from "@tiptap/extension-list";
import Subscript from "@tiptap/extension-subscript";
import Superscript from "@tiptap/extension-superscript";
import { TableKit } from "@tiptap/extension-table";
import TextAlign from "@tiptap/extension-text-align";
import { Color, FontSize, TextStyle } from "@tiptap/extension-text-style";
import { CharacterCount, Placeholder } from "@tiptap/extensions";
import { EditorContent, useEditor, useEditorState, type Editor } from "@tiptap/react";
import { NodeSelection } from "@tiptap/pm/state";
import StarterKit from "@tiptap/starter-kit";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { NoteImage, shrinkImage } from "./editor/note-image";

// Trình soạn note thay cho Google Docs: kiểu đoạn, cỡ chữ, màu, bảng, ảnh, căn lề, checklist…
// Demo lưu HTML; production nên lưu editor.getJSON() vào cột jsonb.

/* ───────────── extensions ───────────── */

function extensions(opts: { placeholder?: string; editable: boolean }) {
  return [
    StarterKit.configure({
      heading: { levels: [1, 2, 3] },
      link: { openOnClick: !opts.editable, autolink: true, HTMLAttributes: { rel: "noreferrer", target: "_blank" } },
    }),
    TextStyle,
    Color,
    FontSize,
    Highlight.configure({ multicolor: true }),
    TextAlign.configure({ types: ["heading", "paragraph"] }),
    TableKit.configure({ table: { resizable: opts.editable } }),
    TaskList,
    TaskItem.configure({ nested: true }),
    Subscript,
    Superscript,
    NoteImage,
    CharacterCount,
    Placeholder.configure({ placeholder: opts.placeholder ?? "Bắt đầu soạn nội dung buổi học…" }),
  ];
}

/* ───────────── bảng màu (token theo theme, đọc được ở cả sáng và tối) ───────────── */

const TEXT_COLORS = [
  { label: "Đỏ", value: "var(--tx-red)" },
  { label: "Cam", value: "var(--tx-orange)" },
  { label: "Xanh lá", value: "var(--tx-green)" },
  { label: "Xanh dương", value: "var(--tx-blue)" },
  { label: "Tím", value: "var(--tx-purple)" },
  { label: "Xám", value: "var(--tx-gray)" },
];
const HIGHLIGHTS = [
  { label: "Vàng", value: "var(--hl-yellow)" },
  { label: "Xanh lá", value: "var(--hl-green)" },
  { label: "Xanh dương", value: "var(--hl-blue)" },
  { label: "Hồng", value: "var(--hl-pink)" },
  { label: "Cam", value: "var(--hl-orange)" },
];
const FONT_SIZES = [
  { label: "Nhỏ", value: "14px" },
  { label: "Thường", value: "" },
  { label: "Lớn", value: "20px" },
  { label: "Rất lớn", value: "24px" },
];

/* ───────────── chỉ đọc (học viên) ───────────── */

export function NoteContent({ html }: { html: string }) {
  const editor = useEditor(
    {
      extensions: extensions({ editable: false }),
      content: html,
      editable: false,
      immediatelyRender: false,
      editorProps: { attributes: { class: "prose-note" } },
    },
    [html],
  );
  return <EditorContent editor={editor} />;
}

/* ───────────── soạn (giáo viên) ───────────── */

export function NoteEditor({
  initialHtml,
  onChange,
  onUploadImage,
  placeholder,
}: {
  initialHtml: string;
  onChange: (html: string) => void;
  /** Lưu file ảnh, trả về fileId */
  onUploadImage?: (file: Blob, name: string) => Promise<string>;
  placeholder?: string;
}) {
  const upload = useRef(onUploadImage);
  useEffect(() => {
    upload.current = onUploadImage;
  }, [onUploadImage]);

  const insertImages = async (ed: Editor, files: File[], pos?: number) => {
    if (!upload.current) return;
    for (const f of files.filter((x) => x.type.startsWith("image/"))) {
      const blob = await shrinkImage(f);
      const fileId = await upload.current(blob, f.name);
      const node = { type: "image", attrs: { fileId, alt: f.name.replace(/\.[^.]+$/, ""), width: "md", align: "center" } };
      // Ảnh vừa chèn đang được chọn: chèn tiếp ngay sau nó thay vì ghi đè (để 2 ảnh nằm cùng 1 ô)
      const sel = ed.state.selection;
      const at = pos ?? (sel instanceof NodeSelection ? sel.to : undefined);
      if (at !== undefined) ed.chain().focus().insertContentAt(at, node).run();
      else ed.chain().focus().insertContent(node).run();
    }
  };

  const editor = useEditor({
    extensions: extensions({ placeholder, editable: true }),
    content: initialHtml,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: "prose-note min-h-[24rem] px-5 py-5 focus:outline-none sm:px-8",
        "aria-label": "Nội dung note buổi học",
      },
      handlePaste: (view, event) => {
        const files = Array.from(event.clipboardData?.files ?? []).filter((f) => f.type.startsWith("image/"));
        if (!files.length || !editorRef.current) return false;
        void insertImages(editorRef.current, files);
        return true;
      },
      handleDrop: (view, event, _slice, moved) => {
        if (moved) return false;
        const files = Array.from(event.dataTransfer?.files ?? []).filter((f) => f.type.startsWith("image/"));
        if (!files.length || !editorRef.current) return false;
        const pos = view.posAtCoords({ left: event.clientX, top: event.clientY })?.pos;
        void insertImages(editorRef.current, files, pos);
        return true;
      },
    },
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
  });

  const editorRef = useRef<Editor | null>(null);
  useEffect(() => {
    editorRef.current = editor;
  }, [editor]);

  return (
    <div className="rounded-xl border border-rule bg-surface shadow-card focus-within:border-brand">
      {editor && <Toolbar editor={editor} onPickImages={(files) => insertImages(editor, files)} canUpload={!!onUploadImage} />}
      <EditorContent editor={editor} />
      {editor && <Footer editor={editor} />}
    </div>
  );
}

function Footer({ editor }: { editor: Editor }) {
  const words = useEditorState({ editor, selector: ({ editor: e }) => e.storage.characterCount.words() as number });
  return (
    <div className="flex justify-between gap-3 border-t border-rule px-4 py-2 text-xs text-muted">
      <span>Dán hoặc kéo thả ảnh thẳng vào note. Tab để thụt lề danh sách.</span>
      <span className="tabular-nums">{words} từ</span>
    </div>
  );
}

/* ───────────── thanh công cụ ───────────── */

function Toolbar({
  editor,
  onPickImages,
  canUpload,
}: {
  editor: Editor;
  onPickImages: (files: File[]) => void;
  canUpload: boolean;
}) {
  const s = useEditorState({
    editor,
    selector: ({ editor: e }) => ({
      block: e.isActive("heading", { level: 1 })
        ? "h1"
        : e.isActive("heading", { level: 2 })
          ? "h2"
          : e.isActive("heading", { level: 3 })
            ? "h3"
            : "p",
      fontSize: (e.getAttributes("textStyle").fontSize as string | undefined) ?? "",
      color: (e.getAttributes("textStyle").color as string | undefined) ?? "",
      highlight: (e.getAttributes("highlight").color as string | undefined) ?? "",
      bold: e.isActive("bold"),
      italic: e.isActive("italic"),
      underline: e.isActive("underline"),
      strike: e.isActive("strike"),
      sub: e.isActive("subscript"),
      sup: e.isActive("superscript"),
      link: e.isActive("link"),
      href: (e.getAttributes("link").href as string | undefined) ?? "",
      align: (["center", "right", "justify"].find((a) => e.isActive({ textAlign: a })) ?? "left") as string,
      bullet: e.isActive("bulletList"),
      ordered: e.isActive("orderedList"),
      task: e.isActive("taskList"),
      quote: e.isActive("blockquote"),
      table: e.isActive("table"),
      image: e.isActive("image"),
      imageWidth: (e.getAttributes("image").width as string | undefined) ?? "md",
      imageAlign: (e.getAttributes("image").align as string | undefined) ?? "center",
      canUndo: e.can().undo(),
      canRedo: e.can().redo(),
      canMerge: e.can().mergeCells(),
      canSplit: e.can().splitCell(),
    }),
  });
  const c = () => editor.chain().focus();

  return (
    <div className="sticky top-0 z-10 rounded-t-xl border-b border-rule bg-surface-2/95 backdrop-blur">
      <div role="toolbar" aria-label="Định dạng" className="flex flex-wrap items-center gap-0.5 px-2 py-1.5">
        <Tool label="Hoàn tác (Ctrl+Z)" disabled={!s.canUndo} onClick={() => c().undo().run()}>
          <Svg d="M9 14 4 9l5-5M4 9h10a6 6 0 0 1 0 12h-3" />
        </Tool>
        <Tool label="Làm lại (Ctrl+Y)" disabled={!s.canRedo} onClick={() => c().redo().run()}>
          <Svg d="m15 14 5-5-5-5M20 9H10a6 6 0 0 0 0 12h3" />
        </Tool>
        <Sep />
        <select
          aria-label="Kiểu đoạn"
          value={s.block}
          onChange={(e) => {
            const v = e.target.value;
            if (v === "p") c().setParagraph().run();
            else c().setHeading({ level: Number(v.slice(1)) as 1 | 2 | 3 }).run();
          }}
          className="h-8 rounded-md border border-transparent bg-transparent px-1.5 text-sm text-ink hover:border-rule focus:border-brand focus:outline-none"
        >
          <option value="p">Văn bản</option>
          <option value="h1">Tiêu đề 1</option>
          <option value="h2">Tiêu đề 2</option>
          <option value="h3">Tiêu đề 3</option>
        </select>
        <select
          aria-label="Cỡ chữ"
          value={s.fontSize}
          onChange={(e) => (e.target.value ? c().setFontSize(e.target.value).run() : c().unsetFontSize().run())}
          className="h-8 rounded-md border border-transparent bg-transparent px-1.5 text-sm text-ink hover:border-rule focus:border-brand focus:outline-none"
        >
          {FONT_SIZES.map((f) => (
            <option key={f.label} value={f.value}>
              {f.label}
            </option>
          ))}
        </select>
        <Sep />
        <Tool label="In đậm (Ctrl+B)" active={s.bold} onClick={() => c().toggleBold().run()}>
          <b className="text-[0.95rem]">B</b>
        </Tool>
        <Tool label="In nghiêng (Ctrl+I)" active={s.italic} onClick={() => c().toggleItalic().run()}>
          <i className="font-serif text-[1rem]">I</i>
        </Tool>
        <Tool label="Gạch chân (Ctrl+U)" active={s.underline} onClick={() => c().toggleUnderline().run()}>
          <u className="text-[0.95rem]">U</u>
        </Tool>
        <Tool label="Gạch ngang" active={s.strike} onClick={() => c().toggleStrike().run()}>
          <s className="text-[0.95rem]">S</s>
        </Tool>
        <Popover
          label="Màu chữ"
          trigger={
            <span className="flex flex-col items-center leading-none">
              <span className="text-[0.95rem] font-semibold">A</span>
              <span className="mt-0.5 h-[3px] w-4 rounded-full" style={{ background: s.color || "var(--ink)" }} />
            </span>
          }
        >
          {(close) => (
            <Swatches
              items={TEXT_COLORS}
              current={s.color}
              kind="text"
              onPick={(v) => {
                if (v) c().setColor(v).run();
                else c().unsetColor().run();
                close();
              }}
            />
          )}
        </Popover>
        <Popover
          label="Màu nền chữ (bút dạ quang)"
          trigger={
            <span className="rounded-sm px-1 text-[0.8rem] font-semibold" style={{ background: s.highlight || "var(--hl-yellow)" }}>
              ab
            </span>
          }
        >
          {(close) => (
            <Swatches
              items={HIGHLIGHTS}
              current={s.highlight}
              kind="highlight"
              onPick={(v) => {
                if (v) c().setHighlight({ color: v }).run();
                else c().unsetHighlight().run();
                close();
              }}
            />
          )}
        </Popover>
        <Sep />
        <Popover label="Chèn link (Ctrl+K)" active={s.link} trigger={<Svg d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1" />}>
          {(close) => <LinkForm editor={editor} href={s.href} onDone={close} />}
        </Popover>
        <Popover label="Chèn ảnh" trigger={<Svg d="M4 5h16v14H4zM4 16l5-5 4 4 3-3 4 4M15 9.5h.01" />}>
          {(close) => <ImageMenu editor={editor} canUpload={canUpload} onPickImages={onPickImages} onDone={close} />}
        </Popover>
        <Popover label="Chèn bảng" trigger={<Svg d="M4 5h16v14H4zM4 10h16M4 15h16M10 5v14M15 5v14" />}>
          {(close) => (
            <TableGrid
              onPick={(rows, cols) => {
                c().insertTable({ rows, cols, withHeaderRow: true }).run();
                close();
              }}
            />
          )}
        </Popover>
        <Tool label="Đường kẻ ngang" onClick={() => c().setHorizontalRule().run()}>
          <Svg d="M4 12h16" />
        </Tool>
        <Sep />
        <Popover label="Căn lề" trigger={<AlignIcon align={s.align} />}>
          {(close) => (
            <div className="flex gap-0.5 p-1">
              {(["left", "center", "right", "justify"] as const).map((a) => (
                <Tool
                  key={a}
                  label={{ left: "Căn trái", center: "Căn giữa", right: "Căn phải", justify: "Căn đều" }[a]}
                  active={s.align === a}
                  onClick={() => {
                    c().setTextAlign(a).run();
                    close();
                  }}
                >
                  <AlignIcon align={a} />
                </Tool>
              ))}
            </div>
          )}
        </Popover>
        <Tool label="Danh sách chấm" active={s.bullet} onClick={() => c().toggleBulletList().run()}>
          <Svg d="M9 6h11M9 12h11M9 18h11" dots />
        </Tool>
        <Tool label="Danh sách số" active={s.ordered} onClick={() => c().toggleOrderedList().run()}>
          <span className="text-[0.75rem] font-semibold tabular-nums">1.</span>
        </Tool>
        <Tool label="Danh sách việc cần làm" active={s.task} onClick={() => c().toggleTaskList().run()}>
          <Svg d="M4 5h5v5H4zM5.5 7.5l1 1 2-2M12 7.5h8M4 14h5v5H4zM12 16.5h8" />
        </Tool>
        <Tool label="Trích dẫn" active={s.quote} onClick={() => c().toggleBlockquote().run()}>
          <span className="font-serif text-lg leading-none">“</span>
        </Tool>
        <Sep />
        <Tool label="Chỉ số dưới" active={s.sub} onClick={() => c().toggleSubscript().run()}>
          <span className="text-[0.8rem]">
            x<sub>2</sub>
          </span>
        </Tool>
        <Tool label="Chỉ số trên" active={s.sup} onClick={() => c().toggleSuperscript().run()}>
          <span className="text-[0.8rem]">
            x<sup>2</sup>
          </span>
        </Tool>
        <Tool label="Xóa định dạng" onClick={() => c().unsetAllMarks().clearNodes().run()}>
          <Svg d="M6 5h11M10 5 7 19M4 19h6M15 13l5 5M20 13l-5 5" />
        </Tool>
      </div>

      {s.table && (
        <div className="flex flex-wrap items-center gap-1 border-t border-rule px-2 py-1.5 text-xs">
          <span className="mr-1 font-medium text-muted">Bảng</span>
          <Chip onClick={() => c().addRowBefore().run()}>+ Hàng trên</Chip>
          <Chip onClick={() => c().addRowAfter().run()}>+ Hàng dưới</Chip>
          <Chip onClick={() => c().addColumnBefore().run()}>+ Cột trái</Chip>
          <Chip onClick={() => c().addColumnAfter().run()}>+ Cột phải</Chip>
          <Chip onClick={() => c().deleteRow().run()}>Xóa hàng</Chip>
          <Chip onClick={() => c().deleteColumn().run()}>Xóa cột</Chip>
          <Chip disabled={!s.canMerge} onClick={() => c().mergeCells().run()}>
            Gộp ô
          </Chip>
          <Chip disabled={!s.canSplit} onClick={() => c().splitCell().run()}>
            Tách ô
          </Chip>
          <Chip onClick={() => c().toggleHeaderRow().run()}>Hàng tiêu đề</Chip>
          <Chip danger onClick={() => c().deleteTable().run()}>
            Xóa bảng
          </Chip>
          <span className="ml-auto hidden text-muted xl:inline">Kéo mép cột để đổi độ rộng; chọn nhiều ô để gộp.</span>
        </div>
      )}

      {s.image && (
        <div className="flex flex-wrap items-center gap-1 border-t border-rule px-2 py-1.5 text-xs">
          <span className="mr-1 font-medium text-muted">Ảnh</span>
          {(
            [
              ["sm", "Nhỏ"],
              ["md", "Vừa"],
              ["full", "Toàn khổ"],
            ] as const
          ).map(([v, l]) => (
            <Chip key={v} active={s.imageWidth === v} onClick={() => c().updateAttributes("image", { width: v }).run()}>
              {l}
            </Chip>
          ))}
          <span className="mx-1 h-4 w-px bg-rule" />
          {(
            [
              ["left", "Trái"],
              ["center", "Giữa"],
              ["right", "Phải"],
            ] as const
          ).map(([v, l]) => (
            <Chip key={v} active={s.imageAlign === v} onClick={() => c().updateAttributes("image", { align: v }).run()}>
              {l}
            </Chip>
          ))}
          <Chip danger onClick={() => c().deleteSelection().run()}>
            Xóa ảnh
          </Chip>
        </div>
      )}
    </div>
  );
}

/* ───────────── các mảnh nhỏ ───────────── */

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

function Chip({
  children,
  onClick,
  active,
  danger,
  disabled,
}: {
  children: ReactNode;
  onClick: () => void;
  active?: boolean;
  danger?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className={`rounded-md border px-2 py-1 transition disabled:opacity-40 ${
        active
          ? "border-brand bg-brand-soft text-brand"
          : danger
            ? "border-transparent text-danger hover:bg-danger-soft"
            : "border-rule bg-surface text-ink-soft hover:text-ink"
      }`}
    >
      {children}
    </button>
  );
}

const Sep = () => <span className="mx-1 h-5 w-px bg-rule" aria-hidden />;

function Svg({ d, dots }: { d: string; dots?: boolean }) {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d={d} />
      {dots && (
        <>
          <circle cx="4.5" cy="6" r="1" fill="currentColor" />
          <circle cx="4.5" cy="12" r="1" fill="currentColor" />
          <circle cx="4.5" cy="18" r="1" fill="currentColor" />
        </>
      )}
    </svg>
  );
}

function AlignIcon({ align }: { align: string }) {
  const d = {
    left: "M4 6h16M4 10h10M4 14h16M4 18h10",
    center: "M4 6h16M7 10h10M4 14h16M7 18h10",
    right: "M4 6h16M10 10h10M4 14h16M10 18h10",
    justify: "M4 6h16M4 10h16M4 14h16M4 18h16",
  }[align] ?? "M4 6h16M4 10h10M4 14h16M4 18h10";
  return <Svg d={d} />;
}

function Popover({
  label,
  trigger,
  active,
  children,
}: {
  label: string;
  trigger: ReactNode;
  active?: boolean;
  children: (close: () => void) => ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);
  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        title={label}
        aria-label={label}
        aria-expanded={open}
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => setOpen((v) => !v)}
        className={`grid h-8 min-w-8 place-items-center rounded-md px-1.5 text-ink-soft transition hover:bg-surface hover:text-ink ${
          active || open ? "bg-brand-soft text-brand" : ""
        }`}
      >
        {trigger}
      </button>
      {open && (
        <div className="absolute left-0 top-full z-30 mt-1 min-w-max rounded-xl border border-rule bg-surface p-1 shadow-card">
          {children(() => setOpen(false))}
        </div>
      )}
    </div>
  );
}

function Swatches({
  items,
  current,
  kind,
  onPick,
}: {
  items: { label: string; value: string }[];
  current: string;
  kind: "text" | "highlight";
  onPick: (v: string | null) => void;
}) {
  return (
    <div className="w-52 p-2">
      <div className="grid grid-cols-6 gap-1.5">
        {items.map((it) => (
          <button
            key={it.value}
            type="button"
            title={it.label}
            aria-label={it.label}
            aria-pressed={current === it.value}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => onPick(it.value)}
            className={`grid h-7 w-7 place-items-center rounded-md border text-[0.8rem] font-semibold ${
              current === it.value ? "border-brand ring-2 ring-brand/30" : "border-rule"
            }`}
            style={kind === "text" ? { color: it.value } : { background: it.value, color: "var(--ink)" }}
          >
            A
          </button>
        ))}
      </div>
      <button
        type="button"
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => onPick(null)}
        className="mt-2 w-full rounded-md px-2 py-1.5 text-left text-xs text-ink-soft hover:bg-surface-2"
      >
        {kind === "text" ? "Màu mặc định" : "Bỏ màu nền"}
      </button>
    </div>
  );
}

function LinkForm({ editor, href, onDone }: { editor: Editor; href: string; onDone: () => void }) {
  const [url, setUrl] = useState(href);
  return (
    <form
      className="flex w-80 gap-1.5 p-1.5"
      onSubmit={(e) => {
        e.preventDefault();
        const v = url.trim();
        if (!v) editor.chain().focus().extendMarkRange("link").unsetLink().run();
        else {
          const full = /^(https?:|mailto:)/i.test(v) ? v : `https://${v}`;
          if (editor.state.selection.empty && !href)
            editor.chain().focus().insertContent({ type: "text", text: v, marks: [{ type: "link", attrs: { href: full } }] }).run();
          else editor.chain().focus().extendMarkRange("link").setLink({ href: full }).run();
        }
        onDone();
      }}
    >
      <input
        autoFocus
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder="Dán link, vd youtube.com/…"
        aria-label="Địa chỉ link"
        className="min-w-0 flex-1 rounded-md border border-rule bg-surface px-2 py-1.5 text-sm focus:border-brand focus:outline-none"
      />
      <button type="submit" className="rounded-md bg-brand px-2.5 text-sm font-medium text-brand-ink">
        {url.trim() ? "Lưu" : "Bỏ link"}
      </button>
    </form>
  );
}

function ImageMenu({
  editor,
  canUpload,
  onPickImages,
  onDone,
}: {
  editor: Editor;
  canUpload: boolean;
  onPickImages: (files: File[]) => void;
  onDone: () => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [url, setUrl] = useState("");
  return (
    <div className="w-80 space-y-1 p-1.5">
      {canUpload && (
        <>
          <button
            type="button"
            onClick={() => input.current?.click()}
            className="w-full rounded-md px-2 py-2 text-left text-sm hover:bg-surface-2"
          >
            Tải ảnh lên từ máy
            <span className="block text-xs text-muted">Ảnh lớn được tự thu nhỏ trước khi lưu</span>
          </button>
          <input
            ref={input}
            type="file"
            accept="image/*"
            multiple
            className="sr-only"
            tabIndex={-1}
            onChange={(e) => {
              const files = Array.from(e.target.files ?? []);
              e.target.value = "";
              if (files.length) onPickImages(files);
              onDone();
            }}
          />
        </>
      )}
      <form
        className="flex gap-1.5 border-t border-rule pt-1.5"
        onSubmit={(e) => {
          e.preventDefault();
          if (!/^https?:\/\//i.test(url.trim())) return;
          editor.chain().focus().setImage({ src: url.trim() }).run();
          onDone();
        }}
      >
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="Hoặc dán link ảnh https://…"
          aria-label="Link ảnh"
          className="min-w-0 flex-1 rounded-md border border-rule bg-surface px-2 py-1.5 text-sm focus:border-brand focus:outline-none"
        />
        <button type="submit" className="rounded-md bg-brand px-2.5 text-sm font-medium text-brand-ink">
          Chèn
        </button>
      </form>
    </div>
  );
}

function TableGrid({ onPick }: { onPick: (rows: number, cols: number) => void }) {
  const [hover, setHover] = useState<[number, number]>([0, 0]);
  const R = 8;
  const C = 8;
  return (
    <div className="p-2" onMouseLeave={() => setHover([0, 0])}>
      <div className="grid gap-[3px]" style={{ gridTemplateColumns: `repeat(${C}, 1.1rem)` }}>
        {Array.from({ length: R * C }, (_, i) => {
          const r = Math.floor(i / C) + 1;
          const col = (i % C) + 1;
          const on = r <= hover[0] && col <= hover[1];
          return (
            <button
              key={i}
              type="button"
              aria-label={`Bảng ${r} hàng ${col} cột`}
              onMouseEnter={() => setHover([r, col])}
              onFocus={() => setHover([r, col])}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => onPick(r, col)}
              className={`h-[1.1rem] w-[1.1rem] rounded-[3px] border ${on ? "border-brand bg-brand-soft" : "border-rule bg-surface"}`}
            />
          );
        })}
      </div>
      <div className="mt-2 text-center text-xs text-muted tabular-nums">
        {hover[0] ? `${hover[0]} hàng × ${hover[1]} cột` : "Chọn kích thước bảng"}
      </div>
    </div>
  );
}
