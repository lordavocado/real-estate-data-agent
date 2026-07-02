import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Compose Tailwind class strings, deduping conflicts. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Format a date in Danish locale for tool sources, etc. */
export function formatDanishDate(value: string | number | Date): string {
  const d = value instanceof Date ? value : new Date(value);
  if (isNaN(d.getTime())) return String(value);
  return d.toLocaleDateString("da-DK", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });
}

/** Format a number in Danish locale. */
export function formatDanishNumber(value: number, fractionDigits = 0): string {
  return value.toLocaleString("da-DK", {
    maximumFractionDigits: fractionDigits,
    minimumFractionDigits: fractionDigits,
  });
}

/** Map a Resights/OpenAPI tool name to a short display label. */
export function shortToolName(name: string): string {
  if (!name) return "Tool";
  // strip prefixes like `resights__` or `dynamic-tool::`
  const cleaned = name.replace(/^(resights__|dynamic-tool::)/, "");
  return cleaned
    .replace(/_/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Tiny unique id for client keys (avoids hydration misses). */
let _idCounter = 0;
export function uid(prefix = "id"): string {
  _idCounter += 1;
  return `${prefix}_${_idCounter}_${Math.random().toString(36).slice(2, 8)}`;
}
