import { PiggyBank, AlertTriangle } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { DefinirOrcamento } from "@/components/forms/definir-orcamento";
import { ExcluirItem } from "@/components/excluir-item";
import { OrcamentoNav } from "@/components/orcamento-nav";
import { CopiarOrcamento } from "@/components/copiar-orcamento";
import {
  getBudgets,
  getCategories,
  getAvailableYears,
  materializeRecurring,
} from "@/lib/queries";
import { formatBRL } from "@/lib/format";
import { MESES } from "@/lib/constants";
import { cn } from "@/lib/utils";

export default async function OrcamentoPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
  const now = new Date();
  const year = parseInt(one(sp.year) ?? "", 10) || now.getFullYear();
  const mParam = parseInt(one(sp.month) ?? "", 10);
  const month = mParam >= 1 && mParam <= 12 ? mParam : now.getMonth() + 1;
  await materializeRecurring(now.getMonth() + 1, now.getFullYear());

  const [budgets, categorias, anos] = await Promise.all([
    getBudgets(month, year),
    getCategories("despesa"),
    getAvailableYears(),
  ]);

  const total = budgets.find((b) => b.isTotal);
  const porCategoria = budgets.filter((b) => !b.isTotal);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Orçamento</h1>
          <p className="text-muted-foreground">
            Limites de {MESES[month - 1]} de {year}.
          </p>
          <div className="mt-2">
            <OrcamentoNav month={month} year={year} anos={anos} />
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <CopiarOrcamento month={month} year={year} />
          <DefinirOrcamento categorias={categorias} month={month} year={year} />
        </div>
      </div>

      {total && (
        <Card>
          <CardHeader className="flex flex-row items-start justify-between space-y-0">
            <div>
              <CardTitle className="flex items-center gap-2">
                <PiggyBank className="size-5 text-muted-foreground" />
                Orçamento total do mês
              </CardTitle>
              <CardDescription>
                {formatBRL(total.gasto)} de {formatBRL(total.limite)} utilizados
              </CardDescription>
            </div>
            <ExcluirItem kind="budget" id={total.id} nome="Orçamento total" />
          </CardHeader>
          <CardContent>
            <BudgetBar pct={total.pct} />
            <div className="mt-2 flex items-center justify-between text-sm">
              <StatusBadge pct={total.pct} />
              <span className="text-muted-foreground">
                Resta {formatBRL(Math.max(total.limite - total.gasto, 0))}
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      <div>
        <h2 className="mb-3 text-lg font-semibold">Por categoria</h2>
        {porCategoria.length === 0 ? (
          <Card>
            <CardContent className="flex h-24 items-center justify-center text-sm text-muted-foreground">
              Nenhum orçamento por categoria definido.
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {porCategoria.map((b) => (
              <Card key={b.id}>
                <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                  <div className="flex items-center gap-2">
                    <span
                      className="size-3 rounded-full"
                      style={{ backgroundColor: b.color }}
                    />
                    <CardTitle className="text-base">{b.nome}</CardTitle>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-sm font-semibold">{b.pct}%</span>
                    <ExcluirItem kind="budget" id={b.id} nome={b.nome} />
                  </div>
                </CardHeader>
                <CardContent>
                  <BudgetBar pct={b.pct} />
                  <div className="mt-2 flex items-center justify-between text-sm text-muted-foreground">
                    <span>
                      {formatBRL(b.gasto)} de {formatBRL(b.limite)}
                    </span>
                    {b.pct >= 100 && (
                      <span className="flex items-center gap-1 text-destructive">
                        <AlertTriangle className="size-3.5" />
                        Estourou
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function BudgetBar({ pct }: { pct: number }) {
  return (
    <Progress
      value={Math.min(pct, 100)}
      className={cn(
        pct >= 100 && "[&>div]:bg-destructive",
        pct >= 80 && pct < 100 && "[&>div]:bg-amber-500"
      )}
    />
  );
}

function StatusBadge({ pct }: { pct: number }) {
  if (pct >= 100)
    return <Badge className="bg-destructive text-white">Orçamento estourado</Badge>;
  if (pct >= 80)
    return (
      <Badge className="bg-amber-500 text-white">Atenção — {pct}% usado</Badge>
    );
  return <Badge variant="secondary">{pct}% usado</Badge>;
}
