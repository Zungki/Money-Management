"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

type Entry = { id: number; kind: "income" | "expense"; title: string; amount: number; category: string; at: string };
type Deposit = { id: number; month: string; amount: number; note: string };
type Formula = "503020" | "buffett" | "fire" | "6jars";
type Lang = "th" | "en";
const entrySchema = z.object({ title: z.string().trim().min(1, "กรุณากรอกชื่อรายการ"), amount: z.number().positive("จำนวนเงินต้องมากกว่า 0") });
const depositSchema = z.object({ amount: z.number().positive("กรุณากรอกยอดฝากที่มากกว่า 0"), note: z.string() });
type EntryValues = z.infer<typeof entrySchema>;
const CURRENCIES = ["THB", "USD", "EUR", "JPY", "GBP", "AUD", "SGD"] as const;
const FORMS: { id: Formula; name: string; ratio: number; desc: Record<Lang, string> }[] = [
  { id: "503020", name: "50/30/20 Rule", ratio: .2, desc: { th: "เหมาะกับมือใหม่ แบ่งรายได้เป็นค่าใช้จ่ายจำเป็น 50% ไลฟ์สไตล์ 30% และออม/ลงทุน 20%", en: "A balanced starter plan: 50% needs, 30% wants, and 20% savings or investments." } },
  { id: "buffett", name: "Warren Buffett · Pay Yourself First", ratio: .2, desc: { th: "เหมาะกับคนที่อยากสร้างวินัย หักเงินออม 20% ออกก่อน แล้ววางแผนใช้ส่วนที่เหลือ", en: "Build a consistent habit: set aside 20% first, then plan your spending with the rest." } },
  { id: "fire", name: "FIRE Movement · Save 50%", ratio: .5, desc: { th: "เหมาะกับคนที่ต้องการอิสรภาพทางการเงินเร็วขึ้น ตั้งเป้าออมสูงถึง 50% ของรายได้", en: "For an ambitious path to financial independence: target a 50% savings rate." } },
  { id: "6jars", name: "6 Jars System", ratio: .2, desc: { th: "แบ่งเงินเป็นหมวดอย่างเป็นระบบ พร้อมกันเงิน 20% สำหรับสร้างความมั่งคั่งและอนาคต", en: "Organize money into clear buckets, with 20% reserved for wealth building and the future." } },
];
const COPY: Record<Lang, Record<string, string>> = {
  th: { subtitle: "ระบบบริหารเงินส่วนบุคคล & พอร์ตความมั่งคั่ง", dashboard: "📊 หน้าหลัก / Main", history: "📜 ประวัติเดือนต่อเดือน", overview: "สรุปยอดรวมเดือนนี้", income: "รายรับรวม", expense: "รายจ่ายรวม", remaining: "คงเหลือ", addIncome: "➕ รายรับ / Income", addExpense: "➖ รายจ่าย / Expense", quick: "เลือกหมวดหมู่ด่วน (หรือพิมพ์เองด้านล่าง):", title: "ชื่อรายการ", amount: "จำนวนเงิน", recordIncome: "➕ บันทึกรายรับ", recordExpense: "➖ บันทึกรายจ่าย", entries: "ประวัติรายการเดือนนี้", formula: "คำนวณเป้าออมตามสูตรคนรวย", fit: "💡 สูตรนี้เหมาะกับใคร?", target: "เป้าหมายออม/ลงทุนจากรายรับ:", savings: "🏦 e-Savings & ปฏิทินเป้าหมายออมเงิน", emInfo: "🛡️ บันทึกฝากเพิ่มเพื่อสะสมยอดทบไปเรื่อยๆ:", emHelp: "เมื่อบันทึกยอดฝาก งวดนั้นจะแสดงเป็นฝากแล้ว พร้อมสะสมยอดให้อัตโนมัติ", months: "อยากสำรองเงินไว้กี่เดือน?", start: "เดือน/ปี ที่เริ่มออมเงิน", goal: "เป้าหมายเงินฉุกเฉินที่ต้องมี:", original: "วันสิ้นสุดตามแผนเดิม:", dynamic: "วันสิ้นสุดใหม่ (คำนวณจากยอดสะสม):", faster: "🚀 บรรลุเป้าหมายเร็วขึ้น", monthsUnit: "เดือน", depositTitle: "➕ ฝากเงิน e-Savings งวดถัดไป", depositAmount: "จำนวนเงินที่ฝากเพิ่ม:", note: "แจกแจงรายละเอียด (จ่ายอะไรเท่าไหร่/ฝากส่วนไหน):", depositButton: "บันทึกฝากจริง & รายละเอียด", ledger: "ตัวอย่างประมาณการงวดถัดไป", fullHistory: "📜 ตารางประวัติการออมจนบรรลุเป้าหมาย", fullSub: "แสดงรายละเอียดทุกเดือนตั้งแต่วันเริ่มต้นจนถึงเป้าหมาย 100%", periods: "งวดที่คาดการณ์", totalGoal: "ยอดเป้าหมายรวม", paid: "ฝากแล้ว ณ ปัจจุบัน", save: "💾 บันทึกข้อมูลลงเครื่อง / Save Data", paidBadge: "✅ จ่าย/ฝากแล้ว", forecast: "คาดการณ์", collected: "ยอดสะสมรวม", actual: "ฝากจริง", achieved: "🎉 บรรลุเป้าหมาย!", noExpense: "กรอกรายการรายจ่ายเพื่อคำนวณ", saved: "บันทึกข้อมูลสำเร็จเรียบร้อย!", deleted: "ลบรายการแล้ว", invalid: "กรุณากรอกข้อมูลให้ถูกต้อง", categorySalary: "💵 เงินเดือน / Salary", categorySide: "💼 รายได้เสริม / Side Income", categoryBonus: "🎁 โบนัส / Bonus", categoryRent: "🏠 ค่าหอ / Rent", categoryUtilities: "⚡ น้ำ-ไฟ / Utilities", categoryFood: "🍲 ของกิน / Food", categoryInternet: "📶 ค่าเน็ต / Internet", categorySubscription: "🎬 Subscriptions", empty: "ยังไม่มีรายการ ลองเพิ่มรายการแรกของคุณ", month: "งวด", dataLoaded: "โหลดข้อมูลที่บันทึกไว้แล้ว" },
  en: { subtitle: "Personal Wealth Builder & Portfolio System", dashboard: "📊 Main Dashboard", history: "📜 Monthly History", overview: "Monthly Overview", income: "Total Income", expense: "Total Expenses", remaining: "Remaining", addIncome: "➕ Income", addExpense: "➖ Expense", quick: "Choose a quick category or type your own:", title: "Item name", amount: "Amount", recordIncome: "➕ Add Income", recordExpense: "➖ Add Expense", entries: "This Month's Transactions", formula: "Savings Goal · Wealth-Building Rules", fit: "💡 Who is this for?", target: "Savings / investment target:", savings: "🏦 e-Savings & Savings Goal Calendar", emInfo: "🛡️ Record deposits to build your balance:", emHelp: "Recorded deposits are marked as paid and added to your running balance automatically.", months: "Emergency fund months", start: "Savings start month", goal: "Emergency fund target:", original: "Original projected finish:", dynamic: "Updated finish (based on deposits):", faster: "🚀 Goal reached earlier by", monthsUnit: "months", depositTitle: "➕ Record next e-Savings deposit", depositAmount: "Deposit amount:", note: "Note (allocation or details):", depositButton: "Record deposit & details", ledger: "Upcoming monthly forecast", fullHistory: "📜 Savings schedule to your goal", fullSub: "Month-by-month plan from your start date until the goal is reached", periods: "Projected periods", totalGoal: "Total goal", paid: "Saved so far", save: "💾 Save data on this device", paidBadge: "✅ Deposited", forecast: "Forecast", collected: "Running total", actual: "Actual deposit", achieved: "🎉 Goal reached!", noExpense: "Add expenses to calculate your target", saved: "Your data has been saved on this device.", deleted: "Item removed", invalid: "Please enter valid information", categorySalary: "💵 Salary", categorySide: "💼 Side income", categoryBonus: "🎁 Bonus", categoryRent: "🏠 Rent", categoryUtilities: "⚡ Utilities", categoryFood: "🍲 Food", categoryInternet: "📶 Internet", categorySubscription: "🎬 Subscriptions", empty: "No entries yet. Add your first transaction.", month: "Period", dataLoaded: "Saved data loaded" },
};
const currentMonth = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`; };
const plusMonth = (month: string, offset: number) => { const [y, m] = month.split("-").map(Number); const d = new Date(y, m - 1 + offset, 1); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`; };
const formatMonth = (value: string, lang: Lang) => { const [y, m] = value.split("-").map(Number); return new Date(y, m - 1, 1).toLocaleDateString(lang === "th" ? "th-TH" : "en-US", { month: "short", year: "numeric" }); };

export default function WealthDashboard() {
  const [items, setItems] = useState<Entry[]>([]);
  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [kind, setKind] = useState<"income" | "expense">("income");
  const [language, setLanguage] = useState<Lang>("th");
  const [view, setView] = useState<"dashboard" | "history">("dashboard");
  const [currency, setCurrency] = useState("THB");
  const [formula, setFormula] = useState<Formula>("503020");
  const [emergencyMonths, setEmergencyMonths] = useState(6);
  const [startMonth, setStartMonth] = useState(currentMonth());
  const [userName, setUserName] = useState("");
  const [depositAmount, setDepositAmount] = useState("");
  const [depositNote, setDepositNote] = useState("");
  const [ready, setReady] = useState(false);
  const [toast, setToast] = useState("");
  const t = COPY[language];
  const { register, handleSubmit, setValue, reset, formState: { errors } } = useForm<EntryValues>({ resolver: zodResolver(entrySchema), defaultValues: { title: "", amount: undefined } });

  useEffect(() => {
    try {
      const raw = localStorage.getItem("kinn-wealth-data");
      if (raw) {
        const saved = JSON.parse(raw);
        setItems(Array.isArray(saved.items) ? saved.items : []);
        setDeposits(Array.isArray(saved.deposits) ? saved.deposits : []);
        setLanguage(saved.language === "en" ? "en" : "th");
        setCurrency(CURRENCIES.includes(saved.currency) ? saved.currency : "THB");
        setFormula(FORMS.some(f => f.id === saved.formula) ? saved.formula : "503020");
        setEmergencyMonths([3, 6, 9, 12].includes(Number(saved.emergencyMonths)) ? Number(saved.emergencyMonths) : 6);
        setStartMonth(typeof saved.startMonth === "string" ? saved.startMonth : currentMonth());
        setUserName(typeof saved.userName === "string" ? saved.userName : "");
      }
    } catch { localStorage.removeItem("kinn-wealth-data"); }
    setReady(true);
  }, []);
  useEffect(() => {
    if (!ready) return;
    localStorage.setItem("kinn-wealth-data", JSON.stringify({ items, deposits, language, currency, formula, emergencyMonths, startMonth, userName }));
  }, [items, deposits, language, currency, formula, emergencyMonths, startMonth, userName, ready]);
  const notify = (text: string) => { setToast(text); window.setTimeout(() => setToast(""), 2400); };
  const money = (value: number) => new Intl.NumberFormat(language === "th" ? "th-TH" : "en-US", { style: "currency", currency, maximumFractionDigits: 0 }).format(value);
  const totalIncome = items.filter(x => x.kind === "income").reduce((sum, x) => sum + x.amount, 0);
  const totalExpense = items.filter(x => x.kind === "expense").reduce((sum, x) => sum + x.amount, 0);
  const remaining = totalIncome - totalExpense;
  const ratio = FORMS.find(f => f.id === formula)?.ratio || .2;
  const targetSave = totalIncome * ratio;
  const emergencyGoal = totalExpense * emergencyMonths;
  const actualSaved = deposits.reduce((sum, d) => sum + d.amount, 0);
  const progress = emergencyGoal > 0 ? Math.min(100, actualSaved / emergencyGoal * 100) : 0;
  const actualByMonth = useMemo(() => new Map(deposits.map(d => [d.month, d])), [deposits]);
  const schedule = useMemo(() => {
    if (emergencyGoal <= 0) return [] as { month: string; amount: number; balance: number; actual: boolean; note: string }[];
    const rows: { month: string; amount: number; balance: number; actual: boolean; note: string; depositId?: number }[] = [];
    let balance = 0;
    const monthly = targetSave > 0 ? targetSave : 0;
    for (let i = 0; i < 120 && balance < emergencyGoal; i++) {
      const month = plusMonth(startMonth, i);
      const actual = actualByMonth.get(month);
      const amount = actual?.amount ?? monthly;
      if (amount <= 0) break;
      balance += amount;
      rows.push({ month, amount, balance, actual: Boolean(actual), note: actual?.note || "", depositId: actual?.id });
    }
    return rows;
  }, [actualByMonth, emergencyGoal, startMonth, targetSave]);
  const originalMonths = emergencyGoal > 0 && targetSave > 0 ? Math.ceil(emergencyGoal / targetSave) : 0;
  const originalEnd = originalMonths ? plusMonth(startMonth, originalMonths - 1) : "";
  const reachedAt = schedule.findIndex(row => row.balance >= emergencyGoal);
  const dynamicEnd = reachedAt >= 0 ? schedule[reachedAt].month : "";
  const speedup = originalMonths && reachedAt >= 0 ? originalMonths - (reachedAt + 1) : 0;
  const visibleItems = [...items].reverse();
  const addItem = ({ title, amount }: EntryValues) => {
    const category = kind === "income" ? "income" : "expense";
    setItems([...items, { id: Date.now(), kind, title, amount, category, at: new Date().toISOString() }]);
    reset({ title: "", amount: undefined });
  };
  const addDeposit = () => {
    const parsed = depositSchema.safeParse({ amount: Number(depositAmount), note: depositNote });
    if (!parsed.success) { notify(language === "th" ? parsed.error.issues[0]?.message || t.invalid : t.invalid); return; }
    const used = new Set(deposits.map(d => d.month));
    let offset = 0;
    while (used.has(plusMonth(startMonth, offset)) && offset < 120) offset++;
    setDeposits([...deposits, { id: Date.now(), month: plusMonth(startMonth, offset), amount: parsed.data.amount, note: parsed.data.note.trim() }]);
    setDepositAmount(""); setDepositNote(""); notify(language === "th" ? "บันทึกยอดฝากแล้ว" : "Deposit recorded");
  };
  const saveData = () => {
    localStorage.setItem("kinn-wealth-data", JSON.stringify({ items, deposits, language, currency, formula, emergencyMonths, startMonth, userName }));
    notify(t.saved);
  };
  const categories = kind === "income" ? [["categorySalary", "เงินเดือน"], ["categorySide", "รายได้เสริม"], ["categoryBonus", "โบนัส"]] : [["categoryRent", "ค่าหอ"], ["categoryUtilities", "ค่าน้ำค่าไฟ"], ["categoryFood", "ของกิน"], ["categoryInternet", "ค่าเน็ต"], ["categorySubscription", "Subscriptions"]];

  return <main className="min-h-screen bg-slate-900 px-4 pb-16 pt-4 text-slate-100 sm:px-5">
    <div className="mx-auto max-w-md">
      <div className="mb-4 flex items-center justify-between rounded-xl border border-slate-700 bg-slate-800 p-2.5 text-xs">
        <div className="flex items-center gap-1.5"><span className="text-slate-400">🌐 Lang:</span>{(["th", "en"] as Lang[]).map(lang => <button key={lang} onClick={() => setLanguage(lang)} className={`rounded-md px-2 py-1 font-bold ${language === lang ? "bg-emerald-600 text-white" : "bg-slate-700 text-slate-300"}`}>{lang.toUpperCase()}</button>)}</div>
        <label className="flex items-center gap-1.5"><span className="text-slate-400">💱 Currency:</span><select value={currency} onChange={e => setCurrency(e.target.value)} className="rounded-md border border-slate-600 bg-slate-700 px-2 py-1 text-xs font-bold text-emerald-400 outline-none">{CURRENCIES.map(code => <option key={code} value={code}>{code}</option>)}</select></label>
      </div>
      <div className="mb-6 grid grid-cols-2 gap-2 rounded-xl border border-slate-700 bg-slate-800 p-1.5">{(["dashboard", "history"] as const).map(v => <button key={v} onClick={() => setView(v)} className={`rounded-lg py-2.5 text-xs font-bold transition ${view === v ? "bg-emerald-600 text-white shadow" : "text-slate-400 hover:text-white"}`}>{v === "dashboard" ? t.dashboard : t.history}</button>)}</div>
      <header className="mb-6 text-center"><div className="mb-1 flex justify-center"><input value={userName} onChange={e => setUserName(e.target.value)} placeholder="Name / ชื่อของคุณ..." className="w-3/4 border-b border-emerald-500 bg-transparent text-center text-xl font-extrabold text-emerald-400 outline-none focus:border-emerald-300"/></div><p className="text-xs text-slate-400">{t.subtitle}</p></header>

      {view === "dashboard" ? <div className="space-y-6">
        <Card><h2 className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-400">{t.overview}</h2><div className="grid grid-cols-3 gap-2 text-center">{[[t.income, totalIncome, "text-emerald-400"], [t.expense, totalExpense, "text-rose-400"], [t.remaining, remaining, "text-sky-400"]].map(([label, value, color]) => <div key={String(label)} className="rounded-xl border border-slate-700 bg-slate-900/60 p-2.5"><span className="block text-[10px] text-slate-400">{label}</span><span className={`text-sm font-bold ${color}`}>{money(Number(value))}</span></div>)}</div></Card>

        <Card><div className="mb-4 grid grid-cols-2 gap-2 rounded-xl border border-slate-700 bg-slate-900/80 p-1">{(["income", "expense"] as const).map(k => <button key={k} onClick={() => setKind(k)} className={`rounded-lg py-2 text-xs font-bold transition ${kind === k ? (k === "income" ? "bg-emerald-600 text-white" : "bg-rose-600 text-white") + " shadow" : "text-slate-400 hover:text-white"}`}>{k === "income" ? t.addIncome : t.addExpense}</button>)}</div>
          <label className="mb-1.5 block text-[10px] text-slate-400">{t.quick}</label><div className="mb-3 flex flex-wrap gap-1.5">{categories.map(([key, label]) => <button key={key} type="button" onClick={() => setValue("title", language === "en" ? t[key] : label)} className={`rounded-lg border bg-slate-700 px-2.5 py-1.5 text-xs transition ${kind === "income" ? "border-emerald-500/30 text-emerald-300 hover:bg-emerald-600/40" : "border-rose-500/30 text-rose-300 hover:bg-rose-600/40"}`}>{t[key]}</button>)}</div>
          <form onSubmit={handleSubmit(addItem)} className="space-y-3 border-t border-slate-700/60 pt-3"><div><label className="mb-1 block text-[10px] text-slate-400">{t.title}</label><input {...register("title")} placeholder={language === "th" ? "ชื่อรายการ / Item description..." : "Item description..."} className="w-full rounded-xl border border-slate-600 bg-slate-700 p-2.5 text-xs text-white outline-none focus:border-emerald-500"/>{errors.title && <p className="mt-1 text-[10px] text-rose-300">{errors.title.message}</p>}</div><div className="flex gap-2"><div className="w-full"><label className="mb-1 block text-[10px] text-slate-400">{t.amount}</label><input type="number" min="0.01" step="any" {...register("amount", { valueAsNumber: true })} placeholder="0" className="w-full rounded-xl border border-slate-600 bg-slate-700 p-2.5 text-xs text-white outline-none focus:border-emerald-500"/>{errors.amount && <p className="mt-1 text-[10px] text-rose-300">{errors.amount.message}</p>}</div><div className="flex items-end"><button className={`h-[38px] whitespace-nowrap rounded-xl px-4 text-xs font-bold text-white shadow transition ${kind === "income" ? "bg-emerald-600 hover:bg-emerald-500" : "bg-rose-600 hover:bg-rose-500"}`}>{kind === "income" ? t.recordIncome : t.recordExpense}</button></div></div></form>
          <div className="mt-4 border-t border-slate-700 pt-3"><h3 className="mb-2 text-[11px] font-bold text-slate-400">{t.entries}</h3><div className="max-h-48 space-y-2 overflow-y-auto pr-1">{visibleItems.length === 0 ? <p className="py-2 text-[11px] text-slate-500">{t.empty}</p> : visibleItems.map(item => <EntryRow key={item.id} item={item} money={money} onDelete={() => { setItems(items.filter(x => x.id !== item.id)); notify(t.deleted); }} />)}</div></div>
        </Card>

        <Card><h2 className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-400">{t.formula}</h2><select value={formula} onChange={e => setFormula(e.target.value as Formula)} className="mb-3 w-full rounded-xl border border-slate-600 bg-slate-700 p-2.5 text-xs text-white outline-none">{FORMS.map(f => <option value={f.id} key={f.id}>{f.name} ({Math.round(f.ratio * 100)}%)</option>)}</select><div className="mb-3 rounded-xl border border-slate-700 bg-slate-900/80 p-3"><p className="mb-0.5 text-[10px] font-bold text-emerald-400">{t.fit}</p><p className="text-xs leading-relaxed text-slate-300">{FORMS.find(f => f.id === formula)?.desc[language]}</p></div><div className="flex justify-between rounded-xl bg-slate-900/50 p-3 text-xs"><span className="text-slate-400">{t.target}</span><span className="font-bold text-emerald-400">{money(targetSave)}</span></div></Card>

        <SavingsCard t={t} language={language} money={money} emergencyMonths={emergencyMonths} setEmergencyMonths={setEmergencyMonths} startMonth={startMonth} setStartMonth={setStartMonth} emergencyGoal={emergencyGoal} actualSaved={actualSaved} progress={progress} originalEnd={originalEnd} dynamicEnd={dynamicEnd} speedup={speedup} depositAmount={depositAmount} setDepositAmount={setDepositAmount} depositNote={depositNote} setDepositNote={setDepositNote} addDeposit={addDeposit} schedule={schedule.slice(0, 5)} onDeleteDeposit={id => { setDeposits(deposits.filter(d => d.id !== id)); notify(t.deleted); }}/>
      </div> : <HistoryView t={t} language={language} money={money} emergencyGoal={emergencyGoal} actualSaved={actualSaved} schedule={schedule} onDeleteDeposit={id => { setDeposits(deposits.filter(d => d.id !== id)); notify(t.deleted); }} deposits={deposits}/>}
      <button onClick={saveData} className="mt-6 w-full rounded-xl bg-emerald-600 py-3 text-xs font-bold text-white shadow-lg transition hover:bg-emerald-500">{t.save}</button>
      {toast && <div role="status" className="fixed bottom-5 left-1/2 z-50 -translate-x-1/2 rounded-xl border border-emerald-500/40 bg-slate-800 px-4 py-3 text-xs text-white shadow-xl">{toast}</div>}
    </div>
  </main>;
}

function Card({ children }: { children: React.ReactNode }) { return <section className="rounded-2xl border border-slate-700 bg-slate-800 p-5 shadow-lg">{children}</section>; }
function EntryRow({ item, money, onDelete }: { item: Entry; money: (n: number) => string; onDelete: () => void }) { const income = item.kind === "income";return <div className={`flex items-center justify-between rounded-xl border bg-slate-900/40 p-2 text-xs ${income ? "border-emerald-900/50" : "border-rose-900/50"}`}><div className="flex min-w-0 items-center gap-2"><span className={income ? "text-emerald-400" : "text-rose-400"}>{income ? "➕" : "➖"}</span><span className="truncate text-slate-200">{item.title}</span></div><div className="ml-2 flex shrink-0 items-center gap-2"><span className={`font-bold ${income ? "text-emerald-400" : "text-rose-400"}`}>{income ? "+" : "−"}{money(item.amount)}</span><button aria-label="ลบรายการ" onClick={onDelete} className="ml-1 text-slate-500 hover:text-rose-400">✕</button></div></div>; }
type SavingsProps = { t: Record<string, string>; language: Lang; money: (n: number) => string; emergencyMonths: number; setEmergencyMonths: (n: number) => void; startMonth: string; setStartMonth: (v: string) => void; emergencyGoal: number; actualSaved: number; progress: number; originalEnd: string; dynamicEnd: string; speedup: number; depositAmount: string; setDepositAmount: (v: string) => void; depositNote: string; setDepositNote: (v: string) => void; addDeposit: () => void; schedule: { month: string; amount: number; balance: number; actual: boolean; note: string; depositId?: number }[]; onDeleteDeposit: (id: number) => void };
function SavingsCard(p: SavingsProps) { const { t, language, money } = p;return <Card><h2 className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-400">{t.savings}</h2><div className="mb-4 space-y-2 rounded-xl border border-slate-700 bg-slate-900/80 p-3 text-xs text-slate-300"><p className="text-[10px] font-bold text-amber-400">{t.emInfo}</p><p className="leading-relaxed">{t.emHelp}</p></div><div className="mb-3 grid grid-cols-2 gap-2"><label className="text-[10px] text-slate-400">{t.months}<select value={p.emergencyMonths} onChange={e => p.setEmergencyMonths(Number(e.target.value))} className="mt-1 w-full rounded-xl border border-slate-600 bg-slate-700 p-2 text-xs text-white outline-none">{[3, 6, 9, 12].map(n => <option key={n} value={n}>{n} {t.monthsUnit}</option>)}</select></label><label className="text-[10px] text-slate-400">{t.start}<input type="month" value={p.startMonth} onChange={e => p.setStartMonth(e.target.value)} className="mt-1 w-full rounded-xl border border-slate-600 bg-slate-700 p-1.5 text-xs text-white outline-none"/></label></div><div className="mb-3 flex items-center justify-between rounded-xl border border-slate-700 bg-slate-900/50 p-2.5 text-xs"><span className="text-slate-400">{t.goal}</span><span className="font-bold text-amber-400">{p.emergencyGoal > 0 ? `${money(p.emergencyGoal)} (${p.emergencyMonths} ${t.monthsUnit})` : t.noExpense}</span></div><div className="mb-1 h-3 w-full overflow-hidden rounded-full bg-slate-700"><div className="h-full bg-emerald-500 transition-all duration-300" style={{ width: `${p.progress}%` }}/></div><p className="mb-4 text-right text-[10px] font-bold text-emerald-400">{money(p.actualSaved)} / {money(p.emergencyGoal)} ({p.progress.toFixed(1)}%)</p>
    <div className="mb-4 space-y-2 rounded-xl border border-emerald-500/40 bg-slate-900/80 p-3.5 text-xs"><div className="flex justify-between border-b border-slate-800 pb-2"><span className="text-slate-400">{t.original}</span><span className="font-bold text-slate-300">{p.originalEnd ? formatMonth(p.originalEnd, language) : "—"}</span></div><div className="flex justify-between border-b border-slate-800 pb-2"><span className="text-slate-400">{t.dynamic}</span><span className="text-sm font-extrabold text-emerald-400">{p.dynamicEnd ? formatMonth(p.dynamicEnd, language) : "—"}</span></div>{p.speedup > 0 && <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/20 px-2 py-1.5 text-center text-[11px] font-bold text-emerald-300">{t.faster} {p.speedup} {t.monthsUnit}!</div>}</div>
    <div className="mb-4 space-y-2.5 rounded-xl border border-slate-700/80 bg-slate-900/40 p-3"><label className="block text-[10px] font-bold text-slate-300">{t.depositTitle}</label><label className="block text-[9px] text-slate-400">{t.depositAmount}<input type="number" min="0.01" step="any" value={p.depositAmount} onChange={e => p.setDepositAmount(e.target.value)} placeholder="0" className="mt-1 w-full rounded-xl border border-slate-600 bg-slate-700 p-2 text-xs text-white outline-none focus:border-emerald-500"/></label><label className="block text-[9px] text-slate-400">{t.note}<input value={p.depositNote} onChange={e => p.setDepositNote(e.target.value)} placeholder={language === "th" ? "เช่น ฝาก e-Savings 3,000 / ลงทุนหุ้น 2,000" : "e.g. e-Savings 3,000 / stocks 2,000"} className="mt-1 w-full rounded-xl border border-slate-600 bg-slate-700 p-2 text-xs text-white outline-none focus:border-emerald-500"/></label><button onClick={p.addDeposit} className="w-full rounded-xl bg-emerald-600 py-2 text-xs font-bold text-white shadow transition hover:bg-emerald-500">{t.depositButton}</button></div>
    <h3 className="mb-2 text-[11px] font-bold text-slate-400">{t.ledger}</h3><div className="max-h-56 space-y-2 overflow-y-auto pr-1">{p.schedule.length ? p.schedule.map((row, i) => <ScheduleRow key={row.month} row={row} index={i} t={t} money={money} language={language} onDeleteDeposit={p.onDeleteDeposit}/>) : <p className="py-2 text-[10px] text-slate-500">{t.noExpense}</p>}</div>
  </Card>; }
function ScheduleRow({ row, index, t, money, language, onDeleteDeposit }: { row: SavingsProps["schedule"][number]; index: number; t: Record<string, string>; money: (n: number) => string; language: Lang; onDeleteDeposit: (id: number) => void }) { return <div className={`rounded-xl border p-2.5 text-xs ${row.actual ? "border-emerald-500/40 bg-emerald-500/[0.08]" : "border-slate-700/60 bg-slate-900/60"}`}><div className="flex items-center justify-between gap-2"><div className="min-w-0"><div className="flex flex-wrap items-center gap-1.5"><span className={`font-bold ${row.actual ? "text-slate-400 line-through" : "text-slate-200"}`}>{t.month} {index + 1}: {formatMonth(row.month, language)}</span><span className={`rounded px-1.5 py-0.5 text-[9px] ${row.actual ? "border border-emerald-500/40 bg-emerald-500/20 font-bold text-emerald-300" : "bg-slate-800 text-slate-400"}`}>{row.actual ? t.paidBadge : t.forecast}</span></div><div className="mt-0.5 text-[10px] text-slate-400">{t.collected}: <span className="font-semibold text-emerald-400">{money(row.balance)}</span></div>{row.note && <p className="mt-1 text-[10px] text-slate-400">📝 {row.note}</p>}</div><div className="shrink-0 text-right"><div className={`font-bold ${row.actual ? "text-emerald-300 line-through" : "text-slate-300"}`}>{money(row.balance)}</div>{row.actual && <div className="text-[9px] text-sky-300">{t.actual} +{money(row.amount)}</div>}{row.actual && <button onClick={() => row.depositId && onDeleteDeposit(row.depositId)} aria-label="ลบยอดฝาก" className="mt-1 text-slate-500 hover:text-rose-400">✕</button>}</div></div></div>; }
function HistoryView({ t, language, money, emergencyGoal, actualSaved, schedule, onDeleteDeposit }: { t: Record<string, string>; language: Lang; money: (n: number) => string; emergencyGoal: number; actualSaved: number; schedule: SavingsProps["schedule"]; onDeleteDeposit: (id: number) => void }) {return <div className="space-y-6"><Card><div className="mb-4 flex items-center justify-between border-b border-slate-700 pb-3"><div><h2 className="text-sm font-bold text-emerald-400">{t.fullHistory}</h2><p className="mt-0.5 text-[10px] text-slate-400">{t.fullSub}</p></div><span className="rounded-lg border border-emerald-500/40 bg-emerald-500/20 px-2 py-1 text-[10px] font-bold text-emerald-300">{schedule.length} {t.periods}</span></div><div className="mb-4 grid grid-cols-2 gap-2 text-xs"><div className="rounded-xl border border-slate-700 bg-slate-900/60 p-3"><span className="block text-[10px] text-slate-400">{t.totalGoal}</span><span className="text-sm font-bold text-amber-400">{money(emergencyGoal)}</span></div><div className="rounded-xl border border-slate-700 bg-slate-900/60 p-3"><span className="block text-[10px] text-slate-400">{t.paid}</span><span className="text-sm font-bold text-emerald-400">{money(actualSaved)}</span></div></div><div className="space-y-2.5">{schedule.length ? schedule.map((row, i) => <ScheduleRow key={row.month} row={row} index={i} t={t} money={money} language={language} onDeleteDeposit={onDeleteDeposit}/>) : <p className="py-4 text-center text-xs text-slate-500">{t.noExpense}</p>}</div></Card></div>; }
