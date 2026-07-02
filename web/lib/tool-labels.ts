/**
 * Human-readable labels for tool invocations in the activity rail.
 * Tuple: [in-progress label, completed label]
 */
export const TOOL_LABELS: Record<string, [string, string]> = {
  present_chart: ["Generating chart", "Chart generated"],
  present_table: ["Building table", "Table built"],
  present_card: ["Formatting card", "Card formatted"],
  present_map: ["Rendering map", "Map rendered"],
  present_artifact: ["Building report", "Report built"],
  connection_search: ["Searching API catalog", "Found API operations"],
  load_skill: ["Loading workflow", "Loaded workflow"],
  todo: ["Updating plan", "Updated plan"],
  get_properties: ["Searching properties", "Found properties"],
  get_properties_advanced: ["Searching properties", "Found properties"],
  get_property_by_bfe_number: ["Looking up property", "Property found"],
  get_cvr_companies: ["Searching companies", "Found companies"],
  get_cvr_network: ["Fetching CVR network", "CVR network loaded"],
  expand_network: ["Expanding network", "Network expanded"],
  calculate_cap_rate: ["Calculating cap rate", "Cap rate calculated"],
  ask_question: ["Needs your input", "Question answered"],
};

export function toolActivityLabel(
  toolName: string,
  isLoading: boolean,
  state?: string
): string {
  const short = toolName.replace(/^(resights__|dynamic-tool::)/, "");
  if (short === "ask_question" && state === "approval-requested") {
    return "Waiting for your answer";
  }
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

export function isToolAwaitingUser(state: string): boolean {
  return state === "approval-requested";
}

export function isToolFailed(state: string): boolean {
  return (
    state === "output-error" ||
    state === "output-denied"
  );
}
