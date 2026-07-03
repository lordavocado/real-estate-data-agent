import { defineCatalog } from "@json-render/core";
import { schema } from "@json-render/react/schema";
import { z } from "zod";

/**
 * Inline UI catalog — constrained component vocabulary for `present_ui`.
 * Styled per DESIGN.md: achromatic surfaces, shadow-as-border, Geist typography.
 */
export const uiCatalog = defineCatalog(schema, {
  components: {
    Card: {
      props: z.object({
        title: z.string().nullable(),
        maxWidth: z.number().nullable(),
      }),
      slots: ["default"],
      description: "Elevated surface container. Do not nest Card inside Card.",
    },
    Stack: {
      props: z.object({
        direction: z.enum(["row", "column"]).nullable(),
        gap: z.enum(["sm", "md", "lg"]).nullable(),
        align: z.string().nullable(),
        justify: z.string().nullable(),
      }),
      slots: ["default"],
      description: "Flex layout — row or column.",
    },
    Grid: {
      props: z.object({
        columns: z.number().nullable(),
        gap: z.enum(["sm", "md", "lg"]).nullable(),
      }),
      slots: ["default"],
      description: "CSS grid for side-by-side metrics or charts.",
    },
    Heading: {
      props: z.object({
        text: z.string(),
        level: z.number().nullable(),
      }),
      description: "Section heading (h1–h4).",
    },
    Text: {
      props: z.object({
        text: z.string(),
        variant: z.enum(["body", "caption", "lead"]).nullable(),
        muted: z.boolean().nullable(),
      }),
      description: "Paragraph text.",
    },
    Badge: {
      props: z.object({
        text: z.string(),
        variant: z
          .enum(["neutral", "positive", "negative", "info", "warning"])
          .nullable(),
      }),
      description: "Status pill — achromatic variants only.",
    },
    Separator: {
      props: z.object({}),
      description: "Hairline divider.",
    },
    Metric: {
      props: z.object({
        label: z.string(),
        value: z.string(),
        change: z.string().nullable(),
        changeType: z.enum(["positive", "negative", "neutral"]).nullable(),
        detail: z.string().nullable(),
      }),
      description: "KPI stat — label, value, optional change indicator.",
    },
    Table: {
      props: z.object({
        columns: z.array(z.string()),
        rows: z.array(z.array(z.unknown())),
        caption: z.string().nullable(),
      }),
      description: "Data table with string column headers.",
    },
    BarChart: {
      props: z.object({
        title: z.string().nullable(),
        labels: z.array(z.string()),
        datasets: z.array(
          z.object({
            label: z.string().nullable(),
            data: z.array(z.number()),
            color: z.string().nullable(),
          })
        ),
        direction: z.enum(["vertical", "horizontal"]).nullable(),
        height: z.number().nullable(),
      }),
      description: "Bar chart for comparisons and distributions.",
    },
    LineChart: {
      props: z.object({
        title: z.string().nullable(),
        labels: z.array(z.string()),
        datasets: z.array(
          z.object({
            label: z.string().nullable(),
            data: z.array(z.number()),
            color: z.string().nullable(),
          })
        ),
        height: z.number().nullable(),
      }),
      description: "Line chart for time series.",
    },
    PieChart: {
      props: z.object({
        title: z.string().nullable(),
        labels: z.array(z.string()),
        datasets: z.array(
          z.object({
            label: z.string().nullable(),
            data: z.array(z.number()),
          })
        ),
        height: z.number().nullable(),
      }),
      description: "Pie chart for proportional breakdowns.",
    },
    Progress: {
      props: z.object({
        label: z.string().nullable(),
        value: z.number(),
        max: z.number().nullable(),
      }),
      description: "Progress bar (0–100).",
    },
    List: {
      props: z.object({
        items: z.array(
          z.object({
            icon: z.string().nullable(),
            text: z.string(),
            description: z.string().nullable(),
          })
        ),
      }),
      description: "Icon + text list.",
    },
    MapView: {
      props: z.object({
        title: z.string().nullable(),
        points: z.array(
          z.object({
            lat: z.number(),
            lng: z.number(),
            label: z.string().nullable(),
            detail: z.string().nullable(),
          })
        ),
        center: z
          .object({ lat: z.number(), lng: z.number() })
          .nullable(),
        zoom: z.number().nullable(),
        height: z.number().nullable(),
      }),
      description: "Interactive Leaflet map with markers.",
    },
  },
  actions: {},
});
