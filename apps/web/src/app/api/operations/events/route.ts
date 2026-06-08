import { subscribeToOperationalUpdates } from "@/realtime/operational-events";

export const dynamic = "force-dynamic";

export function GET(request: Request) {
  const encoder = new TextEncoder();
  let close: (() => void) | undefined;
  const stream = new ReadableStream({
    start(controller) {
      const send = (event: string, data: string) => {
        controller.enqueue(encoder.encode(`event: ${event}\ndata: ${data}\n\n`));
      };
      send("connected", new Date().toISOString());
      const unsubscribe = subscribeToOperationalUpdates((version) => send("workflow-update", version));
      const heartbeat = setInterval(() => send("heartbeat", new Date().toISOString()), 20000);
      close = () => {
        clearInterval(heartbeat);
        unsubscribe();
        try {
          controller.close();
        } catch {
          // The connection may already be closed by the browser.
        }
      };
      request.signal.addEventListener("abort", close, { once: true });
    },
    cancel() {
      close?.();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
