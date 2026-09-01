import { Target, CheckCircle2, CalendarClock } from "lucide-react";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { MetaDialog } from "@/components/forms/meta-dialog";
import { MetaContribuir } from "@/components/meta-contribuir";
import { ExcluirItem } from "@/components/excluir-item";
import { getGoals } from "@/lib/queries";
import { formatBRL } from "@/lib/format";
import { cn } from "@/lib/utils";

function mesesAte(deadline: Date): number {
  const now = new Date();
  return Math.max(
    (deadline.getFullYear() - now.getFullYear()) * 12 +
      (deadline.getMonth() - now.getMonth()),
    0
  );
}

export default async function MetasPage() {
  const metas = await getGoals();

  const totalAlvo = metas.reduce((s, m) => s + m.target, 0);
  const totalGuardado = metas.reduce((s, m) => s + m.saved, 0);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Metas de economia</h1>
          <p className="text-muted-foreground">
            {metas.length > 0
              ? `${formatBRL(totalGuardado)} de ${formatBRL(totalAlvo)} guardados no total.`
              : "Defina objetivos e acompanhe o progresso."}
          </p>
        </div>
        <MetaDialog />
      </div>

      {metas.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center gap-2 py-12 text-center">
            <Target className="size-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Nenhuma meta ainda. Crie sua reserva de emergência, uma viagem…
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {metas.map((m) => {
            const pct = m.target > 0 ? Math.min((m.saved / m.target) * 100, 100) : 0;
            const falta = Math.max(m.target - m.saved, 0);
            const concluida = m.saved >= m.target;
            const meses = m.deadline ? mesesAte(m.deadline) : 0;
            const porMes = m.deadline && meses > 0 ? falta / meses : 0;
            return (
              <Card key={m.id}>
                <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                  <div className="flex items-center gap-2">
                    <span
                      className="size-4 rounded-full"
                      style={{ backgroundColor: m.color }}
                    />
                    <CardTitle className="text-base">{m.name}</CardTitle>
                    {concluida && (
                      <Badge className="gap-1 bg-emerald-500 text-white">
                        <CheckCircle2 className="size-3" />
                        Concluída
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center">
                    <MetaDialog
                      meta={{
                        id: m.id,
                        name: m.name,
                        target: m.target,
                        saved: m.saved,
                        deadline: m.deadline,
                        color: m.color,
                      }}
                    />
                    <ExcluirItem kind="goal" id={m.id} nome={m.name} />
                  </div>
                </CardHeader>
                <CardContent className="grid gap-3">
                  <div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-mono font-semibold">
                        {formatBRL(m.saved)}
                      </span>
                      <span className="text-muted-foreground">
                        de {formatBRL(m.target)} ({Math.round(pct)}%)
                      </span>
                    </div>
                    <Progress
                      value={pct}
                      className={cn("mt-1.5", concluida && "[&>div]:bg-emerald-500")}
                    />
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
                    <span>
                      {concluida ? "Meta alcançada! 🎉" : `Faltam ${formatBRL(falta)}`}
                    </span>
                    {m.deadline && !concluida && (
                      <span className="flex items-center gap-1">
                        <CalendarClock className="size-3.5" />
                        {porMes > 0
                          ? `${formatBRL(porMes)}/mês (${meses} ${meses === 1 ? "mês" : "meses"})`
                          : "Prazo vencido"}
                      </span>
                    )}
                  </div>
                  <MetaContribuir id={m.id} nome={m.name} />
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
