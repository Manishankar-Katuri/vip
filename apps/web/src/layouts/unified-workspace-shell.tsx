"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, ChevronRight, Menu, Search } from "lucide-react";

import { HospitalSwitcher } from "@/components/hospital-switcher";
import { Button, Drawer, DrawerContent, DrawerTitle, StatusIndicator } from "@/design-system/primitives";
import { cn } from "@/lib/utils";

export type UnifiedNavigationItem = {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  description?: string;
};

export type UnifiedNavigationSection = {
  title: string;
  items: UnifiedNavigationItem[];
};

export function activeForPath(pathname: string, href: string) {
  if (href === "/" || href === "/admin" || href === "/production" || href === "/doctor" || href === "/staff" || href === "/today") {
    return pathname === href;
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export function findActiveNavigation(
  sections: UnifiedNavigationSection[],
  pathname: string
) {
  for (const section of sections) {
    const item = section.items.find((candidate) => activeForPath(pathname, candidate.href));
    if (item) return { section, item };
  }

  return null;
}

export function WorkspaceFrame({
  workspaceLabel,
  workspaceDescription,
  workspaceHref,
  navSections,
  children,
  hospitalName,
  workspaceSelector,
  userLabel,
  userRole,
  statusLabel = "Governed",
  sidebarFooter,
  topBarAction,
}: {
  workspaceLabel: string;
  workspaceDescription: string;
  workspaceHref: string;
  navSections: UnifiedNavigationSection[];
  children: React.ReactNode;
  hospitalName?: string;
  workspaceSelector?: React.ReactNode;
  userLabel?: string;
  userRole?: string;
  statusLabel?: string;
  sidebarFooter?: React.ReactNode;
  topBarAction?: React.ReactNode;
}) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const active = findActiveNavigation(navSections, pathname);
  const activeSection = active?.section.title ?? "Workspace";
  const activeItem = active?.item.title ?? workspaceLabel;

  const navigation = <WorkspaceSidebarContent sections={navSections} pathname={pathname} onNavigate={() => setMobileOpen(false)} />;

  return (
    <div className="min-h-screen bg-slate-100 text-slate-950">
      <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-white focus:p-3">
        Skip to content
      </a>

      <aside className="fixed inset-y-0 left-0 z-40 hidden w-72 flex-col border-r border-slate-200 bg-white lg:flex">
        <WorkspaceBrand href={workspaceHref} label={workspaceLabel} description={workspaceDescription} />
        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
          {navigation}
        </div>
        <div className="border-t border-slate-200 p-4">
          {sidebarFooter ?? (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <p className="text-xs font-medium text-slate-500">Workspace</p>
              <p className="mt-1 truncate text-sm font-semibold text-slate-900">{hospitalName ?? workspaceDescription}</p>
            </div>
          )}
        </div>
      </aside>

      <Drawer open={mobileOpen} onOpenChange={setMobileOpen}>
        <DrawerContent side="left" className="w-[300px] border-slate-200 bg-white p-0">
          <DrawerTitle className="sr-only">{workspaceLabel} navigation</DrawerTitle>
          <WorkspaceBrand href={workspaceHref} label={workspaceLabel} description={workspaceDescription} />
          <div className="max-h-[calc(100vh-5rem)] overflow-y-auto px-4 py-4">{navigation}</div>
        </DrawerContent>
      </Drawer>

      <div className="lg:pl-72">
        <WorkspaceTopBar
          activeSection={activeSection}
          activeItem={activeItem}
          hospitalName={hospitalName}
          userLabel={userLabel}
          userRole={userRole}
          statusLabel={statusLabel}
          workspaceSelector={workspaceSelector}
          topBarAction={topBarAction}
          onOpenMobileNav={() => setMobileOpen(true)}
        />
        <main id="main-content" className="min-h-[calc(100vh-4rem)] min-w-0 px-4 py-5 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-[1440px] space-y-5">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

function WorkspaceBrand({ href, label, description }: { href: string; label: string; description: string }) {
  return (
    <div className="border-b border-slate-200 p-4">
      <Link href={href} className="flex min-h-12 items-center gap-3 rounded-xl">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-slate-950 text-sm font-semibold text-white">VIP</span>
        <span className="min-w-0">
          <span className="block truncate text-base font-semibold text-slate-950">{label}</span>
          <span className="block truncate text-xs text-slate-500">{description}</span>
        </span>
      </Link>
    </div>
  );
}

function WorkspaceSidebarContent({
  sections,
  pathname,
  onNavigate,
}: {
  sections: UnifiedNavigationSection[];
  pathname: string;
  onNavigate?: () => void;
}) {
  return (
    <nav aria-label="Workspace navigation" className="space-y-5">
      {sections.map((section) => (
        <section key={section.title} aria-label={section.title}>
          <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
            {section.title}
          </p>
          <div className="space-y-1">
            {section.items.map((item) => {
              const Icon = item.icon;
              const active = activeForPath(pathname, item.href);
              return (
                <Link
                  key={`${section.title}-${item.href}`}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  onClick={onNavigate}
                  className={cn(
                    "group flex min-h-12 items-start gap-3 rounded-xl px-3 py-2.5 text-sm transition",
                    active ? "bg-slate-950 text-white shadow-sm" : "text-slate-700 hover:bg-slate-100 hover:text-slate-950"
                  )}
                >
                  <Icon className="mt-0.5 size-4 shrink-0" aria-hidden />
                  <span className="min-w-0">
                    <span className="block truncate font-semibold">{item.title}</span>
                    {item.description && (
                      <span className={cn("block truncate text-xs", active ? "text-slate-300" : "text-slate-500")}>
                        {item.description}
                      </span>
                    )}
                  </span>
                </Link>
              );
            })}
          </div>
        </section>
      ))}
    </nav>
  );
}

function WorkspaceTopBar({
  activeSection,
  activeItem,
  hospitalName,
  workspaceSelector,
  userLabel,
  userRole,
  statusLabel,
  topBarAction,
  onOpenMobileNav,
}: {
  activeSection: string;
  activeItem: string;
  hospitalName?: string;
  workspaceSelector?: React.ReactNode;
  userLabel?: string;
  userRole?: string;
  statusLabel: string;
  topBarAction?: React.ReactNode;
  onOpenMobileNav: () => void;
}) {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="flex min-h-16 items-center gap-3 px-4 sm:px-6 lg:px-8">
        <Button variant="ghost" size="icon-lg" className="lg:hidden" onClick={onOpenMobileNav} aria-label="Open navigation">
          <Menu className="size-5" aria-hidden />
        </Button>
        <div className="min-w-0">
          <WorkspaceBreadcrumbs items={[activeSection, activeItem]} />
          <div className="mt-0.5 flex min-w-0 items-center gap-2">
            <h1 className="truncate text-sm font-semibold text-slate-950 sm:text-base">{activeItem}</h1>
            {hospitalName && <span className="hidden truncate text-xs text-slate-500 md:inline">{hospitalName}</span>}
          </div>
        </div>
        <div className="ml-auto flex min-w-0 items-center gap-2">
          <div className="hidden min-w-[220px] max-w-[320px] md:block">
            {workspaceSelector ?? <HospitalSwitcher />}
          </div>
          {topBarAction ?? (
            <button
              type="button"
              onClick={() => window.dispatchEvent(new Event("vip:open-command-palette"))}
              className="hidden h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-600 shadow-sm transition hover:text-slate-950 xl:inline-flex"
            >
              <Search className="size-4" aria-hidden />
              Search
            </button>
          )}
          <button className="flex size-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 shadow-sm" aria-label="Notifications">
            <Bell className="size-4" aria-hidden />
          </button>
          <StatusIndicator label={statusLabel} tone="success" />
          <div className="hidden min-w-0 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm lg:block">
            <p className="max-w-[180px] truncate font-medium text-slate-950">{userLabel ?? "Visual preview"}</p>
            <p className="text-xs text-slate-500">{userRole ?? "Workspace"}</p>
          </div>
        </div>
      </div>
      <div className="border-t border-slate-100 px-4 py-3 md:hidden">
        {workspaceSelector ?? <HospitalSwitcher />}
      </div>
    </header>
  );
}

export function WorkspaceBreadcrumbs({ items }: { items: string[] }) {
  return (
    <nav aria-label="Breadcrumb" className="flex min-w-0 items-center gap-1 text-xs text-slate-500">
      {items.map((item, index) => (
        <span key={`${item}-${index}`} className="inline-flex min-w-0 items-center gap-1">
          {index > 0 && <ChevronRight className="size-3" aria-hidden />}
          <span className={cn("truncate", index === items.length - 1 && "font-medium text-slate-700")}>{item}</span>
        </span>
      ))}
    </nav>
  );
}

export function WorkspacePageHeader({
  eyebrow,
  title,
  summary,
  status,
  action,
}: {
  eyebrow: string;
  title: string;
  summary?: string;
  status?: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm sm:px-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">{eyebrow}</p>
          <h2 className="mt-1 text-balance text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">{title}</h2>
          {summary && <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">{summary}</p>}
        </div>
        {(status || action) && (
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            {status}
            {action}
          </div>
        )}
      </div>
    </section>
  );
}

export function WorkspaceSubnavTabs({ items }: { items: Array<{ label: string; href: string; active?: boolean }> }) {
  return (
    <nav aria-label="Workspace subsections" className="overflow-x-auto">
      <div className="inline-flex min-w-full gap-1 rounded-xl border border-slate-200 bg-white p-1 shadow-sm sm:min-w-0">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            aria-current={item.active ? "page" : undefined}
            className={cn(
              "whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition",
              item.active ? "bg-slate-950 text-white" : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"
            )}
          >
            {item.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}

export function DecisionBriefStrip({ items }: { items: Array<{ title: string; detail: string }> }) {
  return (
    <section className="grid gap-3 lg:grid-cols-3">
      {items.map((item) => (
        <article key={item.title} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">{item.title}</p>
          <p className="mt-2 text-sm leading-6 text-slate-600">{item.detail}</p>
        </article>
      ))}
    </section>
  );
}

export function MetricSummaryGrid({ metrics }: { metrics: Array<{ label: string; value: string; detail?: string }> }) {
  return (
    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {metrics.map((metric) => (
        <article key={metric.label} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">{metric.label}</p>
          <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">{metric.value}</p>
          {metric.detail && <p className="mt-2 text-xs leading-5 text-slate-500">{metric.detail}</p>}
        </article>
      ))}
    </section>
  );
}

export function WorkspaceEmptyState({ title, detail, action }: { title: string; detail: string; action?: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-center shadow-sm">
      <h2 className="text-lg font-semibold text-slate-950">{title}</h2>
      <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-600">{detail}</p>
      {action && <div className="mt-4">{action}</div>}
    </section>
  );
}
