import { TrendingUp, CheckCircle2, Clock, Target } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { formatBRL } from "@/lib/format";
import { cn } from "@/lib/utils";

export function PrevisaoPanel({
  mes,
  despesaPaga,
  despesaPendente,
  receitaPaga,
  receitaPendente,
  orcamentoTotal,
}: {
  mes: string;
  despesaPaga: number;
  despesaPendente: number;
  receitaPaga: number;
  receitaPendente: number;
  orcamentoTotal: number;
}) {
  const despesaPrevista = despesaPaga + despesaPendente;
  const receitaPrevista = receitaPaga + receitaPendente;
  const saldoPrevisto = receitaPrevista - despesaPrevista;
  const pctPago =
    despesaPrevista > 0 ? (despesaPaga / despesaPrevista) * 100 : 0;

  const estouraOrcamento = orcamentoTotal > 0 && despesaPrevista > orcamentoTotal;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="size-5 text-muted-foreground" />
          Previsão de {mes}
        </CardTitle>
        <CardDescription>
          Quanto você deve gastar no mês, incluindo as pendências.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-5 md:grid-cols-2">
        {/* Despesa prevista */}
        <div>
          <div className="text-sm text-muted-foreground">Despesa prevista</div>
          <div className="text-3xl font-bold">{formatBRL(despesaPrevista)}</div>

          <Progress value={pctPago} className="mt-3" />
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs">
            <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-500">
              <CheckCircle2 className="size-3.5" />
              Já paguei {formatBRL(despesaPaga)}
            </span>
            <span className="flex items-center gap-1 text-amber-600 dark:text-amber-500">
              <Clock className="size-3.5" />
              Falta pagar {formatBRL(despesaPendente)}
            </span>
          </div>

          {orcamentoTotal > 0 && (
            <div
              className={cn(
                "mt-3 flex items-center gap-1.5 text-xs",
                estouraOrcamento
                  ? "text-destructive"
                  : "text-muted-foreground"
              )}
            >
              <Target className="size-3.5" />
              {estouraOrcamento
                ? `Vai passar do orçamento (${formatBRL(orcamentoTotal)}) em ${formatBRL(
                    despesaPrevista - orcamentoTotal
                  )}`
                : `Dentro do orçamento — sobra ${formatBRL(
                    orcamentoTotal - despesaPrevista
                  )} de ${formatBRL(orcamentoTotal)}`}
            </div>
          )}
        </div>

        {/* Receita e saldo previstos */}
        <div className="grid content-start gap-3 rounded-lg border p-4">
          <Linha
            rotulo="Receita prevista"
            valor={receitaPrevista}
            sub={`${formatBRL(receitaPendente)} a receber`}
            cor="text-emerald-600 dark:text-emerald-500"
          />
          <Linha
            rotulo="Despesa prevista"
            valor={despesaPrevista}
            sub={`${formatBRL(despesaPendente)} pendente`}
            cor="text-destructive"
          />
          <div className="border-t pt-3">
            <Linha
              rotulo="Saldo previsto do mês"
              valor={saldoPrevisto}
              cor={
                saldoPrevisto >= 0
                  ? "text-emerald-600 dark:text-emerald-500"
                  : "text-destructive"
              }
              forte
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function Linha({
  rotulo,
  valor,
  sub,
  cor,
  forte,
}: {
  rotulo: string;
  valor: number;
  sub?: string;
  cor: string;
  forte?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <div>
        <div className={cn("text-sm", forte ? "font-semibold" : "text-muted-foreground")}>
          {rotulo}
        </div>
        {sub && <div className="text-xs text-muted-foreground">{sub}</div>}
      </div>
      <div className={cn("font-mono font-bold", forte ? "text-lg" : "text-base", cor)}>
        {formatBRL(valor)}
      </div>
    </div>
  );
}
