"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Receipt, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { payCardInvoice } from "@/lib/actions";
import { formatBRL } from "@/lib/format";

type Opt = { id: string; name: string; saldo?: number };

export function PagarFaturaDialog({
  card,
  contas,
  fullWidth = false,
  open: openProp,
  onOpenChange,
  showTrigger = true,
}: {
  card: { id: string; name: string; aPagar: number };
  contas: Opt[];
  fullWidth?: boolean;
  open?: boolean;
  onOpenChange?: (o: boolean) => void;
  showTrigger?: boolean;
}) {
  const controlled = openProp !== undefined;
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlled ? openProp : internalOpen;
  const setOpen = (o: boolean) =>
    controlled ? onOpenChange?.(o) : setInternalOpen(o);
  const router = useRouter();
  const [pending, start] = useTransition();
  const [accountId, setAccountId] = useState(contas[0]?.id ?? "");
  const contaSel = contas.find((c) => c.id === accountId);
  const saldoInsuficiente =
    contaSel?.saldo !== undefined && contaSel.saldo < card.aPagar;

  function onConfirm() {
    if (!accountId) {
      toast.error("Escolha a conta de pagamento.");
      return;
    }
    const fd = new FormData();
    fd.set("cardId", card.id);
    fd.set("accountId", accountId);
    start(async () => {
      const res = await payCardInvoice(fd);
      if (res.ok) {
        toast.success("Fatura paga.");
        setOpen(false);
        router.refresh();
      } else toast.error(res.error ?? "Erro ao pagar.");
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {showTrigger && (
        <DialogTrigger asChild>
          <Button className={fullWidth ? "w-full justify-between" : ""}>
            <span className="flex items-center gap-2">
              <Receipt className="size-4" />
              Pagar fatura
            </span>
            <span className="font-semibold">{formatBRL(card.aPagar)}</span>
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Pagar fatura — {card.name}</DialogTitle>
          <DialogDescription>
            Quita a fatura em aberto e desconta da conta escolhida.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="rounded-lg border p-3">
            <div className="text-sm text-muted-foreground">Valor da fatura</div>
            <div className="text-2xl font-bold">{formatBRL(card.aPagar)}</div>
          </div>
          <div className="grid gap-2">
            <Label>Pagar com</Label>
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
            Confirmar pagamento
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
