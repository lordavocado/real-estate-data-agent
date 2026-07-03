import type {
  HandleMessageStreamEvent,
  SessionState,
} from "eve/client";

const EVE_PROXY_PREFIX = "/api/eve/eve/v1";

export interface EveSessionHydration {
  events: HandleMessageStreamEvent[];
  session: SessionState;
}

/** Read the full NDJSON event stream for an existing eve session (for URL resume). */
export async function fetchEveSessionEvents(
  sessionId: string,
  host = EVE_PROXY_PREFIX
): Promise<EveSessionHydration> {
  const res = await fetch(
    `${host}/session/${encodeURIComponent(sessionId)}/stream`,
    { headers: { Accept: "application/x-ndjson" }, cache: "no-store" }
  );

  if (!res.ok) {
    throw new Error(`Failed to load session ${sessionId}: ${res.status}`);
  }

  const reader = res.body?.getReader();
  if (!reader) throw new Error("No stream body");

  const decoder = new TextDecoder();
  let buffer = "";
  const events: HandleMessageStreamEvent[] = [];
  let hydrated = false;

  while (!hydrated) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      if (!line.trim()) continue;
      try {
        const ev = JSON.parse(line) as HandleMessageStreamEvent & { type?: string };
        events.push(ev);
        if (ev.type === "session.waiting" || ev.type === "turn.completed") {
          hydrated = true;
        }
      } catch {
        // skip malformed lines
      }
    }
  }

  await reader.cancel().catch(() => {});

  return {
    events,
    session: {
      sessionId,
      streamIndex: events.length,
    },
  };
}
