#!/usr/bin/env node
/**
 * Smoke test: create eve session via Next proxy, send a turn, read NDJSON stream
 * until we see assistant text or a tool call.
 */
const BASE = process.env.WEB_URL ?? "http://localhost:3001";
const MESSAGE =
  process.env.SMOKE_MESSAGE ??
  "What is the BFE number for Borgergade 24, 1300 København K? Use the API.";

async function main() {
  console.log("→ Creating session via proxy…");
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

  console.log("→ Opening stream…");
  const streamRes = await fetch(
    `${BASE}/api/eve/eve/v1/session/${id}/stream`,
    { headers: { Accept: "application/x-ndjson" } }
  );
  if (!streamRes.ok) {
    throw new Error(`Stream failed ${streamRes.status}`);
  }

  console.log("→ Sending follow-up turn…");
  const turnRes = await fetch(`${BASE}/api/eve/eve/v1/session/${id}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-eve-session-id": id,
    },
    body: JSON.stringify({ message: MESSAGE }),
  });
  if (!turnRes.ok && turnRes.status !== 202) {
    const text = await turnRes.text();
    throw new Error(`Turn failed ${turnRes.status}: ${text}`);
  }
  console.log(`✓ Turn accepted (${turnRes.status})`);

  const reader = streamRes.body?.getReader();
  if (!reader) throw new Error("No stream body");

  const decoder = new TextDecoder();
  let buffer = "";
  let sawText = false;
  let sawTool = false;
  let sawReasoning = false;
  const deadline = Date.now() + 120_000;

  while (Date.now() < deadline) {
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
      const type = ev.type ?? ev.event ?? "";
      const payload = JSON.stringify(ev).slice(0, 200);
      if (type.includes("reasoning") || payload.includes("reasoning")) {
        sawReasoning = true;
        console.log(`  [reasoning] ${payload.slice(0, 120)}…`);
      }
      if (
        type.includes("tool") ||
        payload.includes("toolCall") ||
        payload.includes("dynamic-tool")
      ) {
        sawTool = true;
        console.log(`  [tool] ${payload.slice(0, 120)}…`);
      }
      if (
        type.includes("text") ||
        type.includes("message") ||
        (ev.part?.type === "text" && ev.part?.text)
      ) {
        sawText = true;
        const text =
          ev.part?.text ?? ev.text ?? ev.delta ?? "";
        if (text) console.log(`  [text] ${String(text).slice(0, 80)}…`);
      }
      if (type.includes("completed") || type.includes("finish")) {
        console.log(`  [done] ${type}`);
      }
    }

    if (sawText && sawTool) break;
  }

  console.log("\n── Results ──");
  console.log(`  Reasoning events: ${sawReasoning ? "yes" : "no"}`);
  console.log(`  Tool/API calls:   ${sawTool ? "yes" : "no"}`);
  console.log(`  Assistant text:   ${sawText ? "yes" : "no"}`);

  if (!sawText && !sawTool) {
    process.exit(1);
  }
  console.log("\n✓ Smoke test passed");
}

main().catch((err) => {
  console.error("✗", err.message);
  process.exit(1);
});
