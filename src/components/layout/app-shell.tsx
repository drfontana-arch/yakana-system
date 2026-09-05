import type { ReactNode } from "react";
import { Sidebar } from "@/components/layout/sidebar";

export function AppShell({
  children,
  userEmail,
}: {
  children: ReactNode;
  userEmail: string | null;
}) {
  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      <Sidebar userEmail={userEmail} />
      <main className="flex-1 px-4 py-6 lg:px-10 lg:py-10">{children}</main>
    </div>
  );
}
