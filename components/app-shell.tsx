"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { useStore } from "@/lib/store";
import { awaitingReview, classesForAccount, homeworkForStudent } from "@/lib/selectors";
import type { Account, Role } from "@/lib/types";
import { IconBook, IconHome, IconLogout, IconMoon, IconPin, IconSettings, IconSun, IconTasks } from "./icons";
import { Avatar } from "./ui";

interface NavItem {
  href: string;
  label: string;
  icon: (p: { size?: number }) => ReactNode;
  badge?: number;
  /** Tiền tố đường dẫn được tính là "đang ở mục này" */
  match?: string[];
}

const ROLE_LABEL: Record<Role, string> = {
  student: "Học viên",
  teacher: "Giáo viên",
  admin: "Quản trị",
};

const PIN_KEY = "yose-sidebar-pinned";
const RAIL = "4rem";
const FULL = "15.5rem";

function useNav(account: Account): NavItem[] {
  const { data } = useStore();
  if (account.role === "student") {
    const pending = homeworkForStudent(data, account.profileId!).filter(
      (i) => i.state === "todo" || i.state === "overdue",
    ).length;
    return [
      { href: "/", label: "Lớp của tôi", icon: IconBook, match: ["/classes"] },
      { href: "/homework", label: "Bài tập", icon: IconTasks, badge: pending },
    ];
  }
  if (account.role === "teacher") {
    const ids = classesForAccount(data, account).map((c) => c.id);
    return [
      { href: "/", label: "Lớp đang dạy", icon: IconBook, match: ["/classes"] },
      { href: "/homework", label: "Chờ chấm", icon: IconTasks, badge: awaitingReview(data, ids).length },
      { href: "/manage/classes", label: "Quản lý", icon: IconSettings, match: ["/manage"] },
    ];
  }
  return [
    { href: "/", label: "Tổng quan", icon: IconHome },
    { href: "/manage/classes", label: "Quản lý", icon: IconSettings, match: ["/manage", "/classes"] },
  ];
}

function isActive(pathname: string, item: NavItem) {
  if (item.href === "/" && pathname === "/") return true;
  if (item.href !== "/" && pathname.startsWith(item.href)) return true;
  return item.match?.some((m) => pathname.startsWith(m)) ?? false;
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
      className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-muted hover:bg-surface-2 hover:text-ink"
      aria-label={dark ? "Chuyển sang giao diện sáng" : "Chuyển sang giao diện tối"}
      title={dark ? "Giao diện sáng" : "Giao diện tối"}
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

  // Sidebar: thu thành thanh icon, rê chuột (hoặc focus bàn phím) thì mở, ghim để luôn mở
  const [pinned, setPinned] = useState(false);
  const [hover, setHover] = useState(false);
  const [focusIn, setFocusIn] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const closeTimer = useRef<number | null>(null);
  const scroller = useRef<HTMLElement>(null);

  // Khung cuộn riêng nên phải tự đưa về đầu trang khi chuyển trang
  useEffect(() => {
    scroller.current?.scrollTo({ top: 0 });
  }, [pathname]);

  useEffect(() => {
    try {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- đọc lựa chọn đã lưu một lần
      setPinned(localStorage.getItem(PIN_KEY) === "1");
    } catch {}
  }, []);

  const togglePin = () => {
    const next = !pinned;
    setPinned(next);
    if (!next) setHover(false);
    try {
      localStorage.setItem(PIN_KEY, next ? "1" : "0");
    } catch {}
  };

  const expanded = pinned || hover || focusIn;
  const fade = `transition-opacity duration-150 ${expanded ? "opacity-100" : "pointer-events-none opacity-0"}`;

  const logout = () => {
    signOut();
    router.replace("/login");
  };

  return (
    <div className="h-dvh overflow-hidden" style={{ ["--rail" as string]: pinned ? FULL : RAIL }}>
      {/* Sidebar (desktop) */}
      <aside
        onMouseEnter={() => {
          if (closeTimer.current) window.clearTimeout(closeTimer.current);
          setHover(true);
        }}
        onMouseLeave={() => {
          closeTimer.current = window.setTimeout(() => setHover(false), 120);
        }}
        onFocus={() => setFocusIn(true)}
        onBlur={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget as Node)) setFocusIn(false);
        }}
        aria-label="Thanh điều hướng"
        className={`fixed inset-y-0 left-0 z-40 hidden flex-col overflow-hidden border-r border-rule bg-surface py-4 transition-[width,box-shadow] duration-200 ease-out lg:flex ${
          expanded && !pinned ? "shadow-[0_10px_40px_-10px_rgb(0_0_0/0.35)]" : ""
        }`}
        style={{ width: expanded ? FULL : RAIL }}
      >
        <div className="mb-6 flex items-center gap-2.5 px-[1.125rem]">
          <Link href="/" className="flex min-w-0 items-center gap-2.5" aria-label="Yose Home, trang chủ">
            <Logo />
            <span className={`whitespace-nowrap text-[1.05rem] font-semibold tracking-tight ${fade}`}>Yose Home</span>
          </Link>
          <button
            type="button"
            onClick={togglePin}
            aria-pressed={pinned}
            aria-label={pinned ? "Bỏ ghim thanh điều hướng" : "Ghim thanh điều hướng"}
            title={pinned ? "Bỏ ghim: thu gọn khi rời chuột" : "Ghim: luôn mở"}
            className={`ml-auto grid h-8 w-8 shrink-0 place-items-center rounded-lg ${fade} ${
              pinned ? "bg-brand-soft text-brand" : "text-muted hover:bg-surface-2 hover:text-ink"
            }`}
          >
            <IconPin size={16} className={pinned ? "" : "rotate-45"} />
          </button>
        </div>

        <nav className="flex flex-col gap-0.5 px-3" aria-label="Điều hướng chính">
          {nav.map((n) => {
            const active = isActive(pathname, n);
            return (
              <Link
                key={n.href}
                href={n.href}
                aria-current={active ? "page" : undefined}
                title={expanded ? undefined : n.label}
                className={`relative flex h-10 items-center gap-3 rounded-lg px-[0.6875rem] text-sm transition-colors ${
                  active ? "bg-brand-soft font-semibold text-brand" : "text-ink-soft hover:bg-surface-2 hover:text-ink"
                }`}
              >
                <span className="shrink-0">
                  <n.icon />
                </span>
                <span className={`flex-1 whitespace-nowrap ${fade}`}>{n.label}</span>
                {!!n.badge &&
                  (expanded ? (
                    <span className="rounded-full bg-brand px-1.5 text-[0.7rem] font-semibold leading-5 text-brand-ink tabular-nums">
                      {n.badge}
                    </span>
                  ) : (
                    <span className="absolute left-7 top-2 h-2 w-2 rounded-full bg-brand ring-2 ring-surface" aria-hidden />
                  ))}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto border-t border-rule px-3 pt-4">
          <div className="flex items-center gap-3 px-1">
            <Avatar name={account.name} size={34} />
            <div className={`min-w-0 flex-1 ${fade}`}>
              <div className="truncate whitespace-nowrap text-sm font-medium">{account.name}</div>
              <div className="truncate whitespace-nowrap text-xs text-muted">
                {ROLE_LABEL[account.role]}
                {code ? `, ${code}` : ""}
              </div>
            </div>
          </div>
          <div className={`mt-3 flex items-center gap-1 ${fade}`}>
            <button
              type="button"
              onClick={logout}
              className="flex flex-1 items-center gap-2 whitespace-nowrap rounded-lg px-2 py-2 text-sm text-muted hover:bg-surface-2 hover:text-ink"
            >
              <IconLogout /> Đổi tài khoản
            </button>
            <ThemeToggle />
          </div>
          <div className={`mt-1 px-2 text-xs ${fade}`}>
            {confirmReset ? (
              <span className="flex items-center gap-2 whitespace-nowrap">
                <span className="text-muted">Xóa mọi thay đổi?</span>
                <button
                  type="button"
                  className="font-medium text-danger hover:underline"
                  onClick={() => {
                    resetDemo();
                    setConfirmReset(false);
                  }}
                >
                  Đặt lại
                </button>
                <button type="button" className="text-muted hover:underline" onClick={() => setConfirmReset(false)}>
                  Hủy
                </button>
              </span>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmReset(true)}
                className="whitespace-nowrap text-muted hover:text-ink hover:underline"
              >
                Đặt lại dữ liệu demo
              </button>
            )}
          </div>
        </div>
      </aside>

      <div className="flex h-dvh flex-col transition-[padding] duration-200 ease-out lg:pl-[var(--rail)]">
        {/* Top bar (mobile) */}
        <header className="z-20 flex shrink-0 items-center justify-between border-b border-rule bg-surface px-4 py-3 lg:hidden">
          <Link href="/" className="flex items-center gap-2">
            <Logo />
            <span className="font-semibold tracking-tight">Yose Home</span>
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

        {/* Nội dung cuộn trong khung riêng, sidebar và header đứng yên */}
        <main
          ref={scroller}
          id="app-scroll"
          className="min-h-0 w-full flex-1 overflow-y-auto overscroll-contain px-4 pb-28 pt-6 sm:px-8 lg:px-10 lg:pb-12 lg:pt-9"
        >
          {children}
        </main>
      </div>

      {/* Bottom nav (mobile) */}
      <nav
        className="fixed inset-x-0 bottom-0 z-20 flex border-t border-rule bg-surface/95 backdrop-blur lg:hidden"
        aria-label="Điều hướng chính"
      >
        {nav.map((n) => {
          const active = isActive(pathname, n);
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
              {!!n.badge && <span className="absolute right-[calc(50%-1.4rem)] top-1.5 h-2 w-2 rounded-full bg-brand" />}
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
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden className="shrink-0">
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
