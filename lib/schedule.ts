import type { ClassGroup, ClassSession } from "./types";

const DAY = 86_400_000;

/**
 * Sinh danh sách buổi học từ lịch tuần của lớp.
 * `fromIndex` cho phép sinh tiếp sau các buổi đã học khi admin đổi lịch.
 */
export function generateSessions(
  c: Pick<ClassGroup, "id" | "schedule" | "totalSessions" | "startDate" | "teacherId">,
  opts: { fromIndex?: number; from?: Date; now?: number; topic?: (i: number) => string } = {},
): ClassSession[] {
  const out: ClassSession[] = [];
  if (!c.schedule.length) return out;
  let index = opts.fromIndex ?? 0;
  let cursor = new Date(opts.from ?? c.startDate);
  cursor.setHours(0, 0, 0, 0);
  const now = opts.now ?? Date.now();
  let guard = 0;
  while (index < c.totalSessions && guard++ < 2000) {
    const slot = c.schedule.find((s) => s.day === cursor.getDay());
    if (slot) {
      const [h, m] = slot.start.split(":").map(Number);
      const start = new Date(cursor);
      start.setHours(h, m, 0, 0);
      if (!opts.from || start.getTime() > (opts.from as Date).getTime()) {
        index += 1;
        out.push({
          id: `${c.id}-b${index}`,
          classId: c.id,
          index,
          date: start.toISOString(),
          durationMin: slot.durationMin,
          topic: opts.topic?.(index) ?? `Buổi ${index}`,
          teacherId: c.teacherId,
          status: start.getTime() + slot.durationMin * 60_000 < now ? "done" : "scheduled",
        });
      }
    }
    cursor = new Date(cursor.getTime() + DAY);
  }
  return out;
}
