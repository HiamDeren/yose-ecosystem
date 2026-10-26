import { Suspense } from "react";
import { StudentsManager } from "@/components/manage/students-manager";

export default function Page() {
  return (
    <Suspense>
      <StudentsManager />
    </Suspense>
  );
}
