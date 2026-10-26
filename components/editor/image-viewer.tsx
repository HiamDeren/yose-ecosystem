"use client";

import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";

/**
 * Xem ảnh phóng to khi double-click ảnh trong note.
 * Dùng chung cho chế độ soạn và chế độ xem: NoteImage phát sự kiện
 * "yose:view-image" kèm phần tử <img>, viewer gom mọi ảnh cùng note để chuyển qua lại.
 */

export function openImageViewer(img: HTMLImageElement) {
  window.dispatchEvent(new CustomEvent("yose:view-image", { detail: img }));
}

interface Shot {
  src: string;
  alt: string;
}

export function ImageViewerHost() {
  const [shots, setShots] = useState<Shot[]>([]);
  const [i, setI] = useState(0);
  const open = shots.length > 0;

  useEffect(() => {
    const onOpen = (e: Event) => {
      const img = (e as CustomEvent<HTMLImageElement>).detail;
      const root = img.closest(".prose-note") ?? document;
      const all = Array.from(root.querySelectorAll<HTMLImageElement>(".note-image img"));
      const list = all.map((x) => ({ src: x.currentSrc || x.src, alt: x.alt }));
      setShots(list.length ? list : [{ src: img.src, alt: img.alt }]);
      setI(Math.max(0, all.indexOf(img)));
    };
    window.addEventListener("yose:view-image", onOpen);
    return () => window.removeEventListener("yose:view-image", onOpen);
  }, []);

  const close = useCallback(() => setShots([]), []);
  const step = useCallback((d: number) => setI((x) => (x + d + shots.length) % shots.length), [shots.length]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      if (e.key === "ArrowRight") step(1);
      if (e.key === "ArrowLeft") step(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, close, step]);

  if (!open) return null;
  const shot = shots[i];

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Xem ảnh"
      className="fixed inset-0 z-[60] flex flex-col bg-[rgb(8_10_18/0.92)] text-[#e7ebf6]"
      onClick={close}
    >
      <div className="flex items-center gap-3 px-4 py-3 text-sm" onClick={(e) => e.stopPropagation()}>
        <span className="min-w-0 flex-1 truncate">{shot.alt || "Ảnh"}</span>
        {shots.length > 1 && (
          <span className="tabular-nums text-[#b9c1d9]">
            {i + 1}/{shots.length}
          </span>
        )}
        <a
          href={shot.src}
          target="_blank"
          rel="noreferrer"
          className="rounded-md px-2.5 py-1.5 hover:bg-white/10"
          onClick={(e) => e.stopPropagation()}
        >
          Mở ảnh gốc
        </a>
        <button type="button" onClick={close} className="rounded-md px-2.5 py-1.5 hover:bg-white/10" autoFocus>
          Đóng
        </button>
      </div>
      <div className="relative flex min-h-0 flex-1 items-center justify-center px-4 pb-6 sm:px-16">
        {/* eslint-disable-next-line @next/next/no-img-element -- ảnh người dùng tải lên */}
        <img
          src={shot.src}
          alt={shot.alt}
          className="max-h-full max-w-full rounded-lg object-contain shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        />
        {shots.length > 1 && (
          <>
            <Nav side="left" onClick={() => step(-1)} />
            <Nav side="right" onClick={() => step(1)} />
          </>
        )}
      </div>
    </div>,
    document.body,
  );
}

function Nav({ side, onClick }: { side: "left" | "right"; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-label={side === "left" ? "Ảnh trước" : "Ảnh sau"}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className={`absolute top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-white/10 hover:bg-white/20 ${
        side === "left" ? "left-3" : "right-3"
      }`}
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
        <path d={side === "left" ? "m15 6-6 6 6 6" : "m9 6 6 6-6 6"} />
      </svg>
    </button>
  );
}
