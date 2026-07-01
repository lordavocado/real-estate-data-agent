import { defineTool } from "eve/tools";
import { z } from "zod";

const resightsApi = {
  baseUrl: process.env.RESIGHTS_API_DOMAIN || "https://api.resights.dk",
  token: process.env.RESIGHTS_API_TOKEN,

  async request(path: string, params?: Record<string, string>) {
    const url = new URL(path, this.baseUrl);
    if (params) {
      Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
    }
    const res = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${this.token}`,
        Accept: "application/json",
      },
    });
    if (!res.ok) {
      throw new Error(`Resights API error ${res.status}: ${await res.text()}`);
    }
    return res.json();
  },
};

export default defineTool({
  description:
    "Search for properties in the Resights database by address, BFE number, street name, or city. Returns matching properties with key details including square meters, building year, usage type, and assessed value.",
  inputSchema: z.object({
    query: z
      .string()
      .describe(
        "Search term — an address (e.g. 'Borgergade 24, Kobenhavn K'), BFE number, street name, or city."
      ),
  }),
  async execute({ query }) {
    return resightsApi.request("/properties/search", { q: query, limit: "10" });
  },
});
