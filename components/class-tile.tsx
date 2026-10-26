"use client";

import Link from "next/link";
import { dateLong, scheduleLabel, time } from "@/lib/format";
import { homeworkForStudent, progressOf, rosterOf } from "@/lib/selectors";
import { useStore } from "@/lib/store";
import type { ClassGroup } from "@/lib/types";
import { CLASS_CAPACITY } from "@/lib/types";
import { IconChevron } from "./icons";
import { ClassTypeBadge, TYPE_BAR } from "./ui";

export function ClassTile({ cls, studentId }: { cls: ClassGroup; studentId?: string }) {
  const { data } = useStore();
  const teacher = data.teachers.find((t) => t.id === cls.teacherId);
  const { done, total, next } = progressOf(data, cls);
  const pending = studentId
    ? homeworkForStudent(data, studentId).filter(
        (i) => i.cls.id === cls.id && (i.state === "todo" || i.state === "overdue"),
      ).length
    : 0;
  const roster = rosterOf(data, cls.id);

  return (
    <Link
      href={`/classes/${cls.id}`}
      className="group relative flex flex-col overflow-hidden rounded-xl border border-rule bg-surface p-5 pl-6 shadow-card transition hover:border-brand/40"
    >
      <span className={`absolute inset-y-0 left-0 w-1 ${TYPE_BAR[cls.type]}`} aria-hidden />
      <div className="flex items-center gap-2 text-xs text-muted">
        <ClassTypeBadge type={cls.type} />
        <span>{cls.code}</span>
        <span className="ml-auto">{cls.level}</span>
      </div>
      <h3 className="mt-3 text-lg font-semibold tracking-tight text-ink">{cls.name}</h3>
      <p className="mt-0.5 text-sm text-ink-soft">
        {teacher?.fullName}
        {cls.type !== "ONE_ON_ONE" && (
          <span className="text-muted">
            , {roster.length}/{CLASS_CAPACITY[cls.type]} học viên
          </span>
        )}
      </p>
      <p className="mt-0.5 text-sm text-muted">{scheduleLabel(cls)}</p>

      <div className="mt-5">
        <div className="flex items-baseline justify-between text-xs text-muted">
          <span>
            Đã học <b className="font-semibold text-ink tabular-nums">{done}</b>/{total} buổi
          </span>
          {pending > 0 && <span className="hl font-medium text-ink">{pending} bài chưa nộp</span>}
        </div>
        <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-surface-2">
          <div className={`h-full rounded-full ${TYPE_BAR[cls.type]}`} style={{ width: `${(done / total) * 100}%` }} />
        </div>
      </div>

      <div className="mt-4 flex items-center gap-2 border-t border-rule pt-3 text-sm">
        {next ? (
          <span className="text-ink-soft">
            Buổi {next.index}: {dateLong(next.date)} lúc {time(next.date)}
          </span>
        ) : (
          <span className="text-muted">Đã hoàn thành khóa</span>
        )}
        <IconChevron className="ml-auto text-muted transition group-hover:translate-x-0.5 group-hover:text-brand" />
      </div>
    </Link>
  );
}
