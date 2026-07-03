#!/usr/bin/env node
/**
 * Integration test: send a real property query, expect data API tool calls + assistant text.
 */
const BASE = process.env.WEB_URL ?? "http://localhost:3001";
const MESSAGE =
  process.env.SMOKE_MESSAGE ??
  "Hvem ejer matriklen Borgergade 24, 1300 København K? Giv ejer og CVR hvis muligt.";
const TIMEOUT_MS = Number(process.env.SMOKE_TIMEOUT_MS ?? 180_000);

async function main() {
  console.log("→ Creating session…");
  console.log(`  Query: ${MESSAGE.slice(0, 80)}…`);

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

  const id =
    createRes.headers.get("x-eve-session-id") ??
    (await createRes.json()).sessionId;
  if (!id) throw new Error("No session id");

  console.log(`✓ Session ${id}`);

  const streamRes = await fetch(
    `${BASE}/api/eve/eve/v1/session/${id}/stream`,
    { headers: { Accept: "application/x-ndjson" } }
  );
  if (!streamRes.ok) throw new Error(`Stream failed ${streamRes.status}`);

  const reader = streamRes.body?.getReader();
  if (!reader) throw new Error("No stream body");

  const decoder = new TextDecoder();
  let buffer = "";
  const toolNames = new Set();
  let assistantText = "";
  let sawDataApiTool = false;
  let sawError = false;
  let errorMsg = "";
  const deadline = Date.now() + TIMEOUT_MS;

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

      const type = ev.type ?? "";
      const raw = JSON.stringify(ev);

      if (type === "error" || raw.includes("MODEL_CALL_FAILED")) {
        sawError = true;
        errorMsg = ev.data?.message ?? ev.data?.error ?? raw.slice(0, 300);
        console.log(`  [error] ${errorMsg}`);
      }

      // eve step/tool events
      if (
        type.includes("tool") ||
        raw.includes("toolName") ||
        raw.includes("resights__")
      ) {
        const nameMatch = raw.match(/resights__([a-z0-9_]+)/i);
        if (nameMatch) {
          const name = `resights__${nameMatch[1]}`;
          if (!toolNames.has(name)) {
            toolNames.add(name);
            sawDataApiTool = true;
            console.log(`  [api] ${name}`);
          }
        }
        const builtinMatch = raw.match(
          /"(load_skill|connection_search|present_[a-z_]+)"/
        );
        if (builtinMatch && !toolNames.has(builtinMatch[1])) {
          toolNames.add(builtinMatch[1]);
          console.log(`  [tool] ${builtinMatch[1]}`);
        }
      }

      if (type === "message.appended") {
        const delta = ev.data?.messageDelta ?? "";
        if (delta) assistantText += delta;
      }
      if (type === "message.completed") {
        const msg = ev.data?.message ?? "";
        if (msg) assistantText = msg;
      }

      if (type === "turn.completed" || type === "session.waiting") {
        console.log(`  [done] ${type}`);
        break;
      }
    }

    if (assistantText.length > 100 && sawDataApiTool) break;
  }

  console.log("\n── Results ──");
  console.log(`  Data API tools: ${sawDataApiTool ? [...toolNames].filter((n) => n.startsWith("resights__")).join(", ") || "yes" : "NO"}`);
  console.log(`  All tools (${toolNames.size}): ${[...toolNames].join(", ") || "none"}`);
  console.log(`  Assistant text (${assistantText.length} chars):`);
  console.log(`  ${assistantText.slice(0, 400)}${assistantText.length > 400 ? "…" : ""}`);

  if (sawError && !assistantText) {
    throw new Error(`Agent error: ${errorMsg}`);
  }
  if (!sawDataApiTool) {
    throw new Error("No property data API tool was called");
  }
  if (assistantText.length < 50) {
    throw new Error("Assistant response too short — likely no real API data");
  }

  console.log("\n✓ API integration test passed");
}

main().catch((err) => {
  console.error("\n✗", err.message);
  process.exit(1);
});
