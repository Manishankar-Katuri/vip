"use client";

import { useEffect } from "react";
import Link from "next/link";

import { Button } from "@/components/ui/button";

const previewLinks = [
  { label: "Admin home", href: "/admin" },
  { label: "Weekly analysis report", href: "/admin/reports/weekly-analysis" },
  { label: "Social intelligence", href: "/admin/intelligence/social" },
  { label: "Content strategy", href: "/strategy/content-strategy" },
];

export default function LoginPage() {
  useEffect(() => {
    window.localStorage.removeItem("vip_access_token");
    window.localStorage.removeItem("vip.selectedHospitalId");
    document.cookie = "vip_access_token=; path=/; max-age=0; SameSite=Lax";
    document.cookie = "access_token=; path=/; max-age=0; SameSite=Lax";
  }, []);

  return (
    <main className="min-h-screen bg-background">
      <section className="mx-auto flex min-h-screen max-w-3xl flex-col justify-center px-4 py-12 sm:px-6">
        <div className="rounded-lg border bg-card p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.13em] text-primary">VIP access</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight">Choose a preview workspace</h1>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            Authentication is not configured for this local preview. Use one of the public preview routes below to continue reviewing the app.
          </p>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {previewLinks.map((link) => (
              <Button key={link.href} asChild variant={link.href.includes("executive") ? "default" : "outline"}>
                <Link href={link.href}>{link.label}</Link>
              </Button>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
