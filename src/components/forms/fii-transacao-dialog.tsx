"use client";

import { useState, useTransition } from "react";
import { Plus, Loader2 } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import { createFiiTransaction } from "@/lib/actions";

function hoje() {
  return new Date().toISOString().slice(0, 10);
}

export function FiiTransacaoDialog({ fiiId }: { fiiId: string }) {
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const [kind, setKind] = useState("compra");

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    fd.set("kind", kind);
    start(async () => {
      const res = await createFiiTransaction(fiiId, fd);
      if (res.ok) {
        toast.success("Operação registrada.");
        setOpen(false);
        form.reset();
        setKind("compra");
      } else toast.error(res.error ?? "Erro ao registrar.");
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Plus className="size-4" />
          Compra / venda
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={onSubmit}>
          <DialogHeader>
            <DialogTitle>Registrar operação</DialogTitle>
            <DialogDescription>Compra ou venda de cotas.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Tipo</Label>
              <Select value={kind} onValueChange={setKind}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="compra">Compra</SelectItem>
                  <SelectItem value="venda">Venda</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label htmlFor="fii-tx-qty">Quantidade de cotas</Label>
                <Input
                  id="fii-tx-qty"
                  name="quantity"
                  type="number"
                  min="1"
                  step="1"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="fii-tx-price">Preço unitário (R$)</Label>
                <Input
                  id="fii-tx-price"
                  name="price"
                  type="number"
                  min="0"
                  step="0.01"
                  required
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="fii-tx-date">Data</Label>
              <DatePicker id="fii-tx-date" name="date" defaultValue={hoje()} />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={pending} className="w-full">
              {pending && <Loader2 className="size-4 animate-spin" />}
              Registrar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
