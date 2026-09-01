import Link from "next/link";
import { CalendarClock, CreditCard, Wallet, ArrowUpRight } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PagarItemVencer } from "@/components/pagar-item-vencer";
import { formatBRL } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { ItemVencer } from "@/lib/queries";

function diasAte(d: Date | string) {
  const date = typeof d === "string" ? new Date(d) : d;
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const alvo = new Date(date);
  alvo.setHours(0, 0, 0, 0);
  return Math.round((alvo.getTime() - hoje.getTime()) / 86400000);
}

function textoPrazo(dias: number) {
  if (dias < 0) return { txt: `venceu há ${-dias}d`, atrasado: true };
  if (dias === 0) return { txt: "vence hoje", atrasado: true };
  if (dias === 1) return { txt: "vence amanhã", atrasado: false };
  return { txt: `em ${dias} dias`, atrasado: false };
}

type Opt = { id: string; name: string; saldo?: number };

export function ContasAVencer({
  itens,
  contas,
}: {
  itens: ItemVencer[];
  contas: Opt[];
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <CalendarClock className="size-5 text-muted-foreground" />
            Contas a vencer
          </CardTitle>
          <CardDescription>Pendências e faturas por vencimento</CardDescription>
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link href="/transacoes?status=pendente&month=all">Ver todas</Link>
        </Button>
      </CardHeader>
      <CardContent>
        {itens.length === 0 ? (
          <div className="flex h-16 items-center justify-center text-sm text-muted-foreground">
            Nenhuma pendência. Tudo em dia! 👌
          </div>
        ) : (
          <ul className="divide-y">
            {itens.map((t) => {
              const ehReceita = t.kind === "receita";
              const ehFatura = t.tipo === "fatura";
              const dias = diasAte(t.date);
              const prazo = textoPrazo(dias);
              const Icon = ehFatura
                ? CreditCard
                : ehReceita
                  ? ArrowUpRight
                  : Wallet;
              return (
                <li key={t.id} className="flex items-center gap-3 py-2">
                  <div
                    className={cn(
                      "flex size-8 shrink-0 items-center justify-center rounded-full",
                      ehFatura
                        ? "bg-muted text-foreground"
                        : ehReceita
                          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400"
                          : "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400"
                    )}
                  >
                    <Icon className="size-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-medium">{t.description}</div>
                    <div className="truncate text-xs text-muted-foreground">
                      {t.detalhe}
                    </div>
                  </div>
                  <Badge
                    variant={prazo.atrasado ? "secondary" : "outline"}
                    className={cn(
                      prazo.atrasado && "bg-destructive text-white",
                      !prazo.atrasado && dias <= 3 && "text-amber-600 dark:text-amber-500"
                    )}
                  >
                    {prazo.txt}
                  </Badge>
                  <div
                    className={cn(
                      "w-24 text-right font-mono font-medium",
                      ehReceita
                        ? "text-emerald-600 dark:text-emerald-500"
                        : "text-foreground"
                    )}
                  >
                    {ehReceita ? "+" : "−"}
                    {formatBRL(t.amount)}
                  </div>
                  <PagarItemVencer item={t} contas={contas} />
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
