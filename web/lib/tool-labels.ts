/**
 * Human-readable labels for tool invocations in the activity rail.
 * Tuple: [in-progress label, completed label]
 */
export const TOOL_LABELS: Record<string, [string, string]> = {
  present_chart: ["Generating chart", "Chart generated"],
  present_table: ["Building table", "Table built"],
  present_card: ["Formatting card", "Card formatted"],
  present_map: ["Rendering map", "Map rendered"],
  present_ui: ["Composing dashboard", "Dashboard composed"],
  present_artifact: ["Building report", "Report built"],
  connection_search: ["Searching API catalog", "Found API operations"],
  calculate_cap_rate: ["Calculating cap rate", "Cap rate calculated"],
};

export function toolActivityLabel(
  toolName: string,
  isLoading: boolean
): string {
  const short = toolName.replace(/^(resights__|dynamic-tool::)/, "");
  const labels = TOOL_LABELS[short] ?? TOOL_LABELS[toolName];
  if (labels) return isLoading ? labels[0] : labels[1];
  const pretty = short
    .replace(/_/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2");
  return isLoading ? `Running ${pretty}…` : `Completed ${pretty}`;
}

export function isToolLoading(state: string): boolean {
  return state === "input-streaming" || state === "input-available";
}

export function isToolFailed(state: string): boolean {
  return (
    state === "output-error" ||
    state === "output-denied" ||
    state === "approval-requested"
  );
}
