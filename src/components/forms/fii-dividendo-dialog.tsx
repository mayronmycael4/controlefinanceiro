"use client";

import { useState, useTransition } from "react";
import { Plus, Loader2, Coins } from "lucide-react";
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
import { DatePicker } from "@/components/ui/date-picker";
import { createFiiDividend } from "@/lib/actions";

function hoje() {
  return new Date().toISOString().slice(0, 10);
}

export function FiiDividendoDialog({ fiiId }: { fiiId: string }) {
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    start(async () => {
      const res = await createFiiDividend(fiiId, fd);
      if (res.ok) {
        toast.success("Rendimento registrado.");
        setOpen(false);
        form.reset();
      } else toast.error(res.error ?? "Erro ao registrar.");
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Coins className="size-4" />
          Registrar rendimento
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <form onSubmit={onSubmit}>
          <DialogHeader>
            <DialogTitle>Registrar rendimento</DialogTitle>
            <DialogDescription>Dividendo recebido deste FII.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="fii-div-amount">Valor recebido (R$)</Label>
              <Input
                id="fii-div-amount"
                name="amount"
                type="number"
                min="0"
                step="0.01"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="fii-div-date">Data (mês de referência)</Label>
              <DatePicker id="fii-div-date" name="date" defaultValue={hoje()} />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={pending} className="w-full">
              {pending && <Loader2 className="size-4 animate-spin" />}
              <Plus className="size-4" />
              Registrar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
