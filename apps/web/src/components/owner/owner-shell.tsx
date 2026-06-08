"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowUpRight, Boxes, Menu } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { ownerNavigation } from "@/navigation/owner-navigation";
import { cn } from "@/lib/utils";

export function OwnerShell({
  title,
  eyebrow = "VIP Production OS",
  description,
  children,
  actions,
}: {
  title: string;
  eyebrow?: string;
  description: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex min-h-16 max-w-[1440px] items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
          <Link href="/overview" className="flex min-w-0 items-center gap-3">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-slate-950 text-xs font-semibold text-white">
              VIP
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-semibold">Production Command Center</span>
              <span className="block truncate text-xs text-slate-500">Workflow-first owner experience</span>
            </span>
          </Link>

          <nav className="hidden items-center gap-1 xl:flex" aria-label="Owner navigation">
            {ownerNavigation.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "inline-flex min-h-9 items-center gap-2 rounded-md px-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-950",
                  isActive(pathname, item.href) && "bg-slate-950 text-white hover:bg-slate-900 hover:text-white"
                )}
              >
                <item.icon className="size-4" aria-hidden />
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <Button asChild variant="outline" className="hidden sm:inline-flex">
              <Link href="/admin">
                Legacy admin
                <ArrowUpRight className="size-4" aria-hidden />
              </Link>
            </Button>
            <Sheet>
              <SheetTrigger asChild>
                <Button type="button" variant="outline" size="icon" className="xl:hidden" aria-label="Open owner navigation">
                  <Menu className="size-4" aria-hidden />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[340px]">
                <SheetHeader>
                  <SheetTitle>Owner Navigation</SheetTitle>
                </SheetHeader>
                <div className="mt-6 grid gap-2">
                  {ownerNavigation.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "rounded-lg border border-slate-200 p-3 text-sm transition hover:border-slate-300 hover:bg-slate-50",
                        isActive(pathname, item.href) && "border-slate-950 bg-slate-950 text-white hover:bg-slate-900"
                      )}
                    >
                      <span className="flex items-center gap-2 font-semibold">
                        <item.icon className="size-4" aria-hidden />
                        {item.label}
                      </span>
                      <span className={cn("mt-1 block text-xs leading-5 text-slate-500", isActive(pathname, item.href) && "text-slate-300")}>
                        {item.description}
                      </span>
                    </Link>
                  ))}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-[1440px] px-4 py-5 sm:px-6 lg:px-8">
        <header className="mb-5 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-sky-700">{eyebrow}</p>
              <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">{title}</h1>
              <p className="mt-2 max-w-4xl text-sm leading-6 text-slate-600">{description}</p>
            </div>
            {actions && <div className="shrink-0">{actions}</div>}
          </div>
        </header>
        {children}
      </div>
    </main>
  );
}

export function OwnerShellPage({
  title,
  description,
  connectedSystems,
  nextPhaseData,
  primaryLinks = [],
}: {
  title: string;
  description: string;
  connectedSystems: string[];
  nextPhaseData: string[];
  primaryLinks?: Array<{ label: string; href: string }>;
}) {
  return (
    <OwnerShell title={title} description={description}>
      <div className="grid gap-4 lg:grid-cols-[1fr_380px]">
        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-start gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-sky-50 text-sky-700">
              <Boxes className="size-5" aria-hidden />
            </span>
            <div>
              <h2 className="text-base font-semibold text-slate-950">Production alignment shell</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                This page is part of the final owner-facing route map. Existing systems remain preserved and will be connected here in later phases without removing legacy routes.
              </p>
            </div>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <InfoPanel title="Connects to existing systems" items={connectedSystems} />
            <InfoPanel title="Next phases will show" items={nextPhaseData} />
          </div>
        </section>

        <aside className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-base font-semibold text-slate-950">Preserved routes</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Role-based workspaces are still available while this owner structure becomes the production entry point.
          </p>
          <div className="mt-4 grid gap-2">
            {[
              { label: "Admin", href: "/admin" },
              { label: "Doctor", href: "/doctor" },
              { label: "Staff", href: "/staff" },
              { label: "Production", href: "/production" },
              ...primaryLinks,
            ].map((link) => (
              <Button key={`${link.label}-${link.href}`} asChild variant="outline" className="justify-between">
                <Link href={link.href}>
                  {link.label}
                  <ArrowUpRight className="size-4" aria-hidden />
                </Link>
              </Button>
            ))}
          </div>
        </aside>
      </div>
    </OwnerShell>
  );
}

function InfoPanel({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
      <h3 className="text-sm font-semibold text-slate-950">{title}</h3>
      <ul className="mt-3 space-y-2">
        {items.map((item) => (
          <li key={item} className="flex gap-2 text-sm leading-5 text-slate-600">
            <span className="mt-2 size-1.5 shrink-0 rounded-full bg-sky-600" aria-hidden />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

function isActive(pathname: string, href: string) {
  if (href === "/overview") return pathname === "/" || pathname === "/overview";
  return pathname === href || pathname.startsWith(`${href}/`);
}

