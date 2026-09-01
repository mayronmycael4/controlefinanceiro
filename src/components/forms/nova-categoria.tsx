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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ColorPicker } from "@/components/color-picker";
import { createCategory, updateCategory } from "@/lib/actions";
import { CHART_COLORS } from "@/lib/constants";

export type CategoriaEdit = {
  id: string;
  name: string;
  kind: string;
  color: string;
};

export function CategoriaDialog({
  categoria,
  variant = "outline",
}: {
  categoria?: CategoriaEdit;
  variant?: "outline" | "ghost";
}) {
  const isEdit = !!categoria;
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const [kind, setKind] = useState<"despesa" | "receita">(
    (categoria?.kind as "despesa" | "receita") ?? "despesa"
  );
  const [color, setColor] = useState(categoria?.color ?? CHART_COLORS[0]);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    fd.set("kind", kind);
    fd.set("color", color);
    start(async () => {
      const res = isEdit
        ? await updateCategory(categoria!.id, fd)
        : await createCategory(fd);
      if (res.ok) {
        toast.success(isEdit ? "Categoria atualizada." : "Categoria adicionada.");
        setOpen(false);
        if (!isEdit) {
          form.reset();
          setKind("despesa");
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
            aria-label="Editar categoria"
          >
            <Pencil className="size-4" />
          </Button>
        ) : (
          <Button variant={variant} size="sm">
            <Plus className="size-4" />
            Nova categoria
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <form onSubmit={onSubmit}>
          <DialogHeader>
            <DialogTitle>{isEdit ? "Editar categoria" : "Nova categoria"}</DialogTitle>
            <DialogDescription>
              Para classificar receitas e despesas.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {isEdit ? (
              <div className="text-sm text-muted-foreground">
                Tipo:{" "}
                <span className="font-medium text-foreground">
                  {kind === "receita" ? "Receita" : "Despesa"}
                </span>
              </div>
            ) : (
              <Tabs value={kind} onValueChange={(v) => setKind(v as typeof kind)}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="despesa">Despesa</TabsTrigger>
                  <TabsTrigger value="receita">Receita</TabsTrigger>
                </TabsList>
              </Tabs>
            )}

            <div className="grid gap-2">
              <Label htmlFor="cat-name">Nome</Label>
              <Input
                id="cat-name"
                name="name"
                placeholder="Ex.: Educação"
                defaultValue={categoria?.name ?? ""}
                required
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
              {isEdit ? "Salvar alterações" : "Salvar categoria"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// Wrapper de criação (mantém a API usada nas páginas)
export function NovaCategoria({ variant = "outline" }: { variant?: "outline" | "ghost" }) {
  return <CategoriaDialog variant={variant} />;
}
