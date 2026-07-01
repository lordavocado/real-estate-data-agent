import { defineTool } from "eve/tools";
import { z } from "zod";

export default defineTool({
  description:
    "Calculate the total acquisition cost for a Danish real estate purchase, including all fees and taxes. Covers registration fee (tinglysningsafgift), legal fees, and optional mortgage costs. Use when a user is evaluating a purchase and needs to know the total cash required.",
  inputSchema: z.object({
    purchase_price: z.number().describe("Purchase price in DKK."),
    property_type: z
      .enum(["residential", "commercial", "land"])
      .optional()
      .default("residential")
      .describe("Property type — affects some fee structures."),
    legal_fee_percent: z
      .number()
      .optional()
      .default(0.6)
      .describe("Legal/advokat fee as percentage of purchase price (default 0.6%)."),
    legal_fee_flat: z
      .number()
      .optional()
      .default(10000)
      .describe("Flat legal fee in DKK on top of percentage (default 10,000 kr)."),
    include_mortgage_costs: z.boolean().optional().default(false).describe("Include mortgage setup costs."),
    mortgage_amount: z
      .number()
      .optional()
      .default(0)
      .describe("If including mortgage costs, the loan amount in DKK."),
    mortgage_type: z
      .enum(["realkredit", "bank"])
      .optional()
      .default("realkredit")
      .describe("Mortgage type — realkredit has different fees than bank loans."),
    is_owner_occupied: z
      .boolean()
      .optional()
      .default(true)
      .describe("Whether the buyer will occupy the property (affects some fees)."),
  }),
  async execute(input) {
    const {
      purchase_price,
      legal_fee_percent = 0.6,
      legal_fee_flat = 10000,
      include_mortgage_costs = false,
      mortgage_amount = 0,
      mortgage_type = "realkredit",
      is_owner_occupied = true,
    } = input;

    const tinglysning_variable = purchase_price * 0.0145;
    const tinglysning_fixed = 1850;
    const tinglysning_total = tinglysning_variable + tinglysning_fixed;

    const legal_percentage = purchase_price * (legal_fee_percent / 100);
    const legal_total = legal_percentage + legal_fee_flat;

    let mortgage_reg_fixed = 0;
    let mortgage_reg_variable = 0;
    let mortgage_bank_fee = 0;
    let mortgage_guarantee = 0;

    if (include_mortgage_costs && mortgage_amount > 0) {
      mortgage_reg_fixed = 1850;
      mortgage_reg_variable = mortgage_amount * 0.0145;

      if (mortgage_type === "realkredit") {
        mortgage_guarantee = mortgage_amount * 0.01;
      } else {
        mortgage_bank_fee = 5000;
      }
    }

    const mortgage_total =
      mortgage_reg_fixed + mortgage_reg_variable + mortgage_bank_fee + mortgage_guarantee;

    const total_acquisition = purchase_price + tinglysning_total + legal_total + mortgage_total;

    return {
      inputs: {
        purchase_price_dkk: purchase_price,
        property_type: input.property_type,
        is_owner_occupied,
      },
      breakdown: {
        tinglysning_afgift: {
          variable_1_45_percent_dkk: round(tinglysning_variable),
          fixed_dkk: tinglysning_fixed,
          total_dkk: round(tinglysning_total),
        },
        legal_fees: {
          percentage_dkk: round(legal_percentage),
          flat_dkk: legal_fee_flat,
          total_dkk: round(legal_total),
        },
        mortgage_costs: include_mortgage_costs
          ? {
              registration_fixed_dkk: mortgage_reg_fixed,
              registration_variable_1_45_percent_dkk: round(mortgage_reg_variable),
              bank_fee_dkk: mortgage_bank_fee,
              guarantee_dkk: round(mortgage_guarantee),
              total_dkk: round(mortgage_total),
            }
          : undefined,
      },
      totals: {
        purchase_price_dkk: purchase_price,
        fees_and_taxes_dkk: round(tinglysning_total + legal_total + mortgage_total),
        total_acquisition_dkk: round(total_acquisition),
        fees_percent: round(((total_acquisition - purchase_price) / purchase_price) * 100),
      },
      text: [
        `**Samlet anskaffelsessum: ${round(total_acquisition).toLocaleString("da-DK")} kr**`,
        ``,
        `- Købspris: ${purchase_price.toLocaleString("da-DK")} kr`,
        `- Tinglysningsafgift (1,45% + 1.850 kr): ${round(tinglysning_total).toLocaleString("da-DK")} kr`,
        `- Advokatomkostninger (~${legal_fee_percent}% + ${legal_fee_flat.toLocaleString("da-DK")} kr): ${round(legal_total).toLocaleString("da-DK")} kr`,
        ...(include_mortgage_costs && mortgage_amount > 0
          ? [
              `- Låneomkostninger: ${round(mortgage_total).toLocaleString("da-DK")} kr`,
            ]
          : []),
        ``,
        `- **Samlede omkostninger ud over købspris: ${round(tinglysning_total + legal_total + mortgage_total).toLocaleString("da-DK")} kr (${round(((total_acquisition - purchase_price) / purchase_price) * 100)}%)**`,
      ].join("\n"),
    };
  },
});

function round(n: number): number {
  return Math.round(n * 100) / 100;
}
