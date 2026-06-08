import { Activity, AlertTriangle, ArrowUpRight, CalendarClock, TrendingUp } from "lucide-react";
import type { Prediction } from "@vip/analytics-intelligence";
import { ForecastCurveChart } from "@/charts/forecast-curve-chart";
import type { LiveData } from "@/components/operations/operational-surfaces";
import { Panel, SectionHeader, StatusIndicator } from "@/design-system/primitives";

export function PredictiveIntelligence({ data }: { data: LiveData }) {
  const intelligence = data.intelligence;
  const seven = intelligence?.predictions7Day ?? [];
  const thirty = intelligence?.predictions30Day ?? [];
  const engagement = seven.find((item) => item.metric === "ENGAGEMENT_TRAJECTORY");
  return (
    <Panel className="p-5">
      <SectionHeader
        title="Predictive growth intelligence"
        description="Measured healthcare social performance projected through the analytics-intelligence engine"
        action={engagement ? <StatusIndicator label={`${Math.round(engagement.confidence * 100)}% model confidence`} tone="info" /> : undefined}
      />
      {!seven.length ? (
        <div className="rounded-xl border border-dashed p-5 text-sm text-muted-foreground">{intelligence?.forecastBasis ?? "Forecast input is not available."}</div>
      ) : (
        <>
          <ForecastCurveChart history={data.analytics.engagementTrend.series} forecast={engagement} />
          <p className="mt-2 text-xs leading-5 text-muted-foreground">{intelligence?.forecastBasis} Content-performance forecasting uses measured engagement response as its scoring input.</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {forecastCards(seven, thirty).map((item) => (
              <div key={item.label} className="rounded-xl border bg-background p-4">
                <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-primary [&_svg]:size-4">{item.icon}{item.label}</p>
                <p className="mt-3 text-2xl font-semibold">{item.value}</p>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">{item.detail}</p>
              </div>
            ))}
          </div>
        </>
      )}
      {!!intelligence?.signals.length && (
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {intelligence.signals.map((signal) => (
            <div key={signal.id} className="rounded-xl border border-warning/25 bg-warning/8 p-3">
              <div className="flex flex-wrap justify-between gap-2">
                <p className="flex items-center gap-2 text-sm font-medium"><AlertTriangle className="size-4 text-warning-foreground" />{friendly(signal.kind)}</p>
                <StatusIndicator label={`${signal.severity.toLowerCase()} risk`} tone="warning" />
              </div>
              <p className="mt-2 text-sm text-muted-foreground">{signal.summary} Confidence {Math.round(signal.confidence * 100)}%.</p>
            </div>
          ))}
        </div>
      )}
    </Panel>
  );
}

function forecastCards(seven: Prediction[], thirty: Prediction[]) {
  const card = (metric: Prediction["metric"], label: string, icon: React.ReactNode) => {
    const near = seven.find((item) => item.metric === metric);
    const far = thirty.find((item) => item.metric === metric);
    return near ? {
      label,
      icon,
      value: `${signed(near.changePercent)}%`,
      detail: `7-day projection${far ? `; ${signed(far.changePercent)}% over 30 days` : ""}.`,
    } : undefined;
  };
  return [
    card("ENGAGEMENT_TRAJECTORY", "Engagement", <TrendingUp />),
    card("FOLLOWER_GROWTH", "Followers", <ArrowUpRight />),
    card("CAMPAIGN_PERFORMANCE", "Campaign outcome", <Activity />),
    card("OPPORTUNITY_WINDOW", "Activation window", <CalendarClock />),
  ].filter((item): item is NonNullable<typeof item> => Boolean(item));
}

function friendly(value: string) {
  return value.toLowerCase().replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function signed(value: number) {
  return value > 0 ? `+${value.toFixed(1)}` : value.toFixed(1);
}
