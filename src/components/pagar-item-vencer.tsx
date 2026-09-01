"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { PagarTransacaoDialog } from "@/components/forms/pagar-transacao-dialog";
import { PagarFaturaDialog } from "@/components/forms/pagar-fatura-dialog";
import type { ItemVencer } from "@/lib/queries";

type Opt = { id: string; name: string; saldo?: number };

export function PagarItemVencer({
  item,
  contas,
}: {
  item: ItemVencer;
  contas: Opt[];
}) {
  const [open, setOpen] = useState(false);

  // Fatura: só a vigente é pagável direto daqui
  if (item.tipo === "fatura") {
    if (!item.pagavelAgora || !item.cardId) return null;
    return (
      <>
        <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
          Pagar
        </Button>
        {open && (
          <PagarFaturaDialog
            card={{ id: item.cardId, name: item.detalhe ?? "Cartão", aPagar: item.amount }}
            contas={contas}
            open={open}
            onOpenChange={setOpen}
            showTrigger={false}
          />
        )}
      </>
    );
  }

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        {item.kind === "receita" ? "Receber" : "Pagar"}
      </Button>
      {open && (
        <PagarTransacaoDialog
          open={open}
          onOpenChange={setOpen}
          transacao={{
            id: item.id,
            description: item.description,
            amount: item.amount,
            kind: item.kind,
            accountId: item.accountId,
          }}
          contas={contas}
        />
      )}
    </>
  );
}
