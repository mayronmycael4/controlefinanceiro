import Link from "next/link";
import { Wallet, TrendingUp, TrendingDown, PiggyBank } from "lucide-react";

import { StatCard } from "@/components/stat-card";
import { DonutChart, FluxoBar, SaldoArea } from "@/components/charts";
import { TransacoesTable } from "@/components/transacoes-table";
import { NovaTransacao } from "@/components/forms/nova-transacao";
import { InsightsPanel } from "@/components/insights-panel";
import { PrevisaoPanel } from "@/components/previsao-panel";
import { ContasAVencer } from "@/components/contas-a-vencer";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  getSummary,
  getDespesasPorCategoria,
  getFluxoMensal,
  getEvolucaoSaldo,
  listTransactions,
  getCategories,
  getAccounts,
  getCreditCards,
  getInsights,
  prevMonth,
  getBudgets,
  getAvailableYears,
  getContasAVencer,
  getAccountsWithBalance,
  materializeRecurring,
} from "@/lib/queries";
import { FiltroMesAno } from "@/components/filtro-mes-ano";
import { formatBRL } from "@/lib/format";
import { MESES } from "@/lib/constants";

function variacao(atual: number, anterior: number): number | undefined {
  if (!anterior) return undefined;
  return ((atual - anterior) / Math.abs(anterior)) * 100;
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const now = new Date();

  // Gera as recorrentes do mês atual (pendentes) — independente do mês visualizado.
  await materializeRecurring(now.getMonth() + 1, now.getFullYear());

  const anos = await getAvailableYears();
  const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
  const year = parseInt(one(sp.year) ?? "", 10) || now.getFullYear();
  const mParam = parseInt(one(sp.month) ?? "", 10);
  const month = mParam >= 1 && mParam <= 12 ? mParam : now.getMonth() + 1;
  const filter = { year, month };
  const anosSel = anos.includes(year) ? anos : [...anos, year].sort((a, b) => b - a);

  const anterior = prevMonth(month, year);

  const [
    summary,
    resumoAnt,
    insights,
    despCat,
    fluxo,
    saldoEvol,
    recentes,
    categorias,
    contas,
    cartoes,
    budgets,
    contasVencer,
    contasSaldo,
  ] = await Promise.all([
    getSummary(filter),
    getSummary({ year: anterior.year, month: anterior.month }),
    getInsights(month, year),
    getDespesasPorCategoria(filter),
    getFluxoMensal(year),
    getEvolucaoSaldo(year),
    listTransactions(filter),
    getCategories(),
    getAccounts(),
    getCreditCards(),
    getBudgets(month, year),
    getContasAVencer(6),
    getAccountsWithBalance(),
  ]);

  const orcamentoTotal = budgets.find((b) => b.isTotal)?.limite ?? 0;

  const economia = summary.receitas - summary.despesas;
  const economiaAnt = resumoAnt.receitas - resumoAnt.despesas;
  const mesAntLabel = `vs. ${MESES[anterior.month - 1].slice(0, 3).toLowerCase()}`;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Visão geral de {MESES[month - 1]} de {year}.
          </p>
          <div className="mt-2">
            <FiltroMesAno anos={anosSel} />
          </div>
        </div>
        <NovaTransacao categorias={categorias} contas={contas} cartoes={cartoes} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          titulo="Receitas do mês"
          valor={formatBRL(summary.receitas)}
          icon={TrendingUp}
          trend={variacao(summary.receitas, resumoAnt.receitas)}
          trendLabel={mesAntLabel}
          trendPositivaEhBoa
          tom="positivo"
          legenda={`${formatBRL(summary.receitasPendentes)} pendentes`}
        />
        <StatCard
          titulo="Despesas do mês"
          valor={formatBRL(summary.despesas)}
          icon={TrendingDown}
          trend={variacao(summary.despesas, resumoAnt.despesas)}
          trendLabel={mesAntLabel}
          trendPositivaEhBoa={false}
          tom="negativo"
          legenda={`${formatBRL(summary.despesasPendentes)} pendentes`}
        />
        <StatCard
          titulo="Saldo do mês"
          valor={formatBRL(economia)}
          icon={PiggyBank}
          trend={variacao(economia, economiaAnt)}
          trendLabel={mesAntLabel}
          trendPositivaEhBoa
          tom={economia >= 0 ? "positivo" : "negativo"}
          legenda={economia >= 0 ? "Você economizou" : "Gastou mais que ganhou"}
        />
        <StatCard
          titulo="Transações"
          valor={String(summary.total)}
          icon={Wallet}
          legenda="lançamentos no mês"
        />
      </div>

      <PrevisaoPanel
        mes={MESES[month - 1]}
        despesaPaga={summary.despesas}
        despesaPendente={summary.despesasPendentes}
        receitaPaga={summary.receitas}
        receitaPendente={summary.receitasPendentes}
        orcamentoTotal={orcamentoTotal}
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <InsightsPanel insights={insights} />
        <ContasAVencer
          itens={contasVencer}
          contas={contasSaldo.map((a) => ({ id: a.id, name: a.name, saldo: a.saldo }))}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-7">
        <FluxoBar data={fluxo} className="lg:col-span-4" />
        <DonutChart
          title="Despesas por Categoria"
          description={`${MESES[month - 1]} de ${year}`}
          data={despCat}
          className="lg:col-span-3"
        />
      </div>

      <SaldoArea data={saldoEvol} />

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Transações Recentes</CardTitle>
            <CardDescription>Últimas movimentações do mês</CardDescription>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link href="/transacoes">Ver todas</Link>
          </Button>
        </CardHeader>
        <CardContent>
          <TransacoesTable items={recentes.slice(0, 6)} showActions={false} />
        </CardContent>
      </Card>
    </div>
  );
}
