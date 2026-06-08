import { aiApiHandlers } from "../_lib/runtime";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  return aiApiHandlers.opportunities(request);
}
