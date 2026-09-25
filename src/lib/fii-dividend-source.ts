import "server-only";

export type FiiDividendSourceEvent = {
  symbol?: string;
  rate?: number;
  paymentDate?: string | null;
  lastDatePrior?: string | null;
  label?: string | null;
  remarks?: string | null;
};

export function parseBrapiDate(value?: string | null, endOfDay = false) {
  const day = value?.match(/^(\d{4}-\d{2}-\d{2})/)?.[1];
  if (!day) return null;
  const parsed = new Date(`${day}T${endOfDay ? "23:59:59.999" : "12:00:00.000"}Z`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function asEvents(payload: unknown, symbol: string): FiiDividendSourceEvent[] {
  const dividends = (payload as { dividends?: FiiDividendSourceEvent[] | Record<string, FiiDividendSourceEvent[]> } | null)?.dividends;
  if (!dividends) return [];
  if (Array.isArray(dividends)) return dividends.filter((event) => event.symbol?.toUpperCase() === symbol);
  return dividends[symbol] ?? [];
}

async function requestEvents(symbols: string[], startDate: string, endDate: string) {
  const url = new URL("https://brapi.dev/api/v2/fii/dividends");
  url.searchParams.set("symbols", symbols.join(","));
  url.searchParams.set("startDate", startDate);
  url.searchParams.set("endDate", endDate);
  url.searchParams.set("sortBy", "paymentDate");
  url.searchParams.set("sortOrder", "asc");
  const headers: HeadersInit = {};
  if (process.env.BRAPI_TOKEN) headers.Authorization = `Bearer ${process.env.BRAPI_TOKEN}`;
  return fetch(url, { headers, cache: "no-store", signal: AbortSignal.timeout(12_000) });
}

/** Busca em lote quando autorizado; sem token, tenta cada ticker para que os
 * tickers gratuitos MXRF11/HGLG11 ainda retornem mesmo com outros FIIs na carteira. */
export async function fetchFiiDividendEvents(symbols: string[], startDate: string, endDate: string) {
  const result = new Map<string, FiiDividendSourceEvent[]>();
  const unique = [...new Set(symbols.map((symbol) => symbol.toUpperCase()))];
  for (let i = 0; i < unique.length; i += 20) {
    const batch = unique.slice(i, i + 20);
    try {
      const response = await requestEvents(batch, startDate, endDate);
      if (response.ok) {
        const payload = await response.json();
        for (const symbol of batch) result.set(symbol, asEvents(payload, symbol));
        continue;
      }
      if (process.env.BRAPI_TOKEN && response.status !== 401 && response.status !== 403) continue;
    } catch {
      // Tenta individualmente abaixo; falhas de um ativo não derrubam a carteira.
    }

    const individual: Array<[string, FiiDividendSourceEvent[]]> = await Promise.all(batch.map(async (symbol): Promise<[string, FiiDividendSourceEvent[]]> => {
      try {
        const response = await requestEvents([symbol], startDate, endDate);
        if (!response.ok) return [symbol, []];
        return [symbol, asEvents(await response.json(), symbol)];
      } catch {
        return [symbol, []];
      }
    }));
    for (const [symbol, events] of individual) result.set(symbol, events);
  }
  return result;
}

export function isIncomeDistribution(event: FiiDividendSourceEvent) {
  const label = event.label?.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase();
  return !label || label.includes("RENDIMENTO") || label.includes("DIVIDENDO");
}
