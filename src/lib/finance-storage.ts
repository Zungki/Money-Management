import type { SupabaseClient } from "@supabase/supabase-js";

type FinanceSnapshot = {
  items: { id: number; kind: "income" | "expense"; title: string; category: string; amount: number; createdAt: string }[];
  deposits: { id: number; goalId: string; month: string; amount: number; note: string; recordedAt?: string }[];
  goals: { id: string; name: string; target: number; start: string }[];
  budgets: { id: string; category: string; limit: number }[];
  accounts: { id: string; name: string; type: "savings" | "fixed"; principal: number; annualRate: number; termMonths: number }[];
  debts: { id: string; name: string; monthlyPayment: number; totalInstallments: number; paidInstallments: number; dueDay: number; paidMonths: string[] }[];
  selectedGoal: string;
  lang: "th" | "en";
  currency: string;
  formula: "503020" | "buffett" | "fire" | "6jars";
  months: number;
  start: string;
  name: string;
};

const numericId = (id: string) => Number.isFinite(Number(id)) ? Number(id) : Date.now();

export async function loadFinanceSnapshot(client: SupabaseClient, userId: string): Promise<FinanceSnapshot> {
  const tables = [
    "finance_transactions", "finance_savings_goals", "finance_savings_deposits", "finance_budgets",
    "finance_interest_accounts", "finance_debts", "finance_debt_payments", "finance_preferences",
  ] as const;
  const results = await Promise.all(tables.map(table => client.from(table).select("*").eq("user_id", userId)));
  const error = results.find(result => result.error)?.error;
  if (error) throw error;
  const [transactions, goals, deposits, budgets, accounts, debts, payments, preferences] = results.map(result => result.data ?? []) as any[][];
  const hasNormalizedData = [transactions, goals, deposits, budgets, accounts, debts, payments, preferences].some(rows => rows.length > 0);
  if (!hasNormalizedData) {
    // One-time migration from the earlier authenticated JSON backup table.
    const legacy = await (client as any).from("user_finance_data").select("data").eq("user_id", userId).maybeSingle();
    if (!legacy.error && legacy.data?.data && typeof legacy.data.data === "object") {
      await saveFinanceSnapshot(client, legacy.data.data as FinanceSnapshot);
      return legacy.data.data as FinanceSnapshot;
    }
  }
  const paidMonths = new Map<string, string[]>();
  for (const payment of payments) paidMonths.set(payment.debt_id, [...(paidMonths.get(payment.debt_id) ?? []), payment.paid_month]);
  const pref = preferences[0];

  return {
    items: transactions.map(row => ({ id: numericId(row.id), kind: row.kind, title: row.title, category: row.category, amount: Number(row.amount), createdAt: row.occurred_at })),
    goals: goals.map(row => ({ id: row.id, name: row.name, target: Number(row.target_amount), start: row.start_month })),
    deposits: deposits.map(row => ({ id: numericId(row.id), goalId: row.goal_id, month: row.month, amount: Number(row.amount), note: row.note, ...(row.recorded_at ? { recordedAt: row.recorded_at } : {}) })),
    budgets: budgets.map(row => ({ id: row.id, category: row.category, limit: Number(row.monthly_limit) })),
    accounts: accounts.map(row => ({ id: row.id, name: row.name, type: row.account_type, principal: Number(row.principal), annualRate: Number(row.annual_rate), termMonths: row.term_months })),
    debts: debts.map(row => ({ id: row.id, name: row.name, monthlyPayment: Number(row.monthly_payment), totalInstallments: row.total_installments, paidInstallments: row.paid_installments, dueDay: row.due_day, paidMonths: paidMonths.get(row.id) ?? [] })),
    selectedGoal: pref?.selected_goal ?? "emergency",
    lang: pref?.language === "en" ? "en" : "th",
    currency: pref?.currency ?? "THB",
    formula: pref?.savings_formula ?? "503020",
    months: pref?.emergency_months ?? 6,
    start: pref?.emergency_start_month ?? new Date().toISOString().slice(0, 7),
    name: pref?.display_name ?? "",
  };
}

export async function saveFinanceSnapshot(client: SupabaseClient, snapshot: FinanceSnapshot) {
  const { error } = await (client as any).rpc("save_my_finance_data", { p_data: snapshot });
  if (error) throw error;
}
