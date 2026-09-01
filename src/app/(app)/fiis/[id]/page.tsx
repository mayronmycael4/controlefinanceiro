import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, Landmark } from "lucide-react";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { FiiDialog } from "@/components/forms/novo-fii";
import { FiiTransacaoDialog } from "@/components/forms/fii-transacao-dialog";
import { FiiDividendoDialog } from "@/components/forms/fii-dividendo-dialog";
import { AtualizarPrecoFii } from "@/components/forms/atualizar-preco-fii";
import { ExcluirItem } from "@/components/excluir-item";
import { getFiiById } from "@/lib/queries";
import { formatBRL } from "@/lib/format";

export default async function FiiPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const fii = await getFiiById(id);
  if (!fii) notFound();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="size-8" asChild>
            <Link href="/fiis" aria-label="Voltar">
              <ChevronLeft className="size-4" />
            </Link>
          </Button>
          <span
            className="flex size-10 items-center justify-center rounded-lg text-white"
            style={{ backgroundColor: fii.color }}
          >
            <Landmark className="size-5" />
          </span>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{fii.ticker}</h1>
            <p className="text-muted-foreground">{fii.name || "Fundo Imobiliário"}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <AtualizarPrecoFii id={fii.id} />
          <FiiDialog
            fii={{
              id: fii.id,
              ticker: fii.ticker,
              name: fii.name,
              color: fii.color,
              dy: fii.dy,
              pvp: fii.pvp,
            }}
          />
          <ExcluirItem kind="fii" id={fii.id} nome={fii.ticker} />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Cotas
            </CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">{fii.quantidade}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Preço médio
            </CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">
            {formatBRL(fii.precoMedio)}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Cotação atual
            </CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">
            {formatBRL(fii.currentPrice)}
            {fii.priceUpdatedAt && (
              <p className="mt-1 text-xs font-normal text-muted-foreground">
                Atualizado em {fii.priceUpdatedAt.toLocaleDateString("pt-BR")}
              </p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Lucro/prejuízo
            </CardTitle>
          </CardHeader>
          <CardContent
            className={
              fii.lucro >= 0
                ? "text-2xl font-bold text-emerald-600 dark:text-emerald-500"
                : "text-2xl font-bold text-destructive"
            }
          >
            {formatBRL(fii.lucro)}
          </CardContent>
        </Card>
      </div>

      {(fii.dy != null || fii.pvp != null) && (
        <div className="flex gap-2">
          {fii.dy != null && <Badge variant="secondary">DY {fii.dy.toFixed(1)}%</Badge>}
          {fii.pvp != null && <Badge variant="secondary">P/VP {fii.pvp.toFixed(2)}</Badge>}
        </div>
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2">
          <div>
            <CardTitle>Compras e vendas</CardTitle>
            <CardDescription>Histórico de operações com as cotas.</CardDescription>
          </div>
          <FiiTransacaoDialog fiiId={fii.id} />
        </CardHeader>
        <CardContent>
          {fii.transactions.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Nenhuma operação registrada.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead className="text-right">Quantidade</TableHead>
                  <TableHead className="text-right">Preço</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {fii.transactions.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell>{t.date.toLocaleDateString("pt-BR")}</TableCell>
                    <TableCell>
                      <Badge variant={t.kind === "venda" ? "destructive" : "secondary"}>
                        {t.kind === "venda" ? "Venda" : "Compra"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">{t.quantity}</TableCell>
                    <TableCell className="text-right">{formatBRL(t.price)}</TableCell>
                    <TableCell className="text-right font-medium">
                      {formatBRL(t.quantity * t.price)}
                    </TableCell>
                    <TableCell>
                      <ExcluirItem kind="fiiTransaction" id={t.id} nome="esta operação" />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2">
          <div>
            <CardTitle>Rendimentos recebidos</CardTitle>
            <CardDescription>
              Total recebido: <strong>{formatBRL(fii.totalDividendos)}</strong>
            </CardDescription>
          </div>
          <FiiDividendoDialog fiiId={fii.id} />
        </CardHeader>
        <CardContent>
          {fii.dividends.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Nenhum rendimento registrado.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {fii.dividends.map((d) => (
                  <TableRow key={d.id}>
                    <TableCell>{d.date.toLocaleDateString("pt-BR")}</TableCell>
                    <TableCell className="text-right font-medium">
                      {formatBRL(d.amount)}
                    </TableCell>
                    <TableCell>
                      <ExcluirItem kind="fiiDividend" id={d.id} nome="este rendimento" />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
