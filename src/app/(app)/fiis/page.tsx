import Link from "next/link";
import { Landmark, Wallet, TrendingUp, Coins } from "lucide-react";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { FiisView } from "@/components/fiis-view";
import { StatCard } from "@/components/stat-card";
import { FiiDialog } from "@/components/forms/novo-fii";
import { AtualizarTodosPrecosFii } from "@/components/forms/atualizar-preco-fii";
import { AtualizacaoAutomaticaFii } from "@/components/forms/atualizacao-automatica-fii";
import { getFiis } from "@/lib/queries";
import { formatBRL } from "@/lib/format";

export default async function FiisPage() {
  const fiis = await getFiis();

  const valorInvestido = fiis.reduce((s, f) => s + f.valorInvestido, 0);
  const valorAtual = fiis.reduce((s, f) => s + f.valorAtual, 0);
  const totalDividendos = fiis.reduce((s, f) => s + f.totalDividendos, 0);
  const lucro = valorAtual - valorInvestido;
  const lucroRealizado = fiis.reduce((s, f) => s + f.lucroRealizado, 0);
  const lucroTotal = fiis.reduce((s, f) => s + f.lucroTotal, 0);
  const rentabilidadeTotal = valorInvestido > 0 ? (lucroTotal / valorInvestido) * 100 : 0;

  return (
    <div className="flex flex-col gap-6">
      <AtualizacaoAutomaticaFii enabled={fiis.length > 0} />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">FIIs</h1>
          <p className="text-muted-foreground">
            Carteira de Fundos Imobiliários — separada do seu patrimônio geral.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <AtualizarTodosPrecosFii />
          <FiiDialog />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard titulo="Valor investido" valor={formatBRL(valorInvestido)} icon={Wallet} />
        <StatCard
          titulo="Valor atual"
          valor={formatBRL(valorAtual)}
          icon={Landmark}
          tom={lucro >= 0 ? "positivo" : "negativo"}
        />
        <StatCard
          titulo="Lucro/prejuízo"
          valor={formatBRL(lucroTotal)}
          icon={TrendingUp}
          tom={lucroTotal >= 0 ? "positivo" : "negativo"}
          legenda={`${rentabilidadeTotal.toFixed(2)}% total · ${formatBRL(lucroRealizado)} realizado`}
        />
        <Link href="/proventos" className="block transition hover:opacity-90">
          <StatCard titulo="Dividendos recebidos" valor={formatBRL(totalDividendos)} icon={Coins} tom="positivo" legenda="Ver histórico e detalhes" />
        </Link>
      </div>

      {fiis.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-12 text-center text-muted-foreground">
            <Landmark className="size-8" />
            <p>Nenhum FII cadastrado ainda.</p>
          </CardContent>
        </Card>
      ) : (
        <FiisView fiis={fiis} />
      )}
    </div>
  );
}
