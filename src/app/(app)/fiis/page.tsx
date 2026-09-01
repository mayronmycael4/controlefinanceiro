import Link from "next/link";
import { Landmark, Wallet, TrendingUp, Coins } from "lucide-react";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/stat-card";
import { FiiDialog } from "@/components/forms/novo-fii";
import { AtualizarTodosPrecosFii } from "@/components/forms/atualizar-preco-fii";
import { getFiis } from "@/lib/queries";
import { formatBRL } from "@/lib/format";

export default async function FiisPage() {
  const fiis = await getFiis();

  const valorInvestido = fiis.reduce((s, f) => s + f.valorInvestido, 0);
  const valorAtual = fiis.reduce((s, f) => s + f.valorAtual, 0);
  const totalDividendos = fiis.reduce((s, f) => s + f.totalDividendos, 0);
  const lucro = valorAtual - valorInvestido;

  return (
    <div className="flex flex-col gap-6">
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
          valor={formatBRL(lucro)}
          icon={TrendingUp}
          tom={lucro >= 0 ? "positivo" : "negativo"}
        />
        <StatCard
          titulo="Dividendos recebidos"
          valor={formatBRL(totalDividendos)}
          icon={Coins}
          tom="positivo"
        />
      </div>

      {fiis.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-12 text-center text-muted-foreground">
            <Landmark className="size-8" />
            <p>Nenhum FII cadastrado ainda.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {fiis.map((f) => (
            <Link key={f.id} href={`/fiis/${f.id}`}>
              <Card className="h-full transition hover:border-foreground/30">
                <CardHeader className="flex flex-row items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span
                      className="flex size-8 items-center justify-center rounded-md text-white"
                      style={{ backgroundColor: f.color }}
                    >
                      <Landmark className="size-4" />
                    </span>
                    <div>
                      <CardTitle className="text-base">{f.ticker}</CardTitle>
                      {f.name && (
                        <CardDescription className="truncate">{f.name}</CardDescription>
                      )}
                    </div>
                  </div>
                  {f.dy != null && <Badge variant="secondary">DY {f.dy.toFixed(1)}%</Badge>}
                </CardHeader>
                <CardContent className="grid gap-1 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Cotas</span>
                    <span className="font-medium">{f.quantidade}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Preço médio</span>
                    <span className="font-medium">{formatBRL(f.precoMedio)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Cotação atual</span>
                    <span className="font-medium">{formatBRL(f.currentPrice)}</span>
                  </div>
                  <div className="mt-2 flex items-center justify-between border-t pt-2">
                    <span className="text-muted-foreground">Valor atual</span>
                    <span className="font-semibold">{formatBRL(f.valorAtual)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Lucro/prejuízo</span>
                    <span
                      className={
                        f.lucro >= 0
                          ? "font-semibold text-emerald-600 dark:text-emerald-500"
                          : "font-semibold text-red-600 dark:text-red-500"
                      }
                    >
                      {formatBRL(f.lucro)}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
