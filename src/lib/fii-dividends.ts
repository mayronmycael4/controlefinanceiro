import "server-only";

import { db } from "@/lib/db";

type Transaction = { kind: string; quantity: number; date: Date };
type FiiWithTransactions = {
  id: string;
  ticker: string;
  userId: string;
  transactions: Transaction[];
};

type DividendApiEvent = {
  symbol?: string;
  rate?: number;
  paymentDate?: string | null;
  lastDatePrior?: string | null;
};

function positionOnDate(transactions: Transaction[], referenceDate: Date) {
  return transactions.reduce((total, transaction) => {
    if (transaction.date > referenceDate) return total;
    return total + (transaction.kind === "venda" ? -transaction.quantity : transaction.quantity);
  }, 0);
}

async function fetchDividendEvents(symbols: string[]) {
  const url = new URL("https://brapi.dev/api/v2/fii/dividends");
  url.searchParams.set("symbols", symbols.join(","));
  url.searchParams.set("startDate", new Date(Date.now() - 366 * 86_400_000).toISOString().slice(0, 10));
  url.searchParams.set("endDate", new Date(Date.now() + 120 * 86_400_000).toISOString().slice(0, 10));
  url.searchParams.set("sortBy", "paymentDate");
  url.searchParams.set("sortOrder", "asc");

  const headers: HeadersInit = {};
  if (process.env.BRAPI_TOKEN) headers.Authorization = `Bearer ${process.env.BRAPI_TOKEN}`;
  const response = await fetch(url, {
    headers,
    cache: "no-store",
    signal: AbortSignal.timeout(15_000),
  });
  if (!response.ok) {
    throw new Error(
      response.status === 401 || response.status === 403
        ? "A fonte exige BRAPI_TOKEN para consultar todos os proventos."
        : `Fonte de proventos indisponível (${response.status}).`
    );
  }

  const payload = (await response.json()) as {
    dividends?: DividendApiEvent[] | Record<string, DividendApiEvent[]>;
  };
  return payload.dividends ?? [];
}

/**
 * Registra somente eventos ainda inexistentes, calculando o total pela posição
 * na data-com (lastDatePrior) em vez da posição atual da carteira.
 */
export async function syncFiiDividendsFor(fiis: FiiWithTransactions[]) {
  if (!fiis.length) return { imported: 0 };

  const dividends = await fetchDividendEvents(fiis.map((fii) => fii.ticker));
  let imported = 0;

  for (const fii of fiis) {
    const list = Array.isArray(dividends)
      ? dividends.filter((item) => item.symbol?.toUpperCase() === fii.ticker.toUpperCase())
      : dividends[fii.ticker] ?? [];

    for (const item of list) {
      const date = item.paymentDate ?? item.lastDatePrior;
      if (!date || !item.rate || item.rate <= 0) continue;

      const paymentDate = new Date(`${date}T12:00:00.000Z`);
      const entitlementDate = new Date(`${item.lastDatePrior ?? date}T23:59:59.999Z`);
      const quantity = positionOnDate(fii.transactions, entitlementDate);
      if (quantity <= 0) continue;

      const existing = await db.fiiDividend.findFirst({
        where: { fiiId: fii.id, userId: fii.userId, date: paymentDate },
      });
      // Lançamentos existentes podem ter sido conferidos manualmente pelo
      // usuário; sincronizar não deve sobrescrever valores já armazenados.
      if (existing) continue;

      const amount = Math.round(item.rate * quantity * 100) / 100;
      await db.fiiDividend.create({ data: { fiiId: fii.id, amount, date: paymentDate, userId: fii.userId } });
      imported++;
    }
  }

  return { imported };
}

export async function syncAllFiiDividends() {
  const fiis = await db.fii.findMany({ include: { transactions: true } });
  return syncFiiDividendsFor(fiis);
}

export async function syncUserFiiDividends(userId: string) {
  const fiis = await db.fii.findMany({ where: { userId }, include: { transactions: true } });
  return syncFiiDividendsFor(fiis);
}
