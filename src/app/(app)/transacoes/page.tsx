import { ArrowUpRight, ArrowDownLeft, Wallet, Clock } from "lucide-react";

import { TransacoesTable } from "@/components/transacoes-table";
import { FiltrosTransacoes } from "@/components/filtros-transacoes";
import { NovaTransacao } from "@/components/forms/nova-transacao";
import { NovaCategoria } from "@/components/forms/nova-categoria";
import { ExportarTransacoes } from "@/components/exportar-transacoes";
import { ImportarTransacoes } from "@/components/importar-transacoes";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  getAvailableYears,
  parseTxFilter,
  listTransactions,
  getSummary,
  getCategories,
  getAccounts,
  getCreditCards,
  getAllTags,
  materializeRecurring,
} from "@/lib/queries";
import { formatBRL } from "@/lib/format";

export default async function TransacoesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const now = new Date();
  await materializeRecurring(now.getMonth() + 1, now.getFullYear());

  const anos = await getAvailableYears();
  // Padrão: ano e mês atuais (mês "all" mostra o ano inteiro).
  const filter = parseTxFilter(sp, now.getFullYear(), now.getMonth() + 1);

  const [items, summary, categorias, contas, cartoes, tags] = await Promise.all([
    listTransactions(filter),
    getSummary(filter),
    getCategories(),
    getAccounts(),
    getCreditCards(),
    getAllTags(),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Transações</h1>
          <p className="text-muted-foreground">
            Filtre por período, tipo e status.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <ExportarTransacoes items={items} nomeArquivo="transacoes" />
          <ImportarTransacoes contas={contas} />
          <NovaCategoria />
          <NovaTransacao categorias={categorias} contas={contas} cartoes={cartoes} />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MiniStat titulo="Receitas" valor={formatBRL(summary.receitas)} icon={ArrowUpRight} cor="text-emerald-600 dark:text-emerald-500" />
        <MiniStat titulo="Despesas" valor={formatBRL(summary.despesas)} icon={ArrowDownLeft} cor="text-destructive" />
        <MiniStat titulo="Saldo do período" valor={formatBRL(summary.saldo)} icon={Wallet} cor="text-foreground" />
        <MiniStat
          titulo="Pendentes"
          valor={formatBRL(summary.despesasPendentes + summary.receitasPendentes)}
          icon={Clock}
          cor="text-amber-600 dark:text-amber-500"
        />
      </div>

      <Card>
        <CardHeader className="gap-4">
          <div className="flex items-center justify-between">
            <CardTitle>{items.length} transações</CardTitle>
          </div>
          <FiltrosTransacoes
            anos={anos}
            contas={contas}
            cartoes={cartoes}
            tags={tags}
          />
        </CardHeader>
        <CardContent>
          <TransacoesTable
            items={items}
            categorias={categorias}
            contas={contas}
            cartoes={cartoes}
          />
        </CardContent>
      </Card>
    </div>
  );
}

function MiniStat({
  titulo,
  valor,
  icon: Icon,
  cor,
}: {
  titulo: string;
  valor: string;
  icon: typeof Wallet;
  cor: string;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 py-2">
        <div className="flex size-10 items-center justify-center rounded-lg bg-muted">
          <Icon className={`size-5 ${cor}`} />
        </div>
        <div className="min-w-0">
          <div className="text-sm text-muted-foreground">{titulo}</div>
          <div className={`truncate text-lg font-bold ${cor}`}>{valor}</div>
        </div>
      </CardContent>
    </Card>
  );
}
