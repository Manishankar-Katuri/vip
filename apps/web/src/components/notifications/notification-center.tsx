"use client";

import { useEffect, useRef, useState } from "react";
import { Bell, CheckCheck } from "lucide-react";
import { Button, StatusIndicator } from "@/design-system/primitives";
import type { Role } from "@/design-system/theme";
import { useOperationalStore } from "@/state/operational-store";

export function NotificationCenter({ role }: { role: Role }) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const allNotifications = useOperationalStore((state) => state.notifications);
  const notifications = allNotifications.filter((item) => item.role === role);
  const markRead = useOperationalStore((state) => state.markNotificationRead);
  const markAllRead = useOperationalStore((state) => state.markRoleNotificationsRead);
  const unread = notifications.filter((item) => item.unread).length;
  const groups = Object.entries(notifications.reduce<Record<string, typeof notifications>>((result, item) => {
    (result[item.groupKey] ??= []).push(item);
    return result;
  }, {}));

  useEffect(() => {
    function closeOnOutsideClick(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", closeOnOutsideClick);
    return () => document.removeEventListener("mousedown", closeOnOutsideClick);
  }, []);

  return (
    <div ref={containerRef} className="relative">
      <Button
        variant="ghost"
        size="icon-lg"
        aria-label={`Notifications${unread ? `, ${unread} unread` : ""}`}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen((visible) => !visible)}
        className="relative"
      >
        <Bell />
        {!!unread && <span className="absolute right-1.5 top-1.5 flex size-4 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">{unread}</span>}
      </Button>
      {open && (
        <section
          role="dialog"
          aria-label="Notification center"
          className="surface absolute right-0 top-12 z-40 w-[min(23rem,calc(100vw-2rem))] rounded-xl border bg-card p-3"
        >
          <div className="mb-3 flex items-center justify-between gap-2 px-1">
            <div>
              <h2 className="text-sm font-semibold">Notifications</h2>
              <p className="text-xs text-muted-foreground" aria-live="polite">{unread ? `${unread} need attention - updated live` : "You are up to date"}</p>
            </div>
            {!!unread && (
              <Button variant="ghost" size="sm" onClick={() => markAllRead(role)}>
                <CheckCheck /> Mark read
              </Button>
            )}
          </div>
          <div className="max-h-[420px] space-y-4 overflow-y-auto">
            {groups.map(([group, items]) => (
              <section key={group} aria-label={group.replaceAll("-", " ")}>
                <p className="mb-2 px-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  {group.replaceAll("-", " ")} ({items.length})
                </p>
                <div className="space-y-2">
                  {items.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => markRead(item.id)}
                      className={`block w-full rounded-lg border p-3 text-left transition-colors hover:bg-muted/55 ${item.unread ? "border-primary/20 bg-info/35" : "bg-background"}`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-medium">{item.title}</p>
                        <StatusIndicator label={item.category} tone={item.tone} />
                      </div>
                      <p className="mt-1 text-xs leading-5 text-muted-foreground">{item.detail}</p>
                      <p className="mt-2 text-[11px] text-muted-foreground">{formatTimestamp(item.createdAt)}</p>
                    </button>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function formatTimestamp(value: string) {
  return new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}
