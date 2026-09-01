import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  ArrowUpRight,
  ArrowDownLeft,
} from "lucide-react";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TransacoesTable } from "@/components/transacoes-table";
import { TransacaoDialog } from "@/components/forms/nova-transacao";
import {
  getAccountById,
  getAccountsWithBalance,
  getAccountTransactions,
  getCategories,
  getAccounts,
  getCreditCards,
  materializeRecurring,
} from "@/lib/queries";
import { formatBRL } from "@/lib/format";
import { accountTypeLabel, MESES } from "@/lib/constants";

function addMonthKey(key: string, delta: number) {
  const [y, m] = key.split("-").map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}
function labelKey(key: string) {
  const [y, m] = key.split("-").map(Number);
  return `${MESES[m - 1]} de ${y}`;
}

export default async function ContaPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const now = new Date();
  await materializeRecurring(now.getMonth() + 1, now.getFullYear());

  const [conta, saldos, txs, categorias, contas, cartoes] = await Promise.all([
    getAccountById(id),
    getAccountsWithBalance(),
    getAccountTransactions(id),
    getCategories(),
    getAccounts(),
    getCreditCards(),
  ]);

  if (!conta) notFound();
  const saldoAtual = saldos.find((a) => a.id === id)?.saldo ?? conta.initialBalance;

  const currentKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const paramMes = Array.isArray(sp.mes) ? sp.mes[0] : sp.mes;
  const selKey = paramMes && /^\d{4}-\d{2}$/.test(paramMes) ? paramMes : currentKey;
  const [selY, selM] = selKey.split("-").map(Number);

  const doMes = txs.filter(
    (t) => t.date.getFullYear() === selY && t.date.getMonth() + 1 === selM
  );
  const entradas = doMes
    .filter((t) => t.kind === "receita")
    .reduce((s, t) => s + t.amount, 0);
  const saidas = doMes
    .filter((t) => t.kind === "despesa")
    .reduce((s, t) => s + t.amount, 0);

  const prevKey = addMonthKey(selKey, -1);
  const nextKey = addMonthKey(selKey, 1);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="size-8" asChild>
            <Link href="/contas" aria-label="Voltar">
              <ChevronLeft className="size-4" />
            </Link>
          </Button>
          <span
            className="size-10 rounded-lg"
            style={{ backgroundColor: conta.color }}
          />
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{conta.name}</h1>
            <p className="text-muted-foreground">{accountTypeLabel(conta.type)}</p>
          </div>
        </div>
        <TransacaoDialog
          categorias={categorias}
          contas={contas}
          cartoes={cartoes}
          presetAccountId={conta.id}
        />
      </div>

      {/* Resumo */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="py-2">
            <div className="text-xs text-muted-foreground">Saldo atual</div>
            <div className="text-2xl font-bold">{formatBRL(saldoAtual)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 py-2">
            <div className="flex size-9 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400">
              <ArrowUpRight className="size-4" />
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Entradas no mês</div>
              <div className="text-lg font-bold text-emerald-600 dark:text-emerald-500">
                {formatBRL(entradas)}
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 py-2">
            <div className="flex size-9 items-center justify-center rounded-lg bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400">
              <ArrowDownLeft className="size-4" />
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Saídas no mês</div>
              <div className="text-lg font-bold text-destructive">
                {formatBRL(saidas)}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Transações do mês selecionado (com navegação) */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="size-8" asChild>
              <Link href={`?mes=${prevKey}`} scroll={false} aria-label="Mês anterior">
                <ChevronLeft className="size-4" />
              </Link>
            </Button>
            <div className="min-w-[150px] text-center">
              <CardTitle className="text-base">{labelKey(selKey)}</CardTitle>
            </div>
            <Button variant="ghost" size="icon" className="size-8" asChild>
              <Link href={`?mes=${nextKey}`} scroll={false} aria-label="Próximo mês">
                <ChevronRight className="size-4" />
              </Link>
            </Button>
          </div>
          {selKey === currentKey && <Badge variant="secondary">Mês atual</Badge>}
        </CardHeader>
        <CardContent>
          {doMes.length === 0 ? (
            <div className="flex h-24 items-center justify-center text-sm text-muted-foreground">
              Nenhuma transação nesta conta em {labelKey(selKey)}.
            </div>
          ) : (
            <>
              <TransacoesTable
                items={doMes}
                categorias={categorias}
                contas={contas}
                cartoes={cartoes}
              />
              <div className="mt-3 flex flex-wrap justify-end gap-6 border-t pt-3 text-sm">
                <span className="text-emerald-600 dark:text-emerald-500">
                  Entradas: <span className="font-mono font-medium">{formatBRL(entradas)}</span>
                </span>
                <span className="text-destructive">
                  Saídas: <span className="font-mono font-medium">{formatBRL(saidas)}</span>
                </span>
                <span>
                  Resultado:{" "}
                  <span className="font-mono font-bold">{formatBRL(entradas - saidas)}</span>
                </span>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
