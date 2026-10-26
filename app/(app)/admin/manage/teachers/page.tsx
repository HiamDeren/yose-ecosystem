import { Suspense } from "react";
import { TeachersManager } from "@/components/manage/teachers-manager";

export default function Page() {
  return (
    <Suspense>
      <TeachersManager />
    </Suspense>
  );
}
