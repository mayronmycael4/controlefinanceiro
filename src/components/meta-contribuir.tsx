"use client";

import { useState, useTransition } from "react";
import { Loader2, PiggyBank } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { addToGoal } from "@/lib/actions";

export function MetaContribuir({ id, nome }: { id: string; nome: string }) {
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const [valor, setValor] = useState("");

  function submit(sinal: 1 | -1) {
    const n = parseFloat(valor);
    if (!(n > 0)) {
      toast.error("Informe um valor válido.");
      return;
    }
    start(async () => {
      const res = await addToGoal(id, sinal * n);
      if (res.ok) {
        toast.success(sinal > 0 ? "Valor guardado." : "Valor retirado.");
        setOpen(false);
        setValor("");
      } else toast.error(res.error ?? "Erro.");
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <PiggyBank className="size-4" />
          Guardar
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-xs">
        <DialogHeader>
          <DialogTitle>{nome}</DialogTitle>
          <DialogDescription>Guardar ou retirar um valor da meta.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-2 py-2">
          <Label htmlFor="meta-valor">Valor (R$)</Label>
          <Input
            id="meta-valor"
            type="number"
            step="0.01"
            min="0"
            placeholder="0,00"
            value={valor}
            onChange={(e) => setValor(e.target.value)}
            autoFocus
          />
        </div>
        <DialogFooter className="flex-row gap-2">
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            disabled={pending}
            onClick={() => submit(-1)}
          >
            Retirar
          </Button>
          <Button
            type="button"
            className="flex-1"
            disabled={pending}
            onClick={() => submit(1)}
          >
            {pending && <Loader2 className="size-4 animate-spin" />}
            Guardar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
