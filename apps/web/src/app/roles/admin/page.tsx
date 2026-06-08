"use client";

import { useEffect } from "react";
import Link from "next/link";

import { Button } from "@/design-system/primitives";

export default function AdminRoleRedirectPage() {
  useEffect(() => {
    window.location.replace("/admin");
  }, []);

  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-6">
      <div className="max-w-md rounded-xl border bg-card p-6 text-center shadow-[var(--shadow-surface)]">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">Admin role</p>
        <h1 className="mt-3 text-xl font-semibold">Opening VIP Admin</h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Admin users land in the operational control workspace.
        </p>
        <Button asChild className="mt-4">
          <Link href="/admin">Open Admin Workspace</Link>
        </Button>
      </div>
    </main>
  );
}
