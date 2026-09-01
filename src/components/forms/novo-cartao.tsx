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
import { createCreditCard, updateCreditCard } from "@/lib/actions";
import { CARD_BRANDS, CHART_COLORS } from "@/lib/constants";

export type CartaoEdit = {
  id: string;
  name: string;
  brand: string;
  limit: number;
  closingDay: number;
  dueDay: number;
  color: string;
};

export function CartaoDialog({ cartao }: { cartao?: CartaoEdit }) {
  const isEdit = !!cartao;
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const [brand, setBrand] = useState(cartao?.brand || "Visa");
  const [color, setColor] = useState(cartao?.color ?? CHART_COLORS[1]);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    fd.set("brand", brand);
    fd.set("color", color);
    start(async () => {
      const res = isEdit
        ? await updateCreditCard(cartao!.id, fd)
        : await createCreditCard(fd);
      if (res.ok) {
        toast.success(isEdit ? "Cartão atualizado." : "Cartão adicionado.");
        setOpen(false);
        if (!isEdit) {
          form.reset();
          setBrand("Visa");
          setColor(CHART_COLORS[1]);
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
            aria-label="Editar cartão"
          >
            <Pencil className="size-4" />
          </Button>
        ) : (
          <Button variant="outline">
            <Plus className="size-4" />
            Novo cartão
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={onSubmit}>
          <DialogHeader>
            <DialogTitle>{isEdit ? "Editar cartão" : "Novo cartão de crédito"}</DialogTitle>
            <DialogDescription>Limite, fechamento e vencimento.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="card-name">Nome</Label>
              <Input
                id="card-name"
                name="name"
                placeholder="Ex.: Nubank Ultravioleta"
                defaultValue={cartao?.name ?? ""}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label>Bandeira</Label>
                <Select value={brand} onValueChange={setBrand}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CARD_BRANDS.map((b) => (
                      <SelectItem key={b} value={b}>
                        {b}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="card-limit">Limite (R$)</Label>
                <Input
                  id="card-limit"
                  name="limit"
                  type="number"
                  step="0.01"
                  min="0"
                  defaultValue={cartao?.limit ?? "0"}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label htmlFor="closingDay">Dia de fechamento</Label>
                <Input
                  id="closingDay"
                  name="closingDay"
                  type="number"
                  min="1"
                  max="31"
                  defaultValue={cartao?.closingDay ?? "1"}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="dueDay">Dia de vencimento</Label>
                <Input
                  id="dueDay"
                  name="dueDay"
                  type="number"
                  min="1"
                  max="31"
                  defaultValue={cartao?.dueDay ?? "10"}
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Cor</Label>
              <ColorPicker value={color} onChange={setColor} />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={pending} className="w-full">
              {pending && <Loader2 className="size-4 animate-spin" />}
              {isEdit ? "Salvar alterações" : "Salvar cartão"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function NovoCartao() {
  return <CartaoDialog />;
}
