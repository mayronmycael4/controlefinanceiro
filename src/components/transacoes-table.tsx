"use client";

import { useState, useTransition } from "react";
import {
  ArrowDownLeft,
  ArrowUpRight,
  MoreHorizontal,
  Pencil,
  Trash2,
  CheckCircle2,
  Clock,
  CreditCard,
  Wallet,
  Repeat,
  Receipt,
} from "lucide-react";
import { toast } from "sonner";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { formatBRL } from "@/lib/format";
import {
  deleteTransaction,
  deleteInstallmentGroup,
  toggleTransactionStatus,
} from "@/lib/actions";
import { TransacaoDialog } from "@/components/forms/nova-transacao";
import { PagarTransacaoDialog } from "@/components/forms/pagar-transacao-dialog";

type Opt = { id: string; name: string; kind?: string };

export type TxRow = {
  id: string;
  description: string;
  amount: number;
  kind: string;
  status: string;
  date: Date | string;
  purchaseDate: Date | string | null;
  categoryId: string | null;
  accountId: string | null;
  creditCardId: string | null;
  recurringId: string | null;
  installmentId: string | null;
  isTransfer: boolean;
  tags?: string;
  category: { name: string } | null;
  account: { name: string } | null;
  creditCard: { name: string } | null;
};

function formatData(d: Date | string) {
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}

export function TransacoesTable({
  items,
  showActions = true,
  categorias = [],
  contas = [],
  cartoes = [],
}: {
  items: TxRow[];
  showActions?: boolean;
  categorias?: Opt[];
  contas?: Opt[];
  cartoes?: Opt[];
}) {
  if (items.length === 0) {
    return (
      <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
        Nenhuma transação encontrada para os filtros selecionados.
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Descrição</TableHead>
          <TableHead className="hidden sm:table-cell">Categoria</TableHead>
          <TableHead className="hidden lg:table-cell">Pagamento</TableHead>
          <TableHead className="hidden md:table-cell">Data</TableHead>
          <TableHead className="hidden sm:table-cell">Status</TableHead>
          <TableHead className="text-right">Valor</TableHead>
          {showActions && <TableHead className="w-8" />}
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((t) => {
          const ehReceita = t.kind === "receita";
          const ehTransfer = t.isTransfer;
          const pagamento = t.creditCard?.name ?? t.account?.name ?? "—";
          return (
            <TableRow key={t.id}>
              <TableCell>
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      "flex size-8 shrink-0 items-center justify-center rounded-full",
                      ehTransfer
                        ? "bg-muted text-muted-foreground"
                        : ehReceita
                          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400"
                          : "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400"
                    )}
                  >
                    {ehTransfer ? (
                      <Receipt className="size-4" />
                    ) : ehReceita ? (
                      <ArrowUpRight className="size-4" />
                    ) : (
                      <ArrowDownLeft className="size-4" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="truncate font-medium">{t.description}</span>
                      {ehTransfer && (
                        <span
                          className="flex items-center gap-0.5 rounded bg-muted px-1 py-0.5 text-[10px] font-medium text-muted-foreground"
                          title="Pagamento de fatura (transferência)"
                        >
                          fatura
                        </span>
                      )}
                      {t.recurringId && (
                        <span
                          className="flex items-center gap-0.5 rounded bg-muted px-1 py-0.5 text-[10px] font-medium text-muted-foreground"
                          title="Gerada por recorrente"
                        >
                          <Repeat className="size-2.5" />
                          fixa
                        </span>
                      )}
                    </div>
                    {t.purchaseDate && (
                      <div className="text-xs text-muted-foreground">
                        Compra em {formatData(t.purchaseDate)}
                      </div>
                    )}
                    {t.tags && (
                      <div className="mt-0.5 flex flex-wrap gap-1">
                        {t.tags.split(",").filter(Boolean).map((tag) => (
                          <span
                            key={tag}
                            className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
                    <div className="text-xs text-muted-foreground sm:hidden">
                      {t.category?.name ?? "Sem categoria"} · {formatData(t.date)}
                    </div>
                  </div>
                </div>
              </TableCell>
              <TableCell className="hidden sm:table-cell">
                <Badge variant="secondary">
                  {ehTransfer ? "Fatura cartão" : t.category?.name ?? "—"}
                </Badge>
              </TableCell>
              <TableCell className="hidden lg:table-cell">
                <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  {t.creditCard ? (
                    <CreditCard className="size-3.5" />
                  ) : (
                    <Wallet className="size-3.5" />
                  )}
                  {pagamento}
                </span>
              </TableCell>
              <TableCell className="hidden text-muted-foreground md:table-cell">
                {formatData(t.date)}
              </TableCell>
              <TableCell className="hidden sm:table-cell">
                <Badge
                  variant={t.status === "pago" ? "outline" : "secondary"}
                  className={cn(
                    "gap-1",
                    t.status === "pendente" &&
                      "text-amber-600 dark:text-amber-500"
                  )}
                >
                  {t.status === "pago" ? (
                    <CheckCircle2 className="size-3" />
                  ) : (
                    <Clock className="size-3" />
                  )}
                  {t.status === "pago" ? "Pago" : "Pendente"}
                </Badge>
              </TableCell>
              <TableCell
                className={cn(
                  "text-right font-mono font-medium",
                  ehTransfer
                    ? "text-muted-foreground"
                    : ehReceita
                      ? "text-emerald-600 dark:text-emerald-500"
                      : "text-foreground"
                )}
              >
                {ehReceita ? "+" : "−"}
                {formatBRL(t.amount)}
              </TableCell>
              {showActions && (
                <TableCell>
                  <RowActions
                    tx={t}
                    categorias={categorias}
                    contas={contas}
                    cartoes={cartoes}
                  />
                </TableCell>
              )}
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}

function RowActions({
  tx,
  categorias,
  contas,
  cartoes,
}: {
  tx: TxRow;
  categorias: Opt[];
  contas: Opt[];
  cartoes: Opt[];
}) {
  const [pending, start] = useTransition();
  const [editOpen, setEditOpen] = useState(false);
  const [delAllOpen, setDelAllOpen] = useState(false);
  const [pagarOpen, setPagarOpen] = useState(false);

  // Conta pode ser paga escolhendo a conta (despesa/receita fora do cartão)
  const podeQuitar = tx.status === "pendente" && !tx.creditCardId && !tx.isTransfer;

  const agrupada = tx.installmentId != null;
  // "parcela" p/ cartão, "lançamento" p/ repetição de conta
  const termo = tx.creditCardId ? "parcela" : "lançamento";
  const termoPlural = tx.creditCardId ? "parcelas" : "lançamentos";
  // Nº total a partir do sufixo "(i/N)" da descrição
  const totalParcelas = tx.description.match(/\((\d+)\/(\d+)\)\s*$/)?.[2];

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="size-8" disabled={pending}>
            <MoreHorizontal className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={() => setEditOpen(true)}>
            <Pencil className="size-4" />
            Editar
          </DropdownMenuItem>
          {podeQuitar ? (
            <DropdownMenuItem onSelect={() => setPagarOpen(true)}>
              <Wallet className="size-4" />
              {tx.kind === "receita" ? "Receber" : "Pagar"}
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem
              onClick={() =>
                start(async () => {
                  await toggleTransactionStatus(tx.id);
                  toast.success(
                    tx.status === "pago"
                      ? "Marcada como pendente."
                      : "Marcada como paga."
                  );
                })
              }
            >
              {tx.status === "pago" ? (
                <>
                  <Clock className="size-4" />
                  Marcar pendente
                </>
              ) : (
                <>
                  <CheckCircle2 className="size-4" />
                  Marcar paga
                </>
              )}
            </DropdownMenuItem>
          )}
          <DropdownMenuItem
            variant="destructive"
            onClick={() =>
              start(async () => {
                await deleteTransaction(tx.id);
                toast.success(agrupada ? `${termo[0].toUpperCase()}${termo.slice(1)} excluído.` : "Transação excluída.");
              })
            }
          >
            <Trash2 className="size-4" />
            {agrupada ? `Excluir só este ${termo}` : "Excluir"}
          </DropdownMenuItem>
          {agrupada && (
            <DropdownMenuItem
              variant="destructive"
              onSelect={() => setDelAllOpen(true)}
            >
              <Trash2 className="size-4" />
              Excluir todos os {termoPlural}
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {agrupada && (
        <AlertDialog open={delAllOpen} onOpenChange={setDelAllOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                Excluir todos os {totalParcelas ?? ""} {termoPlural}?
              </AlertDialogTitle>
              <AlertDialogDescription>
                Isso remove todos os {termoPlural} deste grupo (pagos e pendentes).
                Não pode ser desfeito.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                disabled={pending}
                onClick={(e) => {
                  e.preventDefault();
                  start(async () => {
                    await deleteInstallmentGroup(tx.installmentId!);
                    toast.success("Excluídos.");
                    setDelAllOpen(false);
                  });
                }}
              >
                Excluir todas
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      {pagarOpen && (
        <PagarTransacaoDialog
          open={pagarOpen}
          onOpenChange={setPagarOpen}
          transacao={{
            id: tx.id,
            description: tx.description,
            amount: tx.amount,
            kind: tx.kind,
            accountId: tx.accountId,
          }}
          contas={contas}
        />
      )}

      {editOpen && (
        <TransacaoDialog
          categorias={categorias}
          contas={contas}
          cartoes={cartoes}
          transacao={{
            id: tx.id,
            description: tx.description,
            amount: tx.amount,
            kind: tx.kind,
            status: tx.status,
            date: tx.date,
            purchaseDate: tx.purchaseDate,
            categoryId: tx.categoryId,
            accountId: tx.accountId,
            creditCardId: tx.creditCardId,
            tags: tx.tags,
          }}
          open={editOpen}
          onOpenChange={setEditOpen}
          showTrigger={false}
        />
      )}
    </>
  );
}
