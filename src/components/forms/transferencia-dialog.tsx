"use client";

import { useState, useTransition } from "react";
import { ArrowLeftRight, Loader2, ArrowRight } from "lucide-react";
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
import { createTransfer } from "@/lib/actions";

type Opt = { id: string; name: string };

export function TransferenciaDialog({ contas }: { contas: Opt[] }) {
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const [from, setFrom] = useState(contas[0]?.id ?? "");
  const [to, setTo] = useState(contas[1]?.id ?? "");
  const [hoje] = useState(() => new Date().toISOString().slice(0, 10));

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    fd.set("fromAccountId", from);
    fd.set("toAccountId", to);
    start(async () => {
      const res = await createTransfer(fd);
      if (res.ok) {
        toast.success("Transferência realizada.");
        setOpen(false);
        form.reset();
      } else toast.error(res.error ?? "Erro ao transferir.");
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <ArrowLeftRight className="size-4" />
          Transferir
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={onSubmit}>
          <DialogHeader>
            <DialogTitle>Transferir entre contas</DialogTitle>
            <DialogDescription>
              Move dinheiro entre suas contas (não conta como despesa/receita).
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-[1fr_auto_1fr] items-end gap-2">
              <div className="grid gap-2">
                <Label>De</Label>
                <Select value={from} onValueChange={setFrom}>
                  <SelectTrigger>
                    <SelectValue placeholder="Origem" />
                  </SelectTrigger>
                  <SelectContent>
                    {contas.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <ArrowRight className="mb-2.5 size-4 text-muted-foreground" />
              <div className="grid gap-2">
                <Label>Para</Label>
                <Select value={to} onValueChange={setTo}>
                  <SelectTrigger>
                    <SelectValue placeholder="Destino" />
                  </SelectTrigger>
                  <SelectContent>
                    {contas.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label htmlFor="tr-amount">Valor (R$)</Label>
                <Input
                  id="tr-amount"
                  name="amount"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0,00"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="tr-date">Data</Label>
                <DatePicker id="tr-date" name="date" defaultValue={hoje} required />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={pending} className="w-full">
              {pending && <Loader2 className="size-4 animate-spin" />}
              Confirmar transferência
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
