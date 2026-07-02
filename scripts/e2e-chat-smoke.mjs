#!/usr/bin/env node
/**
 * Smoke test: create eve session via Next proxy, send first turn, read NDJSON stream.
 */
const BASE = process.env.WEB_URL ?? "http://localhost:3001";
const MESSAGE =
  process.env.SMOKE_MESSAGE ?? "Reply with exactly one word: pong";

async function main() {
  console.log("→ Creating session + first turn via proxy…");
  const createRes = await fetch(`${BASE}/api/eve/eve/v1/session`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/x-ndjson",
    },
    body: JSON.stringify({ message: MESSAGE }),
  });

  if (!createRes.ok) {
    const text = await createRes.text();
    throw new Error(`Session create failed ${createRes.status}: ${text}`);
  }

  const sessionId = createRes.headers.get("x-eve-session-id");
  const createJson = await createRes.json();
  const id = sessionId ?? createJson.sessionId;
  if (!id) throw new Error("No session id in response");

  console.log(`✓ Session ${id}`);

  console.log("→ Reading stream…");
  const streamRes = await fetch(
    `${BASE}/api/eve/eve/v1/session/${id}/stream`,
    { headers: { Accept: "application/x-ndjson" } }
  );
  if (!streamRes.ok) {
    throw new Error(`Stream failed ${streamRes.status}`);
  }

  const reader = streamRes.body?.getReader();
  if (!reader) throw new Error("No stream body");

  const decoder = new TextDecoder();
  let buffer = "";
  let sawText = false;
  let sawTool = false;
  let sawReasoning = false;
  let turnCompleted = false;
  const deadline = Date.now() + 120_000;

  while (Date.now() < deadline && !turnCompleted) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      if (!line.trim()) continue;
      let ev;
      try {
        ev = JSON.parse(line);
      } catch {
        continue;
      }
      const type = ev.type ?? "";
      const payload = JSON.stringify(ev);

      if (type.includes("reasoning") || payload.includes("reasoning")) {
        sawReasoning = true;
      }
      if (
        type.includes("tool") ||
        payload.includes("toolCall") ||
        payload.includes("dynamic-tool")
      ) {
        sawTool = true;
        console.log(`  [tool] ${payload.slice(0, 120)}…`);
      }
      if (type === "message.appended" || type === "message.completed") {
        const text = ev.data?.message ?? ev.data?.messageDelta ?? "";
        if (text) {
          sawText = true;
          console.log(`  [text] ${String(text).slice(0, 80)}`);
        }
      }
      if (type === "turn.completed" || type === "session.waiting") {
        turnCompleted = true;
        console.log(`  [done] ${type}`);
      }
    }
  }

  console.log("\n── Results ──");
  console.log(`  Reasoning events: ${sawReasoning ? "yes" : "no"}`);
  console.log(`  Tool/API calls:   ${sawTool ? "yes" : "no"}`);
  console.log(`  Assistant text:   ${sawText ? "yes" : "no"}`);

  if (!sawText) {
    process.exit(1);
  }
  console.log("\n✓ Smoke test passed");
}

main().catch((err) => {
  console.error("✗", err.message);
  process.exit(1);
});
