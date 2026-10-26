import { Suspense } from "react";
import { ClassesManager } from "@/components/manage/classes-manager";

export default function Page() {
  return (
    <Suspense>
      <ClassesManager />
    </Suspense>
  );
}
