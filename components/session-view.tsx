"use client";

import Link from "next/link";
import { useParams, usePathname, useRouter, useSearchParams } from "next/navigation";
import { dateLong, time } from "@/lib/format";
import { canAccessClass, homeworkOfSession, homeworkState, rosterOf, sessionsOf } from "@/lib/selectors";
import { useStore } from "@/lib/store";
import { AttendancePanel } from "./attendance-panel";
import { BackLink } from "./class-view";
import { HomeworkPanel } from "./homework-panel";
import { IconBack, IconChevron } from "./icons";
import { NotePanel } from "./note-panel";
import { ClassTypeBadge, Empty, PageHeader } from "./ui";

type Tab = "note" | "homework" | "attendance";

export function SessionView() {
  const { classId, sessionId } = useParams<{ classId: string; sessionId: string }>();
  const search = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const { data, account } = useStore();
  if (!account) return null;

  const cls = data.classes.find((c) => c.id === classId);
  const session = data.sessions.find((s) => s.id === sessionId);
  if (!cls || !session || !canAccessClass(data, account, classId)) {
    return <Empty>Không tìm thấy buổi học, hoặc bạn không có quyền xem.</Empty>;
  }

  const staff = account.role !== "student";
  const studentId = staff ? undefined : account.profileId!;
  const tab = (search.get("tab") as Tab) || "note";
  const all = sessionsOf(data, cls.id);
  const prev = all.find((s) => s.index === session.index - 1);
  const next = all.find((s) => s.index === session.index + 1);
  const hws = homeworkOfSession(data, session.id, studentId);
  const pendingCount = studentId
    ? hws.filter((h) => ["todo", "overdue"].includes(homeworkState(data, h, studentId))).length
    : 0;
  const teacher = data.teachers.find((t) => t.id === session.teacherId);

  const tabs: { id: Tab; label: string; count?: number; mark?: boolean }[] = [
    { id: "note", label: "Note trên lớp" },
    { id: "homework", label: "Homework", count: hws.length, mark: pendingCount > 0 },
    ...(staff
      ? [{ id: "attendance" as Tab, label: "Điểm danh và nhận xét", count: rosterOf(data, cls.id).length }]
      : []),
  ];

  const setTab = (t: Tab) => {
    const q = new URLSearchParams(search.toString());
    if (t === "note") q.delete("tab");
    else q.set("tab", t);
    const qs = q.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };

  // Màn lớn: trang vừa khít khung, chỉ nội dung tab (khung note) tự cuộn
  return (
    <div className="lg:flex lg:h-full lg:flex-col">
      <div className="shrink-0">
        <PageHeader
          back={<BackLink href={`/classes/${cls.id}`}>{cls.name}</BackLink>}
          title={
            <>
              <span className="mr-2 text-muted">Buổi {session.index}.</span>
              {session.topic}
            </>
          }
          sub={
            <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <ClassTypeBadge type={cls.type} />
              <span>
                {dateLong(session.date)}, {time(session.date)}, {session.durationMin} phút. Giáo viên{" "}
                {teacher?.fullName}.
              </span>
            </span>
          }
        />
      </div>
      <div
        role="tablist"
        aria-label="Nội dung buổi học"
        className="no-scrollbar mb-5 shrink-0 flex gap-1 overflow-x-auto overflow-y-hidden shadow-[inset_0_-1px_0_var(--rule)]"
      >
        {tabs.map((t) => {
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              role="tab"
              type="button"
              aria-selected={active}
              onClick={() => setTab(t.id)}
              className={`flex shrink-0 items-center gap-2 border-b-2 px-3 py-2.5 text-sm transition ${
                active ? "border-brand font-semibold text-ink" : "border-transparent text-muted hover:text-ink"
              }`}
            >
              <span className={t.mark ? "hl" : ""}>{t.label}</span>
              {t.count !== undefined && t.count > 0 && (
                <span className="rounded-full bg-surface-2 px-1.5 text-xs tabular-nums text-muted">{t.count}</span>
              )}
            </button>
          );
        })}
      </div>

      <div role="tabpanel" className="lg:flex lg:min-h-0 lg:flex-1 lg:flex-col">
        {tab === "note" && <NotePanel session={session} cls={cls} />}
        {tab === "homework" && (
          <div className="lg:min-h-0 lg:flex-1 lg:overflow-y-auto lg:pr-2">
            <HomeworkPanel session={session} cls={cls} />
          </div>
        )}
        {tab === "attendance" && staff && (
          <div className="lg:min-h-0 lg:flex-1 lg:overflow-y-auto lg:pr-2">
            <AttendancePanel session={session} cls={cls} />
          </div>
        )}
      </div>

      <nav
        className="mt-8 grid shrink-0 grid-cols-2 gap-3 border-t border-rule pt-3 text-sm lg:mt-4"
        aria-label="Buổi khác"
      >
        {prev ? (
          <Link
            href={`/classes/${cls.id}/sessions/${prev.id}${tab !== "note" ? `?tab=${tab}` : ""}`}
            className="group flex items-center gap-2 rounded-lg p-2 text-muted hover:bg-surface"
          >
            <IconBack className="shrink-0" />
            <span className="min-w-0">
              <span className="block text-xs">Buổi {prev.index}</span>
              <span className="block truncate text-ink group-hover:text-brand">{prev.topic}</span>
            </span>
          </Link>
        ) : (
          <span />
        )}
        {next && (
          <Link
            href={`/classes/${cls.id}/sessions/${next.id}${tab !== "note" ? `?tab=${tab}` : ""}`}
            className="group flex items-center justify-end gap-2 rounded-lg p-2 text-right text-muted hover:bg-surface"
          >
            <span className="min-w-0">
              <span className="block text-xs">Buổi {next.index}</span>
              <span className="block truncate text-ink group-hover:text-brand">{next.topic}</span>
            </span>
            <IconChevron className="shrink-0" />
          </Link>
        )}
      </nav>
    </div>
  );
}
