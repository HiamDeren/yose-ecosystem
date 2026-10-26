"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { useStore } from "@/lib/store";
import { awaitingReview, classesForAccount, homeworkForStudent } from "@/lib/selectors";
import type { Account, Role } from "@/lib/types";
import {
  IconBook,
  IconHome,
  IconLayers,
  IconLogout,
  IconMoon,
  IconSun,
  IconTasks,
  IconUsers,
  IconWallet,
} from "./icons";
import { Avatar } from "./ui";

interface NavItem {
  href: string;
  label: string;
  icon: (p: { size?: number }) => ReactNode;
  badge?: number;
}

const ROLE_LABEL: Record<Role, string> = {
  student: "Học viên",
  teacher: "Giáo viên",
  admin: "Quản trị",
};

function useNav(account: Account): NavItem[] {
  const { data } = useStore();
  if (account.role === "student") {
    const pending = homeworkForStudent(data, account.profileId!).filter(
      (i) => i.state === "todo" || i.state === "overdue",
    ).length;
    return [
      { href: "/", label: "Lớp của tôi", icon: IconBook },
      { href: "/homework", label: "Bài tập", icon: IconTasks, badge: pending },
    ];
  }
  if (account.role === "teacher") {
    const ids = classesForAccount(data, account).map((c) => c.id);
    return [
      { href: "/", label: "Lớp đang dạy", icon: IconBook },
      { href: "/homework", label: "Chờ chấm", icon: IconTasks, badge: awaitingReview(data, ids).length },
    ];
  }
  return [
    { href: "/", label: "Tổng quan", icon: IconHome },
    { href: "/admin/students", label: "Học viên", icon: IconUsers },
    { href: "/admin/classes", label: "Lớp học", icon: IconLayers },
    { href: "/admin/teachers", label: "Giáo viên & giờ dạy", icon: IconWallet },
  ];
}

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/" || pathname.startsWith("/classes");
  return pathname.startsWith(href);
}

function ThemeToggle() {
  const [dark, setDark] = useState<boolean | null>(null);
  useEffect(() => {
    let saved: string | null = null;
    try {
      saved = localStorage.getItem("yose-theme");
    } catch {}
    const isDark = saved ? saved === "dark" : window.matchMedia("(prefers-color-scheme: dark)").matches;
    document.documentElement.dataset.theme = isDark ? "dark" : "light";
    // eslint-disable-next-line react-hooks/set-state-in-effect -- sync with DOM once
    setDark(isDark);
  }, []);
  if (dark === null) return null;
  return (
    <button
      type="button"
      onClick={() => {
        const next = !dark;
        setDark(next);
        document.documentElement.dataset.theme = next ? "dark" : "light";
        try {
          localStorage.setItem("yose-theme", next ? "dark" : "light");
        } catch {}
      }}
      className="grid h-9 w-9 place-items-center rounded-lg text-muted hover:bg-surface-2 hover:text-ink"
      aria-label={dark ? "Chuyển sang giao diện sáng" : "Chuyển sang giao diện tối"}
    >
      {dark ? <IconSun /> : <IconMoon />}
    </button>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const { ready, account } = useStore();
  const router = useRouter();

  useEffect(() => {
    if (ready && !account) router.replace("/login");
  }, [ready, account, router]);

  if (!ready || !account) {
    return (
      <div className="grid min-h-screen place-items-center text-sm text-muted" role="status">
        Đang tải…
      </div>
    );
  }
  return <Shell account={account}>{children}</Shell>;
}

function Shell({ account, children }: { account: Account; children: ReactNode }) {
  const nav = useNav(account);
  const pathname = usePathname();
  const router = useRouter();
  const { data, signOut, resetDemo } = useStore();
  const code =
    account.role === "student" ? data.students.find((s) => s.id === account.profileId)?.code : undefined;

  const logout = () => {
    signOut();
    router.replace("/login");
  };

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[248px_1fr]">
      {/* Sidebar (desktop) */}
      <aside className="sticky top-0 hidden h-screen flex-col border-r border-rule bg-surface px-4 py-5 lg:flex">
        <Link href="/" className="mb-8 flex items-center gap-2.5 px-2">
          <Logo />
          <span className="text-[1.05rem] font-semibold tracking-tight">Yose Center</span>
        </Link>
        <nav className="flex flex-col gap-0.5" aria-label="Điều hướng chính">
          {nav.map((n) => {
            const active = isActive(pathname, n.href);
            return (
              <Link
                key={n.href}
                href={n.href}
                aria-current={active ? "page" : undefined}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition ${
                  active ? "bg-brand-soft font-semibold text-brand" : "text-ink-soft hover:bg-surface-2 hover:text-ink"
                }`}
              >
                <n.icon />
                <span className="flex-1">{n.label}</span>
                {!!n.badge && (
                  <span className="rounded-full bg-brand px-1.5 text-[0.7rem] font-semibold leading-5 text-brand-ink tabular-nums">
                    {n.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto border-t border-rule pt-4">
          <div className="flex items-center gap-3 px-2">
            <Avatar name={account.name} size={36} />
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium">{account.name}</div>
              <div className="truncate text-xs text-muted">
                {ROLE_LABEL[account.role]}
                {code ? `, ${code}` : ""}
              </div>
            </div>
          </div>
          <div className="mt-3 flex items-center gap-1 px-1">
            <button
              type="button"
              onClick={logout}
              className="flex flex-1 items-center gap-2 rounded-lg px-2 py-2 text-sm text-muted hover:bg-surface-2 hover:text-ink"
            >
              <IconLogout /> Đổi tài khoản
            </button>
            <ThemeToggle />
          </div>
          <button
            type="button"
            onClick={() => {
              if (confirm("Xóa mọi thay đổi bạn đã làm và tạo lại dữ liệu mẫu?")) resetDemo();
            }}
            className="mt-2 px-3 text-xs text-muted hover:text-ink hover:underline"
          >
            Đặt lại dữ liệu demo
          </button>
        </div>
      </aside>

      {/* Top bar (mobile) */}
      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-rule bg-surface/90 px-4 py-3 backdrop-blur lg:hidden">
        <Link href="/" className="flex items-center gap-2">
          <Logo />
          <span className="font-semibold tracking-tight">Yose Center</span>
        </Link>
        <div className="flex items-center gap-1">
          <ThemeToggle />
          <button
            type="button"
            onClick={logout}
            className="grid h-9 w-9 place-items-center rounded-lg text-muted"
            aria-label="Đổi tài khoản"
          >
            <IconLogout />
          </button>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl px-4 pb-28 pt-6 sm:px-8 lg:pb-16 lg:pt-10">{children}</main>

      {/* Bottom nav (mobile) */}
      <nav
        className="fixed inset-x-0 bottom-0 z-20 flex border-t border-rule bg-surface/95 backdrop-blur lg:hidden"
        aria-label="Điều hướng chính"
      >
        {nav.map((n) => {
          const active = isActive(pathname, n.href);
          return (
            <Link
              key={n.href}
              href={n.href}
              className={`relative flex flex-1 flex-col items-center gap-1 py-2.5 text-[0.7rem] ${
                active ? "font-semibold text-brand" : "text-muted"
              }`}
            >
              <n.icon size={20} />
              <span className="max-w-[6rem] truncate">{n.label}</span>
              {!!n.badge && (
                <span className="absolute right-[calc(50%-1.4rem)] top-1.5 h-2 w-2 rounded-full bg-brand" />
              )}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

export function Logo({ size = 28 }: { size?: number }) {
  // Chữ Y viết như nét bút trên trang vở, có đường lề đỏ
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden>
      <rect x="1" y="1" width="30" height="30" rx="8" fill="var(--brand)" />
      <path d="M8.5 1v30" stroke="var(--margin)" strokeWidth="1.5" opacity=".9" />
      <path
        d="M12 9.5l5 7.2 5-7.2M17 16.7V23"
        stroke="var(--brand-ink)"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}
