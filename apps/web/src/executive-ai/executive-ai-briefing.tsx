import { Activity, Lightbulb, ShieldCheck, TrendingUp } from "lucide-react";
import type { LiveData } from "@/components/operations/operational-surfaces";
import { DetailDisclosure, Panel, SectionHeader, StatusIndicator } from "@/design-system/primitives";
import { integer, percent } from "@/lib/product-experience";

export function ExecutiveAIBriefing({ data, role }: { data: LiveData; role: "doctor" | "admin" }) {
  const intelligence = data.intelligence;
  const engagement = intelligence?.predictions7Day.find((prediction) => prediction.metric === "ENGAGEMENT_TRAJECTORY");
  const highest = data.recommendations.slice().sort((left, right) => right.score - left.score)[0];
  const risks = intelligence?.signals.filter((signal) => signal.severity === "HIGH" || signal.severity === "CRITICAL") ?? [];
  const content = data.analytics.topPosts[0];
  const briefings = [
    {
      icon: <TrendingUp />,
      title: "Growth summary",
      value: `${data.measuredNarrative ?? `${data.analytics.totalPosts} measured posts available.`}${engagement ? ` Seven-day engagement outlook is ${signed(engagement.changePercent)}%.` : ""}`,
      tone: "success" as const,
    },
    {
      icon: <Lightbulb />,
      title: "Strategic opportunity",
      value: highest ? `${highest.title}. ${highest.expectedOutcome}` : "No ranked recommendation is currently available.",
      tone: "info" as const,
    },
    {
      icon: <ShieldCheck />,
      title: role === "doctor" ? "Reputation and decision brief" : "Portfolio risk brief",
      value: risks.length ? `${risks.length} predictive risk signal${risks.length === 1 ? " requires" : "s require"} review. ${risks[0].summary}` : "No high-severity predictive risk signal is present in the measured series.",
      tone: risks.length ? "warning" as const : "success" as const,
    },
  ];
  return (
    <Panel className="border-primary/15 bg-info/20 p-4">
      <SectionHeader
        title="Executive AI briefing"
        description="Concise leadership intelligence with visible evidence basis"
        action={<StatusIndicator label="Assistive intelligence" tone="info" />}
      />
      <div className="grid gap-2 lg:grid-cols-3">
        {briefings.map((brief) => (
          <article key={brief.title} className="rounded-lg border bg-background p-3">
            <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-primary [&_svg]:size-4">{brief.icon}{brief.title}</p>
            <DetailDisclosure label="Brief" className="mt-2">{brief.value}</DetailDisclosure>
            <div className="mt-2"><StatusIndicator label="Evidence below" tone={brief.tone} /></div>
          </article>
        ))}
      </div>
      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 border-t pt-3 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5"><Activity className="size-3.5" />{data.analytics.totalPosts} published posts analyzed</span>
        <span>{integer(data.analytics.totalReach)} recorded reach</span>
        <span>{percent(data.analytics.avgEngagementRate)} average engagement</span>
        {content && <span>Best measured post: {percent(content.engagementRate)} engagement</span>}
      </div>
    </Panel>
  );
}

function signed(value: number) {
  return value > 0 ? `+${value.toFixed(1)}` : value.toFixed(1);
}
