import { defineTool } from "eve/tools";
import { z } from "zod";

export default defineTool({
  description:
    "Generate a chart from data. Supports bar, line, pie, and scatter charts. Returns structured chart data for frontend rendering, a QuickChart.io image URL for inline chat visualization, and a markdown text fallback. Use after retrieving data from the Resights API — for example to show price trends over time, compare property values across areas, or visualize rental distributions.",
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
    const DEFAULT_COLORS = ["#1e40af", "#0d9488", "#c2410c", "#7e22ce", "#b45309", "#166534", "#dc2626", "#2563eb"];

    const styledDatasets = datasets.map((ds, i) => ({
      label: ds.label,
      data: ds.values,
      backgroundColor: ds.color ?? DEFAULT_COLORS[i % DEFAULT_COLORS.length],
      borderColor: ds.color ?? DEFAULT_COLORS[i % DEFAULT_COLORS.length],
    }));

    const chart = {
      title,
      type,
      labels,
      datasets: styledDatasets,
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
    };

    const isHorizontal = type === "horizontal_bar";
    const quickChartType = isHorizontal ? "bar" : type;

    const quickChartDs = styledDatasets.map((ds) => ({
      label: ds.label,
      data: ds.data,
      backgroundColor: ds.backgroundColor,
      borderColor: ds.borderColor,
      borderWidth: 1,
    }));

    const quickChartConfig: Record<string, unknown> = {
      type: quickChartType,
      data: { labels, datasets: quickChartDs },
      options: {
        indexAxis: isHorizontal ? "y" : "x",
        plugins: {
          legend: { display: datasets.length > 1 || datasets[0]?.label !== "", position: "bottom" },
          title: { display: true, text: title, font: { size: 16 } },
        },
      },
    };

    if (quickChartType !== "pie") {
      const scales: Record<string, unknown> = {};
      const valueAxis = isHorizontal ? "y" : "x";
      scales[valueAxis] = { beginAtZero: true };
      if (xLabel) scales.x = { ...(typeof scales.x === "object" ? scales.x : {}), title: { display: true, text: xLabel } } as Record<string, unknown>;
      if (yLabel) scales.y = { ...(typeof scales.y === "object" ? scales.y : {}), title: { display: true, text: yLabel } } as Record<string, unknown>;
      (quickChartConfig.options as Record<string, unknown>).scales = scales;
    }

    const encodedConfig = encodeURIComponent(JSON.stringify(quickChartConfig));
    const imageUrl = `https://quickchart.io/chart?c=${encodedConfig}&w=600&h=320&b=ffffff&f=png`;

    const textSummary = buildTextSummary({ title, type, labels, datasets, imageUrl, source });

    return {
      text: textSummary,
      imageUrl,
      chart,
    };
  },
});

function buildTextSummary(opts: {
  title: string;
  type: string;
  labels: string[];
  datasets: { label: string; values: number[]; color?: string }[];
  imageUrl: string;
  source?: string;
}): string {
  const lines: string[] = [];
  lines.push(`## ${opts.title}\n`);

  lines.push(`![${opts.title}](${opts.imageUrl})\n`);

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
