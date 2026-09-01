"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { settleTransaction } from "@/lib/actions";
import { formatBRL } from "@/lib/format";
import { AlertTriangle } from "lucide-react";

type Opt = { id: string; name: string; saldo?: number };

export function PagarTransacaoDialog({
  open,
  onOpenChange,
  transacao,
  contas,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  transacao: {
    id: string;
    description: string;
    amount: number;
    kind: string;
    accountId: string | null;
  };
  contas: Opt[];
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [accountId, setAccountId] = useState(
    transacao.accountId ?? contas[0]?.id ?? ""
  );
  const ehReceita = transacao.kind === "receita";
  const contaSel = contas.find((c) => c.id === accountId);
  const saldoInsuficiente =
    !ehReceita &&
    contaSel?.saldo !== undefined &&
    contaSel.saldo < transacao.amount;

  function onConfirm() {
    if (!accountId) {
      toast.error("Escolha uma conta.");
      return;
    }
    start(async () => {
      const res = await settleTransaction(transacao.id, accountId);
      if (res.ok) {
        toast.success(ehReceita ? "Recebimento confirmado." : "Conta paga.");
        onOpenChange(false);
        router.refresh();
      } else toast.error(res.error ?? "Erro.");
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{ehReceita ? "Receber" : "Pagar"} — {transacao.description}</DialogTitle>
          <DialogDescription>
            {ehReceita
              ? "Escolha em qual conta o valor entra."
              : "Escolha de qual conta o valor sai."}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-3 py-2">
          <div className="rounded-lg border p-3">
            <div className="text-sm text-muted-foreground">Valor</div>
            <div className="text-2xl font-bold">{formatBRL(transacao.amount)}</div>
          </div>
          <div className="grid gap-2">
            <Label>{ehReceita ? "Receber em" : "Pagar com"}</Label>
            <Select value={accountId} onValueChange={setAccountId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione a conta" />
              </SelectTrigger>
              <SelectContent>
                {contas.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                    {c.saldo !== undefined ? ` · ${formatBRL(c.saldo)}` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {saldoInsuficiente && (
            <div className="flex items-start gap-2 rounded-lg border border-amber-500/40 bg-amber-50 p-3 text-xs text-amber-700 dark:bg-amber-950/40 dark:text-amber-400">
              <AlertTriangle className="mt-0.5 size-4 shrink-0" />
              <span>
                Saldo insuficiente nesta conta ({formatBRL(contaSel?.saldo ?? 0)}).
                A conta ficará negativa se confirmar.
              </span>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button onClick={onConfirm} disabled={pending} className="w-full">
            {pending && <Loader2 className="size-4 animate-spin" />}
            {ehReceita ? "Confirmar recebimento" : "Confirmar pagamento"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
