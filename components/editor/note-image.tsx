"use client";

import Image from "@tiptap/extension-image";
import { NodeViewWrapper, ReactNodeViewRenderer, type ReactNodeViewProps } from "@tiptap/react";
import { useEffect, useState } from "react";
import { getFile } from "@/lib/file-store";
import { openImageViewer } from "./image-viewer";

/**
 * Ảnh trong note. Ảnh tải lên được lưu như một file đính kèm (`fileId`), không nhét base64
 * vào nội dung note. Demo: đọc từ IndexedDB. Production: đổi `resolveFile` sang xin
 * presigned GET URL của S3.
 */

export type ImageWidth = "sm" | "md" | "full";
export type ImageAlign = "left" | "center" | "right";

const cache = new Map<string, string>();

async function resolveFile(fileId: string) {
  if (cache.has(fileId)) return cache.get(fileId)!;
  const blob = await getFile(fileId);
  if (!blob) return null;
  const url = URL.createObjectURL(blob);
  cache.set(fileId, url);
  return url;
}

function ImageView({ node, selected, editor }: ReactNodeViewProps) {
  const { src, alt, fileId, width, align } = node.attrs as {
    src?: string;
    alt?: string;
    fileId?: string;
    width: ImageWidth;
    align: ImageAlign;
  };
  const [url, setUrl] = useState<string | null>(src || (fileId ? cache.get(fileId) ?? null : null));
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    if (src || !fileId) return;
    let alive = true;
    resolveFile(fileId).then((u) => {
      if (!alive) return;
      if (u) setUrl(u);
      else setMissing(true);
    });
    return () => {
      alive = false;
    };
  }, [src, fileId]);

  return (
    <NodeViewWrapper
      className="note-image"
      data-width={width}
      data-align={align}
      data-selected={selected && editor.isEditable ? "true" : undefined}
    >
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element -- ảnh do người dùng tải lên (blob/S3)
        <img
          src={url}
          alt={alt ?? ""}
          draggable={false}
          title="Nhấp đúp để xem lớn"
          onDoubleClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            openImageViewer(e.currentTarget);
          }}
        />
      ) : (
        <span className="note-image-placeholder">{missing ? "Không tìm thấy ảnh trên trình duyệt này" : "Đang tải ảnh…"}</span>
      )}
    </NodeViewWrapper>
  );
}

export const NoteImage = Image.extend({
  draggable: true,
  // Ảnh tải lên không có src (chỉ có data-file-id), nên phải nhận cả hai dạng
  parseHTML() {
    return [{ tag: "img[data-file-id]" }, { tag: 'img[src]:not([src^="data:"])' }];
  },
  addAttributes() {
    return {
      ...this.parent?.(),
      fileId: {
        default: null,
        parseHTML: (el) => el.getAttribute("data-file-id"),
        renderHTML: (a) => (a.fileId ? { "data-file-id": a.fileId } : {}),
      },
      width: {
        default: "md",
        parseHTML: (el) => el.getAttribute("data-width") ?? "md",
        renderHTML: (a) => ({ "data-width": a.width }),
      },
      align: {
        default: "center",
        parseHTML: (el) => el.getAttribute("data-align") ?? "center",
        renderHTML: (a) => ({ "data-align": a.align }),
      },
    };
  },
  addNodeView() {
    return ReactNodeViewRenderer(ImageView);
  },
}).configure({ inline: false, allowBase64: false });

/** Thu nhỏ ảnh lớn trước khi lưu: cạnh dài tối đa 1600px, WebP chất lượng 0.85 */
export async function shrinkImage(file: File): Promise<Blob> {
  if (!file.type.startsWith("image/") || file.type === "image/gif" || file.type === "image/svg+xml") return file;
  const bitmap = await createImageBitmap(file).catch(() => null);
  if (!bitmap) return file;
  const max = 1600;
  const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
  if (scale === 1 && file.size < 900_000) return file;
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  const out = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/webp", 0.85));
  return out && out.size < file.size ? out : file;
}
