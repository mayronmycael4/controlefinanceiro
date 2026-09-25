import "server-only";

import { db } from "@/lib/db";
import { fetchFiiDividendEvents, isIncomeDistribution, parseBrapiDate } from "@/lib/fii-dividend-source";

type Transaction = { kind: string; quantity: number; date: Date };
type FiiWithTransactions = {
  id: string;
  ticker: string;
  userId: string;
  transactions: Transaction[];
};

function positionOnDate(transactions: Transaction[], referenceDate: Date) {
  return transactions.reduce((total, transaction) => {
    if (transaction.date > referenceDate) return total;
    return total + (transaction.kind === "venda" ? -transaction.quantity : transaction.quantity);
  }, 0);
}

/**
 * Registra somente eventos ainda inexistentes, calculando o total pela posição
 * na data-com (lastDatePrior) em vez da posição atual da carteira.
 */
export async function syncFiiDividendsFor(fiis: FiiWithTransactions[]) {
  if (!fiis.length) return { imported: 0 };

  const earliestTransaction = fiis.flatMap((fii) => fii.transactions.map((transaction) => transaction.date)).sort((a, b) => a.getTime() - b.getTime())[0];
  const startDate = (earliestTransaction ?? new Date(Date.now() - 5 * 366 * 86_400_000)).toISOString().slice(0, 10);
  const dividends = await fetchFiiDividendEvents(
    fiis.map((fii) => fii.ticker),
    startDate,
    new Date(Date.now() + 120 * 86_400_000).toISOString().slice(0, 10)
  );
  let imported = 0;

  for (const fii of fiis) {
    const list = dividends.get(fii.ticker.toUpperCase()) ?? [];

    for (const item of list) {
      if (!isIncomeDistribution(item) || !item.paymentDate || !item.rate || item.rate <= 0) continue;
      const paymentDate = parseBrapiDate(item.paymentDate);
      const entitlementDate = parseBrapiDate(item.lastDatePrior ?? item.paymentDate, true);
      if (!paymentDate || !entitlementDate) continue;
      const quantity = positionOnDate(fii.transactions, entitlementDate);
      if (quantity <= 0) continue;

      const paymentDayStart = new Date(`${paymentDate.toISOString().slice(0, 10)}T00:00:00.000Z`);
      const paymentDayEnd = new Date(paymentDayStart.getTime() + 86_400_000);
      const existing = await db.fiiDividend.findFirst({
        where: {
          fiiId: fii.id,
          userId: fii.userId,
          date: { gte: paymentDayStart, lt: paymentDayEnd },
        },
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
