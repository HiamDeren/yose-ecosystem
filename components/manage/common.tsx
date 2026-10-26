"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, type ReactNode } from "react";
import { useStore } from "@/lib/store";
import { IconSearch, IconX } from "../icons";
import { Empty } from "../ui";

/* ───────────── khung trang Quản lý + sub-tab ───────────── */

export function ManageShell({ children }: { children: ReactNode }) {
  const { data, account } = useStore();
  const pathname = usePathname();
  if (account?.role !== "admin") return <Empty>Trang này chỉ dành cho quản trị viên.</Empty>;

  const tabs = [
    { href: "/admin/manage/classes", label: "Lớp học", count: data.classes.length },
    { href: "/admin/manage/students", label: "Học viên", count: data.students.length },
    { href: "/admin/manage/teachers", label: "Giáo viên", count: data.teachers.length },
  ];

  return (
    <>
      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-[1.75rem]">Quản lý</h1>
        <p className="mt-1.5 text-sm text-muted">
          Thiết lập lớp, danh sách học viên và giáo viên. Xếp học viên vào lớp ở tab Lớp học hoặc Học viên.
        </p>
      </header>
      <nav aria-label="Quản lý" className="mb-6 flex gap-1 overflow-x-auto border-b border-rule">
        {tabs.map((t) => {
          const active = pathname.startsWith(t.href);
          return (
            <Link
              key={t.href}
              href={t.href}
              aria-current={active ? "page" : undefined}
              className={`-mb-px flex shrink-0 items-center gap-2 border-b-2 px-3 py-2.5 text-sm transition ${
                active ? "border-brand font-semibold text-ink" : "border-transparent text-muted hover:text-ink"
              }`}
            >
              {t.label}
              <span className="rounded-full bg-surface-2 px-1.5 text-xs tabular-nums text-muted">{t.count}</span>
            </Link>
          );
        })}
      </nav>
      {children}
    </>
  );
}

/* ───────────── ?id= mở panel chi tiết ───────────── */

export function useSelected() {
  const search = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const id = search.get("id");
  const select = (next: string | null) => {
    const q = new URLSearchParams(search.toString());
    if (next) q.set("id", next);
    else q.delete("id");
    const qs = q.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };
  return [id, select] as const;
}

/* ───────────── panel trượt từ phải ───────────── */

export function Sheet({
  open,
  title,
  subtitle,
  onClose,
  children,
}: {
  open: boolean;
  title: ReactNode;
  subtitle?: ReactNode;
  onClose: () => void;
  children: ReactNode;
}) {
  const panel = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    panel.current?.focus();
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true" aria-label={typeof title === "string" ? title : undefined}>
      <button type="button" aria-label="Đóng" onClick={onClose} className="absolute inset-0 bg-ink/30 backdrop-blur-[1px]" />
      <div
        ref={panel}
        tabIndex={-1}
        className="relative flex h-full w-full max-w-xl flex-col border-l border-rule bg-paper shadow-2xl outline-none"
      >
        <div className="flex items-start gap-3 border-b border-rule bg-surface px-5 py-4">
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-lg font-semibold tracking-tight">{title}</h2>
            {subtitle && <div className="mt-0.5 text-sm text-muted">{subtitle}</div>}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-muted hover:bg-surface-2 hover:text-ink"
            aria-label="Đóng"
          >
            <IconX />
          </button>
        </div>
        <div className="flex-1 space-y-8 overflow-y-auto px-5 py-5">{children}</div>
      </div>
    </div>
  );
}

/* ───────────── thanh công cụ ───────────── */

export function SearchBox({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <label className="relative block w-full sm:w-72">
      <span className="sr-only">{placeholder}</span>
      <IconSearch size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-rule bg-surface py-2 pl-9 pr-3 text-sm text-ink placeholder:text-muted focus:border-brand focus:outline-none"
      />
    </label>
  );
}

export function FilterChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`whitespace-nowrap rounded-full border px-3 py-1 text-sm transition ${
        active ? "border-brand bg-brand-soft text-brand" : "border-rule bg-surface text-ink-soft hover:bg-surface-2"
      }`}
    >
      {children}
    </button>
  );
}

export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-muted">{hint}</span>}
    </label>
  );
}

export function ErrorText({ children }: { children: ReactNode }) {
  if (!children) return null;
  return (
    <p role="alert" className="rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">
      {children}
    </p>
  );
}

export function CapacityBar({ used, cap }: { used: number; cap: number }) {
  const full = used >= cap;
  return (
    <span className="inline-flex items-center gap-2">
      <span className={`tabular-nums ${full ? "font-semibold text-ink" : ""}`}>
        {used}
        <span className="text-muted">/{cap}</span>
      </span>
      {cap > 2 && (
        <span className="hidden h-1.5 w-14 overflow-hidden rounded-full bg-surface-2 sm:block" aria-hidden>
          <span className={`block h-full ${full ? "bg-late" : "bg-brand"}`} style={{ width: `${(used / cap) * 100}%` }} />
        </span>
      )}
    </span>
  );
}
