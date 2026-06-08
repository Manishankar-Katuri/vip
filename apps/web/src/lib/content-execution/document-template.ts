import type { ThreeDayContentExecutionDocument } from "./types";

export function renderContentExecutionHtml(document: ThreeDayContentExecutionDocument) {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(document.title)}</title>
  <style>
    @page { size: A4; margin: 12mm 10mm; }
    :root {
      color-scheme: light;
      --ink: #172033;
      --muted: #5d677a;
      --line: #d8deea;
      --soft: #f5f7fb;
      --paper: #ffffff;
      --accent: #0f766e;
      --accent-dark: #115e59;
      --gold: #b7791f;
      --blue: #1d4ed8;
      --green: #047857;
      --orange: #9a3412;
      --red: #b91c1c;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      background: #eef2f7;
      color: var(--ink);
      font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      font-size: 10.5px;
      line-height: 1.32;
    }
    .page {
      max-width: 960px;
      margin: 12px auto;
      background: var(--paper);
      border: 1px solid var(--line);
      box-shadow: 0 18px 50px rgba(23, 32, 51, .08);
    }
    header {
      padding: 14px 20px 12px;
      border-bottom: 5px solid var(--accent);
      background: linear-gradient(180deg, #ffffff 0%, #f8fbfb 100%);
    }
    .brand {
      color: var(--accent-dark);
      font-size: 13px;
      font-weight: 800;
      letter-spacing: .08em;
      text-transform: uppercase;
    }
    h1, h2, h3 { break-after: avoid; page-break-after: avoid; }
    h1 { margin: 7px 0 7px; max-width: 820px; font-size: 24px; line-height: 1.12; letter-spacing: 0; }
    h2 { margin: 0 0 6px; font-size: 15px; letter-spacing: 0; }
    h3 { margin: 0 0 5px; font-size: 12.5px; letter-spacing: 0; }
    p { margin: 0; line-height: 1.55; }
    .meta { color: var(--muted); font-size: 14px; }
    .cover-grid { display: grid; grid-template-columns: 1.25fr .75fr; gap: 12px; margin-top: 12px; }
    .cover-card, .section-card, .detail, .email-box {
      border: 1px solid var(--line);
      background: #fff;
      border-radius: 6px;
    }
    .cover-card { padding: 10px; }
    .label { color: var(--muted); font-size: 11px; font-weight: 800; letter-spacing: .05em; text-transform: uppercase; }
    .value { margin-top: 5px; font-size: 15px; font-weight: 700; }
    main { padding: 12px 20px 20px; }
    section { margin-top: 10px; break-inside: avoid; }
    .brief-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }
    .metric { border: 1px solid var(--line); background: var(--soft); border-radius: 6px; padding: 9px; min-height: 56px; }
    .metric .value { font-size: 13px; line-height: 1.25; }
    .summary { grid-column: span 2; min-height: 42px; }
    .note { border-left: 4px solid var(--gold); background: #fffaf0; border-radius: 4px; padding: 9px 11px; color: #5f3d08; }
    .table-wrap { overflow-x: auto; border: 1px solid var(--line); border-radius: 6px; }
    table { width: 100%; border-collapse: collapse; table-layout: fixed; font-size: 10.5px; }
    thead { display: table-header-group; }
    tr { page-break-inside: avoid; }
    th { color: var(--muted); text-align: left; font-size: 9px; text-transform: uppercase; letter-spacing: .04em; border-bottom: 1px solid var(--line); padding: 5px; background: #f8fafc; }
    td { border-bottom: 1px solid var(--line); padding: 5px; vertical-align: top; overflow-wrap: anywhere; }
    .date-cell { white-space: nowrap; }
    tr:last-child td { border-bottom: 0; }
    .day-group { margin-top: 10px; }
    .day-heading { color: var(--accent-dark); font-size: 13px; font-weight: 800; text-transform: uppercase; letter-spacing: .04em; }
    .detail { padding: 10px; margin-top: 8px; break-inside: avoid; }
    .detail-head { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; margin-bottom: 10px; }
    .detail p { color: var(--muted); font-size: 13px; }
    .field-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 6px 12px; margin-top: 8px; }
    .field { min-width: 0; }
    .field strong { color: var(--ink); }
    .script-table td, .script-table th { font-size: 12px; }
    .subsection { margin-top: 8px; }
    .copy-box { white-space: pre-wrap; border: 1px solid var(--line); border-radius: 6px; background: #f8fafc; padding: 8px; color: var(--muted); line-height: 1.45; }
    ul, ol { margin: 6px 0 0 16px; padding: 0; color: var(--muted); line-height: 1.45; }
    .two { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 18px; }
    .section-card { padding: 10px; }
    .email-box { padding: 10px; background: #f8fafc; }
    .email-body { margin-top: 10px; white-space: pre-wrap; color: var(--muted); font-family: inherit; font-size: 13px; line-height: 1.55; }
    @media (max-width: 760px) {
      .page { margin: 0; border-left: 0; border-right: 0; }
      header, main { padding-left: 20px; padding-right: 20px; }
      h1 { font-size: 28px; }
      .cover-grid, .brief-grid, .two, .field-grid { grid-template-columns: 1fr; }
      .summary { grid-column: auto; }
    }
    @media print {
      body { background: #fff; }
      .page { margin: 0; max-width: none; border: 0; box-shadow: none; }
      .table-wrap { overflow: visible; }
      section { page-break-inside: avoid; }
    }
  </style>
</head>
<body>
  <article class="page">
    <header>
      <div class="brand">VIP Intelligence OS</div>
      <h1>${escapeHtml(document.title)}</h1>
      <p class="meta">${escapeHtml(document.modeLabel)} | ${escapeHtml(document.contentWindow.purpose)} | Generated ${escapeHtml(formatDateTime(document.generatedAt))}</p>
      <div class="cover-grid">
        <div class="cover-card">
          <div class="label">Client</div>
          <div class="value">${escapeHtml(document.clientName)}</div>
          <p class="meta">Workspace/business: ${escapeHtml(document.workspaceName || document.clientName)}</p>
        </div>
        <div class="cover-card">
          <div class="label">Plan window</div>
          <div class="value">${escapeHtml(document.contentWindow.displayRange)}</div>
          <p class="meta">Send: ${escapeHtml(document.contentWindow.sendDay)} at ${escapeHtml(document.contentWindow.sendTime)}</p>
        </div>
      </div>
    </header>
    <main>
      <section>
        <h2>Executive Brief</h2>
        <div class="brief-grid">
          ${metric("Main goal", document.executiveBrief.primaryGoal)}
          ${metric("Platforms included", document.executiveBrief.platformsCovered.join(", ") || "None")}
          ${metric("Total posts planned", String(document.executiveBrief.totalContentPieces))}
          ${metric("Main preparation needed", document.executiveBrief.priorityPreparationSummary || "Review content scripts, clinic materials, and final checks before scheduling.", "summary")}
        </div>
      </section>

      <section>
        <h2>Intelligence Note</h2>
        <p class="note">${escapeHtml(document.intelligenceNote)}</p>
      </section>

      <section>
        <h2>Day-Wise Execution Schedule</h2>
        <div class="table-wrap">
          <table>
            <thead><tr><th>Date</th><th>Day</th><th>Platform</th><th>Post type</th><th>Topic</th><th>Time</th><th>Things needed</th><th>Final status</th></tr></thead>
            <tbody>${document.dayWiseSchedule.map((item) => `<tr><td class="date-cell">${escapeHtml(item.date)}</td><td>${escapeHtml(item.day)}</td><td>${escapeHtml(item.platform)}</td><td>${escapeHtml(item.contentType)}</td><td>${escapeHtml(item.topic)}</td><td>${escapeHtml(item.postingTime)}</td><td>${escapeHtml(item.assetNeeded)}</td><td>${escapeHtml(item.approvalStatus)}</td></tr>`).join("")}</tbody>
          </table>
        </div>
      </section>

      <section>
        <h2>Detailed Content Instructions</h2>
        ${renderDetailedInstructions(document)}
      </section>

      <section class="two">
        <div class="section-card">
          <h2>Asset Checklist: Needed from Client</h2>
          ${list(document.assetChecklist.neededFromClient)}
        </div>
        <div class="section-card">
          <h2>Asset Checklist: Needed from Internal Team</h2>
          ${list(document.assetChecklist.neededFromInternalTeam)}
        </div>
      </section>

      <section>
        <h2>Priority Actions</h2>
        ${orderedList(document.priorityActions)}
      </section>

      <section>
        <h2>Email Summary Preview</h2>
        <div class="email-box">
          <p><strong>Subject:</strong> ${escapeHtml(document.emailSummaryPreview.subject)}</p>
          <pre class="email-body">${escapeHtml(document.emailSummaryPreview.body)}</pre>
        </div>
      </section>
    </main>
  </article>
</body>
</html>`;
}

function renderDetailedInstructions(document: ThreeDayContentExecutionDocument) {
  const groups = new Map<string, typeof document.detailedContentInstructions>();

  for (const item of document.detailedContentInstructions) {
    const key = `${item.date}|${item.platform}`;
    groups.set(key, [...(groups.get(key) ?? []), item]);
  }

  return Array.from(groups.entries()).map(([key, items]) => {
    const [date, platform] = key.split("|");
    return `<div class="day-group">
      <div class="day-heading">${escapeHtml(date)} | ${escapeHtml(platform)}</div>
      ${items.map((item) => `<div class="detail">
        <div class="detail-head">
          <h3>${escapeHtml(item.contentType)} | ${escapeHtml(item.topic)}</h3>
        </div>
        <div class="field-grid">
          ${field("Objective", item.objective)}
          ${field("Target audience", item.targetAudience)}
          ${field("Posting time", item.postingTime)}
          ${item.duration ? field("Video length", item.duration) : ""}
          ${field("Opening line", item.hook)}
          ${field("Patient action", item.cta)}
          ${item.thumbnailText ? field("Cover text", item.thumbnailText) : ""}
          ${field("How the post should look", item.creativeDirection)}
          ${field("Expected result", item.expectedImpact)}
        </div>
        ${item.fullScript ? renderScript(item.fullScript.scenes) : ""}
        ${item.carouselSlides ? renderSlides(item.carouselSlides) : ""}
        ${item.gbpPostCopy ? renderCopySection("Google Business Profile post: Post text", item.gbpPostCopy) : ""}
        ${item.gbpSuggestedImage ? fieldBlock("Suggested photo", item.gbpSuggestedImage) : ""}
        ${item.gbpServiceCategory ? fieldBlock("Service/category", item.gbpServiceCategory) : ""}
        ${item.whatsappMessage ? renderCopySection("Exact WhatsApp message", item.whatsappMessage) : ""}
        ${item.whatsappAudienceSegment ? fieldBlock("Audience segment", item.whatsappAudienceSegment) : ""}
        ${item.whatsappFollowUpNote ? fieldBlock("Follow-up note", item.whatsappFollowUpNote) : ""}
        ${item.blogArticlePlan ? renderBlogPlan(item.blogArticlePlan) : ""}
        ${listBlock("What the doctor should record", item.recordingInstructions)}
        ${listBlock("Work for our team", item.editingInstructions)}
        ${listBlock("How the carousel should look", item.designInstructions)}
        ${renderCopySection("Post description", item.caption)}
        ${fieldBlock("Social media tags", item.hashtags.join(", "))}
        ${listBlock("Things needed", item.assetsRequired)}
        ${listBlock("What the clinic team should prepare", item.clientPreparationNeeded)}
        ${listBlock("Work for our team", item.internalTeamTasks)}
        ${listBlock("Final check before posting", item.approvalChecklist)}
        ${fieldBlock("Medical safety note", item.medicalSafetyNote)}
      </div>`).join("")}
    </div>`;
  }).join("");
}

function renderScript(scenes: NonNullable<ThreeDayContentExecutionDocument["detailedContentInstructions"][number]["fullScript"]>["scenes"]) {
  return `<div class="subsection">
    <h3>Full video script for doctor</h3>
    <p><strong>What the doctor should say:</strong></p>
    <div class="table-wrap">
      <table class="script-table">
        <thead><tr><th>Part</th><th>Time</th><th>What the doctor should say</th><th>Text shown on video</th><th>Extra clinic visuals</th></tr></thead>
        <tbody>${scenes.map((scene) => `<tr>
          <td>${escapeHtml(String(scene.sceneNumber))}. ${escapeHtml(scene.sceneTitle)}</td>
          <td>${escapeHtml(scene.timestamp)}</td>
          <td>${list(scene.doctorLines ?? scene.voiceoverLines ?? [])}</td>
          <td>${list(scene.onScreenText ?? [])}</td>
          <td>${escapeHtml(scene.visualDirection ?? "")}${list(scene.brollSuggestions ?? [])}</td>
        </tr>`).join("")}</tbody>
      </table>
    </div>
  </div>`;
}

function renderSlides(slides: NonNullable<ThreeDayContentExecutionDocument["detailedContentInstructions"][number]["carouselSlides"]>) {
  return `<div class="subsection">
    <h3>Slide plan</h3>
    <div class="table-wrap">
      <table>
        <thead><tr><th>Slide</th><th>Headline</th><th>Body Copy</th><th>Visual Suggestion</th></tr></thead>
        <tbody>${slides.map((slide) => `<tr><td>${escapeHtml(String(slide.slideNumber))}</td><td>${escapeHtml(slide.headline)}</td><td>${escapeHtml(slide.body)}</td><td>${escapeHtml(slide.visualSuggestion)}</td></tr>`).join("")}</tbody>
      </table>
    </div>
  </div>`;
}

function renderBlogPlan(plan: NonNullable<ThreeDayContentExecutionDocument["detailedContentInstructions"][number]["blogArticlePlan"]>) {
  return `<div class="subsection">
    <h3>Blog / Article Plan</h3>
    ${fieldBlock("Title", plan.title)}
    ${renderCopySection("Intro paragraph", plan.introParagraph)}
    ${listBlock("Outline", plan.outline)}
    ${listBlock("Section headings", plan.sectionHeadings)}
    ${fieldBlock("Patient action", plan.cta)}
  </div>`;
}

function renderCopySection(label: string, value: string) {
  return `<div class="subsection"><h3>${escapeHtml(label)}</h3><div class="copy-box">${escapeHtml(value)}</div></div>`;
}

function fieldBlock(label: string, value: string) {
  return `<div class="subsection">${field(label, value)}</div>`;
}

function listBlock(label: string, items?: string[]) {
  return items?.length ? `<div class="subsection"><h3>${escapeHtml(label)}</h3>${list(items)}</div>` : "";
}

function metric(label: string, value: string, className = "") {
  return `<div class="metric ${className}"><div class="label">${escapeHtml(label)}</div><div class="value">${escapeHtml(value)}</div></div>`;
}

function field(label: string, value: string) {
  return `<p class="field"><strong>${escapeHtml(label)}:</strong> ${escapeHtml(value)}</p>`;
}

function list(items: string[]) {
  return `<ul>${(items.length ? items : ["No items listed."]).map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`;
}

function orderedList(items: string[]) {
  return `<ol>${(items.length ? items : ["Review scripts, assets, approvals, and medical safety notes before scheduling."]).map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ol>`;
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Kolkata" });
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
