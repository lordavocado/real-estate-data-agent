import { defineTool } from "eve/tools";
import { z } from "zod";

const columnDef = z.object({
  header: z.string().describe("Column header text."),
  key: z.string().describe("Key path in the row data (e.g. 'price' or 'address.street')."),
  align: z
    .enum(["left", "right", "center"])
    .optional()
    .default("left")
    .describe("Text alignment."),
  format: z
    .enum(["number", "currency_dkk", "currency_eur", "percentage", "area_m2", "date", "text"])
    .optional()
    .default("text")
    .describe("How to format the value."),
});

export default defineTool({
  description:
    "Format structured data as a readable markdown table. Use after retrieving data from the Resights API to present results clearly to the user. Pass an array of row objects and column definitions.",
  inputSchema: z.object({
    title: z.string().optional().describe("Optional title for the table."),
    rows: z.array(z.record(z.string(), z.unknown())).describe("Array of data rows, each as a key-value object."),
    columns: z
      .array(columnDef)
      .describe("Column definitions — header, key, alignment, and format."),
    footer: z
      .string()
      .optional()
      .describe("Optional footer note (e.g. 'Source: Resights API, July 2026')."),
  }),
  async execute({ title, rows, columns, footer }) {
    const lines: string[] = [];

    if (title) lines.push(`### ${title}\n`);

    const headers = columns.map((c) => c.header);
    const alignMap: Record<string, string> = {
      left: ":--",
      right: "--:",
      center: ":-:",
    };

    lines.push("| " + headers.join(" | ") + " |");
    lines.push("| " + columns.map((c) => alignMap[c.align ?? "left"]).join(" | ") + " |");

    for (const row of rows) {
      const cells = columns.map((col) => {
        const value = resolveKey(row, col.key);
        return formatValue(value, col.format);
      });
      lines.push("| " + cells.join(" | ") + " |");
    }

    if (footer) lines.push(`\n*${footer}*`);

    return {
      // Structured payload — lets the frontend render an interactive table
      // (sortable, sticky header, formatted columns) instead of relying on
      // markdown parsing.
      title,
      footer,
      rows,
      columns,
      // Markdown fallback for clients that cannot render structured data.
      markdown: lines.join("\n"),
      rowCount: rows.length,
      columnCount: columns.length,
    };
  },
});

function resolveKey(obj: unknown, key: string): unknown {
  if (obj === null || obj === undefined) return null;
  const parts = key.split(".");
  let current: unknown = obj;
  for (const part of parts) {
    if (typeof current !== "object" || current === null) return null;
    current = (current as Record<string, unknown>)[part];
  }
  return current;
}

function formatValue(value: unknown, format: string): string {
  if (value === null || value === undefined) return "—";

  switch (format) {
    case "number":
      return typeof value === "number" ? value.toLocaleString("da-DK") : String(value);
    case "currency_dkk":
      return typeof value === "number"
        ? `${value.toLocaleString("da-DK")} kr.`
        : String(value);
    case "currency_eur":
      return typeof value === "number" ? `€${value.toLocaleString("da-DK")}` : String(value);
    case "percentage":
      return typeof value === "number" ? `${value.toFixed(1)}%` : String(value);
    case "area_m2":
      return typeof value === "number"
        ? `${value.toLocaleString("da-DK")} m²`
        : String(value);
    case "date": {
      if (typeof value === "string") {
        const d = new Date(value);
        if (!isNaN(d.getTime())) return d.toLocaleDateString("da-DK");
      }
      return String(value);
    }
    default:
      return String(value);
  }
}
