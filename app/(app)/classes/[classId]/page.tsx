import { Suspense } from "react";
import { ClassView } from "@/components/class-view";
import { buildMockData } from "@/lib/mock-data";

// Cần cho bản static export (preview); khi có DB thật có thể bỏ.
export function generateStaticParams() {
  return buildMockData().classes.map((c) => ({ classId: c.id }));
}

export default function ClassPage() {
  return (
    <Suspense>
      <ClassView />
    </Suspense>
  );
}
