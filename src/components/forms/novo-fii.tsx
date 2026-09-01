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
import { ColorPicker } from "@/components/color-picker";
import { createFii, updateFii } from "@/lib/actions";
import { CHART_COLORS } from "@/lib/constants";

export type FiiEdit = {
  id: string;
  ticker: string;
  name: string;
  color: string;
  dy: number | null;
  pvp: number | null;
};

export function FiiDialog({ fii }: { fii?: FiiEdit }) {
  const isEdit = !!fii;
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const [color, setColor] = useState(fii?.color ?? CHART_COLORS[0]);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    fd.set("color", color);
    start(async () => {
      const res = isEdit
        ? await updateFii(fii!.id, fd)
        : await createFii(fd);
      if (res.ok) {
        toast.success(isEdit ? "FII atualizado." : "FII adicionado.");
        setOpen(false);
        if (!isEdit) {
          form.reset();
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
            aria-label="Editar FII"
          >
            <Pencil className="size-4" />
          </Button>
        ) : (
          <Button variant="outline">
            <Plus className="size-4" />
            Novo FII
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={onSubmit}>
          <DialogHeader>
            <DialogTitle>{isEdit ? "Editar FII" : "Novo Fundo Imobiliário"}</DialogTitle>
            <DialogDescription>
              Ticker, nome e indicadores do fundo.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="fii-ticker">Ticker</Label>
              <Input
                id="fii-ticker"
                name="ticker"
                placeholder="Ex.: MXRF11"
                defaultValue={fii?.ticker ?? ""}
                disabled={isEdit}
                required
                className="uppercase"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="fii-name">Nome (opcional)</Label>
              <Input
                id="fii-name"
                name="name"
                placeholder="Ex.: Maxi Renda FII"
                defaultValue={fii?.name ?? ""}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label htmlFor="fii-dy">DY (%) — opcional</Label>
                <Input
                  id="fii-dy"
                  name="dy"
                  type="number"
                  step="0.01"
                  placeholder="Ex.: 10.5"
                  defaultValue={fii?.dy ?? ""}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="fii-pvp">P/VP — opcional</Label>
                <Input
                  id="fii-pvp"
                  name="pvp"
                  type="number"
                  step="0.01"
                  placeholder="Ex.: 0.95"
                  defaultValue={fii?.pvp ?? ""}
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
              {isEdit ? "Salvar alterações" : "Adicionar FII"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
