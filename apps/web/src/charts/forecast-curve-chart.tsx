"use client";

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { Prediction } from "@vip/analytics-intelligence";

type Point = { date: string; avgEngagementRate: number };

export function ForecastCurveChart({
  history,
  forecast,
}: {
  history: Point[];
  forecast?: Prediction;
}) {
  const measured = history.map((point) => ({
    date: point.date,
    measured: point.avgEngagementRate,
    predicted: undefined as number | undefined,
  }));
  const latest = measured.at(-1);
  const projected = forecast && latest
    ? [{
        date: shiftDate(latest.date, forecast.horizonDays),
        measured: undefined as number | undefined,
        predicted: forecast.predictedValue,
      }]
    : [];
  const data = latest && forecast
    ? [...measured.slice(0, -1), { ...latest, predicted: latest.measured }, ...projected]
    : measured;

  return (
    <div className="h-64 min-w-0" role="img" aria-label="Measured engagement and forecast trajectory chart">
      <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={1} initialDimension={{ width: 680, height: 256 }}>
        <AreaChart data={data} margin={{ top: 12, right: 8, left: -16, bottom: 0 }}>
          <defs>
            <linearGradient id="measuredForecastFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.18} />
              <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="projectedForecastFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--chart-2)" stopOpacity={0.2} />
              <stop offset="100%" stopColor="var(--chart-2)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="date"
            axisLine={false}
            tickLine={false}
            minTickGap={28}
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
            formatter={(value, name) => [`${Number(value).toFixed(2)}%`, name === "measured" ? "Measured" : "Predicted"]}
            labelFormatter={(date) => new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" }).format(new Date(String(date)))}
            contentStyle={{
              background: "var(--card)",
              border: "1px solid var(--border)",
              borderRadius: "10px",
              boxShadow: "var(--shadow-surface)",
              fontSize: "12px",
            }}
          />
          <Area type="monotone" dataKey="measured" stroke="var(--chart-1)" fill="url(#measuredForecastFill)" strokeWidth={2.5} connectNulls />
          <Area type="monotone" dataKey="predicted" stroke="var(--chart-2)" fill="url(#projectedForecastFill)" strokeDasharray="5 4" strokeWidth={2.5} connectNulls />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

function shiftDate(value: string, days: number) {
  const result = new Date(value);
  result.setUTCDate(result.getUTCDate() + days);
  return result.toISOString();
}
