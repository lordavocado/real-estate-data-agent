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

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      if (!line.trim()) continue;
      try {
        events.push(JSON.parse(line) as HandleMessageStreamEvent);
      } catch {
        // skip malformed lines
      }
    }
  }

  return {
    events,
    session: {
      sessionId,
      streamIndex: events.length,
    },
  };
}
