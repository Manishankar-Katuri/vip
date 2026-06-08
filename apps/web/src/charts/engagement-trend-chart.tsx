"use client";

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

type Point = {
  date: string;
  avgEngagementRate: number;
  reach: number;
};

export function EngagementTrendChart({ data }: { data: Point[] }) {
  return (
    <div className="h-64 min-w-0" aria-label="Measured Instagram engagement trend chart">
      <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={1} initialDimension={{ width: 680, height: 256 }}>
        <AreaChart data={data} margin={{ top: 12, right: 8, left: -16, bottom: 0 }}>
          <defs>
            <linearGradient id="engagementFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.2} />
              <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="date"
            axisLine={false}
            tickLine={false}
            minTickGap={30}
            tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
            tickFormatter={(date) => new Intl.DateTimeFormat("en-IN", { month: "short", day: "numeric" }).format(new Date(date))}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
            tickFormatter={(value) => `${value}%`}
          />
          <Tooltip
            formatter={(value, name) => name === "avgEngagementRate" ? [`${Number(value).toFixed(2)}%`, "Engagement"] : [value, name]}
            labelFormatter={(date) => new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" }).format(new Date(String(date)))}
            contentStyle={{
              background: "var(--card)",
              border: "1px solid var(--border)",
              borderRadius: "10px",
              boxShadow: "var(--shadow-surface)",
              fontSize: "12px",
            }}
          />
          <Area
            type="monotone"
            dataKey="avgEngagementRate"
            stroke="var(--chart-1)"
            fill="url(#engagementFill)"
            strokeWidth={2.5}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
