import Link from "next/link";
import { TrendingUp, Wallet, ArrowUpRight, ArrowDownLeft } from "lucide-react";

import { StatCard } from "@/components/stat-card";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { materializeRecurring, getFluxoProjetado } from "@/lib/queries";
import { formatBRL } from "@/lib/format";
import { cn } from "@/lib/utils";

export default async function FluxoPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const now = new Date();
  await materializeRecurring(now.getMonth() + 1, now.getFullYear());

  const mParam = parseInt((Array.isArray(sp.meses) ? sp.meses[0] : sp.meses) ?? "", 10);
  const meses = [3, 6, 12].includes(mParam) ? mParam : 6;

  const { patrimonio, meses: linhas } = await getFluxoProjetado(meses);
  const saldoFinal = linhas[linhas.length - 1]?.projetado ?? patrimonio;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Fluxo de caixa projetado</h1>
          <p className="text-muted-foreground">
            Projeção do saldo somando pendentes, recorrentes e parcelas.
          </p>
        </div>
        <div className="flex gap-1">
          {[3, 6, 12].map((n) => (
            <Button
              key={n}
              variant={n === meses ? "default" : "outline"}
              size="sm"
              asChild
            >
              <Link href={`?meses=${n}`} scroll={false}>
                {n} meses
              </Link>
            </Button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <StatCard
          titulo="Saldo atual"
          valor={formatBRL(patrimonio)}
          icon={Wallet}
          legenda="soma das contas hoje"
        />
        <StatCard
          titulo={`Saldo projetado (${meses} meses)`}
          valor={formatBRL(saldoFinal)}
          icon={TrendingUp}
          tom={saldoFinal >= patrimonio ? "positivo" : "negativo"}
          legenda={saldoFinal >= 0 ? "considerando as pendências" : "atenção: pode ficar negativo"}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Projeção mês a mês</CardTitle>
          <CardDescription>
            Entradas e saídas ainda pendentes em cada mês, e o saldo acumulado.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Mês</TableHead>
                <TableHead className="text-right">Entradas</TableHead>
                <TableHead className="text-right">Saídas</TableHead>
                <TableHead className="text-right">Resultado</TableHead>
                <TableHead className="text-right">Saldo projetado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {linhas.map((l) => (
                <TableRow key={l.label}>
                  <TableCell className="font-medium">{l.mesNome}</TableCell>
                  <TableCell className="text-right font-mono text-emerald-600 dark:text-emerald-500">
                    {l.entradas > 0 ? (
                      <span className="inline-flex items-center gap-1">
                        <ArrowUpRight className="size-3.5" />
                        {formatBRL(l.entradas)}
                      </span>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                  <TableCell className="text-right font-mono text-destructive">
                    {l.saidas > 0 ? (
                      <span className="inline-flex items-center gap-1">
                        <ArrowDownLeft className="size-3.5" />
                        {formatBRL(l.saidas)}
                      </span>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                  <TableCell
                    className={cn(
                      "text-right font-mono",
                      l.saldoMes >= 0
                        ? "text-emerald-600 dark:text-emerald-500"
                        : "text-destructive"
                    )}
                  >
                    {l.saldoMes >= 0 ? "+" : "−"}
                    {formatBRL(Math.abs(l.saldoMes))}
                  </TableCell>
                  <TableCell
                    className={cn(
                      "text-right font-mono font-bold",
                      l.projetado < 0 && "text-destructive"
                    )}
                  >
                    {formatBRL(l.projetado)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
