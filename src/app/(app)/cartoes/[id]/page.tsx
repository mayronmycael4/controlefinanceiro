import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  CreditCard as CardIcon,
  CalendarClock,
} from "lucide-react";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { TransacoesTable } from "@/components/transacoes-table";
import { TransacaoDialog } from "@/components/forms/nova-transacao";
import { PagarFaturaDialog } from "@/components/forms/pagar-fatura-dialog";
import {
  getCreditCardById,
  getCardTransactions,
  getCreditCardsWithUsage,
  getAccounts,
  getCategories,
  getCreditCards,
  materializeRecurring,
} from "@/lib/queries";
import { formatBRL } from "@/lib/format";
import { MESES } from "@/lib/constants";
import { cn } from "@/lib/utils";

type Tx = Awaited<ReturnType<typeof getCardTransactions>>[number];
type Fatura = { key: string; ano: number; mes: number; itens: Tx[]; total: number; pendente: number };

function addMonthKey(key: string, delta: number) {
  const [y, m] = key.split("-").map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}
function labelKey(key: string) {
  const [y, m] = key.split("-").map(Number);
  return `${MESES[m - 1]} de ${y}`;
}

export default async function CartaoPage({
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

  const [card, txs, contas, categorias, cartoes, usageList] = await Promise.all([
    getCreditCardById(id),
    getCardTransactions(id),
    getAccounts(),
    getCategories(),
    getCreditCards(),
    getCreditCardsWithUsage({ year: now.getFullYear(), month: now.getMonth() + 1 }),
  ]);

  if (!card) notFound();
  const usage = usageList.find((c) => c.id === id);
  const uso = card.limit > 0 ? Math.min(((usage?.emAberto ?? 0) / card.limit) * 100, 100) : 0;

  // Agrupa transações por mês (fatura)
  const mapa = new Map<string, Fatura>();
  for (const t of txs) {
    const ano = t.date.getFullYear();
    const mes = t.date.getMonth() + 1;
    const key = `${ano}-${String(mes).padStart(2, "0")}`;
    let g = mapa.get(key);
    if (!g) {
      g = { key, ano, mes, itens: [], total: 0, pendente: 0 };
      mapa.set(key, g);
    }
    g.itens.push(t);
    g.total += t.amount;
    if (t.status === "pendente") g.pendente += t.amount;
  }

  const currentKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const paramMes = Array.isArray(sp.mes) ? sp.mes[0] : sp.mes;
  const selKey = paramMes && /^\d{4}-\d{2}$/.test(paramMes) ? paramMes : currentKey;
  const sel = mapa.get(selKey);
  const prevKey = addMonthKey(selKey, -1);
  const nextKey = addMonthKey(selKey, 1);

  // Próximas faturas = mês atual em diante que tenham lançamentos (parcelas futuras)
  const proximas = [...mapa.values()]
    .filter((g) => g.key >= currentKey)
    .sort((a, b) => a.key.localeCompare(b.key));

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
            className="flex size-10 items-center justify-center rounded-lg text-white"
            style={{ backgroundColor: card.color }}
          >
            <CardIcon className="size-5" />
          </span>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{card.name}</h1>
            <p className="text-muted-foreground">{card.brand || "Cartão de crédito"}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <TransacaoDialog
            categorias={categorias}
            contas={contas}
            cartoes={cartoes}
            presetCardId={card.id}
          />
          {usage && usage.aPagar > 0 && (
            <PagarFaturaDialog
              card={{ id: card.id, name: card.name, aPagar: usage.aPagar }}
              contas={contas.map((a) => ({ id: a.id, name: a.name }))}
            />
          )}
        </div>
      </div>

      {/* Resumo do limite */}
      <Card>
        <CardContent className="grid gap-4 py-2 sm:grid-cols-2">
          <div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Limite usado</span>
              <span className="font-medium">{formatBRL(usage?.emAberto ?? 0)}</span>
            </div>
            <Progress value={uso} className="mt-1.5" />
            <div className="mt-1 flex items-center justify-between text-xs text-muted-foreground">
              <span>Disponível: {formatBRL(usage?.disponivel ?? card.limit)}</span>
              <span>Limite: {formatBRL(card.limit)}</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <Info rotulo="Fatura de" valor={MESES[now.getMonth()]} />
            <Info rotulo="A pagar agora" valor={formatBRL(usage?.aPagar ?? 0)} destaque />
            <Info rotulo="Fechamento" valor={`Dia ${card.closingDay}`} />
            <Info rotulo="Vencimento" valor={`Dia ${card.dueDay}`} />
          </div>
        </CardContent>
      </Card>

      {/* Próximas faturas */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <CalendarClock className="size-4 text-muted-foreground" />
            Próximas faturas
          </CardTitle>
          <CardDescription>
            Parcelas e lançamentos a vencer nos próximos meses.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {proximas.length === 0 ? (
            <div className="flex h-16 items-center justify-center text-sm text-muted-foreground">
              Nenhuma fatura futura em aberto.
            </div>
          ) : (
            <ul className="divide-y">
              {proximas.map((g) => (
                <li key={g.key}>
                  <Link
                    href={`?mes=${g.key}`}
                    scroll={false}
                    className={cn(
                      "flex items-center justify-between gap-3 py-2 transition hover:opacity-80",
                      g.key === selKey && "font-medium"
                    )}
                  >
                    <span className="flex items-center gap-2">
                      {labelKey(g.key)}
                      {g.key === currentKey && (
                        <Badge variant="secondary">Atual</Badge>
                      )}
                    </span>
                    <span className="flex items-center gap-3">
                      {g.pendente > 0 ? (
                        <Badge className="bg-amber-500 text-white">
                          {formatBRL(g.pendente)}
                        </Badge>
                      ) : (
                        <Badge variant="outline">Paga</Badge>
                      )}
                      <span className="font-mono font-medium">
                        {formatBRL(g.total)}
                      </span>
                      <ChevronRight className="size-4 text-muted-foreground" />
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* Fatura do mês selecionado (com navegação) */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="size-8" asChild>
              <Link href={`?mes=${prevKey}`} scroll={false} aria-label="Mês anterior">
                <ChevronLeft className="size-4" />
              </Link>
            </Button>
            <div className="min-w-[150px] text-center">
              <CardTitle className="text-base">Fatura de {labelKey(selKey)}</CardTitle>
            </div>
            <Button variant="ghost" size="icon" className="size-8" asChild>
              <Link href={`?mes=${nextKey}`} scroll={false} aria-label="Próximo mês">
                <ChevronRight className="size-4" />
              </Link>
            </Button>
          </div>
          {sel &&
            (sel.pendente > 0 ? (
              <Badge className="bg-amber-500 text-white">
                Em aberto {formatBRL(sel.pendente)}
              </Badge>
            ) : (
              <Badge variant="outline">Paga</Badge>
            ))}
        </CardHeader>
        <CardContent>
          {!sel || sel.itens.length === 0 ? (
            <div className="flex h-24 items-center justify-center text-sm text-muted-foreground">
              Nenhuma transação nesta fatura.
            </div>
          ) : (
            <>
              <TransacoesTable
                items={sel.itens}
                categorias={categorias}
                contas={contas}
                cartoes={cartoes}
              />
              <div className="mt-3 flex justify-end gap-6 border-t pt-3 text-sm">
                {sel.pendente > 0 && (
                  <span className="text-amber-600 dark:text-amber-500">
                    Pendente: <span className="font-mono font-medium">{formatBRL(sel.pendente)}</span>
                  </span>
                )}
                <span>
                  Total: <span className="font-mono font-bold">{formatBRL(sel.total)}</span>
                </span>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Info({
  rotulo,
  valor,
  destaque,
}: {
  rotulo: string;
  valor: string;
  destaque?: boolean;
}) {
  return (
    <div>
      <div className="text-xs text-muted-foreground">{rotulo}</div>
      <div className={destaque ? "font-semibold" : "font-medium"}>{valor}</div>
    </div>
  );
}
