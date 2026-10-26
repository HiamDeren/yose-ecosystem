"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { CLASS_TYPE_LABEL, scheduleLabel } from "@/lib/format";
import { LEVELS, levelOf, levelRank } from "@/lib/levels";
import { progressOf, rosterOf } from "@/lib/selectors";
import { useStore } from "@/lib/store";
import { CLASS_CAPACITY, type ClassGroup, type ClassType, type Weekday } from "@/lib/types";
import { IconChevron, IconPlus, IconTrash } from "../icons";
import { Avatar, Button, ClassTypeBadge, Empty, inputCls } from "../ui";
import { CapacityBar, ErrorText, Field, FilterChip, SearchBox, Sheet, useSelected } from "./common";

const STATUS: { id: ClassGroup["status"]; title: string }[] = [
  { id: "active", title: "Đang chạy" },
  { id: "upcoming", title: "Sắp khai giảng" },
  { id: "finished", title: "Đã kết thúc" },
];

const WEEKDAYS = ["Chủ nhật", "Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy"];

export function ClassesManager() {
  const { data } = useStore();
  const [id, select] = useSelected();
  const [q, setQ] = useState("");
  const [type, setType] = useState<ClassType | "all">("all");
  const [level, setLevel] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return data.classes
      .filter((c) => type === "all" || c.type === type)
      .filter((c) => !level || c.level === level)
      .filter(
        (c) =>
          !term ||
          c.name.toLowerCase().includes(term) ||
          c.code.toLowerCase().includes(term) ||
          (data.teachers.find((t) => t.id === c.teacherId)?.fullName.toLowerCase().includes(term) ?? false),
      )
      .sort((a, b) => levelRank(a.level) - levelRank(b.level) || a.name.localeCompare(b.name));
  }, [data.classes, data.teachers, q, type, level]);

  const levelStats = LEVELS.map((l) => {
    const running = data.classes.filter((c) => c.level === l.name && c.status !== "finished");
    const students = new Set(
      data.enrollments.filter((e) => running.some((c) => c.id === e.classId) && e.status === "active").map((e) => e.studentId),
    );
    return { ...l, classes: running.length, students: students.size };
  });

  return (
    <>
      {/* Tổng quan theo trình độ */}
      <section aria-label="Theo trình độ" className="mb-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {levelStats.map((l) => {
          const on = level === l.name;
          return (
            <button
              key={l.name}
              type="button"
              aria-pressed={on}
              onClick={() => setLevel(on ? null : l.name)}
              className={`rounded-xl border p-4 text-left transition ${
                on ? "border-brand bg-brand-soft" : "border-rule bg-surface hover:border-brand/40"
              }`}
            >
              <div className="flex items-baseline justify-between gap-2">
                <span className="font-semibold text-ink">{l.name}</span>
                <span className="text-xs text-muted tabular-nums">
                  {l.classes} lớp, {l.students} HV
                </span>
              </div>
              <p className="mt-1.5 text-xs leading-relaxed text-ink-soft">{l.description}</p>
            </button>
          );
        })}
      </section>

      <div className="mb-6 flex flex-wrap items-center gap-2">
        <SearchBox value={q} onChange={setQ} placeholder="Tìm lớp, mã lớp, giáo viên" />
        <div className="flex flex-wrap gap-1.5" role="group" aria-label="Loại lớp">
          <FilterChip active={type === "all"} onClick={() => setType("all")}>
            Tất cả
          </FilterChip>
          {(["ONE_ON_ONE", "ONE_ON_TWO", "GROUP"] as ClassType[]).map((t) => (
            <FilterChip key={t} active={type === t} onClick={() => setType(t)}>
              {CLASS_TYPE_LABEL[t]}
            </FilterChip>
          ))}
        </div>
        {level && (
          <FilterChip active onClick={() => setLevel(null)}>
            {level} ×
          </FilterChip>
        )}
        <Button className="ml-auto" onClick={() => select("new")}>
          <IconPlus size={16} /> Tạo lớp
        </Button>
      </div>

      <div className="space-y-10">
        {STATUS.map((st) => {
          const list = filtered.filter((c) => c.status === st.id);
          if (!list.length) return null;
          const levels = [...new Set(list.map((c) => c.level))];
          const students = new Set(
            data.enrollments.filter((e) => list.some((c) => c.id === e.classId) && e.status === "active").map((e) => e.studentId),
          );
          return (
            <section key={st.id}>
              <div className="mb-3 flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <h2 className="text-lg font-semibold tracking-tight">
                  {st.title} <span className="font-normal text-muted">{list.length} lớp</span>
                </h2>
                <p className="text-sm text-muted">
                  {students.size} học viên. Trình độ: {levels.join(", ")}.
                </p>
              </div>
              <div className="overflow-x-auto rounded-xl border border-rule bg-surface shadow-card">
                <table className="w-full min-w-[900px] text-sm">
                  <thead>
                    <tr className="border-b border-rule text-left text-xs text-muted">
                      <th className="px-4 py-2.5 font-medium">Lớp</th>
                      <th className="px-4 py-2.5 font-medium">Loại</th>
                      <th className="px-4 py-2.5 font-medium">Trình độ</th>
                      <th className="px-4 py-2.5 font-medium">Giáo viên</th>
                      <th className="px-4 py-2.5 font-medium">Lịch học</th>
                      <th className="px-4 py-2.5 font-medium">Sĩ số</th>
                      <th className="px-4 py-2.5 font-medium">Tiến độ</th>
                      <th className="w-8" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-rule">
                    {list.map((c) => {
                      const p = progressOf(data, c);
                      return (
                        <tr
                          key={c.id}
                          onClick={() => select(c.id)}
                          className={`cursor-pointer hover:bg-surface-2 ${id === c.id ? "bg-brand-soft/60" : ""}`}
                        >
                          <td className="px-4 py-3">
                            <button type="button" onClick={() => select(c.id)} className="text-left font-medium text-ink hover:text-brand">
                              {c.name}
                            </button>
                            <div className="text-xs text-muted">{c.code}</div>
                          </td>
                          <td className="px-4 py-3">
                            <ClassTypeBadge type={c.type} />
                          </td>
                          <td className="px-4 py-3">
                            <div className="text-ink">{c.level}</div>
                            {c.description && <div className="max-w-xs truncate text-xs text-muted">{c.description}</div>}
                          </td>
                          <td className="px-4 py-3 text-ink-soft">{data.teachers.find((t) => t.id === c.teacherId)?.fullName}</td>
                          <td className="px-4 py-3 text-ink-soft">{scheduleLabel(c)}</td>
                          <td className="px-4 py-3">
                            <CapacityBar used={rosterOf(data, c.id).length} cap={CLASS_CAPACITY[c.type]} />
                          </td>
                          <td className="px-4 py-3 tabular-nums text-ink-soft">
                            {p.done}/{p.total} buổi
                          </td>
                          <td className="pr-3 text-muted">
                            <IconChevron size={16} />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>
          );
        })}
        {!filtered.length && <Empty>Không có lớp nào khớp bộ lọc.</Empty>}
      </div>

      <ClassSheet id={id} onSelect={select} />
    </>
  );
}

/* ───────────── panel tạo / sửa lớp ───────────── */

function ClassSheet({ id, onSelect }: { id: string | null; onSelect: (id: string | null) => void }) {
  const { data } = useStore();
  const cls = id && id !== "new" ? data.classes.find((c) => c.id === id) : undefined;
  const open = id === "new" || !!cls;
  return (
    <Sheet
      open={open}
      onClose={() => onSelect(null)}
      title={cls ? cls.name : "Tạo lớp mới"}
      subtitle={cls ? `${cls.code}, ${CLASS_TYPE_LABEL[cls.type]}, ${cls.level}` : "Lịch buổi học sẽ được sinh tự động từ lịch tuần."}
    >
      {open && <ClassForm key={id} cls={cls} onCreated={(nid) => onSelect(nid)} />}
      {cls && <Roster cls={cls} />}
    </Sheet>
  );
}

function ClassForm({ cls, onCreated }: { cls?: ClassGroup; onCreated: (id: string) => void }) {
  const { data, createClass, updateClass } = useStore();
  const [name, setName] = useState(cls?.name ?? "");
  const [code, setCode] = useState(cls?.code ?? "");
  const [type, setType] = useState<ClassType>(cls?.type ?? "GROUP");
  const [level, setLevel] = useState(cls?.level ?? LEVELS[0].name);
  const [description, setDescription] = useState(cls?.description ?? "");
  const [teacherId, setTeacherId] = useState(cls?.teacherId ?? data.teachers[0]?.id ?? "");
  const [schedule, setSchedule] = useState<Weekday[]>(cls?.schedule ?? [{ day: 1, start: "19:30", durationMin: 90 }]);
  const [total, setTotal] = useState(String(cls?.totalSessions ?? 24));
  const [start, setStart] = useState((cls?.startDate ?? new Date().toISOString()).slice(0, 10));
  const [status, setStatus] = useState<ClassGroup["status"]>(cls?.status ?? "upcoming");
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!schedule.length) return setError("Lớp cần ít nhất 1 buổi trong tuần.");
    const input = {
      name: name.trim(),
      code: code.trim(),
      type,
      level,
      description: description.trim() || undefined,
      teacherId,
      schedule: [...schedule].sort((a, b) => ((a.day + 6) % 7) - ((b.day + 6) % 7)),
      totalSessions: Math.max(1, Number(total) || 1),
      startDate: new Date(`${start}T00:00:00`).toISOString(),
      status,
    };
    const res: { id?: string; error?: string } = cls ? updateClass(cls.id, input) : createClass(input);
    if (res.error) return setError(res.error);
    setError("");
    setSaved(true);
    if (!cls && res.id) onCreated(res.id);
  };

  return (
    <form onSubmit={submit} onChange={() => setSaved(false)} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-[1fr_10rem]">
        <Field label="Tên lớp">
          <input required value={name} onChange={(e) => setName(e.target.value)} className={inputCls} placeholder="Intern Read-Lis" />
        </Field>
        <Field label="Mã lớp">
          <input required value={code} onChange={(e) => setCode(e.target.value)} className={inputCls} placeholder="G-INT-RL-03" />
        </Field>
      </div>

      <fieldset>
        <legend className="mb-1.5 text-sm font-medium">Loại lớp</legend>
        <div className="grid grid-cols-3 gap-2">
          {(["ONE_ON_ONE", "ONE_ON_TWO", "GROUP"] as ClassType[]).map((t) => (
            <button
              key={t}
              type="button"
              aria-pressed={type === t}
              onClick={() => setType(t)}
              className={`rounded-lg border px-3 py-2 text-sm transition ${
                type === t ? "border-brand bg-brand-soft font-semibold text-brand" : "border-rule bg-surface text-ink-soft hover:bg-surface-2"
              }`}
            >
              {CLASS_TYPE_LABEL[t]}
              <span className="block text-xs font-normal text-muted">tối đa {CLASS_CAPACITY[t]}</span>
            </button>
          ))}
        </div>
      </fieldset>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Trình độ" hint={levelOf(level).description}>
          <select value={level} onChange={(e) => setLevel(e.target.value)} className={inputCls}>
            {LEVELS.map((l) => (
              <option key={l.name}>{l.name}</option>
            ))}
          </select>
        </Field>
        <Field label="Giáo viên phụ trách">
          <select value={teacherId} onChange={(e) => setTeacherId(e.target.value)} className={inputCls}>
            {data.teachers.map((t) => (
              <option key={t.id} value={t.id}>
                {t.fullName}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <Field label="Mô tả lớp">
        <textarea
          rows={2}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className={inputCls}
          placeholder="Mục tiêu, đối tượng học viên"
        />
      </Field>

      <fieldset>
        <legend className="mb-1.5 text-sm font-medium">Lịch học trong tuần</legend>
        <div className="space-y-2">
          {schedule.map((s, i) => (
            <div key={i} className="grid grid-cols-[1fr_8.5rem_6.5rem_auto] items-center gap-2">
              <select
                aria-label="Thứ"
                value={s.day}
                onChange={(e) => setSchedule((l) => l.map((x, j) => (j === i ? { ...x, day: Number(e.target.value) as Weekday["day"] } : x)))}
                className={inputCls}
              >
                {WEEKDAYS.map((w, d) => (
                  <option key={d} value={d}>
                    {w}
                  </option>
                ))}
              </select>
              <input
                aria-label="Giờ bắt đầu"
                type="time"
                value={s.start}
                onChange={(e) => setSchedule((l) => l.map((x, j) => (j === i ? { ...x, start: e.target.value } : x)))}
                className={inputCls}
              />
              <label className="relative">
                <span className="sr-only">Thời lượng (phút)</span>
                <input
                  type="number"
                  min={30}
                  step={15}
                  value={s.durationMin}
                  onChange={(e) => setSchedule((l) => l.map((x, j) => (j === i ? { ...x, durationMin: Number(e.target.value) } : x)))}
                  className={`${inputCls} pr-9`}
                />
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted">phút</span>
              </label>
              <button
                type="button"
                onClick={() => setSchedule((l) => l.filter((_, j) => j !== i))}
                className="grid h-9 w-9 place-items-center rounded-lg text-muted hover:bg-danger-soft hover:text-danger"
                aria-label="Bỏ buổi này"
              >
                <IconTrash size={15} />
              </button>
            </div>
          ))}
        </div>
        <Button
          type="button"
          variant="ghost"
          className="mt-2"
          onClick={() => setSchedule((l) => [...l, { day: 3, start: l[0]?.start ?? "19:30", durationMin: l[0]?.durationMin ?? 90 }])}
        >
          <IconPlus size={16} /> Thêm buổi trong tuần
        </Button>
      </fieldset>

      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Số buổi">
          <input type="number" min={1} required value={total} onChange={(e) => setTotal(e.target.value)} className={inputCls} />
        </Field>
        <Field label="Ngày bắt đầu">
          <input type="date" required value={start} onChange={(e) => setStart(e.target.value)} className={inputCls} />
        </Field>
        <Field label="Trạng thái">
          <select value={status} onChange={(e) => setStatus(e.target.value as ClassGroup["status"])} className={inputCls}>
            {STATUS.map((s) => (
              <option key={s.id} value={s.id}>
                {s.title}
              </option>
            ))}
          </select>
        </Field>
      </div>
      {cls && <p className="text-xs text-muted">Đổi lịch, số buổi hoặc giáo viên sẽ xếp lại các buổi chưa học. Buổi đã học giữ nguyên.</p>}

      <ErrorText>{error}</ErrorText>
      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit">{cls ? "Lưu thay đổi" : "Tạo lớp"}</Button>
        {saved && cls && <span className="text-sm text-ok">Đã lưu</span>}
        {cls && (
          <Link href={`/classes/${cls.id}`} className="ml-auto text-sm text-brand hover:underline">
            Mở trang lớp
          </Link>
        )}
      </div>
    </form>
  );
}

function Roster({ cls }: { cls: ClassGroup }) {
  const { data, enroll, unenroll } = useStore();
  const roster = rosterOf(data, cls.id);
  const cap = CLASS_CAPACITY[cls.type];
  const [pick, setPick] = useState("");
  const [error, setError] = useState("");
  const candidates = data.students
    .filter((s) => !roster.some((r) => r.id === s.id))
    .sort((a, b) => a.fullName.localeCompare(b.fullName));

  return (
    <section className="border-t border-rule pt-6">
      <h3 className="mb-3 flex items-baseline justify-between text-[0.95rem] font-semibold">
        Học viên trong lớp
        <span className="text-sm font-normal">
          <CapacityBar used={roster.length} cap={cap} />
        </span>
      </h3>
      {roster.length ? (
        <ul className="divide-y divide-rule overflow-hidden rounded-xl border border-rule bg-surface">
          {roster.map((s) => (
            <li key={s.id} className="flex items-center gap-3 px-3 py-2.5">
              <Avatar name={s.fullName} size={30} tone="plain" />
              <div className="min-w-0 flex-1">
                <Link href={`/admin/manage/students?id=${s.id}`} className="block truncate text-sm font-medium hover:text-brand">
                  {s.fullName}
                </Link>
                <div className="truncate text-xs text-muted">
                  {s.code}, {s.email}
                </div>
              </div>
              <button
                type="button"
                onClick={() => unenroll(s.id, cls.id)}
                className="rounded-md px-2 py-1 text-xs text-muted hover:bg-danger-soft hover:text-danger"
              >
                Xóa khỏi lớp
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <Empty>Lớp chưa có học viên.</Empty>
      )}

      {cls.status !== "finished" && (
        <form
          className="mt-3 flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (!pick) return;
            const res = enroll(pick, cls.id);
            setError(res.error ?? "");
            if (!res.error) setPick("");
          }}
        >
          <label className="min-w-0 flex-1">
            <span className="sr-only">Chọn học viên</span>
            <select value={pick} onChange={(e) => setPick(e.target.value)} className={inputCls} disabled={roster.length >= cap}>
              <option value="">{roster.length >= cap ? `Lớp đã đủ ${cap} học viên` : "Chọn học viên để thêm vào lớp"}</option>
              {candidates.map((s) => {
                const n = data.enrollments.filter((e) => e.studentId === s.id && e.status === "active").length;
                return (
                  <option key={s.id} value={s.id}>
                    {s.fullName} ({s.code}){n ? `, đang học ${n} lớp` : ", chưa xếp lớp"}
                  </option>
                );
              })}
            </select>
          </label>
          <Button type="submit" disabled={!pick}>
            Thêm
          </Button>
        </form>
      )}
      <div className="mt-2">
        <ErrorText>{error}</ErrorText>
      </div>
    </section>
  );
}
