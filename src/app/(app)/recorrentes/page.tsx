import {
  Repeat,
  ArrowUpRight,
  ArrowDownLeft,
  CreditCard,
  Wallet,
  CalendarClock,
} from "lucide-react";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RecorrenteDialog } from "@/components/forms/recorrente-dialog";
import { RecorrenteToggle } from "@/components/recorrente-toggle";
import { ExcluirItem } from "@/components/excluir-item";
import {
  getRecurrings,
  getCategories,
  getAccounts,
  getCreditCards,
} from "@/lib/queries";
import { formatBRL } from "@/lib/format";
import { frequenciaLabel, recorrenteQuando } from "@/lib/constants";
import { cn } from "@/lib/utils";

export default async function RecorrentesPage() {
  const [recorrentes, categorias, contas, cartoes] = await Promise.all([
    getRecurrings(),
    getCategories(),
    getAccounts(),
    getCreditCards(),
  ]);

  // Valor equivalente por mês, conforme a frequência
  const porMes = (r: { amount: number; frequency: string }) => {
    switch (r.frequency) {
      case "semanal":
        return (r.amount * 52) / 12;
      case "quinzenal":
        return r.amount * 2;
      case "trimestral":
        return r.amount / 3;
      case "semestral":
        return r.amount / 6;
      case "anual":
        return r.amount / 12;
      default:
        return r.amount;
    }
  };

  const ativos = recorrentes.filter((r) => r.active);
  const desTotal = ativos
    .filter((r) => r.kind === "despesa")
    .reduce((s, r) => s + porMes(r), 0);
  const recTotal = ativos
    .filter((r) => r.kind === "receita")
    .reduce((s, r) => s + porMes(r), 0);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Recorrentes / Fixas</h1>
          <p className="text-muted-foreground">
            Lançamentos que se repetem todo mês. Geram pendências automáticas.
          </p>
        </div>
        <RecorrenteDialog categorias={categorias} contas={contas} cartoes={cartoes} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardContent className="flex items-center gap-4 py-2">
            <div className="flex size-10 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400">
              <ArrowUpRight className="size-5" />
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Receitas fixas (≈/mês)</div>
              <div className="text-lg font-bold text-emerald-600 dark:text-emerald-500">
                {formatBRL(recTotal)}
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 py-2">
            <div className="flex size-10 items-center justify-center rounded-lg bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400">
              <ArrowDownLeft className="size-5" />
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Despesas fixas (≈/mês)</div>
              <div className="text-lg font-bold text-destructive">
                {formatBRL(desTotal)}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {recorrentes.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center gap-2 py-12 text-center">
            <Repeat className="size-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Nenhuma recorrente ainda. Crie assinaturas, salário, aluguel…
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {recorrentes.map((r) => {
            const ehReceita = r.kind === "receita";
            const pagamento = r.creditCard?.name ?? r.account?.name ?? "—";
            return (
              <Card key={r.id} className={cn(!r.active && "opacity-60")}>
                <CardContent className="flex flex-wrap items-center gap-4 py-2">
                  <div
                    className="flex size-9 shrink-0 items-center justify-center rounded-full text-white"
                    style={{ backgroundColor: r.color }}
                  >
                    {ehReceita ? (
                      <ArrowUpRight className="size-4" />
                    ) : (
                      <ArrowDownLeft className="size-4" />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate font-medium">{r.description}</span>
                      {r.category && (
                        <Badge variant="secondary">{r.category.name}</Badge>
                      )}
                    </div>
                    <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                      <Badge variant="outline" className="font-normal">
                        {frequenciaLabel(r.frequency)}
                      </Badge>
                      <span className="flex items-center gap-1">
                        <CalendarClock className="size-3.5" />
                        {recorrenteQuando(r)}
                      </span>
                      <span className="flex items-center gap-1">
                        {r.creditCard ? (
                          <CreditCard className="size-3.5" />
                        ) : (
                          <Wallet className="size-3.5" />
                        )}
                        {pagamento}
                      </span>
                      {!r.active && <Badge variant="outline">Pausada</Badge>}
                    </div>
                  </div>

                  <div
                    className={cn(
                      "font-mono font-semibold",
                      ehReceita
                        ? "text-emerald-600 dark:text-emerald-500"
                        : "text-foreground"
                    )}
                  >
                    {ehReceita ? "+" : "−"}
                    {formatBRL(r.amount)}
                  </div>

                  <div className="flex items-center gap-1">
                    <RecorrenteToggle id={r.id} active={r.active} />
                    <RecorrenteDialog
                      categorias={categorias}
                      contas={contas}
                      cartoes={cartoes}
                      recorrente={{
                        id: r.id,
                        description: r.description,
                        amount: r.amount,
                        kind: r.kind,
                        frequency: r.frequency,
                        dayOfMonth: r.dayOfMonth,
                        dayOfWeek: r.dayOfWeek,
                        month: r.month,
                        color: r.color,
                        categoryId: r.categoryId,
                        accountId: r.accountId,
                        creditCardId: r.creditCardId,
                      }}
                    />
                    <ExcluirItem kind="recurring" id={r.id} nome={r.description} />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
