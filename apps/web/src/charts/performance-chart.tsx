"use client";

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { reputationTrend } from "@/demo-data/workspaces";

export function PerformanceChart({ compact = false }: { compact?: boolean }) {
  return (
    <div className={compact ? "h-48 min-w-0" : "h-64 min-w-0"} aria-label="Six week reputation and inquiries trend chart">
      <ResponsiveContainer
        width="100%"
        height="100%"
        minWidth={0}
        minHeight={1}
        initialDimension={{ width: 560, height: compact ? 192 : 256 }}
      >
        <AreaChart data={reputationTrend} margin={{ top: 10, right: 8, left: -24, bottom: 0 }}>
          <defs>
            <linearGradient id="trustFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.2} />
              <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="week" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "var(--muted-foreground)" }} />
          <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "var(--muted-foreground)" }} />
          <Tooltip
            contentStyle={{
              background: "var(--card)",
              border: "1px solid var(--border)",
              borderRadius: "10px",
              boxShadow: "var(--shadow-surface)",
              fontSize: "12px",
            }}
          />
          <Area type="monotone" dataKey="trust" name="Trust score" stroke="var(--chart-1)" fill="url(#trustFill)" strokeWidth={2.5} />
          {!compact && <Area type="monotone" dataKey="inquiries" name="Inquiries" stroke="var(--chart-2)" fill="transparent" strokeWidth={2} />}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
