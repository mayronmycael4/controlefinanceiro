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
import { setBudget } from "@/lib/actions";

const TOTAL = "__total__";

export function DefinirOrcamento({
  categorias,
  month,
  year,
}: {
  categorias: { id: string; name: string }[];
  month: number;
  year: number;
}) {
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const [target, setTarget] = useState(TOTAL);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    fd.set("categoryId", target === TOTAL ? "" : target);
    fd.set("month", String(month));
    fd.set("year", String(year));
    start(async () => {
      const res = await setBudget(fd);
      if (res.ok) {
        toast.success("Orçamento definido.");
        setOpen(false);
        form.reset();
        setTarget(TOTAL);
      } else toast.error(res.error ?? "Erro ao salvar.");
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="size-4" />
          Definir orçamento
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <form onSubmit={onSubmit}>
          <DialogHeader>
            <DialogTitle>Definir orçamento</DialogTitle>
            <DialogDescription>
              Limite total do mês ou por categoria.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Aplicar em</Label>
              <Select value={target} onValueChange={setTarget}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={TOTAL}>Orçamento total do mês</SelectItem>
                  {categorias.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="budget-amount">Valor limite (R$)</Label>
              <Input
                id="budget-amount"
                name="amount"
                type="number"
                step="0.01"
                min="0"
                placeholder="0,00"
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={pending} className="w-full">
              {pending && <Loader2 className="size-4 animate-spin" />}
              Salvar orçamento
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
