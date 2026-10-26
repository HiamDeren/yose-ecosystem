"use client";

import Link from "next/link";
import { dateLong, relativeDay, time } from "@/lib/format";
import {
  awaitingReview,
  classesForAccount,
  homeworkForStudent,
  progressOf,
  rosterOf,
} from "@/lib/selectors";
import { useStore } from "@/lib/store";
import type { Account } from "@/lib/types";
import { CLASS_CAPACITY } from "@/lib/types";
import { ClassTile } from "./class-tile";
import { HomeworkList } from "./homework-list";
import { IconChevron } from "./icons";
import { ClassTypeBadge, Empty, PageHeader, Panel, SectionTitle } from "./ui";

export function givenName(full: string) {
  const parts = full.trim().split(/\s+/);
  return parts.length >= 3 ? parts.slice(-2).join(" ") : parts[parts.length - 1];
}

export function StudentHome({ account }: { account: Account }) {
  const { data } = useStore();
  const student = data.students.find((s) => s.id === account.profileId)!;
  const classes = classesForAccount(data, account);
  const all = homeworkForStudent(data, student.id);
  const pending = all.filter((i) => i.state === "todo" || i.state === "overdue");

  return (
    <>
      <PageHeader
        title={`Chào ${givenName(student.fullName)}`}
        sub={
          <>
            Mã học viên <b className="font-semibold text-ink">{student.code}</b>, đang học {classes.length} lớp
          </>
        }
      />

      <section className="mb-10">
        <SectionTitle aside={pending.length > 0 && <Link href="/homework" className="text-brand">Xem tất cả bài tập</Link>}>
          Cần làm
        </SectionTitle>
        {pending.length ? (
          <HomeworkList items={pending.slice(0, 4)} />
        ) : (
          <Empty>Bạn đã nộp hết bài. Homework mới sẽ hiện ở đây sau mỗi buổi học.</Empty>
        )}
      </section>

      <section>
        <SectionTitle>Lớp của bạn</SectionTitle>
        <div className="grid gap-4 md:grid-cols-2">
          {classes.map((c) => (
            <ClassTile key={c.id} cls={c} studentId={student.id} />
          ))}
        </div>
      </section>
    </>
  );
}

export function TeacherHome({ account }: { account: Account }) {
  const { data, now } = useStore();
  const teacher = data.teachers.find((t) => t.id === account.profileId)!;
  const classes = classesForAccount(data, account);
  const ids = classes.map((c) => c.id);
  const review = awaitingReview(data, ids);

  const upcoming = data.sessions
    .filter((s) => ids.includes(s.classId) && s.status === "scheduled" && new Date(s.date).getTime() - now < 7 * 86_400_000)
    .sort((a, b) => a.date.localeCompare(b.date));

  const missingNote = data.sessions.filter(
    (s) => ids.includes(s.classId) && s.status === "done" && !data.notes.some((n) => n.sessionId === s.id && n.publishedAt),
  );
  const unprepared = upcoming.filter((s) => !data.notes.some((n) => n.sessionId === s.id));

  return (
    <>
      <PageHeader
        title={`Chào ${givenName(teacher.fullName)}`}
        sub={`${classes.length} lớp đang dạy, ${review.length} bài nộp chờ chấm`}
      />

      <div className="mb-10 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <section>
          <SectionTitle>Lịch dạy 7 ngày tới</SectionTitle>
          {upcoming.length ? (
            <Panel className="divide-y divide-rule">
              {upcoming.map((s) => {
                const c = data.classes.find((x) => x.id === s.classId)!;
                return (
                  <Link
                    key={s.id}
                    href={`/classes/${c.id}/sessions/${s.id}`}
                    className="flex items-center gap-4 px-4 py-3 hover:bg-surface-2"
                  >
                    <div className="w-20 shrink-0 text-sm">
                      <div className="font-semibold text-ink">{relativeDay(s.date)}</div>
                      <div className="text-xs text-muted tabular-nums">{time(s.date)}</div>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 text-xs text-muted">
                        <ClassTypeBadge type={c.type} /> {c.name}
                      </div>
                      <div className="mt-0.5 truncate text-sm font-medium">
                        Buổi {s.index}: {s.topic}
                      </div>
                      <div className="mt-0.5 text-xs text-muted">
                        {data.notes.some((n) => n.sessionId === s.id) ? "Đã soạn bài" : <span className="hl text-ink">Chưa soạn bài</span>}
                      </div>
                    </div>
                    <IconChevron className="text-muted" />
                  </Link>
                );
              })}
            </Panel>
          ) : (
            <Empty>Không có buổi dạy nào trong 7 ngày tới.</Empty>
          )}
        </section>

        <section>
          <SectionTitle>Việc cần xử lý</SectionTitle>
          <Panel className="divide-y divide-rule text-sm">
            <Link href="/homework" className="flex items-center justify-between px-4 py-3.5 hover:bg-surface-2">
              <span>Bài nộp chờ chấm</span>
              <span className={review.length ? "hl font-semibold tabular-nums" : "text-muted"}>{review.length}</span>
            </Link>
            <div className="flex items-center justify-between px-4 py-3.5">
              <span>Buổi 7 ngày tới chưa soạn bài</span>
              <span className={unprepared.length ? "hl font-semibold tabular-nums" : "text-muted"}>{unprepared.length}</span>
            </div>
            <div className="flex items-center justify-between px-4 py-3.5">
              <span>Buổi đã dạy chưa công bố note</span>
              <span className={missingNote.length ? "hl font-semibold" : "text-muted"}>{missingNote.length}</span>
            </div>
          </Panel>
          {missingNote.length > 0 && (
            <ul className="mt-3 space-y-1 text-sm">
              {missingNote.slice(0, 4).map((s) => (
                <li key={s.id}>
                  <Link className="text-brand hover:underline" href={`/classes/${s.classId}/sessions/${s.id}`}>
                    {data.classes.find((c) => c.id === s.classId)?.name}, buổi {s.index}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section>
        <SectionTitle>Lớp đang dạy</SectionTitle>
        <div className="grid gap-4 md:grid-cols-2">
          {classes.map((c) => (
            <ClassTile key={c.id} cls={c} />
          ))}
        </div>
      </section>
    </>
  );
}

export function AdminHome() {
  const { data, now } = useStore();
  const weekEnd = now + 7 * 86_400_000;
  const thisWeek = data.sessions.filter((s) => {
    const t = new Date(s.date).getTime();
    return t >= now && t < weekEnd;
  });
  const review = awaitingReview(data, data.classes.map((c) => c.id));

  const stats = [
    { label: "Học viên", value: data.students.length, href: "/admin/students" },
    { label: "Lớp đang mở", value: data.classes.filter((c) => c.status === "active").length, href: "/admin/classes" },
    { label: "Buổi học 7 ngày tới", value: thisWeek.length },
    { label: "Bài chờ chấm", value: review.length },
  ];

  return (
    <>
      <PageHeader title="Tổng quan trung tâm" sub={dateLong(new Date(now).toISOString())} />
      <dl className="mb-10 grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-rule bg-rule shadow-card lg:grid-cols-4">
        {stats.map((s) => {
          const inner = (
            <>
              <dt className="text-sm text-muted">{s.label}</dt>
              <dd className="mt-1 text-3xl font-semibold tracking-tight tabular-nums">{s.value}</dd>
            </>
          );
          return s.href ? (
            <Link key={s.label} href={s.href} className="bg-surface px-5 py-4 hover:bg-surface-2">
              {inner}
            </Link>
          ) : (
            <div key={s.label} className="bg-surface px-5 py-4">
              {inner}
            </div>
          );
        })}
      </dl>

      <section>
        <SectionTitle aside={<Link href="/admin/classes" className="text-brand">Quản lý lớp</Link>}>
          Các lớp
        </SectionTitle>
        <Panel className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-rule text-left text-xs text-muted">
                <th className="px-4 py-2.5 font-medium">Lớp</th>
                <th className="px-4 py-2.5 font-medium">Loại</th>
                <th className="px-4 py-2.5 font-medium">Giáo viên</th>
                <th className="px-4 py-2.5 font-medium">Sĩ số</th>
                <th className="px-4 py-2.5 font-medium">Tiến độ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-rule">
              {data.classes.map((c) => {
                const p = progressOf(data, c);
                return (
                  <tr key={c.id} className="hover:bg-surface-2">
                    <td className="px-4 py-3">
                      <Link href={`/classes/${c.id}`} className="font-medium hover:text-brand">
                        {c.name}
                      </Link>
                      <div className="text-xs text-muted">{c.code}</div>
                    </td>
                    <td className="px-4 py-3">
                      <ClassTypeBadge type={c.type} />
                    </td>
                    <td className="px-4 py-3 text-ink-soft">
                      {data.teachers.find((t) => t.id === c.teacherId)?.fullName}
                    </td>
                    <td className="px-4 py-3 tabular-nums">
                      {rosterOf(data, c.id).length}
                      <span className="text-muted">/{CLASS_CAPACITY[c.type]}</span>
                    </td>
                    <td className="px-4 py-3 tabular-nums text-ink-soft">
                      {p.done}/{p.total}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Panel>
      </section>
    </>
  );
}
