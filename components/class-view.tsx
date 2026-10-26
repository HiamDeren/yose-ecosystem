"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { dateShort, scheduleLabel, time, weekdayShort } from "@/lib/format";
import {
  canAccessClass,
  homeworkOfSession,
  homeworkState,
  progressOf,
  rosterOf,
  sessionsOf,
} from "@/lib/selectors";
import { useStore } from "@/lib/store";
import type { Account, ClassGroup, ClassSession, YoseData } from "@/lib/types";
import { CLASS_CAPACITY } from "@/lib/types";
import { IconBack, IconBook, IconChevron, IconTasks } from "./icons";
import { AttendanceDot, Avatar, ClassTypeBadge, Empty, HomeworkStatus, PageHeader, TYPE_BAR } from "./ui";

export function BackLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="mb-4 inline-flex items-center gap-1 text-sm text-muted hover:text-brand">
      <IconBack size={16} /> {children}
    </Link>
  );
}

export function ClassView() {
  const { classId } = useParams<{ classId: string }>();
  const { data, account } = useStore();
  const [showAll, setShowAll] = useState(false);
  if (!account) return null;

  const cls = data.classes.find((c) => c.id === classId);
  if (!cls || !canAccessClass(data, account, classId)) {
    return <Empty>Bạn không có quyền xem lớp này, hoặc lớp không tồn tại.</Empty>;
  }

  const teacher = data.teachers.find((t) => t.id === cls.teacherId);
  const sessions = sessionsOf(data, cls.id);
  const past = sessions.filter((s) => s.status !== "scheduled").reverse();
  const future = sessions.filter((s) => s.status === "scheduled");
  const visibleFuture = showAll ? future : future.slice(0, 2);
  const { done, total } = progressOf(data, cls);
  const roster = rosterOf(data, cls.id);
  const staff = account.role !== "student";

  return (
    <>
      <PageHeader
        back={<BackLink href="/">{staff ? "Tổng quan" : "Lớp của tôi"}</BackLink>}
        title={
          <span className="flex flex-wrap items-center gap-3">
            {cls.name}
            <ClassTypeBadge type={cls.type} className="text-sm" />
          </span>
        }
        sub={
          <>
            {cls.code}, {cls.level}. Giáo viên {teacher?.fullName}. {scheduleLabel(cls)}.
          </>
        }
        aside={
          <div className="w-44">
            <div className="flex justify-between text-xs text-muted">
              <span>Tiến độ</span>
              <span className="tabular-nums">
                <b className="font-semibold text-ink">{done}</b>/{total}
              </span>
            </div>
            <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-surface">
              <div className={`h-full ${TYPE_BAR[cls.type]}`} style={{ width: `${(done / total) * 100}%` }} />
            </div>
          </div>
        }
      />

      <div className={staff ? "grid gap-8 lg:grid-cols-[1fr_260px]" : ""}>
        <div>
          {future.length > 0 && (
            <section className="mb-8">
              <h2 className="mb-2 text-[0.95rem] font-semibold">Sắp tới</h2>
              <Timeline>
                {visibleFuture.map((s) => (
                  <SessionRow key={s.id} s={s} cls={cls} data={data} account={account} />
                ))}
              </Timeline>
              {future.length > 2 && (
                <button
                  type="button"
                  onClick={() => setShowAll((v) => !v)}
                  className="mt-2 pl-[5.75rem] text-sm text-brand hover:underline"
                >
                  {showAll ? "Thu gọn" : `Xem thêm ${future.length - 2} buổi trong lộ trình`}
                </button>
              )}
            </section>
          )}

          <section>
            <h2 className="mb-2 text-[0.95rem] font-semibold">Đã học</h2>
            {past.length ? (
              <Timeline>
                {past.map((s) => (
                  <SessionRow key={s.id} s={s} cls={cls} data={data} account={account} />
                ))}
              </Timeline>
            ) : (
              <Empty>Lớp chưa bắt đầu.</Empty>
            )}
          </section>
        </div>

        {staff && (
          <aside>
            <h2 className="mb-2 text-[0.95rem] font-semibold">
              Học viên{" "}
              <span className="font-normal text-muted">
                {roster.length}/{CLASS_CAPACITY[cls.type]}
              </span>
            </h2>
            <ul className="divide-y divide-rule rounded-xl border border-rule bg-surface">
              {roster.map((st) => (
                <li key={st.id} className="flex items-center gap-3 px-3 py-2.5">
                  <Avatar name={st.fullName} size={28} tone="plain" />
                  <div className="min-w-0">
                    <div className="truncate text-sm">{st.fullName}</div>
                    <div className="text-xs text-muted tabular-nums">{st.code}</div>
                  </div>
                </li>
              ))}
            </ul>
          </aside>
        )}
      </div>
    </>
  );
}

function Timeline({ children }: { children: React.ReactNode }) {
  return (
    <ol
      className="margin-line overflow-hidden rounded-xl border border-rule bg-surface shadow-card"
      style={{ ["--margin-x" as string]: "4.75rem" }}
    >
      {children}
    </ol>
  );
}

function SessionRow({
  s,
  cls,
  data,
  account,
}: {
  s: ClassSession;
  cls: ClassGroup;
  data: YoseData;
  account: Account;
}) {
  const note = data.notes.find((n) => n.sessionId === s.id);
  const studentId = account.role === "student" ? account.profileId! : undefined;
  const hws = homeworkOfSession(data, s.id, studentId);
  const remark = studentId ? data.remarks.find((r) => r.sessionId === s.id && r.studentId === studentId) : undefined;
  const scheduled = s.status === "scheduled";
  const roster = rosterOf(data, cls.id);

  return (
    <li className="border-b border-rule last:border-0">
      <Link
        href={`/classes/${cls.id}/sessions/${s.id}`}
        className={`group grid grid-cols-[4.75rem_1fr_auto] items-center hover:bg-surface-2 ${scheduled ? "opacity-80" : ""}`}
      >
        <div className="py-3.5 pr-3 text-right">
          <div className="text-[0.7rem] text-muted">{weekdayShort(s.date)}</div>
          <div className="text-sm font-semibold tabular-nums text-ink">{dateShort(s.date)}</div>
        </div>
        <div className="min-w-0 py-3.5 pl-5 pr-3">
          <div className="flex items-baseline gap-2">
            <span className="shrink-0 text-xs font-semibold text-muted tabular-nums">Buổi {s.index}</span>
            <span className="truncate font-medium text-ink">{s.topic}</span>
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted">
            {scheduled ? (
              <span>
                {time(s.date)}, {s.durationMin} phút
              </span>
            ) : (
              <>
                {note ? (
                  <span className="inline-flex items-center gap-1">
                    <IconBook size={13} /> Note, {note.vocab.length} từ mới
                  </span>
                ) : (
                  <span className={account.role !== "student" ? "hl text-ink" : ""}>Chưa có note</span>
                )}
                {remark && (
                  <span className="inline-flex items-center gap-1.5">
                    <AttendanceDot status={remark.attendance} />
                    {remark.attendance === "present" ? "Có mặt" : remark.attendance === "late" ? "Đi trễ" : "Vắng"}
                  </span>
                )}
                {!studentId && hws.length > 0 && (
                  <span className="inline-flex items-center gap-1">
                    <IconTasks size={13} />
                    {hws.map((h) => data.submissions.filter((x) => x.homeworkId === h.id).length).reduce((a, b) => a + b, 0)}
                    /{roster.length * hws.length} đã nộp
                  </span>
                )}
              </>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3 pr-4">
          {studentId &&
            hws.map((h) => {
              const st = homeworkState(data, h, studentId);
              const sub = data.submissions.find((x) => x.homeworkId === h.id && x.studentId === studentId);
              return (
                <span key={h.id} className="hidden sm:inline">
                  <HomeworkStatus state={st} score={sub?.score} />
                </span>
              );
            })}
          <IconChevron className="text-muted group-hover:text-brand" />
        </div>
      </Link>
    </li>
  );
}
