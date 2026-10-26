"use client";

import { rosterOf } from "@/lib/selectors";
import { useStore } from "@/lib/store";
import type { AttendanceStatus, ClassGroup, ClassSession } from "@/lib/types";
import { ATTENDANCE_LABEL, Avatar, Empty, inputCls } from "./ui";

const OPTIONS: AttendanceStatus[] = ["present", "late", "absent", "excused"];

const ACTIVE: Record<AttendanceStatus, string> = {
  present: "bg-ok-soft text-ok border-ok/40",
  late: "bg-late-soft text-late border-late/40",
  absent: "bg-danger-soft text-danger border-danger/40",
  excused: "bg-surface-2 text-ink-soft border-rule",
};

export function AttendancePanel({ session, cls }: { session: ClassSession; cls: ClassGroup }) {
  const { data, setRemark } = useStore();
  const roster = rosterOf(data, cls.id);
  if (session.status === "scheduled") {
    return <Empty>Điểm danh mở khi buổi học bắt đầu.</Empty>;
  }

  const present = roster.filter((s) => {
    const r = data.remarks.find((x) => x.sessionId === session.id && x.studentId === s.id);
    return !r || r.attendance === "present" || r.attendance === "late";
  }).length;

  return (
    <div>
      <p className="mb-4 text-sm text-muted">
        Có mặt <b className="font-semibold text-ink tabular-nums">{present}</b>/{roster.length}. Nhận xét ở đây chỉ học viên
        đó nhìn thấy, trong tab Note của buổi học.
      </p>
      <ul className="divide-y divide-rule overflow-hidden rounded-xl border border-rule bg-surface shadow-card">
        {roster.map((st) => {
          const r = data.remarks.find((x) => x.sessionId === session.id && x.studentId === st.id);
          const status = r?.attendance ?? "present";
          return (
            <li key={st.id} className="grid gap-3 px-4 py-3.5 sm:grid-cols-[13rem_auto_1fr] sm:items-center sm:px-5">
              <div className="flex items-center gap-3">
                <Avatar name={st.fullName} size={30} tone="plain" />
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium">{st.fullName}</div>
                  <div className="text-xs text-muted tabular-nums">{st.code}</div>
                </div>
              </div>
              <div className="flex flex-wrap gap-1" role="radiogroup" aria-label={`Điểm danh ${st.fullName}`}>
                {OPTIONS.map((o) => (
                  <button
                    key={o}
                    type="button"
                    role="radio"
                    aria-checked={status === o}
                    onClick={() => setRemark(session.id, st.id, { attendance: o })}
                    className={`rounded-md border px-2 py-1 text-xs transition ${
                      status === o ? ACTIVE[o] + " font-semibold" : "border-transparent text-muted hover:bg-surface-2"
                    }`}
                  >
                    {ATTENDANCE_LABEL[o]}
                  </button>
                ))}
              </div>
              <input
                aria-label={`Nhận xét cho ${st.fullName}`}
                defaultValue={r?.comment ?? ""}
                onBlur={(e) => {
                  const v = e.target.value.trim();
                  if (v !== (r?.comment ?? "")) setRemark(session.id, st.id, { comment: v || undefined });
                }}
                placeholder="Nhận xét riêng (lưu khi rời ô)"
                className={inputCls}
              />
            </li>
          );
        })}
      </ul>
    </div>
  );
}
