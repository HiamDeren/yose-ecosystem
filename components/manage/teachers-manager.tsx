"use client";

import Link from "next/link";
import { useState } from "react";
import { vnd } from "@/lib/format";
import { rosterOf, teachingHours } from "@/lib/selectors";
import { useStore } from "@/lib/store";
import type { Teacher } from "@/lib/types";
import { IconChevron, IconPlus } from "../icons";
import { Avatar, Button, ClassTypeBadge, Empty, inputCls } from "../ui";
import { ErrorText, Field, SearchBox, Sheet, useSelected } from "./common";

function monthRange(offset: number, now: number) {
  const d = new Date(now);
  const from = new Date(d.getFullYear(), d.getMonth() + offset, 1);
  const to = new Date(d.getFullYear(), d.getMonth() + offset + 1, 1);
  return { from, to, label: `Tháng ${from.getMonth() + 1}/${from.getFullYear()}` };
}

export function TeachersManager() {
  const { data, now } = useStore();
  const [id, select] = useSelected();
  const [q, setQ] = useState("");
  const cur = monthRange(0, now);
  const prev = monthRange(-1, now);
  const term = q.trim().toLowerCase();
  const list = data.teachers.filter(
    (t) => !term || t.fullName.toLowerCase().includes(term) || t.email.toLowerCase().includes(term),
  );

  return (
    <>
      <div className="mb-6 flex flex-wrap items-center gap-2">
        <SearchBox value={q} onChange={setQ} placeholder="Tìm giáo viên" />
        <p className="text-sm text-muted">Giờ dạy tính từ các buổi đã dạy; dạy thay được cộng cho người dạy thực tế.</p>
        <Button className="ml-auto" onClick={() => select("new")}>
          <IconPlus size={16} /> Thêm giáo viên
        </Button>
      </div>

      {list.length ? (
        <div className="overflow-x-auto rounded-xl border border-rule bg-surface shadow-card">
          <table className="w-full min-w-[900px] text-sm">
            <thead>
              <tr className="border-b border-rule text-left text-xs text-muted">
                <th className="px-4 py-2.5 font-medium">Giáo viên</th>
                <th className="px-4 py-2.5 font-medium">Lớp phụ trách</th>
                <th className="px-4 py-2.5 text-right font-medium">Học viên</th>
                <th className="px-4 py-2.5 text-right font-medium">{prev.label}</th>
                <th className="px-4 py-2.5 text-right font-medium">{cur.label}</th>
                <th className="px-4 py-2.5 text-right font-medium">Lương tạm tính</th>
                <th className="w-8" />
              </tr>
            </thead>
            <tbody className="divide-y divide-rule">
              {list.map((t) => {
                const classes = data.classes.filter((c) => c.teacherId === t.id && c.status !== "finished");
                const students = new Set(classes.flatMap((c) => rosterOf(data, c.id).map((s) => s.id)));
                const a = teachingHours(data, t.id, prev.from, prev.to);
                const b = teachingHours(data, t.id, cur.from, cur.to);
                return (
                  <tr
                    key={t.id}
                    onClick={() => select(t.id)}
                    className={`cursor-pointer align-top hover:bg-surface-2 ${id === t.id ? "bg-brand-soft/60" : ""}`}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar name={t.fullName} size={30} />
                        <div className="min-w-0">
                          <button type="button" onClick={() => select(t.id)} className="text-left font-medium hover:text-brand">
                            {t.fullName}
                          </button>
                          <div className="truncate text-xs text-muted">
                            {t.email}
                            {t.hourlyRate ? `, ${vnd(t.hourlyRate)}/giờ` : ""}
                          </div>
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
                        {!classes.length && <span className="text-xs text-muted">Chưa phụ trách lớp nào</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">{students.size}</td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {a.hours.toFixed(1)} giờ<div className="text-xs text-muted">{a.sessions} buổi</div>
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {b.hours.toFixed(1)} giờ<div className="text-xs text-muted">{b.sessions} buổi</div>
                    </td>
                    <td className="px-4 py-3 text-right font-medium tabular-nums">
                      {t.hourlyRate ? vnd(b.hours * t.hourlyRate) : "–"}
                    </td>
                    <td className="pr-3 pt-4 text-muted">
                      <IconChevron size={16} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <Empty>Không có giáo viên nào khớp.</Empty>
      )}

      <TeacherSheet id={id} onSelect={select} />
    </>
  );
}

function TeacherSheet({ id, onSelect }: { id: string | null; onSelect: (id: string | null) => void }) {
  const { data } = useStore();
  const teacher = id && id !== "new" ? data.teachers.find((t) => t.id === id) : undefined;
  const open = id === "new" || !!teacher;
  const classes = teacher ? data.classes.filter((c) => c.teacherId === teacher.id) : [];
  return (
    <Sheet
      open={open}
      onClose={() => onSelect(null)}
      title={teacher ? teacher.fullName : "Thêm giáo viên"}
      subtitle={teacher ? teacher.email : "Email dùng để giáo viên đăng nhập bằng Google."}
    >
      {open && <TeacherForm key={id} teacher={teacher} onCreated={(nid) => onSelect(nid)} />}
      {teacher && (
        <section className="border-t border-rule pt-6">
          <h3 className="mb-3 text-[0.95rem] font-semibold">
            Lớp phụ trách <span className="font-normal text-muted">{classes.length}</span>
          </h3>
          {classes.length ? (
            <ul className="space-y-2">
              {classes.map((c) => (
                <li key={c.id} className="flex items-center gap-3 rounded-xl border border-rule bg-surface px-3 py-2.5">
                  <ClassTypeBadge type={c.type} />
                  <div className="min-w-0 flex-1">
                    <Link href={`/admin/manage/classes?id=${c.id}`} className="block truncate text-sm font-medium hover:text-brand">
                      {c.name}
                    </Link>
                    <div className="text-xs text-muted">
                      {c.level}, {c.status === "finished" ? "đã kết thúc" : c.status === "upcoming" ? "sắp khai giảng" : "đang chạy"}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <Empty>Đổi giáo viên phụ trách trong panel của từng lớp.</Empty>
          )}
        </section>
      )}
    </Sheet>
  );
}

function TeacherForm({ teacher, onCreated }: { teacher?: Teacher; onCreated: (id: string) => void }) {
  const { createTeacher, updateTeacher } = useStore();
  const [fullName, setFullName] = useState(teacher?.fullName ?? "");
  const [email, setEmail] = useState(teacher?.email ?? "");
  const [rate, setRate] = useState(teacher?.hourlyRate ? String(teacher.hourlyRate) : "");
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  return (
    <form
      className="space-y-4"
      onChange={() => setSaved(false)}
      onSubmit={(e) => {
        e.preventDefault();
        const input = { fullName: fullName.trim(), email: email.trim(), hourlyRate: rate ? Number(rate) : undefined };
        const res: { id?: string; error?: string } = teacher ? updateTeacher(teacher.id, input) : createTeacher(input);
        if (res.error) return setError(res.error);
        setError("");
        setSaved(true);
        if (!teacher && res.id) onCreated(res.id);
      }}
    >
      <Field label="Họ và tên">
        <input required value={fullName} onChange={(e) => setFullName(e.target.value)} className={inputCls} />
      </Field>
      <div className="grid gap-4 sm:grid-cols-[1fr_11rem]">
        <Field label="Email đăng nhập">
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className={inputCls} />
        </Field>
        <Field label="Lương mỗi giờ (₫)">
          <input type="number" min={0} step={10000} value={rate} onChange={(e) => setRate(e.target.value)} className={inputCls} />
        </Field>
      </div>
      <ErrorText>{error}</ErrorText>
      <div className="flex items-center gap-3">
        <Button type="submit">{teacher ? "Lưu thay đổi" : "Thêm giáo viên"}</Button>
        {saved && teacher && <span className="text-sm text-ok">Đã lưu</span>}
      </div>
    </form>
  );
}
