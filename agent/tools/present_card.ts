import { defineTool } from "eve/tools";
import { z } from "zod";

export default defineTool({
  description:
    "Format key-value data as a structured info card. Use to present property summaries, company overviews, or any entity's key facts in a clean, readable format. Pass labeled field definitions with values.",
  inputSchema: z.object({
    title: z.string().describe("Card title (e.g. 'Borgergade 24, 1300 København K')."),
    subtitle: z
      .string()
      .optional()
      .describe("Optional subtitle (e.g. 'BFE 12345678 · Ejerlejlighed')."),
    fields: z
      .array(
        z.object({
          label: z.string().describe("Field label (e.g. 'Boligareal')."),
          value: z.string().describe("Formatted value (e.g. '85 m²')."),
          emphasis: z
            .boolean()
            .optional()
            .default(false)
            .describe("Set true to highlight this field (e.g. the price)."),
          detail: z
            .string()
            .optional()
            .describe("Optional detail text shown below the value."),
        })
      )
      .describe("Key-value field pairs to display."),
    sections: z
      .array(
        z.object({
          heading: z.string().describe("Section heading."),
          fields: z
            .array(
              z.object({
                label: z.string(),
                value: z.string(),
                emphasis: z.boolean().optional().default(false),
                detail: z.string().optional(),
              })
            )
            .describe("Fields in this section."),
        })
      )
      .optional()
      .describe("Optional grouped sections (for complex entities with multiple data categories)."),
    footer: z.string().optional().describe("Optional footer note."),
    badge: z
      .object({
        text: z.string().describe("Badge text."),
        color: z
          .enum(["green", "yellow", "red", "blue", "gray"])
          .optional()
          .default("blue")
          .describe("Badge color indicating status/severity."),
      })
      .optional()
      .describe("Optional status badge (e.g. 'Aktiv', 'Tinglyst', 'Under konkurs')."),
  }),
  async execute({ title, subtitle, fields, sections, footer, badge }) {
    const lines: string[] = [];

    const badgeStr = badge
      ? ` \`[${badge.text.toUpperCase()}]\``
      : "";
    lines.push(`## ${title}${badgeStr}`);
    if (subtitle) lines.push(`*${subtitle}*\n`);

    renderFieldGroup(lines, fields);

    if (sections) {
      for (const s of sections) {
        lines.push(`\n### ${s.heading}`);
        renderFieldGroup(lines, s.fields);
      }
    }

    if (footer) lines.push(`\n*${footer}*`);

    return {
      markdown: lines.join("\n"),
      fieldCount: fields.length + (sections?.reduce((n, s) => n + s.fields.length, 0) ?? 0),
    };
  },
});

function renderFieldGroup(
  lines: string[],
  fields: { label: string; value: string; emphasis?: boolean; detail?: string }[]
) {
  lines.push("|  |  |");
  lines.push("|:--|:--|");
  for (const f of fields) {
    const value = f.emphasis ? `**${f.value}**` : f.value;
    const detail = f.detail ? `\n*${f.detail}*` : "";
    lines.push(`| ${f.label} | ${value}${detail} |`);
  }
}
