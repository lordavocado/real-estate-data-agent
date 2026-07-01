import { defineTool } from "eve/tools";
import { z } from "zod";

export default defineTool({
  description:
    "Generate a chart from data. Supports bar, line, pie, and scatter charts. Returns structured chart data that the frontend can render as an interactive visualization, plus a markdown text summary for contexts that cannot render charts. Use after retrieving data from the Resights API — for example to show price trends over time, compare property values across areas, or visualize rental distributions.",
  inputSchema: z.object({
    title: z.string().describe("Chart title."),
    type: z
      .enum(["bar", "horizontal_bar", "line", "pie", "scatter"])
      .describe("Chart type."),
    labels: z.array(z.string()).describe("Labels for each data point (x-axis or slice names)."),
    datasets: z
      .array(
        z.object({
          label: z.string().describe("Dataset label (legend)."),
          values: z.array(z.number()).describe("Numeric values matching the labels array order."),
          color: z
            .string()
            .optional()
            .describe("Optional hex color for this dataset (e.g. '#2563eb')."),
        })
      )
      .describe("One or more datasets to plot."),
    xLabel: z.string().optional().describe("X-axis label."),
    yLabel: z.string().optional().describe("Y-axis label."),
    source: z.string().optional().describe("Data source note."),
  }),
  async execute({ title, type, labels, datasets, xLabel, yLabel, source }) {
    const textSummary = buildTextSummary({ title, type, labels, datasets, source });

    return {
      text: textSummary,
      chart: {
        title,
        type,
        labels,
        datasets: datasets.map((ds) => ({
          label: ds.label,
          data: ds.values,
          backgroundColor: ds.color,
          borderColor: ds.color,
        })),
        options: {
          scales: xLabel || yLabel
            ? {
                x: xLabel ? { title: { display: true, text: xLabel } } : undefined,
                y: yLabel ? { title: { display: true, text: yLabel } } : undefined,
              }
            : undefined,
          plugins: {
            title: { display: true, text: title },
          },
        },
        source,
      },
    };
  },
});

function buildTextSummary(opts: {
  title: string;
  type: string;
  labels: string[];
  datasets: { label: string; values: number[]; color?: string }[];
  source?: string;
}): string {
  const lines: string[] = [];
  lines.push(`## ${opts.title}\n`);

  if (opts.datasets.length === 1 && opts.type !== "scatter" && opts.type !== "pie") {
    lines.push("| " + ["Label", opts.datasets[0].label].join(" | ") + " |");
    lines.push("| " + [":--", "--:"].join(" | ") + " |");
    for (let i = 0; i < opts.labels.length; i++) {
      const val = opts.datasets[0].values[i];
      lines.push(`| ${opts.labels[i]} | ${val?.toLocaleString("da-DK") ?? "—"} |`);
    }
  } else {
    const headers = ["Label", ...opts.datasets.map((d) => d.label)];
    lines.push("| " + headers.join(" | ") + " |");
    lines.push("| " + headers.map((_, i) => (i === 0 ? ":--" : "--:")).join(" | ") + " |");
    for (let i = 0; i < opts.labels.length; i++) {
      const cells = [opts.labels[i], ...opts.datasets.map((d) => d.values[i]?.toLocaleString("da-DK") ?? "—")];
      lines.push("| " + cells.join(" | ") + " |");
    }
  }

  if (opts.source) lines.push(`\n*Kilde: ${opts.source}*`);
  lines.push(`\n*${capitalize(opts.type)} chart with ${opts.labels.length} data points.*`);
  return lines.join("\n");
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
