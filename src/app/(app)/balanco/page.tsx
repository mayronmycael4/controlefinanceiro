import {
  Landmark,
  CreditCard as CardIcon,
  Scale,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownLeft,
} from "lucide-react";

import { StatCard } from "@/components/stat-card";
import { SaldoArea } from "@/components/charts";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  getAccountsWithBalance,
  getCreditCardsWithUsage,
  getSummary,
  getEvolucaoSaldo,
  getCategoriaStatusBreakdown,
  getAvailableYears,
  materializeRecurring,
  type CategoriaStatus,
} from "@/lib/queries";
import { FiltroAno } from "@/components/filtro-ano";
import { formatBRL } from "@/lib/format";
import { accountTypeLabel } from "@/lib/constants";

export default async function BalancoPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const now = new Date();
  const month = now.getMonth() + 1;
  await materializeRecurring(month, now.getFullYear());

  const anosBase = await getAvailableYears();
  const anoParam = Array.isArray(sp.year) ? sp.year[0] : sp.year;
  // Padrão: ano atual (não o mais futuro que tenha parcelas)
  const year = parseInt(anoParam ?? "", 10) || now.getFullYear();
  // Garante que o ano escolhido apareça no seletor, mesmo sem lançamentos
  const anos = anosBase.includes(year)
    ? anosBase
    : [...anosBase, year].sort((a, b) => b - a);

  const [contas, cartoes, resumoAno, evolucao, despCat, recCat] =
    await Promise.all([
      getAccountsWithBalance(),
      getCreditCardsWithUsage({ year, month }),
      getSummary({ year }),
      getEvolucaoSaldo(year),
      getCategoriaStatusBreakdown({ year }, "despesa"),
      getCategoriaStatusBreakdown({ year }, "receita"),
    ]);

  const patrimonio = contas.reduce((s, c) => s + c.saldo, 0);
  // Em aberto = tudo que falta pagar nos cartões (inclui parcelas futuras)
  const faturas = cartoes.reduce((s, c) => s + c.emAberto, 0);
  const liquido = patrimonio - faturas;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Balanço</h1>
          <p className="text-muted-foreground">
            Sua posição financeira consolidada.
          </p>
        </div>
        <FiltroAno anos={anos} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          titulo="Patrimônio (contas)"
          valor={formatBRL(patrimonio)}
          icon={Landmark}
          tom="positivo"
          legenda="soma dos saldos"
        />
        <StatCard
          titulo="Faturas em aberto"
          valor={formatBRL(faturas)}
          icon={CardIcon}
          tom="negativo"
          legenda="cartões de crédito"
        />
        <StatCard
          titulo="Balanço líquido"
          valor={formatBRL(liquido)}
          icon={Scale}
          tom={liquido >= 0 ? "positivo" : "negativo"}
          legenda="patrimônio − faturas"
        />
        <StatCard
          titulo={`Resultado ${year}`}
          valor={formatBRL(resumoAno.saldo)}
          icon={resumoAno.saldo >= 0 ? TrendingUp : TrendingDown}
          tom={resumoAno.saldo >= 0 ? "positivo" : "negativo"}
          legenda={`${formatBRL(resumoAno.receitas)} − ${formatBRL(resumoAno.despesas)}`}
        />
      </div>

      <SaldoArea data={evolucao} />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Landmark className="size-4 text-muted-foreground" />
              Contas & Carteiras
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableBody>
                {contas.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span
                          className="size-3 rounded-full"
                          style={{ backgroundColor: c.color }}
                        />
                        <span className="font-medium">{c.name}</span>
                        <Badge variant="secondary">{accountTypeLabel(c.type)}</Badge>
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-mono font-medium">
                      {formatBRL(c.saldo)}
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow className="border-t-2">
                  <TableCell className="font-semibold">Total</TableCell>
                  <TableCell className="text-right font-mono font-bold">
                    {formatBRL(patrimonio)}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <CardIcon className="size-4 text-muted-foreground" />
              Cartões de Crédito
            </CardTitle>
          </CardHeader>
          <CardContent>
            {cartoes.length === 0 ? (
              <div className="flex h-20 items-center justify-center text-sm text-muted-foreground">
                Nenhum cartão cadastrado.
              </div>
            ) : (
              <Table>
                <TableBody>
                  {cartoes.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span
                            className="size-3 rounded-full"
                            style={{ backgroundColor: c.color }}
                          />
                          <span className="font-medium">{c.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-mono font-medium text-destructive">
                        {formatBRL(c.emAberto)}
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="border-t-2">
                    <TableCell className="font-semibold">Total em aberto</TableCell>
                    <TableCell className="text-right font-mono font-bold text-destructive">
                      {formatBRL(faturas)}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Por categoria (ano), separando pago x pendente */}
      <div className="grid gap-4 lg:grid-cols-2">
        <CategoriaTabela
          titulo={`Despesas por Categoria — ${year}`}
          icon={ArrowDownLeft}
          corIcon="text-destructive"
          itens={despCat}
          corValor="text-destructive"
          vazio="Nenhuma despesa no ano."
        />
        <CategoriaTabela
          titulo={`Receitas por Categoria — ${year}`}
          icon={ArrowUpRight}
          corIcon="text-emerald-600 dark:text-emerald-500"
          itens={recCat}
          corValor="text-emerald-600 dark:text-emerald-500"
          vazio="Nenhuma receita no ano."
        />
      </div>
    </div>
  );
}

function CategoriaTabela({
  titulo,
  icon: Icon,
  corIcon,
  itens,
  corValor,
  vazio,
}: {
  titulo: string;
  icon: typeof Landmark;
  corIcon: string;
  itens: CategoriaStatus[];
  corValor: string;
  vazio: string;
}) {
  const totalPago = itens.reduce((s, c) => s + c.pago, 0);
  const totalPendente = itens.reduce((s, c) => s + c.pendente, 0);
  const totalGeral = itens.reduce((s, c) => s + c.total, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Icon className={`size-4 ${corIcon}`} />
          {titulo}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {itens.length === 0 ? (
          <div className="flex h-20 items-center justify-center text-sm text-muted-foreground">
            {vazio}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Categoria</TableHead>
                <TableHead className="text-right">Pago</TableHead>
                <TableHead className="text-right">Pendente</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {itens.map((c) => (
                <TableRow key={c.nome}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span
                        className="size-3 shrink-0 rounded-full"
                        style={{ backgroundColor: c.fill }}
                      />
                      <span className="font-medium">{c.nome}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {c.pago > 0 ? formatBRL(c.pago) : "—"}
                  </TableCell>
                  <TableCell className="text-right font-mono text-amber-600 dark:text-amber-500">
                    {c.pendente > 0 ? formatBRL(c.pendente) : "—"}
                  </TableCell>
                  <TableCell
                    className={`text-right font-mono font-medium ${corValor}`}
                  >
                    {formatBRL(c.total)}
                  </TableCell>
                </TableRow>
              ))}
              <TableRow className="border-t-2">
                <TableCell className="font-semibold">Total</TableCell>
                <TableCell className="text-right font-mono font-semibold">
                  {formatBRL(totalPago)}
                </TableCell>
                <TableCell className="text-right font-mono font-semibold text-amber-600 dark:text-amber-500">
                  {formatBRL(totalPendente)}
                </TableCell>
                <TableCell className={`text-right font-mono font-bold ${corValor}`}>
                  {formatBRL(totalGeral)}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
