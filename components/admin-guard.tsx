"use client";

import type { ReactNode } from "react";
import { useStore } from "@/lib/store";
import { Empty } from "./ui";

export function AdminOnly({ children }: { children: ReactNode }) {
  const { account } = useStore();
  if (account?.role !== "admin") return <Empty>Trang này chỉ dành cho quản trị viên.</Empty>;
  return <>{children}</>;
}
