"use client";

import { useState, useTransition } from "react";
import { Plus, Loader2, Pencil } from "lucide-react";
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
import { ColorPicker } from "@/components/color-picker";
import { createAccount, updateAccount } from "@/lib/actions";
import { ACCOUNT_TYPES, CHART_COLORS } from "@/lib/constants";

export type ContaEdit = {
  id: string;
  name: string;
  type: string;
  initialBalance: number;
  color: string;
};

export function ContaDialog({ conta }: { conta?: ContaEdit }) {
  const isEdit = !!conta;
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const [type, setType] = useState(conta?.type ?? "carteira");
  const [color, setColor] = useState(conta?.color ?? CHART_COLORS[0]);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    fd.set("type", type);
    fd.set("color", color);
    start(async () => {
      const res = isEdit
        ? await updateAccount(conta!.id, fd)
        : await createAccount(fd);
      if (res.ok) {
        toast.success(isEdit ? "Conta atualizada." : "Conta adicionada.");
        setOpen(false);
        if (!isEdit) {
          form.reset();
          setType("carteira");
          setColor(CHART_COLORS[0]);
        }
      } else toast.error(res.error ?? "Erro ao salvar.");
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {isEdit ? (
          <Button
            variant="ghost"
            size="icon"
            className="size-8 text-muted-foreground hover:text-foreground"
            aria-label="Editar conta"
          >
            <Pencil className="size-4" />
          </Button>
        ) : (
          <Button variant="outline">
            <Plus className="size-4" />
            Nova conta
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={onSubmit}>
          <DialogHeader>
            <DialogTitle>{isEdit ? "Editar conta" : "Nova conta / carteira"}</DialogTitle>
            <DialogDescription>Onde o dinheiro fica guardado.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="acc-name">Nome</Label>
              <Input
                id="acc-name"
                name="name"
                placeholder="Ex.: Conta Nubank"
                defaultValue={conta?.name ?? ""}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label>Tipo</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ACCOUNT_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Cor</Label>
              <ColorPicker value={color} onChange={setColor} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="acc-balance">Saldo inicial (R$)</Label>
              <Input
                id="acc-balance"
                name="initialBalance"
                type="number"
                step="0.01"
                defaultValue={conta?.initialBalance ?? "0"}
              />
              <p className="text-xs text-muted-foreground">
                Ponto de partida. O saldo atual soma receitas e subtrai despesas pagas.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={pending} className="w-full">
              {pending && <Loader2 className="size-4 animate-spin" />}
              {isEdit ? "Salvar alterações" : "Salvar conta"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function NovaConta() {
  return <ContaDialog />;
}
