"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { CHART_COLORS } from "@/lib/constants";
import {
  hashPassword,
  verifyPassword,
  PROFILE_ID,
  DEFAULT_PROFILE,
  DEFAULT_PASSWORD,
} from "@/lib/auth";
import { materializeRecurring } from "@/lib/queries";
import { randomUUID } from "node:crypto";

type ActionResult = { ok: boolean; error?: string };
type Categoria = { id: string; name: string; kind: string; color: string };
type CategoriaResult = ActionResult & { category?: Categoria };

const APP_ROUTES = [
  "/dashboard",
  "/transacoes",
  "/contas",
  "/orcamento",
  "/relatorios",
  "/balanco",
  "/recorrentes",
  "/categorias",
  "/metas",
  "/fluxo",
  "/comparativo",
];

function revalidateApp() {
  for (const r of APP_ROUTES) revalidatePath(r);
}

function money(v: FormDataEntryValue | null): number {
  if (v == null) return 0;
  const n = parseFloat(String(v).replace(/\./g, "").replace(",", ".").replace(/[^0-9.-]/g, ""));
  // Se veio de <input type=number> já é "1234.56"; o replace acima quebraria isso.
  const direct = parseFloat(String(v));
  return Number.isFinite(direct) ? direct : Number.isFinite(n) ? n : 0;
}

function str(v: FormDataEntryValue | null): string {
  return v == null ? "" : String(v).trim();
}

// "Viagem, #Trabalho ; casa" -> "viagem,trabalho,casa"
function normalizeTags(v: FormDataEntryValue | null): string {
  return String(v ?? "")
    .split(/[,;]+/)
    .map((t) => t.trim().replace(/^#/, "").toLowerCase())
    .filter(Boolean)
    .filter((t, i, arr) => arr.indexOf(t) === i)
    .join(",");
}

async function pickColor(model: "account" | "category"): Promise<string> {
  const count =
    model === "account"
      ? await db.account.count()
      : await db.category.count();
  return CHART_COLORS[count % CHART_COLORS.length];
}

// ---------- Contas ----------
export async function createAccount(fd: FormData): Promise<ActionResult> {
  const name = str(fd.get("name"));
  if (!name) return { ok: false, error: "Informe o nome da conta." };
  await db.account.create({
    data: {
      name,
      type: str(fd.get("type")) || "carteira",
      initialBalance: money(fd.get("initialBalance")),
      color: str(fd.get("color")) || (await pickColor("account")),
    },
  });
  revalidateApp();
  return { ok: true };
}

export async function updateAccount(
  id: string,
  fd: FormData
): Promise<ActionResult> {
  const name = str(fd.get("name"));
  if (!name) return { ok: false, error: "Informe o nome da conta." };
  const color = str(fd.get("color"));
  await db.account.update({
    where: { id },
    data: {
      name,
      type: str(fd.get("type")) || "carteira",
      initialBalance: money(fd.get("initialBalance")),
      ...(color ? { color } : {}),
    },
  });
  revalidateApp();
  return { ok: true };
}

export async function deleteAccount(id: string): Promise<ActionResult> {
  await db.account.delete({ where: { id } });
  revalidateApp();
  return { ok: true };
}

// ---------- Cartões ----------
export async function createCreditCard(fd: FormData): Promise<ActionResult> {
  const name = str(fd.get("name"));
  if (!name) return { ok: false, error: "Informe o nome do cartão." };
  const count = await db.creditCard.count();
  await db.creditCard.create({
    data: {
      name,
      brand: str(fd.get("brand")),
      limit: money(fd.get("limit")),
      closingDay: parseInt(str(fd.get("closingDay")) || "1", 10),
      dueDay: parseInt(str(fd.get("dueDay")) || "10", 10),
      color: str(fd.get("color")) || CHART_COLORS[(count + 3) % CHART_COLORS.length],
    },
  });
  revalidateApp();
  return { ok: true };
}

export async function updateCreditCard(
  id: string,
  fd: FormData
): Promise<ActionResult> {
  const name = str(fd.get("name"));
  if (!name) return { ok: false, error: "Informe o nome do cartão." };
  const color = str(fd.get("color"));
  await db.creditCard.update({
    where: { id },
    data: {
      name,
      brand: str(fd.get("brand")),
      limit: money(fd.get("limit")),
      closingDay: parseInt(str(fd.get("closingDay")) || "1", 10),
      dueDay: parseInt(str(fd.get("dueDay")) || "10", 10),
      ...(color ? { color } : {}),
    },
  });
  revalidateApp();
  return { ok: true };
}

export async function deleteCreditCard(id: string): Promise<ActionResult> {
  await db.creditCard.delete({ where: { id } });
  revalidateApp();
  return { ok: true };
}

// Paga a fatura do cartão: quita as despesas pendentes até o fim do mês
// (libera o limite) e registra a saída da conta como transferência.
export async function payCardInvoice(fd: FormData): Promise<ActionResult> {
  const cardId = str(fd.get("cardId"));
  const accountId = str(fd.get("accountId"));
  if (!cardId) return { ok: false, error: "Cartão inválido." };
  if (!accountId) return { ok: false, error: "Escolha a conta de pagamento." };

  const card = await db.creditCard.findUnique({ where: { id: cardId } });
  if (!card) return { ok: false, error: "Cartão não encontrado." };

  const now = new Date();
  const fimMes = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const pendentes = await db.transaction.findMany({
    where: {
      creditCardId: cardId,
      kind: "despesa",
      status: "pendente",
      date: { lt: fimMes },
    },
    select: { id: true, amount: true },
  });
  if (pendentes.length === 0)
    return { ok: false, error: "Não há fatura em aberto para pagar." };

  const total = pendentes.reduce((s, t) => s + t.amount, 0);

  // Quita as despesas do cartão (libera o limite)
  await db.transaction.updateMany({
    where: { id: { in: pendentes.map((p) => p.id) } },
    data: { status: "pago" },
  });
  // Registra a saída da conta como transferência (não conta como despesa)
  await db.transaction.create({
    data: {
      description: `Pagamento fatura ${card.name}`,
      amount: total,
      kind: "despesa",
      status: "pago",
      date: now,
      accountId,
      isTransfer: true,
    },
  });

  revalidateApp();
  return { ok: true };
}

// ---------- Categorias ----------
export async function createCategory(fd: FormData): Promise<CategoriaResult> {
  const name = str(fd.get("name"));
  if (!name) return { ok: false, error: "Informe o nome da categoria." };
  const category = await db.category.create({
    data: {
      name,
      kind: str(fd.get("kind")) === "receita" ? "receita" : "despesa",
      color: str(fd.get("color")) || (await pickColor("category")),
    },
  });
  revalidateApp();
  return { ok: true, category };
}

export async function updateCategory(
  id: string,
  fd: FormData
): Promise<ActionResult> {
  const name = str(fd.get("name"));
  if (!name) return { ok: false, error: "Informe o nome da categoria." };
  const color = str(fd.get("color"));
  await db.category.update({
    where: { id },
    data: { name, ...(color ? { color } : {}) },
  });
  revalidateApp();
  return { ok: true };
}

export async function deleteCategory(id: string): Promise<ActionResult> {
  // Transações/recorrentes ficam sem categoria (SetNull); orçamentos da
  // categoria são removidos (Cascade) — conforme o schema.
  await db.category.delete({ where: { id } });
  revalidateApp();
  return { ok: true };
}

function round2(n: number) {
  return Math.round(n * 100) / 100;
}
function addMonths(base: Date, n: number) {
  const d = new Date(base);
  const alvo = d.getMonth() + n;
  const dia = d.getDate();
  d.setDate(1);
  d.setMonth(alvo);
  // Ajusta para o último dia se o mês de destino for mais curto
  const ultimo = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  d.setDate(Math.min(dia, ultimo));
  return d;
}
function addDays(base: Date, n: number) {
  const d = new Date(base);
  d.setDate(d.getDate() + n);
  return d;
}
// i-ésima ocorrência a partir de `base` conforme a frequência
function ocorrenciaRepeticao(base: Date, freq: string, i: number) {
  switch (freq) {
    case "semanal":
      return addDays(base, 7 * i);
    case "quinzenal":
      return addDays(base, 14 * i);
    case "trimestral":
      return addMonths(base, 3 * i);
    case "semestral":
      return addMonths(base, 6 * i);
    case "anual":
      return addMonths(base, 12 * i);
    default: // mensal
      return addMonths(base, i);
  }
}

// Data de vencimento da PRIMEIRA fatura em que a compra cai,
// conforme o fechamento e o vencimento do cartão.
function primeiraFatura(compra: Date, closingDay: number, dueDay: number) {
  // Compra até o dia de fechamento entra na fatura que fecha neste mês; senão, na próxima.
  const offsetFechamento = compra.getDate() <= closingDay ? 0 : 1;
  // Se o vencimento é depois do fechamento, vence no mesmo mês; senão, no mês seguinte.
  const offsetVencimento = dueDay > closingDay ? 0 : 1;
  const d = new Date(
    compra.getFullYear(),
    compra.getMonth() + offsetFechamento + offsetVencimento,
    1,
    12
  );
  const ultimo = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  d.setDate(Math.min(dueDay, ultimo));
  return d;
}

// ---------- Transações ----------
export async function createTransaction(fd: FormData): Promise<ActionResult> {
  const description = str(fd.get("description"));
  const amount = money(fd.get("amount"));
  if (!description) return { ok: false, error: "Informe a descrição." };
  if (!(amount > 0)) return { ok: false, error: "Informe um valor válido." };

  const dateStr = str(fd.get("date"));
  const date = dateStr ? new Date(`${dateStr}T12:00:00`) : new Date();

  const kind = str(fd.get("kind")) === "receita" ? "receita" : "despesa";
  const status = str(fd.get("status")) === "pendente" ? "pendente" : "pago";
  const paymentType = str(fd.get("paymentType")); // "account" | "card"
  const accountId = paymentType === "account" ? str(fd.get("accountId")) || null : null;
  const creditCardId = paymentType === "card" ? str(fd.get("creditCardId")) || null : null;
  const categoryId = str(fd.get("categoryId")) || null;
  const tags = normalizeTags(fd.get("tags"));

  // Parcelamento (apenas cartão de crédito)
  const parcelas = Math.min(Math.max(parseInt(str(fd.get("parcelas")) || "1", 10) || 1, 1), 48);
  const modo = str(fd.get("installmentMode")) === "parcela" ? "parcela" : "total";
  // Repetir N vezes (conta/receita): mesmo valor, uma ocorrência por período
  const repeticoes = Math.min(Math.max(parseInt(str(fd.get("repeticoes")) || "1", 10) || 1, 1), 60);
  const repeticaoFreq = str(fd.get("repeticaoFreq")) || "mensal";

  // Compra no cartão: `date` = data da fatura (fechamento/vencimento);
  // `purchaseDate` = data real da compra. Conta: date = data, sem purchaseDate.
  let base = date;
  const purchaseDate = creditCardId ? date : null;
  if (creditCardId) {
    const cartao = await db.creditCard.findUnique({ where: { id: creditCardId } });
    if (cartao) base = primeiraFatura(date, cartao.closingDay, cartao.dueDay);
  }

  if (creditCardId && parcelas > 1) {
    // `amount` é o total (modo total) ou o valor de cada parcela (modo parcela)
    const valorParcela = modo === "parcela" ? amount : round2(amount / parcelas);
    const total = modo === "parcela" ? round2(amount * parcelas) : amount;

    const installmentId = randomUUID();
    const dados = [];
    for (let i = 0; i < parcelas; i++) {
      // No modo total, a última parcela absorve o arredondamento
      const valor =
        modo === "total" && i === parcelas - 1
          ? round2(total - valorParcela * (parcelas - 1))
          : valorParcela;
      dados.push({
        description: `${description} (${i + 1}/${parcelas})`,
        amount: valor,
        kind,
        status: i === 0 ? status : "pendente",
        date: addMonths(base, i),
        purchaseDate,
        categoryId,
        accountId: null,
        creditCardId,
        installmentId,
        tags,
      });
    }
    await db.transaction.createMany({ data: dados });
    revalidateApp();
    return { ok: true };
  }

  // Repetição por N meses (conta/receita) — mesmo valor em cada mês
  if (repeticoes > 1 && !creditCardId) {
    const grupo = randomUUID();
    const dados = [];
    for (let i = 0; i < repeticoes; i++) {
      dados.push({
        description: `${description} (${i + 1}/${repeticoes})`,
        amount,
        kind,
        status: i === 0 ? status : "pendente",
        date: ocorrenciaRepeticao(base, repeticaoFreq, i),
        purchaseDate,
        categoryId,
        accountId,
        creditCardId: null,
        installmentId: grupo,
        tags,
      });
    }
    await db.transaction.createMany({ data: dados });
    revalidateApp();
    return { ok: true };
  }

  await db.transaction.create({
    data: {
      description,
      amount,
      kind,
      status,
      date: base,
      purchaseDate,
      categoryId,
      accountId,
      creditCardId,
      tags,
    },
  });
  revalidateApp();
  return { ok: true };
}

export async function updateTransaction(
  id: string,
  fd: FormData
): Promise<ActionResult> {
  const description = str(fd.get("description"));
  const amount = money(fd.get("amount"));
  if (!description) return { ok: false, error: "Informe a descrição." };
  if (!(amount > 0)) return { ok: false, error: "Informe um valor válido." };

  const dateStr = str(fd.get("date"));
  const date = dateStr ? new Date(`${dateStr}T12:00:00`) : new Date();

  const paymentType = str(fd.get("paymentType"));
  const accountId = paymentType === "account" ? str(fd.get("accountId")) || null : null;
  const creditCardId = paymentType === "card" ? str(fd.get("creditCardId")) || null : null;
  const categoryId = str(fd.get("categoryId")) || null;

  // A data digitada é a data da COMPRA; para cartão, `date` vira a data da fatura.
  let dataFatura = date;
  const purchaseDate = creditCardId ? date : null;
  if (creditCardId) {
    const cartao = await db.creditCard.findUnique({ where: { id: creditCardId } });
    if (cartao) dataFatura = primeiraFatura(date, cartao.closingDay, cartao.dueDay);
  }

  await db.transaction.update({
    where: { id },
    data: {
      description,
      amount,
      kind: str(fd.get("kind")) === "receita" ? "receita" : "despesa",
      status: str(fd.get("status")) === "pendente" ? "pendente" : "pago",
      date: dataFatura,
      purchaseDate,
      categoryId,
      accountId,
      creditCardId,
      tags: normalizeTags(fd.get("tags")),
    },
  });
  revalidateApp();
  return { ok: true };
}

export async function deleteInstallmentGroup(
  installmentId: string
): Promise<ActionResult> {
  await db.transaction.deleteMany({ where: { installmentId } });
  revalidateApp();
  return { ok: true };
}

export async function deleteTransaction(id: string): Promise<ActionResult> {
  await db.transaction.delete({ where: { id } });
  revalidateApp();
  return { ok: true };
}

export async function toggleTransactionStatus(id: string): Promise<ActionResult> {
  const t = await db.transaction.findUnique({ where: { id } });
  if (!t) return { ok: false, error: "Transação não encontrada." };
  await db.transaction.update({
    where: { id },
    data: { status: t.status === "pago" ? "pendente" : "pago" },
  });
  revalidateApp();
  return { ok: true };
}

// Quita a transação escolhendo de qual conta o dinheiro sai (ou entra).
export async function settleTransaction(
  id: string,
  accountId: string
): Promise<ActionResult> {
  if (!accountId) return { ok: false, error: "Escolha uma conta." };
  await db.transaction.update({
    where: { id },
    data: { status: "pago", accountId, creditCardId: null },
  });
  revalidateApp();
  return { ok: true };
}

// ---------- Importar extrato ----------
type ImportRow = {
  date: string; // YYYY-MM-DD
  description: string;
  amount: number; // sempre positivo
  kind: "receita" | "despesa";
};

export async function importTransactions(
  rows: ImportRow[],
  accountId: string
): Promise<ActionResult & { count?: number }> {
  if (!accountId) return { ok: false, error: "Escolha a conta de destino." };
  const validas = rows.filter(
    (r) => r.description && r.amount > 0 && /^\d{4}-\d{2}-\d{2}$/.test(r.date)
  );
  if (validas.length === 0)
    return { ok: false, error: "Nenhuma linha válida para importar." };

  await db.transaction.createMany({
    data: validas.map((r) => ({
      description: r.description.slice(0, 200),
      amount: r.amount,
      kind: r.kind === "receita" ? "receita" : "despesa",
      status: "pago",
      date: new Date(`${r.date}T12:00:00`),
      accountId,
    })),
  });
  revalidateApp();
  return { ok: true, count: validas.length };
}

// ---------- Orçamento ----------
export async function setBudget(fd: FormData): Promise<ActionResult> {
  const amount = money(fd.get("amount"));
  if (!(amount > 0)) return { ok: false, error: "Informe um valor válido." };
  const month = parseInt(str(fd.get("month")), 10);
  const year = parseInt(str(fd.get("year")), 10);
  const categoryId = str(fd.get("categoryId")) || null;

  // NULL é distinto em índices únicos do SQLite, então o upsert por
  // (month, year, categoryId=null) não casa — tratamos o total manualmente.
  const existing = await db.budget.findFirst({ where: { month, year, categoryId } });
  if (existing) {
    await db.budget.update({ where: { id: existing.id }, data: { amount } });
  } else {
    await db.budget.create({ data: { amount, month, year, categoryId } });
  }
  revalidateApp();
  return { ok: true };
}

export async function deleteBudget(id: string): Promise<ActionResult> {
  await db.budget.delete({ where: { id } });
  revalidateApp();
  return { ok: true };
}

// Copia os orçamentos do mês anterior para (month, year).
// Não sobrescreve orçamentos já definidos no mês de destino.
export async function copyBudgetsFromPreviousMonth(
  month: number,
  year: number
): Promise<ActionResult & { copied?: number }> {
  const prev = month === 1 ? { month: 12, year: year - 1 } : { month: month - 1, year };
  const [origem, destino] = await Promise.all([
    db.budget.findMany({ where: { month: prev.month, year: prev.year } }),
    db.budget.findMany({ where: { month, year } }),
  ]);
  if (origem.length === 0)
    return { ok: false, error: "Não há orçamento no mês anterior para copiar." };

  const jaExiste = new Set(destino.map((b) => b.categoryId ?? "__total__"));
  const novos = origem
    .filter((b) => !jaExiste.has(b.categoryId ?? "__total__"))
    .map((b) => ({ amount: b.amount, month, year, categoryId: b.categoryId }));

  if (novos.length === 0)
    return { ok: false, error: "Todos os orçamentos deste mês já estão definidos." };

  await db.budget.createMany({ data: novos });
  revalidateApp();
  return { ok: true, copied: novos.length };
}

// ---------- Recorrentes / fixas ----------
function clampInt(v: string, min: number, max: number, fallback: number) {
  const n = parseInt(v || "", 10);
  return Math.min(Math.max(Number.isFinite(n) ? n : fallback, min), max);
}

function recurringDataFrom(fd: FormData) {
  const paymentType = str(fd.get("paymentType"));
  const kind = str(fd.get("kind")) === "receita" ? "receita" : "despesa";
  const freqRaw = str(fd.get("frequency"));
  const frequency = [
    "mensal",
    "semanal",
    "quinzenal",
    "trimestral",
    "semestral",
    "anual",
  ].includes(freqRaw)
    ? freqRaw
    : "mensal";
  const usaMesAncora = ["anual", "trimestral", "semestral"].includes(frequency);
  return {
    description: str(fd.get("description")),
    amount: money(fd.get("amount")),
    kind,
    frequency,
    dayOfMonth: clampInt(str(fd.get("dayOfMonth")), 1, 31, 1),
    dayOfWeek:
      frequency === "semanal" ? clampInt(str(fd.get("dayOfWeek")), 0, 6, 1) : null,
    month: usaMesAncora ? clampInt(str(fd.get("month")), 1, 12, 1) : null,
    color: str(fd.get("color")) || "var(--color-chart-1)",
    categoryId: str(fd.get("categoryId")) || null,
    accountId:
      kind === "despesa" && paymentType === "card"
        ? null
        : str(fd.get("accountId")) || null,
    creditCardId:
      kind === "despesa" && paymentType === "card"
        ? str(fd.get("creditCardId")) || null
        : null,
  };
}

export async function createRecurring(fd: FormData): Promise<ActionResult> {
  const data = recurringDataFrom(fd);
  if (!data.description) return { ok: false, error: "Informe a descrição." };
  if (!(data.amount > 0)) return { ok: false, error: "Informe um valor válido." };

  await db.recurring.create({ data });
  // Materializa o mês atual para já aparecer na previsão
  const now = new Date();
  await materializeRecurring(now.getMonth() + 1, now.getFullYear());
  revalidateApp();
  return { ok: true };
}

export async function updateRecurring(
  id: string,
  fd: FormData
): Promise<ActionResult> {
  const data = recurringDataFrom(fd);
  if (!data.description) return { ok: false, error: "Informe a descrição." };
  if (!(data.amount > 0)) return { ok: false, error: "Informe um valor válido." };

  // Regenera os pendentes do mês atual com o novo agendamento:
  // apaga os pendentes (não pagos) e remateriliza. Os já pagos ficam.
  const now = new Date();
  const inicioMes = new Date(now.getFullYear(), now.getMonth(), 1);
  await db.transaction.deleteMany({
    where: { recurringId: id, status: "pendente", date: { gte: inicioMes } },
  });
  await db.recurring.update({
    where: { id },
    data: { ...data, lastGenerated: null },
  });
  await materializeRecurring(now.getMonth() + 1, now.getFullYear());
  revalidateApp();
  return { ok: true };
}

export async function toggleRecurringActive(id: string): Promise<ActionResult> {
  const r = await db.recurring.findUnique({ where: { id } });
  if (!r) return { ok: false, error: "Recorrente não encontrado." };
  await db.recurring.update({ where: { id }, data: { active: !r.active } });
  revalidateApp();
  return { ok: true };
}

export async function deleteRecurring(id: string): Promise<ActionResult> {
  // Remove os lançamentos pendentes (não pagos) gerados por este recorrente;
  // os já pagos ficam no histórico (recurringId vira null).
  await db.transaction.deleteMany({
    where: { recurringId: id, status: "pendente" },
  });
  await db.recurring.delete({ where: { id } });
  revalidateApp();
  return { ok: true };
}

// ---------- Perfil / Senha / Login ----------
async function ensureProfile() {
  const p = await db.profile.findUnique({ where: { id: PROFILE_ID } });
  if (p) return p;
  return db.profile.create({
    data: {
      id: PROFILE_ID,
      name: DEFAULT_PROFILE.name,
      email: DEFAULT_PROFILE.email,
      password: hashPassword(DEFAULT_PASSWORD),
    },
  });
}

export async function authenticate(fd: FormData): Promise<ActionResult> {
  const email = str(fd.get("email")).toLowerCase();
  const password = str(fd.get("password"));
  if (!email || !password)
    return { ok: false, error: "Preencha e-mail e senha." };

  const p = await ensureProfile();
  if (p.email.toLowerCase() !== email || !verifyPassword(password, p.password)) {
    return { ok: false, error: "E-mail ou senha incorretos." };
  }
  return { ok: true };
}

export async function updateProfile(fd: FormData): Promise<ActionResult> {
  const name = str(fd.get("name"));
  const email = str(fd.get("email"));
  if (!name) return { ok: false, error: "Informe seu nome." };
  if (!email || !/.+@.+\..+/.test(email))
    return { ok: false, error: "Informe um e-mail válido." };

  await ensureProfile();
  await db.profile.update({ where: { id: PROFILE_ID }, data: { name, email } });
  revalidatePath("/configuracoes");
  revalidatePath("/", "layout"); // atualiza o nome/e-mail na sidebar
  return { ok: true };
}

export async function changePassword(fd: FormData): Promise<ActionResult> {
  const current = str(fd.get("currentPassword"));
  const next = str(fd.get("newPassword"));
  const confirm = str(fd.get("confirmPassword"));

  if (!next || next.length < 4)
    return { ok: false, error: "A nova senha deve ter ao menos 4 caracteres." };
  if (next !== confirm)
    return { ok: false, error: "A confirmação não confere." };

  const p = await ensureProfile();
  if (!verifyPassword(current, p.password))
    return { ok: false, error: "Senha atual incorreta." };

  await db.profile.update({
    where: { id: PROFILE_ID },
    data: { password: hashPassword(next) },
  });
  return { ok: true };
}

// ---------- Transferência entre contas ----------
export async function createTransfer(fd: FormData): Promise<ActionResult> {
  const fromId = str(fd.get("fromAccountId"));
  const toId = str(fd.get("toAccountId"));
  const amount = money(fd.get("amount"));
  if (!fromId || !toId) return { ok: false, error: "Escolha as contas." };
  if (fromId === toId) return { ok: false, error: "As contas devem ser diferentes." };
  if (!(amount > 0)) return { ok: false, error: "Informe um valor válido." };

  const dateStr = str(fd.get("date"));
  const date = dateStr ? new Date(`${dateStr}T12:00:00`) : new Date();
  const [from, to] = await Promise.all([
    db.account.findUnique({ where: { id: fromId } }),
    db.account.findUnique({ where: { id: toId } }),
  ]);
  if (!from || !to) return { ok: false, error: "Conta não encontrada." };

  const grupo = randomUUID();
  // Saída da origem e entrada no destino, ambas transferências (não contam em relatórios)
  await db.transaction.createMany({
    data: [
      {
        description: `Transferência para ${to.name}`,
        amount,
        kind: "despesa",
        status: "pago",
        date,
        accountId: fromId,
        isTransfer: true,
        installmentId: grupo,
      },
      {
        description: `Transferência de ${from.name}`,
        amount,
        kind: "receita",
        status: "pago",
        date,
        accountId: toId,
        isTransfer: true,
        installmentId: grupo,
      },
    ],
  });
  revalidateApp();
  return { ok: true };
}

// ---------- Metas de economia ----------
export async function createGoal(fd: FormData): Promise<ActionResult> {
  const name = str(fd.get("name"));
  const target = money(fd.get("target"));
  if (!name) return { ok: false, error: "Informe o nome da meta." };
  if (!(target > 0)) return { ok: false, error: "Informe um valor alvo válido." };
  const deadlineStr = str(fd.get("deadline"));
  const count = await db.goal.count();
  await db.goal.create({
    data: {
      name,
      target,
      saved: money(fd.get("saved")),
      deadline: deadlineStr ? new Date(`${deadlineStr}T12:00:00`) : null,
      color: str(fd.get("color")) || CHART_COLORS[count % CHART_COLORS.length],
    },
  });
  revalidateApp();
  return { ok: true };
}

export async function updateGoal(id: string, fd: FormData): Promise<ActionResult> {
  const name = str(fd.get("name"));
  const target = money(fd.get("target"));
  if (!name) return { ok: false, error: "Informe o nome da meta." };
  if (!(target > 0)) return { ok: false, error: "Informe um valor alvo válido." };
  const deadlineStr = str(fd.get("deadline"));
  const color = str(fd.get("color"));
  await db.goal.update({
    where: { id },
    data: {
      name,
      target,
      saved: money(fd.get("saved")),
      deadline: deadlineStr ? new Date(`${deadlineStr}T12:00:00`) : null,
      ...(color ? { color } : {}),
    },
  });
  revalidateApp();
  return { ok: true };
}

// Adiciona (ou remove, se negativo) um valor ao guardado da meta
export async function addToGoal(id: string, delta: number): Promise<ActionResult> {
  const g = await db.goal.findUnique({ where: { id } });
  if (!g) return { ok: false, error: "Meta não encontrada." };
  await db.goal.update({
    where: { id },
    data: { saved: Math.max(g.saved + delta, 0) },
  });
  revalidateApp();
  return { ok: true };
}

export async function deleteGoal(id: string): Promise<ActionResult> {
  await db.goal.delete({ where: { id } });
  revalidateApp();
  return { ok: true };
}
