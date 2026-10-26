import type { ReactNode } from "react";
import { ManageShell } from "@/components/manage/common";

export default function ManageLayout({ children }: { children: ReactNode }) {
  return <ManageShell>{children}</ManageShell>;
}
