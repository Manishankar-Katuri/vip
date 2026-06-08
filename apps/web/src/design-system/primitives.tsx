import { AlertCircle, CheckCircle2, ChevronDown, Info, TriangleAlert } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import type { Tone } from "./theme";

const toneClass: Record<Tone, string> = {
  neutral: "border-border bg-muted text-muted-foreground",
  info: "border-primary/15 bg-info text-info-foreground",
  success: "border-success/20 bg-success/10 text-success-foreground",
  warning: "border-warning/35 bg-warning/15 text-warning-foreground",
  danger: "border-destructive/20 bg-destructive/8 text-destructive",
};

const toneIcon = {
  neutral: Info,
  info: Info,
  success: CheckCircle2,
  warning: TriangleAlert,
  danger: AlertCircle,
};

export function Panel({ className, ...props }: React.ComponentProps<typeof Card>) {
  return <Card className={cn("surface border border-slate-200 bg-white py-0 shadow-sm ring-0", className)} {...props} />;
}

export function SectionHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-3 flex items-start justify-between gap-3">
      <div className="min-w-0">
        <h2 className="text-base font-semibold text-slate-950">{title}</h2>
        {description && <p className="mt-0.5 max-w-3xl text-xs leading-5 text-slate-500">{description}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

export function StatusIndicator({ label, tone = "neutral" }: { label: string; tone?: Tone }) {
  return (
    <span className={cn("inline-flex min-h-5 items-center gap-1 rounded-md border px-1.5 text-[11px] font-medium leading-none", toneClass[tone])}>
      <span className="size-1 rounded-full bg-current" aria-hidden />
      {label}
    </span>
  );
}

export function DetailDisclosure({
  label = "Details",
  children,
  className,
}: {
  label?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <details className={cn("group rounded-md border bg-background/80 text-sm", className)}>
      <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-2.5 py-1.5 text-xs font-medium text-muted-foreground marker:hidden [&::-webkit-details-marker]:hidden">
        <span className="inline-flex items-center gap-1.5">
          <Info className="size-3.5 text-primary" aria-hidden />
          {label}
        </span>
        <ChevronDown className="size-3.5 transition-transform group-open:rotate-180" aria-hidden />
      </summary>
      <div className="border-t px-2.5 py-2 text-xs leading-5 text-muted-foreground">
        {children}
      </div>
    </details>
  );
}

export function AlertBanner({
  title,
  message,
  tone = "info",
}: {
  title: string;
  message: string;
  tone?: Tone;
}) {
  const Icon = toneIcon[tone];
  return (
    <div role={tone === "danger" ? "alert" : "status"} className={cn("flex gap-2 rounded-lg border p-3", toneClass[tone])}>
      <Icon className="mt-0.5 size-4 shrink-0" aria-hidden />
      <div>
        <p className="text-sm font-semibold">{title}</p>
        <p className="mt-0.5 text-xs leading-5 opacity-90">{message}</p>
      </div>
    </div>
  );
}

export function KpiSurface({
  label,
  value,
  change,
  tone = "neutral",
}: {
  label: string;
  value: string;
  change: string;
  tone?: Tone;
}) {
  return (
    <Panel className="surface-hover p-3">
      <p className="text-sm font-medium text-muted-foreground">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-foreground">{value}</p>
      <Badge className={cn("mt-2 border font-medium", toneClass[tone])} variant="outline">
        {change}
      </Badge>
    </Panel>
  );
}

export function TimelineItem({
  title,
  meta,
  detail,
  tone = "neutral",
}: {
  title: string;
  meta: string;
  detail?: string;
  tone?: Tone;
}) {
  return (
    <div className="relative flex gap-3 pb-5 last:pb-0">
      <div className={cn("mt-1 flex size-5 shrink-0 items-center justify-center rounded-full border", toneClass[tone])}>
        <span className="size-1.5 rounded-full bg-current" />
      </div>
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-x-2">
          <p className="text-sm font-medium text-foreground">{title}</p>
          <span className="text-xs text-muted-foreground">{meta}</span>
        </div>
        {detail && <p className="mt-1 text-xs leading-5 text-muted-foreground">{detail}</p>}
      </div>
    </div>
  );
}

export {
  Button,
  Dialog as Modal,
  DialogContent as ModalContent,
  DialogDescription as ModalDescription,
  DialogHeader as ModalHeader,
  DialogTitle as ModalTitle,
  DialogTrigger as ModalTrigger,
  Sheet as Drawer,
  SheetContent as DrawerContent,
  SheetDescription as DrawerDescription,
  SheetHeader as DrawerHeader,
  SheetTitle as DrawerTitle,
  SheetTrigger as DrawerTrigger,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
};
