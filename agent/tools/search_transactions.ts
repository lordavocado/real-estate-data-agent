import { defineTool } from "eve/tools";
import { z } from "zod";

export default defineTool({
  description:
    "Search for property transactions (sales) by BFE number, address, or area. Returns transaction dates, prices, and sale types.",
  inputSchema: z.object({
    bfeNumber: z
      .string()
      .optional()
      .describe("BFE number to find transactions for a specific property."),
    address: z
      .string()
      .optional()
      .describe("Address to find nearby or exact transaction history."),
    limit: z
      .number()
      .optional()
      .default(10)
      .describe("Maximum number of transactions to return."),
  }),
  async execute({ bfeNumber, address, limit }) {
    const baseUrl = process.env.RESIGHTS_API_DOMAIN || "https://api.resights.dk";
    const params = new URLSearchParams();
    if (bfeNumber) params.set("bfe", bfeNumber);
    if (address) params.set("address", address);
    params.set("limit", String(limit));

    const res = await fetch(`${baseUrl}/transactions/search?${params}`, {
      headers: {
        Authorization: `Bearer ${process.env.RESIGHTS_API_TOKEN}`,
        Accept: "application/json",
      },
    });
    if (!res.ok) {
      throw new Error(`Resights API error ${res.status}: ${await res.text()}`);
    }
    return res.json();
  },
});
