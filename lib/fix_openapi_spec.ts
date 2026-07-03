/**
 * OpenAPI 3.1 export uses `examples` with scalar/object values.
 * JSON Schema (and OpenAI function schemas) require `examples` to be an array.
 * Normalize at load time: non-array `examples` → singular `example`.
 */
export function fixOpenApiSpec<T extends Record<string, unknown>>(spec: T): T {
  return deepFix(spec) as T;
}

function deepFix(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(deepFix);
  }
  if (value !== null && typeof value === "object") {
    const record = value as Record<string, unknown>;
    const out: Record<string, unknown> = {};
    for (const [key, child] of Object.entries(record)) {
      if (key === "examples" && !Array.isArray(child)) {
        out.example = child;
        continue;
      }
      out[key] = deepFix(child);
    }
    return out;
  }
  return value;
}
