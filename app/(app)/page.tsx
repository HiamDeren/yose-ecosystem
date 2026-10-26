"use client";

import { AdminHome, StudentHome, TeacherHome } from "@/components/dashboards";
import { useStore } from "@/lib/store";

export default function HomePage() {
  const { account } = useStore();
  if (!account) return null;
  if (account.role === "student") return <StudentHome account={account} />;
  if (account.role === "teacher") return <TeacherHome account={account} />;
  return <AdminHome />;
}
