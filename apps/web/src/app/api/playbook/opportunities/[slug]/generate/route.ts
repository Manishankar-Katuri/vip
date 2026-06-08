import { NextResponse } from "next/server";
import { playbookEvents } from "@/lib/playbook/harika-playbook";
import { generateOpportunityBrief } from "@/lib/playbook/opportunity-brief";
import { getProductExperience } from "@/lib/product-experience";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const event = playbookEvents.find((item) => item.slug === slug);
  if (!event) return NextResponse.json({ success: false, error: "Opportunity not found." }, { status: 404 });

  const experience = await getProductExperience();
  const generated = await generateOpportunityBrief(event, experience);
  return NextResponse.json({ success: true, generated });
}
