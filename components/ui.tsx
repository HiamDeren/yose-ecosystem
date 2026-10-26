import type { ReactNode } from "react";
import { CLASS_TYPE_LABEL, initials } from "@/lib/format";
import type { AttendanceStatus, ClassType, HomeworkState } from "@/lib/types";

const TYPE_STYLE: Record<ClassType, string> = {
  ONE_ON_ONE: "bg-t11-soft text-t11",
  ONE_ON_TWO: "bg-t12-soft text-t12",
  GROUP: "bg-tg-soft text-tg",
};

export const TYPE_BAR: Record<ClassType, string> = {
  ONE_ON_ONE: "bg-t11",
  ONE_ON_TWO: "bg-t12",
  GROUP: "bg-tg",
};

export function ClassTypeBadge({ type, className = "" }: { type: ClassType; className?: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-md px-1.5 py-0.5 text-xs font-semibold tabular-nums ${TYPE_STYLE[type]} ${className}`}
    >
      {CLASS_TYPE_LABEL[type]}
    </span>
  );
}

const HW_LABEL: Record<HomeworkState, string> = {
  todo: "Chưa nộp",
  overdue: "Quá hạn",
  submitted: "Đã nộp, chờ chấm",
  reviewed: "Đã chấm",
};

export function HomeworkStatus({ state, score }: { state: HomeworkState; score?: number }) {
  if (state === "todo") return <span className="hl text-sm font-medium text-ink">{HW_LABEL.todo}</span>;
  const cls =
    state === "overdue"
      ? "bg-danger-soft text-danger"
      : state === "submitted"
        ? "bg-brand-soft text-brand"
        : "bg-ok-soft text-ok";
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${cls}`}>
      {HW_LABEL[state]}
      {state === "reviewed" && score !== undefined && <b className="font-semibold tabular-nums">{score}</b>}
    </span>
  );
}

export const ATTENDANCE_LABEL: Record<AttendanceStatus, string> = {
  present: "Có mặt",
  late: "Đi trễ",
  absent: "Vắng",
  excused: "Vắng có phép",
};

export function AttendanceDot({ status }: { status: AttendanceStatus }) {
  const cls =
    status === "present"
      ? "bg-ok"
      : status === "late"
        ? "bg-late"
        : status === "excused"
          ? "bg-muted"
          : "bg-danger";
  return <span className={`inline-block h-2 w-2 rounded-full ${cls}`} title={ATTENDANCE_LABEL[status]} />;
}

export function Avatar({ name, size = 32, tone = "brand" }: { name: string; size?: number; tone?: "brand" | "plain" }) {
  return (
    <span
      className={`inline-grid shrink-0 place-items-center rounded-full font-semibold ${
        tone === "brand" ? "bg-brand-soft text-brand" : "bg-surface-2 text-ink-soft"
      }`}
      style={{ width: size, height: size, fontSize: size * 0.38 }}
      aria-hidden
    >
      {initials(name)}
    </span>
  );
}

export function PageHeader({
  title,
  sub,
  aside,
  back,
}: {
  title: ReactNode;
  sub?: ReactNode;
  aside?: ReactNode;
  back?: ReactNode;
}) {
  return (
    <header className="mb-8">
      {back}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight text-ink sm:text-[1.75rem]">{title}</h1>
          {sub && <div className="mt-1.5 text-sm text-muted">{sub}</div>}
        </div>
        {aside}
      </div>
    </header>
  );
}

export function SectionTitle({ children, aside }: { children: ReactNode; aside?: ReactNode }) {
  return (
    <div className="mb-3 flex items-baseline justify-between gap-3">
      <h2 className="text-[0.95rem] font-semibold text-ink">{children}</h2>
      {aside && <div className="text-sm text-muted">{aside}</div>}
    </div>
  );
}

export function Panel({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-xl border border-rule bg-surface shadow-card ${className}`}>{children}</div>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-xl border border-dashed border-rule px-5 py-8 text-center text-sm text-muted">
      {children}
    </div>
  );
}

export function Button({
  children,
  variant = "primary",
  className = "",
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "ghost" | "danger" }) {
  const v =
    variant === "primary"
      ? "bg-brand text-brand-ink hover:opacity-90"
      : variant === "danger"
        ? "text-danger hover:bg-danger-soft"
        : "border border-rule bg-surface text-ink hover:bg-surface-2";
  return (
    <button
      className={`inline-flex items-center justify-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50 ${v} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}

export const inputCls =
  "w-full rounded-lg border border-rule bg-surface px-3 py-2 text-sm text-ink placeholder:text-muted focus:border-brand focus:outline-none";
