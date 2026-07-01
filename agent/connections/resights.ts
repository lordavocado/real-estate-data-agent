import { defineOpenAPIConnection } from "eve/connections";
import spec from "./resights-openapi.json";

export default defineOpenAPIConnection({
  spec: {
    ...spec,
    servers: [
      {
        url: process.env.RESIGHTS_API_DOMAIN || "https://api.resights.dk",
      },
    ],
  },
  baseUrl: process.env.RESIGHTS_API_DOMAIN || "https://api.resights.dk",
  description:
    "Resights API — the leading Danish property and company data platform. Query properties (BFE), companies (CVR), members, persons (EJF), real estate transactions/trades, rental data, GIS layers, municipal plans, energy labels, POI, and more. Supports Elasticsearch-style DSL queries for advanced filtering and aggregations across 2,500+ data variables from 15+ Danish public registries including BBR, CVR, Tinglysningen, VUR, and Plandata.dk.",
  auth: {
    getToken: async () => ({
      token: process.env.RESIGHTS_API_TOKEN!,
    }),
  },
});
