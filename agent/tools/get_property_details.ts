import { defineTool } from "eve/tools";
import { z } from "zod";

export default defineTool({
  description:
    "Get full details for a property by its BFE number. Returns ownership, building characteristics, transactions, assessed value, tax information, and encumbrances.",
  inputSchema: z.object({
    bfeNumber: z
      .string()
      .describe("The BFE (Bestemt Fast Ejendom) number identifying the property."),
  }),
  async execute({ bfeNumber }) {
    const baseUrl = process.env.RESIGHTS_API_DOMAIN || "https://api.resights.dk";
    const res = await fetch(`${baseUrl}/properties/${bfeNumber}`, {
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
