import { defineTool } from "eve/tools";
import { z } from "zod";

export default defineTool({
  description:
    "Search for companies in the Resights database by name or CVR number. Returns matching companies with ownership structure, directors, and associated properties.",
  inputSchema: z.object({
    query: z
      .string()
      .describe("Company name or CVR number to search for."),
  }),
  async execute({ query }) {
    const baseUrl = process.env.RESIGHTS_API_DOMAIN || "https://api.resights.dk";
    const res = await fetch(
      `${baseUrl}/companies/search?q=${encodeURIComponent(query)}&limit=10`,
      {
        headers: {
          Authorization: `Bearer ${process.env.RESIGHTS_API_TOKEN}`,
          Accept: "application/json",
        },
      }
    );
    if (!res.ok) {
      throw new Error(`Resights API error ${res.status}: ${await res.text()}`);
    }
    return res.json();
  },
});
