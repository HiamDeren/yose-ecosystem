"use client";

import { AdminOnly } from "@/components/admin-guard";
import { Avatar, ClassTypeBadge, PageHeader, Panel } from "@/components/ui";
import { vnd } from "@/lib/format";
import { teachingHours } from "@/lib/selectors";
import { useStore } from "@/lib/store";

export default function TeachersPage() {
  return (
    <AdminOnly>
      <Teachers />
    </AdminOnly>
  );
}

function monthRange(offset: number) {
  const now = new Date();
  const from = new Date(now.getFullYear(), now.getMonth() + offset, 1);
  const to = new Date(now.getFullYear(), now.getMonth() + offset + 1, 1);
  return { from, to, label: `Tháng ${from.getMonth() + 1}/${from.getFullYear()}` };
}

function Teachers() {
  const { data } = useStore();
  const cur = monthRange(0);
  const prev = monthRange(-1);

  return (
    <>
      <PageHeader
        title="Giáo viên và giờ dạy"
        sub="Giờ dạy tính tự động từ các buổi đã dạy. Bảng lương, dạy thay và duyệt chi sẽ làm ở giai đoạn 2."
      />
      <Panel className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-sm">
          <thead>
            <tr className="border-b border-rule text-left text-xs text-muted">
              <th className="px-4 py-2.5 font-medium">Giáo viên</th>
              <th className="px-4 py-2.5 font-medium">Lớp phụ trách</th>
              <th className="px-4 py-2.5 text-right font-medium">{prev.label}</th>
              <th className="px-4 py-2.5 text-right font-medium">{cur.label} (đến hôm nay)</th>
              <th className="px-4 py-2.5 text-right font-medium">Lương tạm tính {cur.label.toLowerCase()}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-rule">
            {data.teachers.map((t) => {
              const a = teachingHours(data, t.id, prev.from, prev.to);
              const b = teachingHours(data, t.id, cur.from, cur.to);
              const classes = data.classes.filter((c) => c.teacherId === t.id);
              return (
                <tr key={t.id} className="align-top hover:bg-surface-2">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar name={t.fullName} size={30} />
                      <div>
                        <div className="font-medium">{t.fullName}</div>
                        <div className="text-xs text-muted">{t.hourlyRate ? `${vnd(t.hourlyRate)}/giờ` : "Chưa đặt mức"}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-1">
                      {classes.map((c) => (
                        <span key={c.id} className="inline-flex items-center gap-1.5 text-xs text-ink-soft">
                          <ClassTypeBadge type={c.type} className="px-1 py-0" /> {c.name}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    {a.hours.toFixed(1)} giờ
                    <div className="text-xs text-muted">{a.sessions} buổi</div>
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    {b.hours.toFixed(1)} giờ
                    <div className="text-xs text-muted">{b.sessions} buổi</div>
                  </td>
                  <td className="px-4 py-3 text-right font-medium tabular-nums">
                    {t.hourlyRate ? vnd(b.hours * t.hourlyRate) : "–"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Panel>
      <p className="mt-4 max-w-prose text-sm text-muted">
        Mỗi buổi học lưu giáo viên thực dạy và thời lượng, nên khi có dạy thay, giờ được cộng đúng người. Đây là nền
        cho module lương sau này.
      </p>
    </>
  );
}
