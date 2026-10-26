import { Suspense } from "react";
import { SessionView } from "@/components/session-view";
import { buildMockData } from "@/lib/mock-data";

export function generateStaticParams() {
  return buildMockData().sessions.map((s) => ({ classId: s.classId, sessionId: s.id }));
}

export default function SessionPage() {
  return (
    <Suspense>
      <SessionView />
    </Suspense>
  );
}
