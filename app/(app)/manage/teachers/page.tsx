import { Suspense } from "react";
import { AdminOnly } from "@/components/manage/common";
import { TeachersManager } from "@/components/manage/teachers-manager";

export default function Page() {
  return (
    <Suspense>
      <AdminOnly>
        <TeachersManager />
      </AdminOnly>
    </Suspense>
  );
}
