import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import { renderContentExecutionHtml } from "./document-template";
import type { ThreeDayContentExecutionDocument } from "./types";

export type GeneratedDocumentFile = {
  fileUrl: string;
  filePath: string;
  format: "HTML_FALLBACK";
  message: string;
};

export class ContentExecutionPdfGenerator {
  async generate(document: ThreeDayContentExecutionDocument): Promise<GeneratedDocumentFile> {
    const directory = path.join(process.cwd(), "public", "generated", "content-execution");
    await mkdir(directory, { recursive: true });

    const fileName = `${slugify(document.clientName)}-${slugify(document.contentWindow.label)}-${document.generatedAt.slice(0, 10)}.html`;
    const filePath = path.join(directory, fileName);
    await writeFile(filePath, renderContentExecutionHtml(document), "utf8");

    return {
      fileUrl: `/generated/content-execution/${fileName}`,
      filePath,
      format: "HTML_FALLBACK",
      message: "HTML fallback generated. Wire a PDF renderer here when a production PDF service is configured.",
    };
  }
}

export async function buildGeneratedDocumentAttachment(fileUrl: string) {
  const relativePath = fileUrl.replace(/^\//, "").replace(/\//g, path.sep);
  const filePath = path.join(process.cwd(), "public", relativePath.replace(/^generated[\\/]/, "generated" + path.sep));
  const content = await readFile(filePath);

  return [{
    filename: fileUrl.split("/").pop() ?? "content-execution-plan.html",
    content: content.toString("base64"),
  }];
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}
