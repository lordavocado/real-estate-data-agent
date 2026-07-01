import { defineTool } from "eve/tools";
import { z } from "zod";

export default defineTool({
  description:
    "Calculate monthly mortgage payments for a Danish real estate loan (realkreditlån). Supports three loan types: annuity (fastforrentet), serial (serielån), and interest-only (afdragsfrihed). Calculates monthly payment before and after tax, and total interest over the loan term. Use when a user asks about financing costs, monthly payments, or loan affordability.",
  inputSchema: z.object({
    loan_amount: z.number().describe("Loan amount (hovedstol) in DKK."),
    interest_rate_percent: z
      .number()
      .describe("Annual nominal interest rate (pålydende rente) as percentage, e.g. 4.0 for 4%."),
    term_years: z
      .number()
      .optional()
      .default(30)
      .describe("Loan term in years (typical: 10, 20, or 30). Default 30."),
    loan_type: z
      .enum(["annuity", "serial", "interest_only"])
      .optional()
      .default("annuity")
      .describe(
        "Loan type. 'annuity' = fixed monthly payment (fastforrentet obligationslån). 'serial' = equal principal payments (serielån). 'interest_only' = only interest, no principal (afdragsfrihed)."
      ),
    interest_only_years: z
      .number()
      .optional()
      .describe(
        "For interest_only loans, optionally specify the interest-only period in years. After this, payments switch to annuity. Default 10 if not specified."
      ),
    bidrag_percent: z
      .number()
      .optional()
      .default(0.8)
      .describe(
        "Annual bidragssats (administration margin) as percentage. Typical for realkredit: 0.5-1.2% depending on LTV. Default 0.8%."
      ),
    tax_deduction_percent: z
      .number()
      .optional()
      .default(25)
      .describe(
        "Tax deduction rate for interest payments (rente-fradrag). Default 25% (approx. Danish average)."
      ),
  }),
  async execute(input) {
    const {
      loan_amount,
      interest_rate_percent,
      term_years = 30,
      loan_type = "annuity",
      interest_only_years,
      bidrag_percent = 0.8,
      tax_deduction_percent = 25,
    } = input;

    const total_rate = interest_rate_percent + bidrag_percent;
    const monthly_rate = total_rate / 100 / 12;
    const total_months = term_years * 12;
    const tax_factor = 1 - tax_deduction_percent / 100;

    let schedule: Array<{
      month: number;
      payment: number;
      principal: number;
      interest: number;
      bidrag: number;
      tax_savings: number;
      net_payment: number;
      remaining: number;
    }> = [];

    if (loan_type === "interest_only") {
      const io_years = interest_only_years ?? 10;
      const io_months = io_years * 12;
      const amort_months = total_months - io_months;

      const io_payment = loan_amount * (monthly_rate);
      const io_interest = loan_amount * ((interest_rate_percent / 100) / 12);
      const io_bidrag = loan_amount * ((bidrag_percent / 100) / 12);

      for (let m = 1; m <= io_months; m++) {
        const tax_savings = io_interest * (tax_deduction_percent / 100);
        schedule.push({
          month: m,
          payment: round(io_payment),
          principal: 0,
          interest: round(io_interest),
          bidrag: round(io_bidrag),
          tax_savings: round(tax_savings),
          net_payment: round(io_payment - tax_savings),
          remaining: round(loan_amount),
        });
      }

      const post_io_rate = monthly_rate;
      const remaining_after_io = loan_amount;
      if (amort_months > 0) {
        const monthly_annuity =
          remaining_after_io *
          ((post_io_rate * Math.pow(1 + post_io_rate, amort_months)) /
            (Math.pow(1 + post_io_rate, amort_months) - 1));

        let balance = remaining_after_io;
        for (let m = 1; m <= amort_months; m++) {
          const total_payment = monthly_annuity;
          const interest_part = balance * ((interest_rate_percent / 100) / 12);
          const bidrag_part = balance * ((bidrag_percent / 100) / 12);
          const principal_part = total_payment - interest_part - bidrag_part;
          balance = Math.max(0, balance - principal_part);
          const tax_savings = interest_part * (tax_deduction_percent / 100);
          schedule.push({
            month: io_months + m,
            payment: round(total_payment),
            principal: round(principal_part),
            interest: round(interest_part),
            bidrag: round(bidrag_part),
            tax_savings: round(tax_savings),
            net_payment: round(total_payment - tax_savings),
            remaining: round(balance),
          });
        }
      }
    } else if (loan_type === "serial") {
      const monthly_principal = loan_amount / total_months;
      let balance = loan_amount;

      for (let m = 1; m <= total_months; m++) {
        const interest_part = balance * ((interest_rate_percent / 100) / 12);
        const bidrag_part = balance * ((bidrag_percent / 100) / 12);
        const total_payment = monthly_principal + interest_part + bidrag_part;
        const tax_savings = interest_part * (tax_deduction_percent / 100);
        balance = Math.max(0, balance - monthly_principal);
        schedule.push({
          month: m,
          payment: round(total_payment),
          principal: round(monthly_principal),
          interest: round(interest_part),
          bidrag: round(bidrag_part),
          tax_savings: round(tax_savings),
          net_payment: round(total_payment - tax_savings),
          remaining: round(balance),
        });
      }
    } else {
      const monthly_payment =
        loan_amount *
        ((monthly_rate * Math.pow(1 + monthly_rate, total_months)) /
          (Math.pow(1 + monthly_rate, total_months) - 1));

      let balance = loan_amount;
      for (let m = 1; m <= total_months; m++) {
        const interest_part = balance * ((interest_rate_percent / 100) / 12);
        const bidrag_part = balance * ((bidrag_percent / 100) / 12);
        const principal_part = monthly_payment - interest_part - bidrag_part;
        balance = Math.max(0, balance - principal_part);
        const tax_savings = interest_part * (tax_deduction_percent / 100);
        schedule.push({
          month: m,
          payment: round(monthly_payment),
          principal: round(principal_part),
          interest: round(interest_part),
          bidrag: round(bidrag_part),
          tax_savings: round(tax_savings),
          net_payment: round(monthly_payment - tax_savings),
          remaining: round(balance),
        });
      }
    }

    const first_payment = schedule[0];
    const last_payment = schedule[schedule.length - 1];
    const total_paid = schedule.reduce((s, p) => s + p.payment, 0);
    const total_interest = schedule.reduce((s, p) => s + p.interest, 0);
    const total_bidrag = schedule.reduce((s, p) => s + p.bidrag, 0);
    const total_tax_savings = schedule.reduce((s, p) => s + p.tax_savings, 0);

    return {
      inputs: {
        loan_amount_dkk: loan_amount,
        interest_rate_percent,
        bidrag_percent,
        total_rate_percent: round(total_rate),
        term_years,
        loan_type,
        tax_deduction_percent,
      },
      summary: {
        first_monthly_payment_dkk: first_payment.payment,
        first_monthly_net_dkk: first_payment.net_payment,
        first_month_interest_dkk: first_payment.interest,
        first_month_principal_dkk: first_payment.principal,
        last_monthly_payment_dkk: last_payment?.payment ?? 0,
        total_paid_dkk: round(total_paid),
        total_interest_dkk: round(total_interest),
        total_bidrag_dkk: round(total_bidrag),
        total_tax_savings_dkk: round(total_tax_savings),
        total_net_cost_dkk: round(total_paid - total_tax_savings),
        total_paid_ratio: round((total_paid / loan_amount) * 100),
      },
      year_1: round(schedule[0]?.payment ?? 0),
      year_1_net: round(schedule[0]?.net_payment ?? 0),
      year_5: round(schedule[Math.min(59, schedule.length - 1)]?.payment ?? 0),
      year_5_remaining: round(schedule[Math.min(59, schedule.length - 1)]?.remaining ?? 0),
      text: buildSummary(input, first_payment, total_paid, total_interest, total_tax_savings),
    };
  },
});

function buildSummary(
  input: {
    loan_amount: number;
    loan_type: string;
    term_years: number;
    interest_rate_percent: number;
    bidrag_percent: number;
    tax_deduction_percent: number;
  },
  first: { payment: number; net_payment: number; interest: number; principal: number; bidrag: number; tax_savings: number } | undefined,
  total_paid: number,
  total_interest: number,
  total_tax_savings: number
): string {
  const typeLabels: Record<string, string> = {
    annuity: "Annuitetslån (fast ydelse)",
    serial: "Serielån (fast afdrag)",
    interest_only: "Afdragsfrit lån",
  };
  const type = typeLabels[input.loan_type] ?? input.loan_type;

  return [
    `**${type} — ${input.loan_amount.toLocaleString("da-DK")} kr over ${input.term_years} år**`,
    ``,
    `- Rente: ${input.interest_rate_percent}% + bidrag ${input.bidrag_percent}% = ${round(input.interest_rate_percent + input.bidrag_percent)}%`,
    `- Månedlig ydelse (før skat): **${first?.payment.toLocaleString("da-DK") ?? "—"} kr**`,
    `- Månedlig ydelse (efter skat): **${first?.net_payment.toLocaleString("da-DK") ?? "—"} kr** (fradrag: ${first ? round(first.tax_savings).toLocaleString("da-DK") : "—"} kr)`,
    `- Heraf rente: ${first?.interest.toLocaleString("da-DK") ?? "—"} kr, afdrag: ${first?.principal.toLocaleString("da-DK") ?? "—"} kr`,
    ``,
    `- **Samlet tilbagebetaling: ${total_paid.toLocaleString("da-DK")} kr**`,
    `- Heraf renter: ${total_interest.toLocaleString("da-DK")} kr`,
    `- Skattefradrag: ${total_tax_savings.toLocaleString("da-DK")} kr`,
    `- **Nettoudgift efter skat: ${(total_paid - total_tax_savings).toLocaleString("da-DK")} kr**`,
    ``,
    `- Total tilbagebetalt: ${round((total_paid / input.loan_amount) * 100)}% af hovedstol`,
  ].join("\n");
}

function round(n: number): number {
  return Math.round(n * 100) / 100;
}
