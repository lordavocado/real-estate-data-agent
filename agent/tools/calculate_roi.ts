import { defineTool } from "eve/tools";
import { z } from "zod";

export default defineTool({
  description:
    "Calculate return on investment (ROI) for a real estate purchase with multiple sensitivity scenarios. Computes cap rate, cash-on-cash return, annual cash flow, and equity buildup. Supports base case, optimistic, and pessimistic scenarios. Use when a user wants a complete investment picture — not just yield, but total return including leverage and tax effects.",
  inputSchema: z.object({
    purchase_price: z.number().describe("Purchase price in DKK."),
    building_area_m2: z
      .number()
      .optional()
      .describe("Building area in m² (used for per-m² benchmarks)."),
    gross_rent_annual: z.number().describe("Gross annual rental income in DKK."),
    vacancy_rate_percent: z
      .number()
      .optional()
      .default(3)
      .describe("Vacancy rate as percentage."),
    total_expenses_annual: z.number().describe("Total annual operating expenses (taxes + insurance + maintenance + admin) in DKK."),
    financing: z
      .object({
        loan_amount: z.number().describe("Loan amount in DKK."),
        interest_rate_percent: z.number().describe("Annual interest rate incl. bidrag."),
        term_years: z.number().optional().default(30).describe("Loan term in years."),
        interest_only: z
          .boolean()
          .optional()
          .default(false)
          .describe("True if interest-only (afdragsfrihed), false for annuity."),
      })
      .optional()
      .describe("Financing details. If omitted, assumes all-cash purchase."),
    scenarios: z
      .object({
        rent_change_percent: z
          .number()
          .optional()
          .default(0)
          .describe("Rent increase (positive) or decrease (negative) as percentage."),
        vacancy_change_percent: z
          .number()
          .optional()
          .default(0)
          .describe("Vacancy change in percentage points."),
        interest_change_percent: z
          .number()
          .optional()
          .default(0)
          .describe("Interest rate change in percentage points."),
      })
      .optional()
      .describe("Override scenarios. If omitted, runs default scenarios."),
  }),
  async execute(input) {
    const {
      purchase_price,
      building_area_m2,
      gross_rent_annual,
      vacancy_rate_percent = 3,
      total_expenses_annual,
      financing,
      scenarios,
    } = input;

    const base = calculateScenario(
      purchase_price,
      gross_rent_annual,
      vacancy_rate_percent,
      total_expenses_annual,
      financing,
      0,
      0,
      0
    );

    const userScenario = scenarios
      ? calculateScenario(
          purchase_price,
          gross_rent_annual,
          vacancy_rate_percent + (scenarios.vacancy_change_percent ?? 0),
          total_expenses_annual,
          financing,
          scenarios.rent_change_percent ?? 0,
          scenarios.vacancy_change_percent ?? 0,
          scenarios.interest_change_percent ?? 0
        )
      : undefined;

    const rent_down = calculateScenario(
      purchase_price,
      gross_rent_annual,
      vacancy_rate_percent,
      total_expenses_annual,
      financing,
      -10,
      0,
      0
    );

    const vacancy_up = calculateScenario(
      purchase_price,
      gross_rent_annual,
      vacancy_rate_percent + 7,
      total_expenses_annual,
      financing,
      0,
      7,
      0
    );

    const worst = calculateScenario(
      purchase_price,
      gross_rent_annual,
      vacancy_rate_percent + 7,
      total_expenses_annual,
      financing,
      -10,
      7,
      0
    );

    const rent_up = calculateScenario(
      purchase_price,
      gross_rent_annual,
      vacancy_rate_percent,
      total_expenses_annual,
      financing,
      10,
      0,
      0
    );

    const per_m2 = building_area_m2
      ? {
          price_per_m2_dkk: round(purchase_price / building_area_m2),
          rent_per_m2_annual_dkk: round(gross_rent_annual / building_area_m2),
          rent_per_m2_monthly_dkk: round(gross_rent_annual / building_area_m2 / 12),
        }
      : undefined;

    return {
      inputs: {
        purchase_price_dkk: purchase_price,
        gross_rent_annual_dkk: gross_rent_annual,
        vacancy_rate_percent,
        total_expenses_annual_dkk: total_expenses_annual,
        financing: financing
          ? {
              loan_amount_dkk: financing.loan_amount,
              equity_dkk: purchase_price - financing.loan_amount,
              ltv_percent: round((financing.loan_amount / purchase_price) * 100),
              interest_rate_percent: financing.interest_rate_percent,
              type: financing.interest_only ? "afdragsfrihed" : "annuitet",
            }
          : "all-cash (kontant)",
      },
      per_m2_benchmarks: per_m2,
      base_case: formatResult(base),
      scenarios: {
        rent_down_10_percent: formatResult(rent_down),
        vacancy_up_10_percent: formatResult(vacancy_up),
        worst_case: formatResult(worst),
        rent_up_10_percent: formatResult(rent_up),
        ...(userScenario ? { custom: formatResult(userScenario) } : {}),
      },
      text: buildSummary(base, per_m2, rent_down, worst, rent_up),
    };
  },
});

function calculateScenario(
  purchase_price: number,
  gross_rent: number,
  vacancy_rate: number,
  expenses: number,
  financing:
    | { loan_amount: number; interest_rate_percent: number; term_years: number; interest_only: boolean }
    | undefined,
  rent_change_pct: number,
  vacancy_change_ppt: number,
  interest_change_ppt: number
) {
  const adjusted_rent = gross_rent * (1 + rent_change_pct / 100);
  const adjusted_vacancy = vacancy_rate;
  const vacancy = adjusted_rent * (adjusted_vacancy / 100);
  const effective_gross = adjusted_rent - vacancy;
  const noi = effective_gross - expenses;

  let debt_service = 0;
  let annual_principal = 0;
  let annual_interest = 0;

  if (financing) {
    const rate = (financing.interest_rate_percent + interest_change_ppt) / 100;
    const monthly_rate = rate / 12;
    const months = financing.term_years * 12;

    if (financing.interest_only) {
      annual_interest = financing.loan_amount * rate;
      annual_principal = 0;
      debt_service = annual_interest;
    } else {
      const monthly_payment =
        financing.loan_amount *
        ((monthly_rate * Math.pow(1 + monthly_rate, months)) /
          (Math.pow(1 + monthly_rate, months) - 1));
      const first_interest = financing.loan_amount * monthly_rate;
      const first_principal = monthly_payment - first_interest;
      annual_interest = first_interest * 12;
      annual_principal = first_principal * 12;
      debt_service = monthly_payment * 12;
    }
  }

  const cash_flow = noi - debt_service;
  const equity = financing ? purchase_price - financing.loan_amount : purchase_price;
  const cap_rate = purchase_price > 0 ? (noi / purchase_price) * 100 : 0;
  const cash_on_cash = equity > 0 ? (cash_flow / equity) * 100 : 0;
  return {
    noi_dkk: round(noi),
    debt_service_dkk: round(debt_service),
    annual_principal_dkk: round(annual_principal),
    annual_interest_dkk: round(annual_interest),
    cash_flow_dkk: round(cash_flow),
    cash_flow_monthly_dkk: round(cash_flow / 12),
    equity_dkk: round(equity),
    cap_rate_percent: round(cap_rate),
    cash_on_cash_percent: round(cash_on_cash),
    rent_coverage: (() => {
      const total = expenses + debt_service;
      return effective_gross > 0 ? round((effective_gross / total) * 100) : 0;
    })(),
  };
}

function formatResult(s: ReturnType<typeof calculateScenario>) {
  return {
    noi_dkk: s.noi_dkk,
    cash_flow_annual_dkk: s.cash_flow_dkk,
    cash_flow_monthly_dkk: s.cash_flow_monthly_dkk,
    cap_rate_percent: s.cap_rate_percent,
    cash_on_cash_percent: s.cash_on_cash_percent,
    annual_principal_paydown_dkk: s.annual_principal_dkk,
    annual_interest_dkk: s.annual_interest_dkk,
    debt_coverage_percent: s.rent_coverage,
  };
}

function buildSummary(
  base: ReturnType<typeof calculateScenario>,
  per_m2: { price_per_m2_dkk: number; rent_per_m2_annual_dkk: number; rent_per_m2_monthly_dkk: number } | undefined,
  rent_down: ReturnType<typeof calculateScenario>,
  worst: ReturnType<typeof calculateScenario>,
  rent_up: ReturnType<typeof calculateScenario>
): string {
  const lines: string[] = [];

  lines.push(`**Investeringsanalyse**`);
  lines.push(``);
  lines.push(`**Base case:**`);
  lines.push(`- NOI: ${base.noi_dkk.toLocaleString("da-DK")} kr/år`);
  lines.push(`- Cash flow: ${base.cash_flow_dkk.toLocaleString("da-DK")} kr/år (${base.cash_flow_monthly_dkk.toLocaleString("da-DK")} kr/md)`);
  lines.push(`- Cap rate: **${base.cap_rate_percent}%**`);
  if (base.cash_on_cash_percent !== base.cap_rate_percent) {
    lines.push(`- Cash-on-cash: **${base.cash_on_cash_percent}%**`);
  }
  if (per_m2) {
    lines.push(`- Pris/m²: ${per_m2.price_per_m2_dkk.toLocaleString("da-DK")} kr | Leje/m²: ${per_m2.rent_per_m2_monthly_dkk.toLocaleString("da-DK")} kr/md`);
  }
  lines.push(``);
  lines.push(`**Følsomhed:**`);
  lines.push(`| Scenario | Cap rate | Cash flow/md |`);
  lines.push(`|:--|:--|:--|`);
  lines.push(`| Base case | ${base.cap_rate_percent}% | ${base.cash_flow_monthly_dkk.toLocaleString("da-DK")} kr |`);
  lines.push(`| Husleje -10% | ${rent_down.cap_rate_percent}% | ${rent_down.cash_flow_monthly_dkk.toLocaleString("da-DK")} kr |`);
  lines.push(`| Husleje +10% | ${rent_up.cap_rate_percent}% | ${rent_up.cash_flow_monthly_dkk.toLocaleString("da-DK")} kr |`);
  lines.push(`| Worst case (-10% leje, 10% tomgang) | ${worst.cap_rate_percent}% | ${worst.cash_flow_monthly_dkk.toLocaleString("da-DK")} kr |`);

  return lines.join("\n");
}

function round(n: number): number {
  return Math.round(n * 100) / 100;
}
