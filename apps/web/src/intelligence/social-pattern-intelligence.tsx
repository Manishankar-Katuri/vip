import { Activity, Captions, Clock3, Hash, Video } from "lucide-react";
import type { LiveData } from "@/components/operations/operational-surfaces";
import { Panel, SectionHeader, StatusIndicator } from "@/design-system/primitives";
import { percent } from "@/lib/product-experience";

export function SocialPatternIntelligence({ data }: { data: LiveData }) {
  const analytics = data.analytics;
  const formats = analytics.contentTypeBreakdown.formats.slice().sort((left, right) => right.avgEngagementRate - left.avgEngagementRate);
  const pillars = analytics.contentTypeBreakdown.pillars.slice().sort((left, right) => right.avgEngagementRate - left.avgEngagementRate);
  const hashtag = analytics.hashtagPerformance[0];
  const timing = analytics.bestPostingTimes[0];
  const top = analytics.topPosts[0];
  const scores = data.intelligence?.scores;
  return (
    <Panel className="p-5">
      <SectionHeader
        title="Healthcare social pattern intelligence"
        description="Content, audience momentum, timing and discoverability signals"
        action={scores ? <StatusIndicator label={`${Math.round(scores.audienceMomentum)} audience momentum`} tone="info" /> : undefined}
      />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Pattern icon={<Video />} label="Reel and format signal" value={formats[0] ? `${friendly(formats[0].contentType)} leads at ${percent(formats[0].avgEngagementRate)} engagement.` : "Format history pending."} />
        <Pattern icon={<Captions />} label="Content theme" value={pillars[0] ? `${friendly(pillars[0].pillar)} is the strongest measured content pillar.` : "Theme analysis pending."} />
        <Pattern icon={<Hash />} label="Hashtag opportunity" value={hashtag ? `#${hashtag.tag} averages ${percent(hashtag.avgEngagementRate)} from ${hashtag.postCount} posts.` : "Hashtag evidence pending."} />
        <Pattern icon={<Clock3 />} label="Audience timing" value={timing ? `${timing.dayLabel} at ${clock(timing.hourOfDay)} is the best measured window.` : "Timing evidence pending."} />
      </div>
      <div className="mt-4 rounded-xl border bg-info/25 p-4">
        <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-primary"><Activity className="size-4" />Pattern explanation</p>
        <p className="mt-2 text-sm leading-6">
          {top
            ? `The leading published content reached ${top.reach.toLocaleString("en-IN")} people at ${percent(top.engagementRate)} engagement. These signals guide the next clinically reviewed content test; they do not guarantee patient response.`
            : "Pattern intelligence becomes available when measured social posts are connected."}
        </p>
      </div>
    </Panel>
  );
}

function Pattern({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-xl border bg-background p-3">
      <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-primary [&_svg]:size-4">{icon}{label}</p>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">{value}</p>
    </div>
  );
}

function clock(hour: number) {
  return new Intl.DateTimeFormat("en-IN", { hour: "numeric", minute: "2-digit" }).format(new Date(Date.UTC(2026, 0, 1, hour)));
}

function friendly(value: string) {
  return value.toLowerCase().replaceAll("_", " ").replace(/\b\w/g, (character) => character.toUpperCase());
}
