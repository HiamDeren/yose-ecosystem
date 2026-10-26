"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { dateShort } from "@/lib/format";
import { canManageRoster, homeworkForStudent, isAdmin, rosterOf } from "@/lib/selectors";
import { useStore } from "@/lib/store";
import { CLASS_CAPACITY, type ClassGroup, type Student } from "@/lib/types";
import { IconChevron, IconPlus } from "../icons";
import { Avatar, Button, ClassTypeBadge, Empty, inputCls } from "../ui";
import { ErrorText, Field, FilterChip, SearchBox, Sheet, useSelected } from "./common";

type Filter = "all" | "learning" | "unassigned";

function classesOf(data: ReturnType<typeof useStore>["data"], studentId: string) {
  const ids = data.enrollments.filter((e) => e.studentId === studentId && e.status === "active").map((e) => e.classId);
  const list = data.classes.filter((c) => ids.includes(c.id));
  return {
    current: list.filter((c) => c.status !== "finished"),
    past: list.filter((c) => c.status === "finished"),
  };
}

function stats(data: ReturnType<typeof useStore>["data"], studentId: string) {
  const hw = homeworkForStudent(data, studentId);
  const done = hw.filter((h) => h.state === "submitted" || h.state === "reviewed").length;
  const scores = data.submissions
    .filter((s) => s.studentId === studentId && s.score !== undefined)
    .map((s) => s.score!);
  return {
    rate: hw.length ? done / hw.length : null,
    avg: scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : null,
    total: hw.length,
    done,
  };
}

export function StudentsManager() {
  const { data, account } = useStore();
  const admin = isAdmin(account);
  const [id, select] = useSelected();
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [classId, setClassId] = useState("");

  const rows = useMemo(() => {
    const term = q.trim().toLowerCase();
    return data.students
      .map((s) => ({ s, ...classesOf(data, s.id), st: stats(data, s.id) }))
      .filter((r) => filter === "all" || (filter === "learning" ? r.current.length > 0 : r.current.length === 0))
      .filter((r) => !classId || r.current.some((c) => c.id === classId) || r.past.some((c) => c.id === classId))
      .filter(
        (r) =>
          !term ||
          r.s.fullName.toLowerCase().includes(term) ||
          r.s.code.toLowerCase().includes(term) ||
          r.s.email.toLowerCase().includes(term) ||
          (r.s.phone ?? "").includes(term),
      )
      .sort((a, b) => a.s.code.localeCompare(b.s.code));
  }, [data, q, filter, classId]);

  const learning = data.students.filter((s) => classesOf(data, s.id).current.length > 0).length;

  return (
    <>
      <div className="mb-6 flex flex-wrap items-center gap-2">
        <SearchBox value={q} onChange={setQ} placeholder="Tìm tên, mã, Gmail, SĐT" />
        <div className="flex flex-wrap gap-1.5" role="group" aria-label="Trạng thái">
          <FilterChip active={filter === "all"} onClick={() => setFilter("all")}>
            Tất cả {data.students.length}
          </FilterChip>
          <FilterChip active={filter === "learning"} onClick={() => setFilter("learning")}>
            Đang học {learning}
          </FilterChip>
          <FilterChip active={filter === "unassigned"} onClick={() => setFilter("unassigned")}>
            Chưa xếp lớp {data.students.length - learning}
          </FilterChip>
        </div>
        <label className="w-full sm:w-56">
          <span className="sr-only">Lọc theo lớp</span>
          <select value={classId} onChange={(e) => setClassId(e.target.value)} className={inputCls}>
            <option value="">Mọi lớp</option>
            {data.classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        {admin && (
          <Button className="ml-auto" onClick={() => select("new")}>
            <IconPlus size={16} /> Thêm học viên
          </Button>
        )}
      </div>

      {rows.length ? (
        <div className="overflow-x-auto rounded-xl border border-rule bg-surface shadow-card">
          <table className="w-full min-w-[860px] text-sm">
            <thead>
              <tr className="border-b border-rule text-left text-xs text-muted">
                <th className="px-4 py-2.5 font-medium">Mã</th>
                <th className="px-4 py-2.5 font-medium">Học viên</th>
                <th className="px-4 py-2.5 font-medium">Số điện thoại</th>
                <th className="px-4 py-2.5 font-medium">Đang học</th>
                <th className="px-4 py-2.5 text-right font-medium">Nộp bài</th>
                <th className="px-4 py-2.5 text-right font-medium">Điểm TB</th>
                <th className="w-8" />
              </tr>
            </thead>
            <tbody className="divide-y divide-rule">
              {rows.map(({ s, current, st }) => (
                <tr
                  key={s.id}
                  onClick={() => select(s.id)}
                  className={`cursor-pointer hover:bg-surface-2 ${id === s.id ? "bg-brand-soft/60" : ""}`}
                >
                  <td className="px-4 py-3 font-medium tabular-nums">{s.code}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar name={s.fullName} size={30} tone="plain" />
                      <div className="min-w-0">
                        <button type="button" onClick={() => select(s.id)} className="text-left font-medium text-ink hover:text-brand">
                          {s.fullName}
                        </button>
                        <div className="truncate text-xs text-muted">{s.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 tabular-nums text-ink-soft">{s.phone ?? "–"}</td>
                  <td className="px-4 py-3">
                    {current.length ? (
                      <div className="flex flex-wrap gap-1.5">
                        {current.map((c) => (
                          <span key={c.id} className="inline-flex items-center gap-1.5 rounded-md border border-rule px-1.5 py-0.5 text-xs">
                            <ClassTypeBadge type={c.type} className="px-1 py-0" /> {c.name}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="hl text-xs text-ink">Chưa xếp lớp</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-ink-soft">
                    {st.rate === null ? "–" : `${Math.round(st.rate * 100)}%`}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-ink-soft">{st.avg === null ? "–" : st.avg.toFixed(1)}</td>
                  <td className="pr-3 text-muted">
                    <IconChevron size={16} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <Empty>Không có học viên nào khớp bộ lọc.</Empty>
      )}

      <StudentSheet id={id} onSelect={select} />
    </>
  );
}

/* ───────────── panel học viên ───────────── */

function StudentSheet({ id, onSelect }: { id: string | null; onSelect: (id: string | null) => void }) {
  const { data, account } = useStore();
  const admin = isAdmin(account);
  const student = id && id !== "new" ? data.students.find((s) => s.id === id) : undefined;
  const open = (id === "new" && admin) || !!student;
  return (
    <Sheet
      open={open}
      onClose={() => onSelect(null)}
      title={student ? student.fullName : "Thêm học viên"}
      subtitle={
        student
          ? `${student.code}, ghi danh ${dateShort(student.joinedAt)}`
          : "Mã học viên được cấp tự động. Gmail dùng để đăng nhập bằng Google."
      }
    >
      {open && <StudentForm key={id} student={student} readOnly={!admin} onCreated={(nid) => onSelect(nid)} />}
      {student && <Enrollments student={student} />}
    </Sheet>
  );
}

function StudentForm({
  student,
  readOnly,
  onCreated,
}: {
  student?: Student;
  readOnly?: boolean;
  onCreated: (id: string) => void;
}) {
  const { createStudent, updateStudent } = useStore();
  const [fullName, setFullName] = useState(student?.fullName ?? "");
  const [email, setEmail] = useState(student?.email ?? "");
  const [phone, setPhone] = useState(student?.phone ?? "");
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  return (
    <form
      className="space-y-4"
      onChange={() => setSaved(false)}
      onSubmit={(e) => {
        e.preventDefault();
        const input = { fullName: fullName.trim(), email: email.trim(), phone: phone.trim() || undefined };
        const res: { id?: string; error?: string } = student ? updateStudent(student.id, input) : createStudent(input);
        if (res.error) return setError(res.error);
        setError("");
        setSaved(true);
        if (!student && res.id) onCreated(res.id);
      }}
    >
      <fieldset disabled={readOnly} className="space-y-4">
      <Field label="Họ và tên">
        <input required value={fullName} onChange={(e) => setFullName(e.target.value)} className={inputCls} placeholder="Nguyễn Văn A" />
      </Field>
      <div className="grid gap-4 sm:grid-cols-[1fr_11rem]">
        <Field label="Gmail đăng nhập" hint="Lấy từ form đăng ký học">
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className={inputCls} placeholder="ten@gmail.com" />
        </Field>
        <Field label="Số điện thoại">
          <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className={inputCls} placeholder="09…" />
        </Field>
      </div>
      </fieldset>
      <ErrorText>{error}</ErrorText>
      <div className="flex items-center gap-3">
        {readOnly ? (
          <p className="text-xs text-muted">Thông tin học viên do quản trị viên quản lý.</p>
        ) : (
          <Button type="submit">{student ? "Lưu thay đổi" : "Thêm học viên"}</Button>
        )}
        {saved && student && <span className="text-sm text-ok">Đã lưu</span>}
      </div>
    </form>
  );
}

function Enrollments({ student }: { student: Student }) {
  const { data, account, enroll, unenroll } = useStore();
  const { current, past } = classesOf(data, student.id);
  const st = stats(data, student.id);
  const [pick, setPick] = useState("");
  const [error, setError] = useState("");
  // Giáo viên chỉ xếp được vào lớp mình phụ trách
  const options = data.classes.filter(
    (c) => c.status !== "finished" && !current.some((x) => x.id === c.id) && canManageRoster(data, account, c.id),
  );

  return (
    <>
      <section className="border-t border-rule pt-6">
        <h3 className="mb-3 text-[0.95rem] font-semibold">
          Đang học <span className="font-normal text-muted">{current.length} lớp</span>
        </h3>
        {current.length ? (
          <ul className="space-y-2">
            {current.map((c) => (
              <ClassRow
                key={c.id}
                c={c}
                action={canManageRoster(data, account, c.id) ? () => unenroll(student.id, c.id) : undefined}
              />
            ))}
          </ul>
        ) : (
          <Empty>Học viên chưa được xếp vào lớp nào.</Empty>
        )}

        <form
          className="mt-3 flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (!pick) return;
            const res = enroll(student.id, pick);
            setError(res.error ?? "");
            if (!res.error) setPick("");
          }}
        >
          <label className="min-w-0 flex-1">
            <span className="sr-only">Chọn lớp</span>
            <select value={pick} onChange={(e) => setPick(e.target.value)} className={inputCls}>
              <option value="">{options.length ? "Xếp vào lớp…" : "Không còn lớp nào bạn có thể xếp"}</option>
              {options.map((c) => {
                const left = CLASS_CAPACITY[c.type] - rosterOf(data, c.id).length;
                return (
                  <option key={c.id} value={c.id} disabled={left <= 0}>
                    {c.name} ({c.level}){left <= 0 ? ", đã đủ" : `, còn ${left} chỗ`}
                  </option>
                );
              })}
            </select>
          </label>
          <Button type="submit" disabled={!pick}>
            Xếp lớp
          </Button>
        </form>
        <div className="mt-2">
          <ErrorText>{error}</ErrorText>
        </div>
      </section>

      {past.length > 0 && (
        <section>
          <h3 className="mb-3 text-[0.95rem] font-semibold">
            Đã học <span className="font-normal text-muted">{past.length} lớp</span>
          </h3>
          <ul className="space-y-2">
            {past.map((c) => (
              <ClassRow key={c.id} c={c} />
            ))}
          </ul>
        </section>
      )}

      <section>
        <h3 className="mb-3 text-[0.95rem] font-semibold">Học tập</h3>
        <dl className="grid grid-cols-3 gap-px overflow-hidden rounded-xl border border-rule bg-rule text-center">
          <div className="bg-surface px-3 py-3">
            <dt className="text-xs text-muted">Bài đã nộp</dt>
            <dd className="mt-0.5 text-lg font-semibold tabular-nums">
              {st.done}
              <span className="text-sm font-normal text-muted">/{st.total}</span>
            </dd>
          </div>
          <div className="bg-surface px-3 py-3">
            <dt className="text-xs text-muted">Tỉ lệ nộp</dt>
            <dd className="mt-0.5 text-lg font-semibold tabular-nums">{st.rate === null ? "–" : `${Math.round(st.rate * 100)}%`}</dd>
          </div>
          <div className="bg-surface px-3 py-3">
            <dt className="text-xs text-muted">Điểm TB</dt>
            <dd className="mt-0.5 text-lg font-semibold tabular-nums">{st.avg === null ? "–" : st.avg.toFixed(1)}</dd>
          </div>
        </dl>
      </section>
    </>
  );
}

function ClassRow({ c, action }: { c: ClassGroup; action?: () => void }) {
  const { data } = useStore();
  return (
    <li className="flex items-center gap-3 rounded-xl border border-rule bg-surface px-3 py-2.5">
      <ClassTypeBadge type={c.type} />
      <div className="min-w-0 flex-1">
        <Link href={`/manage/classes?id=${c.id}`} className="block truncate text-sm font-medium hover:text-brand">
          {c.name}
        </Link>
        <div className="truncate text-xs text-muted">
          {c.level}, {data.teachers.find((t) => t.id === c.teacherId)?.fullName}
        </div>
      </div>
      {action && (
        <button type="button" onClick={action} className="rounded-md px-2 py-1 text-xs text-muted hover:bg-danger-soft hover:text-danger">
          Rút khỏi lớp
        </button>
      )}
    </li>
  );
}
