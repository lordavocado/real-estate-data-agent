import { defineTool } from "eve/tools";
import { z } from "zod";

export default defineTool({
  description:
    "Calculate the cap rate (afkastgrad) for a real estate investment. Cap rate = NOI / property value. Also calculates gross yield and net yield. Use when a user asks about investment returns, yield, or whether a price is fair relative to rental income.",
  inputSchema: z.object({
    property_value: z.number().describe("Property purchase price or market value in DKK."),
    gross_rent_annual: z.number().describe("Gross annual rental income in DKK."),
    vacancy_rate_percent: z
      .number()
      .optional()
      .default(3)
      .describe("Estimated vacancy rate as percentage (default 3%)."),
    property_tax_annual: z
      .number()
      .optional()
      .default(0)
      .describe("Annual property tax (ejendomsskat) in DKK."),
    land_tax_annual: z
      .number()
      .optional()
      .default(0)
      .describe("Annual land tax (grundskyld) in DKK."),
    insurance_annual: z
      .number()
      .optional()
      .default(0)
      .describe("Annual insurance in DKK."),
    maintenance_annual: z
      .number()
      .optional()
      .default(0)
      .describe("Annual maintenance costs in DKK."),
    admin_annual: z
      .number()
      .optional()
      .default(0)
      .describe("Annual administration/property management costs in DKK."),
    other_expenses_annual: z
      .number()
      .optional()
      .default(0)
      .describe("Any other annual operating expenses in DKK."),
  }),
  async execute(input) {
    const {
      property_value,
      gross_rent_annual,
      vacancy_rate_percent = 3,
      property_tax_annual = 0,
      land_tax_annual = 0,
      insurance_annual = 0,
      maintenance_annual = 0,
      admin_annual = 0,
      other_expenses_annual = 0,
    } = input;

    const vacancy = gross_rent_annual * (vacancy_rate_percent / 100);
    const effective_gross = gross_rent_annual - vacancy;
    const total_expenses =
      property_tax_annual +
      land_tax_annual +
      insurance_annual +
      maintenance_annual +
      admin_annual +
      other_expenses_annual;
    const noi = effective_gross - total_expenses;
    const cap_rate = property_value > 0 ? (noi / property_value) * 100 : 0;
    const gross_yield = property_value > 0 ? (gross_rent_annual / property_value) * 100 : 0;
    const net_yield = property_value > 0 ? (noi / property_value) * 100 : 0;

    return {
      inputs: {
        property_value_dkk: property_value,
        gross_rent_annual_dkk: gross_rent_annual,
        vacancy_rate_percent,
      },
      income: {
        gross_rent_annual_dkk: gross_rent_annual,
        vacancy_dkk: vacancy,
        effective_gross_income_dkk: effective_gross,
      },
      expenses: {
        property_tax_dkk: property_tax_annual,
        land_tax_dkk: land_tax_annual,
        insurance_dkk: insurance_annual,
        maintenance_dkk: maintenance_annual,
        administration_dkk: admin_annual,
        other_dkk: other_expenses_annual,
        total_expenses_dkk: total_expenses,
      },
      results: {
        noi_dkk: noi,
        cap_rate_percent: round(cap_rate),
        gross_yield_percent: round(gross_yield),
        net_yield_percent: round(net_yield),
        monthly_noi_dkk: round(noi / 12),
      },
      summary:
        `Afkastgrad (cap rate): **${round(cap_rate)}%**\n` +
        `Bruttoafkast: **${round(gross_yield)}%**\n` +
        `Nettoafkast: **${round(net_yield)}%**\n` +
        `NOI: **${round(noi).toLocaleString("da-DK")} kr/år** (${round(noi / 12).toLocaleString("da-DK")} kr/md)`,
    };
  },
});

function round(n: number): number {
  return Math.round(n * 10) / 10;
}
