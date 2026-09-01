import { TrendingDown, TrendingUp } from "lucide-react";

import { DonutChart, FluxoBar, TendenciaLine } from "@/components/charts";
import { FiltroPeriodo } from "@/components/filtro-periodo";
import {
  getAvailableYears,
  getFluxoMensal,
  getDespesasPorCategoria,
  getDespesasPorConta,
  getDespesasPorCartao,
  getReceitasPorCategoria,
  getReceitasPorConta,
  type TxFilter,
} from "@/lib/queries";
import { MESES } from "@/lib/constants";

export default async function RelatoriosPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const anos = await getAvailableYears();
  const year = parseInt((sp.year as string) ?? "", 10) || anos[0] || new Date().getFullYear();
  const monthRaw = sp.month ? parseInt(sp.month as string, 10) : undefined;
  const month = monthRaw && monthRaw >= 1 && monthRaw <= 12 ? monthRaw : undefined;
  const filter: TxFilter = { year, month };

  const [fluxo, despCat, despConta, despCartao, recCat, recConta] =
    await Promise.all([
      getFluxoMensal(year),
      getDespesasPorCategoria(filter),
      getDespesasPorConta(filter),
      getDespesasPorCartao(filter),
      getReceitasPorCategoria(filter),
      getReceitasPorConta(filter),
    ]);

  const periodo = month ? `${MESES[month - 1]} de ${year}` : `Ano de ${year}`;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Relatórios</h1>
          <p className="text-muted-foreground">Análise de {periodo}.</p>
        </div>
        <FiltroPeriodo anos={anos} />
      </div>

      <TendenciaLine data={fluxo} />
      <FluxoBar data={fluxo} description={`Comparativo mensal — ${year}`} />

      {/* Despesas */}
      <div className="flex items-center gap-2 pt-2">
        <TrendingDown className="size-5 text-destructive" />
        <h2 className="text-lg font-semibold">Despesas — {periodo}</h2>
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <DonutChart title="Por Categoria" data={despCat} />
        <DonutChart title="Por Conta / Carteira" data={despConta} />
        <DonutChart title="Por Cartão de Crédito" data={despCartao} />
      </div>

      {/* Receitas */}
      <div className="flex items-center gap-2 pt-2">
        <TrendingUp className="size-5 text-emerald-600 dark:text-emerald-500" />
        <h2 className="text-lg font-semibold">Receitas — {periodo}</h2>
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <DonutChart title="Por Categoria" data={recCat} />
        <DonutChart title="Por Conta / Carteira" data={recConta} />
      </div>
    </div>
  );
}
