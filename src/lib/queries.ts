import { db } from "@/lib/db";
import { scopedDb } from "@/lib/tenant";
import { MESES } from "@/lib/constants";
import { requireUserId, getActingUser, getSession } from "@/lib/auth";

// ---- Usuário logado no momento (considera impersonação) ----
export async function getCurrentUser() {
  const user = await getActingUser();
  if (!user) return null;
  return { id: user.id, name: user.name, email: user.email, role: user.role };
}

// Sessão bruta (para saber se um admin está "vendo como" outro usuário)
export async function getRawSession() {
  return getSession();
}

// ---- Administração: usuários e log de atividades ----
export async function getAllUsers() {
  return db.user.findMany({
    orderBy: { createdAt: "asc" },
    select: { id: true, name: true, email: true, role: true, createdAt: true },
  });
}

export async function getActivityLogs(opts: {
  limit?: number;
  allUsers?: boolean;
  filterUserId?: string;
} = {}) {
  const userId = await requireUserId();
  const isAdmin = (await getSession())?.user.role === "admin";
  const where =
    opts.allUsers && isAdmin
      ? opts.filterUserId
        ? { userId: opts.filterUserId }
        : {}
      : { userId };
  return db.activityLog.findMany({
    where,
    include: { user: { select: { name: true, email: true } } },
    orderBy: { createdAt: "desc" },
    take: opts.limit ?? 200,
  });
}

export function iniciaisDoNome(nome: string): string {
  const partes = nome.trim().split(/\s+/).filter(Boolean);
  if (partes.length === 0) return "?";
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase();
  return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase();
}

export type TxFilter = {
  year: number;
  month?: number; // 1-12; ausente = ano todo
  day?: number; // 1-31
  kind?: "receita" | "despesa";
  status?: "pago" | "pendente";
  q?: string; // busca por texto na descrição
  accountId?: string;
  creditCardId?: string;
  tag?: string; // etiqueta (contém)
};

// ---- Intervalo de datas a partir do filtro ----
function dateRange(f: TxFilter) {
  if (f.month && f.day) {
    const start = new Date(f.year, f.month - 1, f.day);
    const end = new Date(f.year, f.month - 1, f.day + 1);
    return { start, end };
  }
  if (f.month) {
    const start = new Date(f.year, f.month - 1, 1);
    const end = new Date(f.year, f.month, 1);
    return { start, end };
  }
  return { start: new Date(f.year, 0, 1), end: new Date(f.year + 1, 0, 1) };
}

function whereFromFilter(f: TxFilter) {
  const { start, end } = dateRange(f);
  return {
    date: { gte: start, lt: end },
    ...(f.kind ? { kind: f.kind } : {}),
    ...(f.status ? { status: f.status } : {}),
    ...(f.q ? { description: { contains: f.q } } : {}),
    ...(f.accountId ? { accountId: f.accountId } : {}),
    ...(f.creditCardId ? { creditCardId: f.creditCardId } : {}),
    ...(f.tag ? { tags: { contains: f.tag } } : {}),
  };
}

// ---- Metas de economia ----
export async function getGoals() {
  const userId = await requireUserId();
  const db = scopedDb(userId);
  return db.goal.findMany({ orderBy: { createdAt: "asc" } });
}

// ---- Contas a vencer (pendentes) — compras do cartão viram 1 fatura ----
export type ItemVencer = {
  id: string;
  tipo: "conta" | "fatura";
  description: string;
  amount: number;
  kind: string; // receita | despesa
  date: Date;
  detalhe: string | null; // nome da conta/cartão ou "A pagar/receber"
  accountId: string | null; // conta: de onde sai/entra
  cardId: string | null; // fatura: cartão
  pagavelAgora: boolean; // fatura vigente (pagável pela fatura atual)
};

export async function getContasAVencer(limit = 8): Promise<ItemVencer[]> {
  const userId = await requireUserId();
  const db = scopedDb(userId);
  const pend = await db.transaction.findMany({
    where: { status: "pendente", isTransfer: false },
    include: { account: true, creditCard: true },
    orderBy: { date: "asc" },
  });

  const now = new Date();
  const fimMesAtual = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  const contas: ItemVencer[] = [];
  const faturas = new Map<string, ItemVencer>();
  for (const t of pend) {
    if (t.creditCardId && t.creditCard) {
      // agrupa por cartão + mês da fatura
      const key = `${t.creditCardId}-${t.date.getFullYear()}-${t.date.getMonth()}`;
      const existente = faturas.get(key);
      if (existente) {
        existente.amount += t.amount;
      } else {
        faturas.set(key, {
          id: key,
          tipo: "fatura",
          description: `Fatura ${t.creditCard.name}`,
          amount: t.amount,
          kind: "despesa",
          date: t.date,
          detalhe: t.creditCard.name,
          accountId: null,
          cardId: t.creditCardId,
          pagavelAgora: t.date < fimMesAtual, // fatura vigente/vencida
        });
      }
    } else {
      contas.push({
        id: t.id,
        tipo: "conta",
        description: t.description,
        amount: t.amount,
        kind: t.kind,
        date: t.date,
        detalhe: t.account?.name ?? (t.kind === "receita" ? "A receber" : "A pagar"),
        accountId: t.accountId,
        cardId: null,
        pagavelAgora: false,
      });
    }
  }

  return [...contas, ...faturas.values()]
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .slice(0, limit);
}

// ---- Fluxo de caixa projetado (próximos N meses) ----
export async function getFluxoProjetado(monthsAhead = 6) {
  const userId = await requireUserId();
  const db = scopedDb(userId);
  const now = new Date();
  const accounts = await getAccountsWithBalance();
  const patrimonio = accounts.reduce((s, a) => s + a.saldo, 0);

  const end = new Date(now.getFullYear(), now.getMonth() + monthsAhead, 1);
  const pend = await db.transaction.findMany({
    where: { status: "pendente", isTransfer: false, date: { lt: end } },
    select: { date: true, kind: true, amount: true },
  });

  const buckets = Array.from({ length: monthsAhead }, () => ({ entradas: 0, saidas: 0 }));
  for (const t of pend) {
    let off = (t.date.getFullYear() - now.getFullYear()) * 12 + (t.date.getMonth() - now.getMonth());
    if (off < 0) off = 0; // atrasados entram no mês atual
    if (off >= monthsAhead) continue;
    if (t.kind === "receita") buckets[off].entradas += t.amount;
    else buckets[off].saidas += t.amount;
  }

  let acc = patrimonio;
  const meses = buckets.map((b, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
    acc += b.entradas - b.saidas;
    return {
      label: `${MESES[d.getMonth()].slice(0, 3)}/${d.getFullYear()}`,
      mesNome: `${MESES[d.getMonth()]} de ${d.getFullYear()}`,
      entradas: b.entradas,
      saidas: b.saidas,
      saldoMes: b.entradas - b.saidas,
      projetado: acc,
    };
  });
  return { patrimonio, meses };
}

// ---- Parse dos filtros vindos da URL ----
export function parseTxFilter(
  sp: Record<string, string | string[] | undefined>,
  fallbackYear: number,
  fallbackMonth?: number
): TxFilter {
  const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
  const year = parseInt(one(sp.year) ?? "", 10) || fallbackYear;
  // "all" = ano inteiro; ausente = mês padrão (fallbackMonth); número = aquele mês
  const monthRaw = one(sp.month);
  let month: number | undefined;
  if (monthRaw === "all") month = undefined;
  else if (monthRaw) {
    const m = parseInt(monthRaw, 10);
    month = m >= 1 && m <= 12 ? m : fallbackMonth;
  } else month = fallbackMonth;
  const day = month && one(sp.day) ? parseInt(one(sp.day)!, 10) : undefined;
  const kindRaw = one(sp.kind);
  const statusRaw = one(sp.status);
  const q = one(sp.q)?.trim();
  const accountId = one(sp.account)?.trim();
  const creditCardId = one(sp.card)?.trim();
  const tag = one(sp.tag)?.trim();
  return {
    year,
    month: month && month >= 1 && month <= 12 ? month : undefined,
    day,
    kind: kindRaw === "receita" || kindRaw === "despesa" ? kindRaw : undefined,
    status: statusRaw === "pago" || statusRaw === "pendente" ? statusRaw : undefined,
    q: q || undefined,
    accountId: accountId || undefined,
    creditCardId: creditCardId || undefined,
    tag: tag || undefined,
  };
}

// ---- Recorrentes / fixas ----
function lastDayOfMonth(year: number, month: number) {
  return new Date(year, month, 0).getDate();
}

type RecLike = {
  frequency: string;
  dayOfMonth: number;
  dayOfWeek: number | null;
  month: number | null;
};

// Datas de ocorrência de uma recorrente no intervalo (start, end].
function ocorrencias(r: RecLike, start: Date, end: Date): Date[] {
  const res: Date[] = [];
  const push = (d: Date) => {
    if (d > start && d <= end) res.push(d);
  };

  if (r.frequency === "semanal") {
    const alvo = r.dayOfWeek ?? 0;
    const d = new Date(start.getFullYear(), start.getMonth(), start.getDate(), 12);
    while (d.getDay() !== alvo) d.setDate(d.getDate() + 1);
    for (let i = 0; d <= end && i < 120; i++) {
      push(new Date(d));
      d.setDate(d.getDate() + 7);
    }
  } else if (r.frequency === "quinzenal") {
    // Duas ocorrências por mês: dia X e dia X+15.
    let y = start.getFullYear();
    let m = start.getMonth();
    for (let i = 0; i < 60; i++) {
      if (new Date(y, m, 1) > end) break;
      const last = lastDayOfMonth(y, m + 1);
      const d1 = Math.min(r.dayOfMonth, last);
      push(new Date(y, m, d1, 12));
      const d2 = Math.min(r.dayOfMonth + 15, last);
      if (d2 !== d1) push(new Date(y, m, d2, 12));
      m++;
      if (m > 11) {
        m = 0;
        y++;
      }
    }
  } else if (
    r.frequency === "anual" ||
    r.frequency === "trimestral" ||
    r.frequency === "semestral"
  ) {
    // Passo em meses a partir do mês âncora (r.month).
    const passo = r.frequency === "anual" ? 12 : r.frequency === "semestral" ? 6 : 3;
    let y = start.getFullYear() - 1;
    let m = (r.month ?? 1) - 1;
    for (let i = 0; i < 300; i++) {
      if (new Date(y, m, 1) > end) break;
      const dia = Math.min(r.dayOfMonth, lastDayOfMonth(y, m + 1));
      push(new Date(y, m, dia, 12));
      m += passo;
      while (m > 11) {
        m -= 12;
        y++;
      }
    }
  } else {
    // mensal
    let y = start.getFullYear();
    let m = start.getMonth();
    for (let i = 0; i < 60; i++) {
      if (new Date(y, m, 1) > end) break;
      const dia = Math.min(r.dayOfMonth, lastDayOfMonth(y, m + 1));
      push(new Date(y, m, dia, 12));
      m++;
      if (m > 11) {
        m = 0;
        y++;
      }
    }
  }
  return res.sort((a, b) => a.getTime() - b.getTime());
}

export async function getRecurrings() {
  const userId = await requireUserId();
  const db = scopedDb(userId);
  return db.recurring.findMany({
    include: { category: true, account: true, creditCard: true },
    orderBy: [{ kind: "asc" }, { createdAt: "asc" }],
  });
}

// Gera os lançamentos pendentes das recorrentes ativas até o fim do mês informado.
// Idempotente: `lastGenerated` guarda a data já coberta (respeita exclusões).
export async function materializeRecurring(month: number, year: number) {
  const userId = await requireUserId();
  const db = scopedDb(userId);
  const ativos = await db.recurring.findMany({ where: { active: true } });
  if (ativos.length === 0) return;

  const windowEnd = new Date(year, month, 0, 23, 59, 59); // último dia do mês
  const inicioMes = new Date(year, month - 1, 1, 0, 0, 0);

  for (const r of ativos) {
    // Ponto de partida: o que já foi gerado, ou o início do mês alvo.
    const start = r.lastGenerated
      ? new Date(Math.max(r.lastGenerated.getTime(), inicioMes.getTime() - 1))
      : new Date(inicioMes.getTime() - 1);
    if (start >= windowEnd) continue;

    const datas = ocorrencias(r, start, windowEnd);
    for (const date of datas) {
      await db.transaction.create({
        data: {
          userId,
          description: r.description,
          amount: r.amount,
          kind: r.kind,
          status: "pendente",
          date,
          categoryId: r.categoryId,
          accountId: r.accountId,
          creditCardId: r.creditCardId,
          recurringId: r.id,
        },
      });
    }
    await db.recurring.update({
      where: { id: r.id },
      data: { lastGenerated: windowEnd },
    });
  }
}

// ---- Listas simples para selects ----
export async function getAccounts() {
  const userId = await requireUserId();
  const db = scopedDb(userId);
  return db.account.findMany({ orderBy: { createdAt: "asc" } });
}
export async function getCreditCards() {
  const userId = await requireUserId();
  const db = scopedDb(userId);
  return db.creditCard.findMany({ orderBy: { createdAt: "asc" } });
}
export async function getCreditCardById(id: string) {
  const userId = await requireUserId();
  const db = scopedDb(userId);
  return db.creditCard.findUnique({ where: { id } });
}
export async function getCardTransactions(cardId: string) {
  const userId = await requireUserId();
  const db = scopedDb(userId);
  return db.transaction.findMany({
    where: { creditCardId: cardId },
    include: { category: true, account: true, creditCard: true },
    orderBy: [{ date: "desc" }, { createdAt: "desc" }],
  });
}
export async function getAccountById(id: string) {
  const userId = await requireUserId();
  const db = scopedDb(userId);
  return db.account.findUnique({ where: { id } });
}
export async function getAccountTransactions(accountId: string) {
  const userId = await requireUserId();
  const db = scopedDb(userId);
  return db.transaction.findMany({
    where: { accountId },
    include: { category: true, account: true, creditCard: true },
    orderBy: [{ date: "desc" }, { createdAt: "desc" }],
  });
}
export async function getCategories(kind?: "receita" | "despesa") {
  const userId = await requireUserId();
  const db = scopedDb(userId);
  return db.category.findMany({
    where: kind ? { kind } : {},
    orderBy: { name: "asc" },
  });
}

export async function getCategoriesWithCount() {
  const userId = await requireUserId();
  const db = scopedDb(userId);
  return db.category.findMany({
    include: { _count: { select: { transactions: true, recurrings: true } } },
    orderBy: [{ kind: "asc" }, { name: "asc" }],
  });
}

// ---- Anos disponíveis (para o filtro) ----
export async function getAvailableYears(): Promise<number[]> {
  const userId = await requireUserId();
  const db = scopedDb(userId);
  const [first, last] = await Promise.all([
    db.transaction.findFirst({ orderBy: { date: "asc" } }),
    db.transaction.findFirst({ orderBy: { date: "desc" } }),
  ]);
  const nowY = new Date().getFullYear();
  const startY = first ? first.date.getFullYear() : nowY;
  const endY = Math.max(last ? last.date.getFullYear() : nowY, nowY);
  const years: number[] = [];
  for (let y = endY; y >= Math.min(startY, nowY); y--) years.push(y);
  return years;
}

// ---- Transações filtradas ----
export async function listTransactions(f: TxFilter) {
  const userId = await requireUserId();
  const db = scopedDb(userId);
  return db.transaction.findMany({
    where: whereFromFilter(f),
    include: { category: true, account: true, creditCard: true },
    orderBy: [{ date: "desc" }, { createdAt: "desc" }],
  });
}

// ---- Resumo do período ----
export async function getSummary(f: TxFilter) {
  const userId = await requireUserId();
  const db = scopedDb(userId);
  const txs = await db.transaction.findMany({
    where: { ...whereFromFilter(f), isTransfer: false },
  });
  let receitas = 0;
  let despesas = 0;
  let receitasPendentes = 0;
  let despesasPendentes = 0;
  for (const t of txs) {
    if (t.kind === "receita") {
      if (t.status === "pago") receitas += t.amount;
      else receitasPendentes += t.amount;
    } else {
      if (t.status === "pago") despesas += t.amount;
      else despesasPendentes += t.amount;
    }
  }
  return {
    receitas,
    despesas,
    receitasPendentes,
    despesasPendentes,
    saldo: receitas - despesas,
    total: txs.length,
  };
}

// ---- Saldo real por conta (all-time, apenas pagos) ----
export async function getAccountsWithBalance() {
  const userId = await requireUserId();
  const db = scopedDb(userId);
  const accounts = await db.account.findMany({ orderBy: { createdAt: "asc" } });
  const txs = await db.transaction.findMany({
    where: { status: "pago", accountId: { not: null } },
    select: { accountId: true, kind: true, amount: true },
  });
  return accounts.map((a) => {
    let saldo = a.initialBalance;
    for (const t of txs) {
      if (t.accountId !== a.id) continue;
      saldo += t.kind === "receita" ? t.amount : -t.amount;
    }
    return { ...a, saldo };
  });
}

// ---- Uso dos cartões (fatura do período + limite comprometido) ----
export async function getCreditCardsWithUsage(f: TxFilter) {
  const userId = await requireUserId();
  const db = scopedDb(userId);
  const cards = await db.creditCard.findMany({ orderBy: { createdAt: "asc" } });
  const { start, end } = dateRange(f);
  const [periodo, pendentes, aPagarTxs] = await Promise.all([
    // Fatura do período (mês selecionado)
    db.transaction.findMany({
      where: { kind: "despesa", creditCardId: { not: null }, date: { gte: start, lt: end } },
      select: { creditCardId: true, amount: true },
    }),
    // Em aberto = tudo que ainda não foi pago (inclui parcelas futuras) → compromete o limite
    db.transaction.findMany({
      where: { kind: "despesa", creditCardId: { not: null }, status: "pendente" },
      select: { creditCardId: true, amount: true },
    }),
    // Fatura a pagar agora = pendentes com vencimento até o fim do período
    db.transaction.findMany({
      where: {
        kind: "despesa",
        creditCardId: { not: null },
        status: "pendente",
        date: { lt: end },
      },
      select: { creditCardId: true, amount: true },
    }),
  ]);
  const soma = (arr: { creditCardId: string | null; amount: number }[], id: string) =>
    arr.filter((t) => t.creditCardId === id).reduce((s, t) => s + t.amount, 0);
  return cards.map((c) => {
    const emAberto = soma(pendentes, c.id);
    return {
      ...c,
      fatura: soma(periodo, c.id),
      emAberto,
      aPagar: soma(aPagarTxs, c.id),
      disponivel: Math.max(c.limit - emAberto, 0),
    };
  });
}

// ---- Agrupamentos para gráficos ----
type Group = { nome: string; valor: number; fill: string };

async function groupBy(
  f: TxFilter,
  kind: "receita" | "despesa",
  by: "category" | "account" | "creditCard"
): Promise<Group[]> {
  const userId = await requireUserId();
  const db = scopedDb(userId);
  const txs = await db.transaction.findMany({
    where: { ...whereFromFilter({ ...f, kind }), kind, isTransfer: false },
    include: { category: true, account: true, creditCard: true },
  });
  const map = new Map<string, Group>();
  for (const t of txs) {
    const ref = t[by];
    const nome = ref?.name ?? (by === "creditCard" ? "Sem cartão" : by === "account" ? "Sem conta" : "Sem categoria");
    const fill = ref?.color ?? "var(--color-muted-foreground)";
    if (by === "creditCard" && !t.creditCardId) continue; // cartão só conta lançamentos no cartão
    const cur = map.get(nome);
    if (cur) cur.valor += t.amount;
    else map.set(nome, { nome, valor: t.amount, fill });
  }
  return [...map.values()].sort((a, b) => b.valor - a.valor);
}

export const getDespesasPorCategoria = (f: TxFilter) => groupBy(f, "despesa", "category");
export const getReceitasPorCategoria = (f: TxFilter) => groupBy(f, "receita", "category");
export const getDespesasPorConta = (f: TxFilter) => groupBy(f, "despesa", "account");
export const getReceitasPorConta = (f: TxFilter) => groupBy(f, "receita", "account");
export const getDespesasPorCartao = (f: TxFilter) => groupBy(f, "despesa", "creditCard");

// ---- Por categoria separando pago x pendente ----
export type CategoriaStatus = {
  nome: string;
  fill: string;
  pago: number;
  pendente: number;
  total: number;
};

export async function getCategoriaStatusBreakdown(
  f: TxFilter,
  kind: "receita" | "despesa"
): Promise<CategoriaStatus[]> {
  const userId = await requireUserId();
  const db = scopedDb(userId);
  const txs = await db.transaction.findMany({
    where: { ...whereFromFilter({ ...f, kind }), kind, isTransfer: false },
    include: { category: true },
  });
  const map = new Map<string, CategoriaStatus>();
  for (const t of txs) {
    const nome = t.category?.name ?? "Sem categoria";
    const fill = t.category?.color ?? "var(--color-muted-foreground)";
    let e = map.get(nome);
    if (!e) {
      e = { nome, fill, pago: 0, pendente: 0, total: 0 };
      map.set(nome, e);
    }
    if (t.status === "pago") e.pago += t.amount;
    else e.pendente += t.amount;
    e.total += t.amount;
  }
  return [...map.values()].sort((a, b) => b.total - a.total);
}

// ---- Fluxo mensal do ano (barras) ----
export async function getFluxoMensal(year: number) {
  const userId = await requireUserId();
  const db = scopedDb(userId);
  const txs = await db.transaction.findMany({
    where: {
      date: { gte: new Date(year, 0, 1), lt: new Date(year + 1, 0, 1) },
      status: "pago",
      isTransfer: false,
    },
    select: { date: true, kind: true, amount: true },
  });
  const meses = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
  const data = meses.map((mes) => ({ mes, receitas: 0, despesas: 0 }));
  for (const t of txs) {
    const i = t.date.getMonth();
    if (t.kind === "receita") data[i].receitas += t.amount;
    else data[i].despesas += t.amount;
  }
  return data;
}

// ---- Evolução do saldo acumulado no ano (realizado + previsto c/ pendentes) ----
export async function getEvolucaoSaldo(year: number) {
  const userId = await requireUserId();
  const db = scopedDb(userId);
  const accountsInit = await db.account.aggregate({ _sum: { initialBalance: true } });
  const inicial = await db.transaction.findMany({
    where: { date: { lt: new Date(year, 0, 1) }, status: "pago", isTransfer: false },
    select: { kind: true, amount: true },
  });
  let base = accountsInit._sum.initialBalance ?? 0;
  for (const t of inicial) base += t.kind === "receita" ? t.amount : -t.amount;

  // Fluxo do ano: pago e total (pago+pendente), sem transferências
  const txs = await db.transaction.findMany({
    where: {
      date: { gte: new Date(year, 0, 1), lt: new Date(year + 1, 0, 1) },
      isTransfer: false,
    },
    select: { date: true, kind: true, amount: true, status: true },
  });
  const meses = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
  const pago = meses.map(() => 0);
  const todos = meses.map(() => 0);
  for (const t of txs) {
    const i = t.date.getMonth();
    const delta = t.kind === "receita" ? t.amount : -t.amount;
    todos[i] += delta;
    if (t.status === "pago") pago[i] += delta;
  }

  let accPago = base;
  let accPrev = base;
  return meses.map((mes, i) => {
    accPago += pago[i];
    accPrev += todos[i];
    return { mes, saldo: accPago, previsto: accPrev };
  });
}

// ---- Retrato financeiro do mês (para o simulador "Posso comprar?") ----
export type SaudeFinanceira = {
  disponivel: number; // soma dos saldos das contas
  aVencer: number; // despesas pendentes até o fim do mês
  saldoLivre: number; // disponivel - aVencer
  rendaMes: number; // receitas do mês (pagas + pendentes)
  categorias: {
    categoryId: string;
    nome: string;
    limite: number;
    gasto: number;
    restante: number;
  }[];
};

export async function getSaudeFinanceira(): Promise<SaudeFinanceira> {
  const userId = await requireUserId();
  const db = scopedDb(userId);
  const now = new Date();
  const mInicio = new Date(now.getFullYear(), now.getMonth(), 1);
  const fimMes = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const [contas, pend, resumo, budgetsRaw, despMes] = await Promise.all([
    getAccountsWithBalance(),
    db.transaction.aggregate({
      _sum: { amount: true },
      where: { kind: "despesa", status: "pendente", isTransfer: false, date: { lt: fimMes } },
    }),
    getSummary({ year: now.getFullYear(), month: now.getMonth() + 1 }),
    db.budget.findMany({
      where: { month: now.getMonth() + 1, year: now.getFullYear(), categoryId: { not: null } },
      include: { category: true },
    }),
    db.transaction.findMany({
      where: { kind: "despesa", isTransfer: false, date: { gte: mInicio, lt: fimMes } },
      select: { amount: true, categoryId: true },
    }),
  ]);
  const disponivel = contas.reduce((s, a) => s + a.saldo, 0);
  const aVencer = pend._sum.amount ?? 0;
  const rendaMes = resumo.receitas + resumo.receitasPendentes;

  const gastoPorCat = new Map<string, number>();
  for (const t of despMes) {
    if (!t.categoryId) continue;
    gastoPorCat.set(t.categoryId, (gastoPorCat.get(t.categoryId) ?? 0) + t.amount);
  }
  const categorias = budgetsRaw
    .filter((b) => b.categoryId)
    .map((b) => {
      const gasto = gastoPorCat.get(b.categoryId!) ?? 0;
      return {
        categoryId: b.categoryId!,
        nome: b.category?.name ?? "?",
        limite: b.amount,
        gasto,
        restante: Math.max(b.amount - gasto, 0),
      };
    });

  return { disponivel, aVencer, saldoLivre: disponivel - aVencer, rendaMes, categorias };
}

// ---- Etiquetas (tags) existentes ----
export async function getAllTags(): Promise<string[]> {
  const userId = await requireUserId();
  const db = scopedDb(userId);
  const rows = await db.transaction.findMany({
    where: { tags: { not: "" } },
    select: { tags: true },
  });
  const set = new Set<string>();
  for (const r of rows) {
    for (const t of r.tags.split(",")) {
      const tag = t.trim();
      if (tag) set.add(tag);
    }
  }
  return [...set].sort((a, b) => a.localeCompare(b));
}

// ---- Evolução mensal por categoria (linhas) ----
export type SerieCategoria = { nome: string; fill: string; valores: number[] };

export async function getCategoriaEvolucao(
  year: number,
  kind: "receita" | "despesa"
): Promise<{ meses: string[]; series: SerieCategoria[] }> {
  const userId = await requireUserId();
  const db = scopedDb(userId);
  const txs = await db.transaction.findMany({
    where: {
      kind,
      isTransfer: false,
      date: { gte: new Date(year, 0, 1), lt: new Date(year + 1, 0, 1) },
    },
    include: { category: true },
  });
  const meses = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
  const map = new Map<string, SerieCategoria>();
  for (const t of txs) {
    const nome = t.category?.name ?? "Sem categoria";
    const fill = t.category?.color ?? "var(--color-muted-foreground)";
    let s = map.get(nome);
    if (!s) {
      s = { nome, fill, valores: meses.map(() => 0) };
      map.set(nome, s);
    }
    s.valores[t.date.getMonth()] += t.amount;
  }
  const series = [...map.values()].sort(
    (a, b) => b.valores.reduce((x, y) => x + y, 0) - a.valores.reduce((x, y) => x + y, 0)
  );
  return { meses, series };
}

// ---- Comparativo de dois meses por categoria ----
export type LinhaComparativo = {
  nome: string;
  fill: string;
  valorA: number;
  valorB: number;
  variacao: number | null; // % de A→B (null se A=0)
};

export async function getComparativoMeses(
  a: { month: number; year: number },
  b: { month: number; year: number },
  kind: "receita" | "despesa"
): Promise<LinhaComparativo[]> {
  const userId = await requireUserId();
  const db = scopedDb(userId);
  const [txsA, txsB] = await Promise.all([
    db.transaction.findMany({
      where: { ...whereFromFilter({ ...a, kind }), kind, isTransfer: false },
      include: { category: true },
    }),
    db.transaction.findMany({
      where: { ...whereFromFilter({ ...b, kind }), kind, isTransfer: false },
      include: { category: true },
    }),
  ]);
  const map = new Map<string, LinhaComparativo>();
  const acc = (txs: typeof txsA, campo: "valorA" | "valorB") => {
    for (const t of txs) {
      const nome = t.category?.name ?? "Sem categoria";
      const fill = t.category?.color ?? "var(--color-muted-foreground)";
      let l = map.get(nome);
      if (!l) {
        l = { nome, fill, valorA: 0, valorB: 0, variacao: null };
        map.set(nome, l);
      }
      l[campo] += t.amount;
    }
  };
  acc(txsA, "valorA");
  acc(txsB, "valorB");
  const linhas = [...map.values()].map((l) => ({
    ...l,
    variacao: l.valorA > 0 ? ((l.valorB - l.valorA) / l.valorA) * 100 : null,
  }));
  return linhas.sort((x, y) => y.valorB + y.valorA - (x.valorB + x.valorA));
}

// ---- Mês anterior (para comparação) ----
export function prevMonth(month: number, year: number) {
  return month === 1 ? { month: 12, year: year - 1 } : { month: month - 1, year };
}

export type Insight = {
  kind: "budget" | "card" | "trend" | "pending" | "top";
  tone: "warning" | "info" | "positive";
  titulo: string;
  descricao: string;
};

// ---- Insights / alertas para melhor controle ----
export async function getInsights(month: number, year: number): Promise<Insight[]> {
  const userId = await requireUserId();
  const db = scopedDb(userId);
  const insights: Insight[] = [];
  const now = new Date();
  const ehMesAtual = now.getMonth() + 1 === month && now.getFullYear() === year;

  const [budgets, cartoes, atual, topCat] = await Promise.all([
    getBudgets(month, year),
    getCreditCardsWithUsage({ year, month }),
    getSummary({ year, month }),
    getDespesasPorCategoria({ year, month }),
  ]);
  const anterior = prevMonth(month, year);
  const resumoAnt = await getSummary({ year: anterior.year, month: anterior.month });

  // Saldo disponível x contas a pagar até o fim do mês (só no mês corrente)
  if (ehMesAtual) {
    const fimMes = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const [saldos, devidoAgg] = await Promise.all([
      getAccountsWithBalance(),
      db.transaction.aggregate({
        _sum: { amount: true },
        where: {
          kind: "despesa",
          status: "pendente",
          isTransfer: false,
          date: { lt: fimMes },
        },
      }),
    ]);
    const disponivel = saldos.reduce((s, a) => s + a.saldo, 0);
    const devido = devidoAgg._sum.amount ?? 0;
    if (devido > 0 && devido > disponivel) {
      insights.push({
        kind: "pending",
        tone: "warning",
        titulo: "Saldo pode não cobrir as contas do mês",
        descricao: `${brl(devido)} a pagar até o fim do mês, mas só ${brl(
          disponivel
        )} disponível — faltam ${brl(devido - disponivel)}.`,
      });
    }
  }

  // Orçamentos estourados ou perto do limite
  for (const b of budgets) {
    if (b.pct >= 100) {
      insights.push({
        kind: "budget",
        tone: "warning",
        titulo: b.isTotal ? "Orçamento do mês estourado" : `Orçamento de ${b.nome} estourado`,
        descricao: `Você gastou ${brl(b.gasto)} de ${brl(b.limite)} (${b.pct}%).`,
      });
    } else if (b.pct >= 80) {
      insights.push({
        kind: "budget",
        tone: "info",
        titulo: b.isTotal ? "Orçamento do mês quase no limite" : `${b.nome} quase no limite`,
        descricao: `${b.pct}% usado — restam ${brl(b.limite - b.gasto)}.`,
      });
    }
  }

  // Faturas de cartão
  for (const c of cartoes) {
    if (c.fatura <= 0) continue;
    let tone: Insight["tone"] = "info";
    let quando = `vence dia ${c.dueDay}`;
    if (ehMesAtual) {
      const dias = c.dueDay - now.getDate();
      if (dias >= 0 && dias <= 7) {
        tone = "warning";
        quando = dias === 0 ? "vence hoje" : `vence em ${dias} dia(s)`;
      } else if (dias < 0) {
        quando = `venceu dia ${c.dueDay}`;
      }
    }
    insights.push({
      kind: "card",
      tone,
      titulo: `Fatura do ${c.name}`,
      descricao: `${brl(c.fatura)} — ${quando}.`,
    });
  }

  // Comparação de despesas com o mês anterior
  if (resumoAnt.despesas > 0) {
    const variacao = ((atual.despesas - resumoAnt.despesas) / resumoAnt.despesas) * 100;
    const mesAnt = MESES[anterior.month - 1];
    if (variacao > 5) {
      insights.push({
        kind: "trend",
        tone: "warning",
        titulo: `Gastos ${variacao.toFixed(0)}% acima de ${mesAnt}`,
        descricao: `${brl(atual.despesas)} vs. ${brl(resumoAnt.despesas)} no mês anterior.`,
      });
    } else if (variacao < -5) {
      insights.push({
        kind: "trend",
        tone: "positive",
        titulo: `Gastos ${Math.abs(variacao).toFixed(0)}% abaixo de ${mesAnt}`,
        descricao: `${brl(atual.despesas)} vs. ${brl(resumoAnt.despesas)} no mês anterior.`,
      });
    }
  }

  // Maior categoria de despesa
  if (topCat.length > 0 && atual.despesas > 0) {
    const top = topCat[0];
    const perc = Math.round((top.valor / atual.despesas) * 100);
    insights.push({
      kind: "top",
      tone: "info",
      titulo: `Maior gasto: ${top.nome}`,
      descricao: `${brl(top.valor)} — ${perc}% das suas despesas do mês.`,
    });
  }

  // Pendências
  const pend = atual.despesasPendentes + atual.receitasPendentes;
  if (pend > 0) {
    insights.push({
      kind: "pending",
      tone: "info",
      titulo: "Lançamentos pendentes",
      descricao: `${brl(atual.despesasPendentes)} a pagar e ${brl(atual.receitasPendentes)} a receber.`,
    });
  }

  // Ordena: warning > info/positive
  const rank = { warning: 0, positive: 1, info: 2 };
  return insights.sort((a, b) => rank[a.tone] - rank[b.tone]).slice(0, 6);
}

function brl(v: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);
}

// ---- Orçamentos do mês com gasto real ----
export async function getBudgets(month: number, year: number) {
  const userId = await requireUserId();
  const db = scopedDb(userId);
  const budgets = await db.budget.findMany({
    where: { month, year },
    include: { category: true },
  });
  const despesas = await db.transaction.findMany({
    where: {
      kind: "despesa",
      isTransfer: false,
      date: { gte: new Date(year, month - 1, 1), lt: new Date(year, month, 1) },
    },
    select: { amount: true, categoryId: true },
  });
  const totalGasto = despesas.reduce((s, t) => s + t.amount, 0);
  const gastoPorCat = new Map<string, number>();
  for (const t of despesas) {
    if (!t.categoryId) continue;
    gastoPorCat.set(t.categoryId, (gastoPorCat.get(t.categoryId) ?? 0) + t.amount);
  }
  return budgets
    .map((b) => {
      const gasto = b.categoryId ? gastoPorCat.get(b.categoryId) ?? 0 : totalGasto;
      const pct = b.amount > 0 ? Math.min(Math.round((gasto / b.amount) * 100), 999) : 0;
      return {
        id: b.id,
        nome: b.category?.name ?? "Orçamento total do mês",
        isTotal: !b.categoryId,
        color: b.category?.color ?? "var(--color-primary)",
        limite: b.amount,
        gasto,
        pct,
      };
    })
    .sort((a, b) => Number(b.isTotal) - Number(a.isTotal));
}

// ---- Carteira de FIIs ----
export async function getFiis() {
  const userId = await requireUserId();
  const db = scopedDb(userId);
  const fiis = await db.fii.findMany({
    include: { transactions: true, dividends: true },
    orderBy: { ticker: "asc" },
  });
  return fiis.map((f) => {
    const compras = f.transactions.filter((t) => t.kind !== "venda");
    const vendas = f.transactions.filter((t) => t.kind === "venda");
    const qtyComprada = compras.reduce((s, t) => s + t.quantity, 0);
    const qtyVendida = vendas.reduce((s, t) => s + t.quantity, 0);
    const quantidade = qtyComprada - qtyVendida;
    const totalComprado = compras.reduce((s, t) => s + t.quantity * t.price, 0);
    const precoMedio = qtyComprada > 0 ? totalComprado / qtyComprada : 0;
    const valorInvestido = quantidade * precoMedio;
    const valorAtual = quantidade * f.currentPrice;
    const totalDividendos = f.dividends.reduce((s, d) => s + d.amount, 0);
    return {
      id: f.id,
      ticker: f.ticker,
      name: f.name,
      color: f.color,
      currentPrice: f.currentPrice,
      priceUpdatedAt: f.priceUpdatedAt,
      dy: f.dy,
      pvp: f.pvp,
      quantidade,
      precoMedio,
      valorInvestido,
      valorAtual,
      lucro: valorAtual - valorInvestido,
      totalDividendos,
    };
  });
}

export async function getFiiById(id: string) {
  const userId = await requireUserId();
  const db = scopedDb(userId);
  const f = await db.fii.findUnique({
    where: { id },
    include: {
      transactions: { orderBy: { date: "desc" } },
      dividends: { orderBy: { date: "desc" } },
    },
  });
  if (!f) return null;
  const compras = f.transactions.filter((t) => t.kind !== "venda");
  const vendas = f.transactions.filter((t) => t.kind === "venda");
  const qtyComprada = compras.reduce((s, t) => s + t.quantity, 0);
  const qtyVendida = vendas.reduce((s, t) => s + t.quantity, 0);
  const quantidade = qtyComprada - qtyVendida;
  const totalComprado = compras.reduce((s, t) => s + t.quantity * t.price, 0);
  const precoMedio = qtyComprada > 0 ? totalComprado / qtyComprada : 0;
  const valorInvestido = quantidade * precoMedio;
  const valorAtual = quantidade * f.currentPrice;
  const totalDividendos = f.dividends.reduce((s, d) => s + d.amount, 0);
  return {
    ...f,
    quantidade,
    precoMedio,
    valorInvestido,
    valorAtual,
    lucro: valorAtual - valorInvestido,
    totalDividendos,
  };
}
