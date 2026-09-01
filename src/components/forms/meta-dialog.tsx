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
import { DatePicker } from "@/components/ui/date-picker";
import { ColorPicker } from "@/components/color-picker";
import { createGoal, updateGoal } from "@/lib/actions";
import { CHART_COLORS } from "@/lib/constants";

export type MetaEdit = {
  id: string;
  name: string;
  target: number;
  saved: number;
  deadline: string | Date | null;
  color: string;
};

function toDateInput(d: string | Date | null | undefined): string {
  if (!d) return "";
  const date = typeof d === "string" ? new Date(d) : d;
  const off = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - off).toISOString().slice(0, 10);
}

export function MetaDialog({ meta }: { meta?: MetaEdit }) {
  const isEdit = !!meta;
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const [color, setColor] = useState(meta?.color ?? CHART_COLORS[0]);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    fd.set("color", color);
    start(async () => {
      const res = isEdit ? await updateGoal(meta!.id, fd) : await createGoal(fd);
      if (res.ok) {
        toast.success(isEdit ? "Meta atualizada." : "Meta criada.");
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
            aria-label="Editar meta"
          >
            <Pencil className="size-4" />
          </Button>
        ) : (
          <Button>
            <Plus className="size-4" />
            Nova meta
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={onSubmit}>
          <DialogHeader>
            <DialogTitle>{isEdit ? "Editar meta" : "Nova meta de economia"}</DialogTitle>
            <DialogDescription>
              Um objetivo para juntar dinheiro até uma data.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="goal-name">Nome</Label>
              <Input
                id="goal-name"
                name="name"
                placeholder="Ex.: Reserva de emergência"
                defaultValue={meta?.name ?? ""}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label htmlFor="goal-target">Valor alvo (R$)</Label>
                <Input
                  id="goal-target"
                  name="target"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0,00"
                  defaultValue={meta?.target ?? ""}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="goal-saved">Já guardado (R$)</Label>
                <Input
                  id="goal-saved"
                  name="saved"
                  type="number"
                  step="0.01"
                  min="0"
                  defaultValue={meta?.saved ?? "0"}
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="goal-deadline">Prazo (opcional)</Label>
              <DatePicker
                id="goal-deadline"
                name="deadline"
                defaultValue={toDateInput(meta?.deadline)}
                placeholder="Sem prazo definido"
              />
            </div>
            <div className="grid gap-2">
              <Label>Cor</Label>
              <ColorPicker value={color} onChange={setColor} />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={pending} className="w-full">
              {pending && <Loader2 className="size-4 animate-spin" />}
              {isEdit ? "Salvar alterações" : "Criar meta"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
