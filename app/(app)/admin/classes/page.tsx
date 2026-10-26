"use client";

import Link from "next/link";
import { AdminOnly } from "@/components/admin-guard";
import { ClassTile } from "@/components/class-tile";
import { PageHeader, SectionTitle } from "@/components/ui";
import { useStore } from "@/lib/store";
import type { ClassType } from "@/lib/types";

const GROUPS: { type: ClassType; title: string }[] = [
  { type: "ONE_ON_ONE", title: "Lớp 1-1" },
  { type: "ONE_ON_TWO", title: "Lớp 1-2" },
  { type: "GROUP", title: "Lớp nhóm (tối đa 12 người)" },
];

export default function ClassesPage() {
  return (
    <AdminOnly>
      <Classes />
    </AdminOnly>
  );
}

function Classes() {
  const { data } = useStore();
  return (
    <>
      <PageHeader
        title="Lớp học"
        sub={`${data.classes.length} lớp đang mở. Mở một lớp để xem buổi học, note và homework như giáo viên.`}
        aside={
          <Link href="/admin/students" className="text-sm text-brand hover:underline">
            Danh sách học viên
          </Link>
        }
      />
      <div className="space-y-10">
        {GROUPS.map((g) => {
          const list = data.classes.filter((c) => c.type === g.type);
          return (
            <section key={g.type}>
              <SectionTitle aside={`${list.length} lớp`}>{g.title}</SectionTitle>
              <div className="grid gap-4 md:grid-cols-2">
                {list.map((c) => (
                  <ClassTile key={c.id} cls={c} />
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </>
  );
}
