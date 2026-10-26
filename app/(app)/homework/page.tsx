"use client";

import Link from "next/link";
import { useState } from "react";
import { HomeworkList } from "@/components/homework-list";
import { ClassTypeBadge, Empty, PageHeader, Panel, SectionTitle } from "@/components/ui";
import { dateShort, time } from "@/lib/format";
import { awaitingReview, classesForAccount, homeworkForStudent } from "@/lib/selectors";
import { useStore } from "@/lib/store";
import type { Account } from "@/lib/types";

export default function HomeworkPage() {
  const { account } = useStore();
  if (!account) return null;
  return account.role === "student" ? <StudentHomework account={account} /> : <ReviewQueue account={account} />;
}

function StudentHomework({ account }: { account: Account }) {
  const { data } = useStore();
  const classes = classesForAccount(data, account);
  const [filter, setFilter] = useState<string>("all");
  const all = homeworkForStudent(data, account.profileId!).filter((i) => filter === "all" || i.cls.id === filter);

  const todo = all.filter((i) => i.state === "todo" || i.state === "overdue");
  const waiting = all.filter((i) => i.state === "submitted");
  const reviewed = all.filter((i) => i.state === "reviewed").reverse();
  const scores = reviewed.map((i) => data.submissions.find((s) => s.homeworkId === i.hw.id && s.studentId === account.profileId)?.score).filter((x): x is number => x !== undefined);
  const avg = scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : null;

  return (
    <>
      <PageHeader
        title="Bài tập"
        sub={
          avg !== null ? (
            <>
              {reviewed.length} bài đã chấm, điểm trung bình <b className="font-semibold text-ink">{avg.toFixed(1)}</b>
            </>
          ) : undefined
        }
      />

      <div className="mb-8 flex flex-wrap gap-2" role="group" aria-label="Lọc theo lớp">
        {[{ id: "all", name: "Tất cả lớp" }, ...classes].map((c) => (
          <button
            key={c.id}
            type="button"
            aria-pressed={filter === c.id}
            onClick={() => setFilter(c.id)}
            className={`rounded-full border px-3 py-1 text-sm ${
              filter === c.id ? "border-brand bg-brand-soft text-brand" : "border-rule text-ink-soft hover:bg-surface"
            }`}
          >
            {c.name}
          </button>
        ))}
      </div>

      <section className="mb-10">
        <SectionTitle aside={`${todo.length} bài`}>Cần làm</SectionTitle>
        {todo.length ? <HomeworkList items={todo} /> : <Empty>Không còn bài nào cần nộp.</Empty>}
      </section>
      {waiting.length > 0 && (
        <section className="mb-10">
          <SectionTitle aside={`${waiting.length} bài`}>Đã nộp, chờ chấm</SectionTitle>
          <HomeworkList items={waiting} />
        </section>
      )}
      <section>
        <SectionTitle aside={`${reviewed.length} bài`}>Đã chấm</SectionTitle>
        {reviewed.length ? (
          <HomeworkList
            items={reviewed.map((i) => ({
              ...i,
              score: data.submissions.find((s) => s.homeworkId === i.hw.id && s.studentId === account.profileId)?.score,
            }))}
          />
        ) : (
          <Empty>Chưa có bài nào được chấm.</Empty>
        )}
      </section>
    </>
  );
}

function ReviewQueue({ account }: { account: Account }) {
  const { data } = useStore();
  const classes = classesForAccount(data, account);
  const queue = awaitingReview(data, classes.map((c) => c.id)).sort((a, b) => a.submittedAt.localeCompare(b.submittedAt));

  return (
    <>
      <PageHeader title="Bài chờ chấm" sub={`${queue.length} bài nộp, cũ nhất ở trên`} />
      {queue.length ? (
        <Panel className="divide-y divide-rule">
          {queue.map((sub) => {
            const hw = data.homework.find((h) => h.id === sub.homeworkId)!;
            const s = data.sessions.find((x) => x.id === hw.sessionId)!;
            const c = data.classes.find((x) => x.id === s.classId)!;
            const st = data.students.find((x) => x.id === sub.studentId)!;
            return (
              <Link
                key={sub.id}
                href={`/classes/${c.id}/sessions/${s.id}?tab=homework`}
                className="flex flex-wrap items-center gap-x-4 gap-y-1 px-5 py-3.5 hover:bg-surface-2"
              >
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium">
                    {st.fullName} <span className="font-normal text-muted">{st.code}</span>
                  </div>
                  <div className="mt-0.5 flex items-center gap-2 truncate text-xs text-muted">
                    <ClassTypeBadge type={c.type} /> {c.name}, buổi {s.index}: {hw.title}
                  </div>
                </div>
                <span className="text-xs text-muted tabular-nums">
                  Nộp {time(sub.submittedAt)} {dateShort(sub.submittedAt)}
                </span>
              </Link>
            );
          })}
        </Panel>
      ) : (
        <Empty>Đã chấm hết bài nộp.</Empty>
      )}
    </>
  );
}
