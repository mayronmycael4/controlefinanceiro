import Link from "next/link";
import { Wallet, CreditCard as CardIcon } from "lucide-react";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { NovaConta, ContaDialog } from "@/components/forms/nova-conta";
import { NovoCartao, CartaoDialog } from "@/components/forms/novo-cartao";
import { PagarFaturaDialog } from "@/components/forms/pagar-fatura-dialog";
import { TransferenciaDialog } from "@/components/forms/transferencia-dialog";
import { ExcluirItem } from "@/components/excluir-item";
import { getAccountsWithBalance, getCreditCardsWithUsage } from "@/lib/queries";
import { formatBRL } from "@/lib/format";
import { accountTypeLabel, MESES } from "@/lib/constants";

export default async function ContasPage() {
  const now = new Date();
  const [contas, cartoes] = await Promise.all([
    getAccountsWithBalance(),
    getCreditCardsWithUsage({ year: now.getFullYear(), month: now.getMonth() + 1 }),
  ]);

  const patrimonio = contas.reduce((s, c) => s + c.saldo, 0);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Contas & Cartões</h1>
        <p className="text-muted-foreground">
          Suas carteiras, contas e cartões de crédito.
        </p>
      </div>

      {/* Contas */}
      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="flex items-center gap-2 text-lg font-semibold">
              <Wallet className="size-5 text-muted-foreground" />
              Contas & Carteiras
            </h2>
            <p className="text-sm text-muted-foreground">
              Saldo total: <span className="font-medium text-foreground">{formatBRL(patrimonio)}</span>
            </p>
          </div>
          <div className="flex gap-2">
            {contas.length >= 2 && (
              <TransferenciaDialog
                contas={contas.map((a) => ({ id: a.id, name: a.name }))}
              />
            )}
            <NovaConta />
          </div>
        </div>

        {contas.length === 0 ? (
          <EmptyCard texto="Nenhuma conta cadastrada." />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {contas.map((c) => (
              <Card key={c.id}>
                <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                  <Link
                    href={`/contas/${c.id}`}
                    className="flex items-center gap-3 rounded-md transition hover:opacity-80"
                  >
                    <span
                      className="size-9 rounded-lg"
                      style={{ backgroundColor: c.color }}
                    />
                    <div>
                      <CardTitle className="text-base hover:underline">
                        {c.name}
                      </CardTitle>
                      <Badge variant="secondary" className="mt-1">
                        {accountTypeLabel(c.type)}
                      </Badge>
                    </div>
                  </Link>
                  <div className="flex items-center">
                    <ContaDialog
                      conta={{
                        id: c.id,
                        name: c.name,
                        type: c.type,
                        initialBalance: c.initialBalance,
                        color: c.color,
                      }}
                    />
                    <ExcluirItem kind="account" id={c.id} nome={c.name} />
                  </div>
                </CardHeader>
                <CardContent className="grid gap-3">
                  <div>
                    <div className="text-xs text-muted-foreground">Saldo atual</div>
                    <div className="text-2xl font-bold">{formatBRL(c.saldo)}</div>
                  </div>
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/contas/${c.id}`}>Ver transações</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* Cartões */}
      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="flex items-center gap-2 text-lg font-semibold">
              <CardIcon className="size-5 text-muted-foreground" />
              Cartões de Crédito
            </h2>
            <p className="text-sm text-muted-foreground">
              Fatura do mês atual e limite disponível.
            </p>
          </div>
          <NovoCartao />
        </div>

        {cartoes.length === 0 ? (
          <EmptyCard texto="Nenhum cartão cadastrado." />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {cartoes.map((c) => {
              const uso = c.limit > 0 ? Math.min((c.emAberto / c.limit) * 100, 100) : 0;
              return (
                <Card key={c.id}>
                  <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                    <Link
                      href={`/cartoes/${c.id}`}
                      className="flex items-center gap-3 rounded-md transition hover:opacity-80"
                    >
                      <span
                        className="flex size-9 items-center justify-center rounded-lg text-white"
                        style={{ backgroundColor: c.color }}
                      >
                        <CardIcon className="size-4" />
                      </span>
                      <div>
                        <CardTitle className="text-base hover:underline">
                          {c.name}
                        </CardTitle>
                        <CardDescription>{c.brand || "Cartão"}</CardDescription>
                      </div>
                    </Link>
                    <div className="flex items-center">
                      <CartaoDialog
                        cartao={{
                          id: c.id,
                          name: c.name,
                          brand: c.brand,
                          limit: c.limit,
                          closingDay: c.closingDay,
                          dueDay: c.dueDay,
                          color: c.color,
                        }}
                      />
                      <ExcluirItem kind="card" id={c.id} nome={c.name} />
                    </div>
                  </CardHeader>
                  <CardContent className="grid gap-3">
                    <div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Limite usado</span>
                        <span className="font-medium">{formatBRL(c.emAberto)}</span>
                      </div>
                      <Progress value={uso} className="mt-1.5" />
                      <div className="mt-1 flex items-center justify-between text-xs text-muted-foreground">
                        <span>Disponível: {formatBRL(c.disponivel)}</span>
                        <span>Limite: {formatBRL(c.limit)}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Fatura de {MESES[new Date().getMonth()]}: {formatBRL(c.fatura)}</span>
                      <span>
                        Fecha {c.closingDay} · Vence {c.dueDay}
                      </span>
                    </div>
                    <div className="grid gap-2">
                      {c.aPagar > 0 && (
                        <PagarFaturaDialog
                          card={{ id: c.id, name: c.name, aPagar: c.aPagar }}
                          contas={contas.map((a) => ({
                            id: a.id,
                            name: a.name,
                            saldo: a.saldo,
                          }))}
                          fullWidth
                        />
                      )}
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/cartoes/${c.id}`}>Ver transações</Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

function EmptyCard({ texto }: { texto: string }) {
  return (
    <Card>
      <CardContent className="flex h-24 items-center justify-center text-sm text-muted-foreground">
        {texto}
      </CardContent>
    </Card>
  );
}
