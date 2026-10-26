"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { AdminOnly } from "@/components/admin-guard";
import { Avatar, ClassTypeBadge, PageHeader, Panel, inputCls } from "@/components/ui";
import { dateShort } from "@/lib/format";
import { homeworkForStudent } from "@/lib/selectors";
import { useStore } from "@/lib/store";

export default function StudentsPage() {
  return (
    <AdminOnly>
      <Students />
    </AdminOnly>
  );
}

function Students() {
  const { data } = useStore();
  const [q, setQ] = useState("");

  const rows = useMemo(() => {
    const term = q.trim().toLowerCase();
    return data.students
      .filter(
        (s) =>
          !term ||
          s.fullName.toLowerCase().includes(term) ||
          s.code.toLowerCase().includes(term) ||
          s.email.toLowerCase().includes(term),
      )
      .map((s) => {
        const classIds = data.enrollments.filter((e) => e.studentId === s.id).map((e) => e.classId);
        const hw = homeworkForStudent(data, s.id);
        const done = hw.filter((h) => h.state === "submitted" || h.state === "reviewed").length;
        return { s, classes: data.classes.filter((c) => classIds.includes(c.id)), rate: hw.length ? done / hw.length : null };
      });
  }, [data, q]);

  return (
    <>
      <PageHeader title="Học viên" sub={`${data.students.length} học viên, mỗi người một mã và một Gmail đăng nhập`} />
      <div className="mb-4 max-w-sm">
        <label htmlFor="q" className="sr-only">
          Tìm học viên
        </label>
        <input id="q" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Tìm theo tên, mã hoặc Gmail" className={inputCls} />
      </div>
      <Panel className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-sm">
          <thead>
            <tr className="border-b border-rule text-left text-xs text-muted">
              <th className="px-4 py-2.5 font-medium">Học viên</th>
              <th className="px-4 py-2.5 font-medium">Mã</th>
              <th className="px-4 py-2.5 font-medium">Gmail đăng nhập</th>
              <th className="px-4 py-2.5 font-medium">Lớp đang học</th>
              <th className="px-4 py-2.5 text-right font-medium">Tỉ lệ nộp bài</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-rule">
            {rows.map(({ s, classes, rate }) => (
              <tr key={s.id} className="hover:bg-surface-2">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <Avatar name={s.fullName} size={30} tone="plain" />
                    <div>
                      <div className="font-medium">{s.fullName}</div>
                      <div className="text-xs text-muted">Ghi danh {dateShort(s.joinedAt)}</div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 font-medium tabular-nums">{s.code}</td>
                <td className="px-4 py-3 text-ink-soft">{s.email}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1.5">
                    {classes.map((c) => (
                      <Link key={c.id} href={`/classes/${c.id}`} className="inline-flex items-center gap-1.5 rounded-md border border-rule px-1.5 py-0.5 text-xs hover:border-brand">
                        <ClassTypeBadge type={c.type} className="px-1 py-0" /> {c.name}
                      </Link>
                    ))}
                  </div>
                </td>
                <td className="px-4 py-3 text-right tabular-nums">
                  {rate === null ? <span className="text-muted">Chưa có</span> : `${Math.round(rate * 100)}%`}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>
    </>
  );
}
