/**
 * Same-origin proxy to the eve backend (`eve dev` → :2000, `eve start` → :3000).
 *
 * `useEveAgent` posts a `SendTurnPayload` and reads an NDJSON stream of
 * `HandleMessageStreamEvent`s. Rendering eve from a browser requires a
 * same-origin request (no CORS), so this thin proxy relays the request
 * and stream verbatim, also forwarding `x-eve-session-id` for resumable
 * sessions.
 */
const EVE_BASE_URL =
  process.env.EVE_BASE_URL ?? "http://localhost:2000";

type Params = Promise<{ path: string[] }>;

function targetUrl(req: Request, path: string[]): string {
  const subPath = path.join("/");
  // Re-use the browser's query string but overwrite the rest.
  const incoming = new URL(req.url);
  // `useEveAgent({ host: "/api/eve" })` calls `/api/eve/eve/v1/...` — the
  // catch-all path already includes the `eve/` prefix; do not add it again.
  const target = new URL(`${EVE_BASE_URL}/${subPath}`);
  target.search = incoming.search;
  return target.toString();
}

function forwardHeaders(req: Request): Headers {
  const out = new Headers();
  // Forward hop-by-hop-ish headers we care about.
  const passthrough = [
    "content-type",
    "accept",
    "x-eve-session-id",
    "x-eve-stream-format",
    "x-eve-stream-version",
  ];
  for (const h of passthrough) {
    const v = req.headers.get(h);
    if (v) out.set(h, v);
  }
  return out;
}

async function forward(req: Request, params: Params): Promise<Response> {
  const { path } = await params;
  const url = targetUrl(req, path);
  const init: RequestInit = {
    method: req.method,
    headers: forwardHeaders(req),
    // GET/HEAD have no body; for others forward body verbatim.
    body:
      req.method === "GET" || req.method === "HEAD"
        ? undefined
        : await req.arrayBuffer(),
    // Streaming must bypass Next's body buffering for SSE/NDJSON.
    cache: "no-store",
    // @ts-expect-error duplex is supported by Node fetch but not in TS lib yet.
    duplex: "half",
  };
  const upstream = await fetch(url, init);
  // Pass through the upstream headers, but always stream NDJSON as such.
  const headers = new Headers(upstream.headers);
  headers.set("cache-control", "no-store");
  headers.set("x-accel-buffering", "no");
  return new Response(upstream.body, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers,
  });
}

export async function GET(
  req: Request,
  context: { params: Params }
): Promise<Response> {
  return forward(req, context.params);
}
export async function POST(
  req: Request,
  context: { params: Params }
): Promise<Response> {
  return forward(req, context.params);
}
export async function PUT(
  req: Request,
  context: { params: Params }
): Promise<Response> {
  return forward(req, context.params);
}
export async function PATCH(
  req: Request,
  context: { params: Params }
): Promise<Response> {
  return forward(req, context.params);
}
export async function DELETE(
  req: Request,
  context: { params: Params }
): Promise<Response> {
  return forward(req, context.params);
}
export async function HEAD(
  req: Request,
  context: { params: Params }
): Promise<Response> {
  return forward(req, context.params);
}
export async function OPTIONS(
  req: Request,
  context: { params: Params }
): Promise<Response> {
  return forward(req, context.params);
}
