import type { Spec } from "@json-render/core";

export interface PresentUiOutput {
  root?: string;
  elements?: Record<
    string,
    {
      type: string;
      props?: Record<string, unknown>;
      children?: string[];
      visible?: Record<string, unknown>;
    }
  >;
  data?: Record<string, unknown>;
  title?: string;
}

/** Convert `present_ui` tool output into a json-render Spec. */
export function specFromPresentUi(output: unknown): Spec | null {
  if (!output || typeof output !== "object") return null;
  const obj = output as PresentUiOutput;
  if (!obj.root || !obj.elements || typeof obj.elements !== "object") {
    return null;
  }
  return {
    root: obj.root,
    elements: obj.elements as Spec["elements"],
  };
}

export function stateFromPresentUi(output: unknown): Record<string, unknown> {
  if (!output || typeof output !== "object") return {};
  const data = (output as PresentUiOutput).data;
  return data && typeof data === "object" ? { ...data } : {};
}
