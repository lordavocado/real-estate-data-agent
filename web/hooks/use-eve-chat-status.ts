/**
 * Type-safe status helpers for `UseEveAgentStatus`.
 *
 * The status is a string union — `"ready" | "submitted" | "streaming" | "error"`.
 * We expose small predicates and an `isAgentStatus` helper that accepts either
 * a single status or an array of acceptable values.
 */
export type EveAgentStatus = "ready" | "submitted" | "streaming" | "error";

export function isAgentStatus(
  status: string | undefined | null,
  expected: EveAgentStatus | EveAgentStatus[]
): boolean {
  if (!status) return false;
  const list = Array.isArray(expected) ? expected : [expected];
  return list.includes(status as EveAgentStatus);
}

export function isChatBusy(
  status: string | undefined | null
): boolean {
  return isAgentStatus(status, ["submitted", "streaming"]);
}
