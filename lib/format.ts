import type { ClassGroup, ClassType } from "./types";

const WD_SHORT = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
const WD_LONG = ["Chủ nhật", "Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy"];

export const CLASS_TYPE_LABEL: Record<ClassType, string> = {
  ONE_ON_ONE: "1-1",
  ONE_ON_TWO: "1-2",
  GROUP: "Nhóm 12",
};

const pad = (n: number) => String(n).padStart(2, "0");

export function dateShort(iso: string) {
  const d = new Date(iso);
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}`;
}

export function dateLong(iso: string) {
  const d = new Date(iso);
  return `${WD_LONG[d.getDay()]}, ${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
}

export function weekdayShort(iso: string) {
  return WD_SHORT[new Date(iso).getDay()];
}

export function time(iso: string) {
  const d = new Date(iso);
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function scheduleLabel(c: ClassGroup) {
  const days = c.schedule.map((s) => WD_SHORT[s.day]).join(", ");
  const starts = [...new Set(c.schedule.map((s) => s.start))].join(" / ");
  return `${days} lúc ${starts}`;
}

/** "còn 2 ngày", "hôm nay", "quá hạn 3 ngày" */
export function dueLabel(iso: string, now = Date.now()) {
  const diff = new Date(iso).getTime() - now;
  const days = Math.round(Math.abs(diff) / 86_400_000);
  const hours = Math.round(Math.abs(diff) / 3_600_000);
  if (diff >= 0) {
    if (hours < 24) return `còn ${Math.max(hours, 1)} giờ`;
    return `còn ${days} ngày`;
  }
  if (hours < 24) return `quá hạn ${Math.max(hours, 1)} giờ`;
  return `quá hạn ${days} ngày`;
}

export function relativeDay(iso: string, now = new Date()) {
  const a = new Date(iso);
  a.setHours(0, 0, 0, 0);
  const b = new Date(now);
  b.setHours(0, 0, 0, 0);
  const diff = Math.round((a.getTime() - b.getTime()) / 86_400_000);
  if (diff === 0) return "Hôm nay";
  if (diff === 1) return "Ngày mai";
  if (diff === -1) return "Hôm qua";
  if (diff > 1 && diff < 7) return `${diff} ngày nữa`;
  return dateShort(iso);
}

export function vnd(n: number) {
  return new Intl.NumberFormat("vi-VN").format(n) + " ₫";
}

export function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  return (parts[0][0] + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase();
}
