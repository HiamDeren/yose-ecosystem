"use client";

import Link from "next/link";
import { dateShort, dueLabel, time } from "@/lib/format";
import type { PendingItem } from "@/lib/selectors";
import { IconChevron } from "./icons";
import { ClassTypeBadge, HomeworkStatus } from "./ui";

type Item = PendingItem & { score?: number };

export function HomeworkList({ items, showScore = true }: { items: Item[]; showScore?: boolean }) {
  return (
    <ul className="divide-y divide-rule overflow-hidden rounded-xl border border-rule bg-surface shadow-card">
      {items.map((item) => {
        const { hw, session, cls, state } = item;
        return (
        <li key={hw.id}>
          <Link
            href={`/classes/${cls.id}/sessions/${session.id}?tab=homework`}
            className="group flex items-center gap-4 px-4 py-3.5 hover:bg-surface-2 sm:px-5"
          >
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
                <ClassTypeBadge type={cls.type} />
                <span className="truncate">
                  {cls.name}, buổi {session.index}
                </span>
              </div>
              <div className="mt-1 truncate text-[0.95rem] font-medium text-ink">{hw.title}</div>
              <div className="mt-0.5 text-xs text-muted">
                Hạn {time(hw.dueAt)} ngày {dateShort(hw.dueAt)}
                {(state === "todo" || state === "overdue") && (
                  <span className={state === "overdue" ? "text-danger" : "text-ink-soft"}>
                    , {dueLabel(hw.dueAt)}
                  </span>
                )}
              </div>
            </div>
            {showScore && <HomeworkStatusFor item={item} />}
            <IconChevron className="shrink-0 text-muted group-hover:text-brand" />
          </Link>
        </li>
        );
      })}
    </ul>
  );
}

function HomeworkStatusFor({ item }: { item: Item }) {
  return (
    <span className="hidden shrink-0 sm:inline">
      <HomeworkStatus state={item.state} score={item.score} />
    </span>
  );
}
