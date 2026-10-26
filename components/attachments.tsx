"use client";

import { useEffect, useRef, useState } from "react";
import { ACCEPT, getFile, MAX_FILE_BYTES } from "@/lib/file-store";
import { dateShort, time } from "@/lib/format";
import { useStore } from "@/lib/store";
import type { Attachment, AttachmentOwner } from "@/lib/types";
import { IconTrash } from "./icons";

/* ───────────── tiện ích ───────────── */

export function fileSize(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${Math.round(n / 1024)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}

type Kind = "pdf" | "audio" | "image" | "video" | "doc" | "slide" | "sheet" | "file";

function kindOf(mime: string, name: string): Kind {
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  if (mime === "application/pdf" || ext === "pdf") return "pdf";
  if (mime.startsWith("audio/")) return "audio";
  if (mime.startsWith("image/")) return "image";
  if (mime.startsWith("video/")) return "video";
  if (["doc", "docx", "txt"].includes(ext)) return "doc";
  if (["ppt", "pptx"].includes(ext)) return "slide";
  if (["xls", "xlsx", "csv"].includes(ext)) return "sheet";
  return "file";
}

const KIND_LABEL: Record<Kind, string> = {
  pdf: "PDF",
  audio: "Âm thanh",
  image: "Ảnh",
  video: "Video",
  doc: "Văn bản",
  slide: "Slide",
  sheet: "Bảng tính",
  file: "Tệp",
};

const KIND_STYLE: Record<Kind, string> = {
  pdf: "bg-danger-soft text-danger",
  audio: "bg-t11-soft text-t11",
  image: "bg-t12-soft text-t12",
  video: "bg-tg-soft text-tg",
  doc: "bg-brand-soft text-brand",
  slide: "bg-late-soft text-late",
  sheet: "bg-ok-soft text-ok",
  file: "bg-surface-2 text-ink-soft",
};

function KindChip({ kind }: { kind: Kind }) {
  const short = { pdf: "PDF", audio: "AUD", image: "IMG", video: "VID", doc: "DOC", slide: "PPT", sheet: "XLS", file: "FILE" }[kind];
  return (
    <span
      className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg text-[0.65rem] font-bold tracking-wide ${KIND_STYLE[kind]}`}
      aria-hidden
    >
      {short}
    </span>
  );
}

export function useAttachments(ownerType: AttachmentOwner, ownerId: string) {
  const { data } = useStore();
  return data.attachments.filter((a) => a.ownerType === ownerType && a.ownerId === ownerId);
}

/* ───────────── danh sách file ───────────── */

export function AttachmentList({
  items,
  canRemove = false,
  empty,
}: {
  items: Attachment[];
  canRemove?: boolean;
  empty?: string;
}) {
  if (!items.length) return empty ? <p className="text-sm text-muted">{empty}</p> : null;
  return (
    <ul className="divide-y divide-rule overflow-hidden rounded-xl border border-rule bg-surface">
      {items.map((a) => (
        <AttachmentRow key={a.id} a={a} canRemove={canRemove} />
      ))}
    </ul>
  );
}

function AttachmentRow({ a, canRemove }: { a: Attachment; canRemove: boolean }) {
  const { data, removeAttachment } = useStore();
  const kind = kindOf(a.mime, a.name);
  const [url, setUrl] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [msg, setMsg] = useState("");
  const [confirming, setConfirming] = useState(false);
  const uploader =
    data.teachers.find((t) => t.id === a.uploaderId)?.fullName ??
    data.students.find((s) => s.id === a.uploaderId)?.fullName ??
    "Quản trị";

  useEffect(() => () => {
    if (url) URL.revokeObjectURL(url);
  }, [url]);

  const load = async () => {
    if (url) return url;
    if (a.sample) {
      setMsg("Đây là tệp mẫu của bản demo nên chưa có nội dung. Hãy thử tải file của bạn lên.");
      return null;
    }
    const blob = await getFile(a.id);
    if (!blob) {
      setMsg("Không tìm thấy nội dung file trên trình duyệt này.");
      return null;
    }
    const u = URL.createObjectURL(blob);
    setUrl(u);
    return u;
  };

  const onOpen = async () => {
    const u = await load();
    if (!u) return;
    if (kind === "audio" || kind === "image" || kind === "video") setOpen((v) => !v);
    else if (kind === "pdf") window.open(u, "_blank", "noopener");
    else {
      const link = document.createElement("a");
      link.href = u;
      link.download = a.name;
      link.click();
    }
  };

  const inline = kind === "audio" || kind === "image" || kind === "video";

  return (
    <li className="px-3 py-2.5 sm:px-4">
      <div className="flex items-center gap-3">
        <KindChip kind={kind} />
        <button type="button" onClick={onOpen} className="min-w-0 flex-1 text-left">
          <span className="block truncate text-sm font-medium text-ink hover:text-brand">{a.name}</span>
          <span className="block truncate text-xs text-muted">
            {KIND_LABEL[kind]}, {fileSize(a.size)}. {uploader}, {time(a.uploadedAt)} {dateShort(a.uploadedAt)}
          </span>
        </button>
        <button
          type="button"
          onClick={onOpen}
          className="hidden rounded-md px-2 py-1 text-xs font-medium text-brand hover:bg-brand-soft sm:block"
        >
          {inline ? (open ? "Thu gọn" : kind === "audio" ? "Nghe" : "Xem") : kind === "pdf" ? "Mở" : "Tải về"}
        </button>
        {canRemove &&
          (confirming ? (
            <span className="flex items-center gap-1 text-xs">
              <button type="button" onClick={() => removeAttachment(a.id)} className="rounded-md px-2 py-1 font-medium text-danger hover:bg-danger-soft">
                Xóa
              </button>
              <button type="button" onClick={() => setConfirming(false)} className="rounded-md px-2 py-1 text-muted hover:bg-surface-2">
                Hủy
              </button>
            </span>
          ) : (
            <button
              type="button"
              onClick={() => setConfirming(true)}
              className="grid h-8 w-8 place-items-center rounded-md text-muted hover:bg-danger-soft hover:text-danger"
              aria-label={`Xóa ${a.name}`}
            >
              <IconTrash size={15} />
            </button>
          ))}
      </div>
      {msg && <p className="mt-2 pl-12 text-xs text-muted">{msg}</p>}
      {open && url && (
        <div className="mt-2.5 pl-12">
          {kind === "audio" && <audio controls src={url} className="w-full max-w-md" />}
          {kind === "image" && (
            // eslint-disable-next-line @next/next/no-img-element -- blob URL
            <img src={url} alt={a.name} className="max-h-96 rounded-lg border border-rule" />
          )}
          {kind === "video" && <video controls src={url} className="max-h-96 w-full max-w-xl rounded-lg" />}
        </div>
      )}
    </li>
  );
}

/* ───────────── chọn / kéo thả file ───────────── */

export function FileDrop({
  onFiles,
  hint = "PDF, Word, slide, ảnh, ghi âm, tối đa 25 MB mỗi file",
  label = "Kéo thả file vào đây hoặc chọn file",
  busy,
}: {
  onFiles: (files: File[]) => void;
  hint?: string;
  label?: string;
  busy?: boolean;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);
  const [error, setError] = useState("");

  const accept = (list: FileList | null) => {
    if (!list?.length) return;
    const files = Array.from(list);
    const tooBig = files.filter((f) => f.size > MAX_FILE_BYTES);
    setError(tooBig.length ? `${tooBig.map((f) => f.name).join(", ")} lớn hơn 25 MB nên chưa được tải lên.` : "");
    const ok = files.filter((f) => f.size <= MAX_FILE_BYTES);
    if (ok.length) onFiles(ok);
  };

  return (
    <div>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setOver(false);
          accept(e.dataTransfer.files);
        }}
        className={`flex flex-wrap items-center gap-3 rounded-xl border border-dashed px-4 py-3.5 text-sm transition ${
          over ? "border-brand bg-brand-soft" : "border-rule bg-surface-2"
        }`}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="text-muted" aria-hidden>
          <path d="M12 16V4M7 9l5-5 5 5" />
          <path d="M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3" />
        </svg>
        <div className="min-w-0 flex-1">
          <div className="text-ink">{busy ? "Đang tải lên…" : label}</div>
          <div className="text-xs text-muted">{hint}</div>
        </div>
        <button
          type="button"
          disabled={busy}
          onClick={() => input.current?.click()}
          className="rounded-lg border border-rule bg-surface px-3 py-1.5 text-sm font-medium hover:bg-surface-2 disabled:opacity-50"
        >
          Chọn file
        </button>
        <input
          ref={input}
          type="file"
          multiple
          accept={ACCEPT}
          className="sr-only"
          tabIndex={-1}
          onChange={(e) => {
            accept(e.target.files);
            e.target.value = "";
          }}
        />
      </div>
      {error && (
        <p role="alert" className="mt-1.5 text-xs text-danger">
          {error}
        </p>
      )}
    </div>
  );
}

/** Kéo thả và tải ngay lên (giáo viên đăng tài liệu) */
export function UploadArea({ ownerType, ownerId, label }: { ownerType: AttachmentOwner; ownerId: string; label?: string }) {
  const { addAttachment } = useStore();
  const [busy, setBusy] = useState(false);
  return (
    <FileDrop
      label={label}
      busy={busy}
      onFiles={async (files) => {
        setBusy(true);
        try {
          for (const f of files) await addAttachment(ownerType, ownerId, f, f.name);
        } finally {
          setBusy(false);
        }
      }}
    />
  );
}

/* ───────────── ghi âm (bài nói) ───────────── */

export function AudioRecorder({ onRecorded }: { onRecorded: (blob: Blob) => void }) {
  const [state, setState] = useState<"idle" | "recording" | "denied">("idle");
  const [seconds, setSeconds] = useState(0);
  const rec = useRef<MediaRecorder | null>(null);
  const timer = useRef<number | null>(null);

  useEffect(
    () => () => {
      if (timer.current) window.clearInterval(timer.current);
      rec.current?.stream.getTracks().forEach((t) => t.stop());
    },
    [],
  );

  const start = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const r = new MediaRecorder(stream);
      const chunks: Blob[] = [];
      r.ondataavailable = (e) => chunks.push(e.data);
      r.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        onRecorded(new Blob(chunks, { type: r.mimeType || "audio/webm" }));
      };
      r.start();
      rec.current = r;
      setSeconds(0);
      setState("recording");
      timer.current = window.setInterval(() => setSeconds((s) => s + 1), 1000);
    } catch {
      setState("denied");
    }
  };

  const stop = () => {
    rec.current?.stop();
    if (timer.current) window.clearInterval(timer.current);
    setState("idle");
  };

  const mm = `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;

  return (
    <div className="flex flex-wrap items-center gap-3">
      {state === "recording" ? (
        <button
          type="button"
          onClick={stop}
          className="inline-flex items-center gap-2 rounded-lg bg-danger px-3 py-1.5 text-sm font-medium text-surface"
        >
          <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-surface" aria-hidden /> Dừng ghi âm {mm}
        </button>
      ) : (
        <button
          type="button"
          onClick={start}
          className="inline-flex items-center gap-2 rounded-lg border border-rule bg-surface px-3 py-1.5 text-sm font-medium hover:bg-surface-2"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden>
            <rect x="9" y="3" width="6" height="11" rx="3" />
            <path d="M5 11a7 7 0 0 0 14 0M12 18v3" />
          </svg>
          Ghi âm
        </button>
      )}
      {state === "denied" && (
        <span className="text-xs text-danger">Trình duyệt chưa cho dùng micro. Cho phép micro rồi thử lại, hoặc tải file ghi âm lên.</span>
      )}
    </div>
  );
}

/* ───────────── file chờ nộp (học viên) ───────────── */

export interface PendingFile {
  key: string;
  blob: Blob;
  name: string;
}

export function PendingList({ files, onRemove }: { files: PendingFile[]; onRemove: (key: string) => void }) {
  if (!files.length) return null;
  return (
    <ul className="space-y-2">
      {files.map((f) => (
        <PendingRow key={f.key} f={f} onRemove={() => onRemove(f.key)} />
      ))}
    </ul>
  );
}

function PendingRow({ f, onRemove }: { f: PendingFile; onRemove: () => void }) {
  const kind = kindOf(f.blob.type, f.name);
  const [url] = useState(() => (kind === "audio" ? URL.createObjectURL(f.blob) : null));
  useEffect(() => () => {
    if (url) URL.revokeObjectURL(url);
  }, [url]);
  return (
    <li className="rounded-lg border border-rule bg-surface px-3 py-2">
      <div className="flex items-center gap-3">
        <KindChip kind={kind} />
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-medium">{f.name}</div>
          <div className="text-xs text-muted">{fileSize(f.blob.size)}, chưa nộp</div>
        </div>
        <button
          type="button"
          onClick={onRemove}
          className="grid h-8 w-8 place-items-center rounded-md text-muted hover:bg-danger-soft hover:text-danger"
          aria-label={`Bỏ ${f.name}`}
        >
          <IconTrash size={15} />
        </button>
      </div>
      {url && <audio controls src={url} className="mt-2 w-full max-w-md" />}
    </li>
  );
}
