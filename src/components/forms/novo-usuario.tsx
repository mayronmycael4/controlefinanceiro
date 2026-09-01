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
import { createUserByAdmin } from "@/lib/actions";

export function NovoUsuarioDialog() {
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const [role, setRole] = useState("user");

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    fd.set("role", role);
    start(async () => {
      const res = await createUserByAdmin(fd);
      if (res.ok) {
        toast.success("Usuário criado.");
        setOpen(false);
        form.reset();
        setRole("user");
      } else toast.error(res.error ?? "Erro ao criar usuário.");
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="size-4" />
          Novo usuário
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={onSubmit}>
          <DialogHeader>
            <DialogTitle>Novo usuário</DialogTitle>
            <DialogDescription>
              Cria um acesso para outra pessoa usar o sistema.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="user-name">Nome</Label>
              <Input id="user-name" name="name" required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="user-email">E-mail</Label>
              <Input id="user-email" name="email" type="email" required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="user-password">Senha</Label>
              <Input id="user-password" name="password" type="password" required />
            </div>
            <div className="grid gap-2">
              <Label>Papel</Label>
              <Select value={role} onValueChange={setRole}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">Usuário</SelectItem>
                  <SelectItem value="admin">Administrador</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={pending} className="w-full">
              {pending && <Loader2 className="size-4 animate-spin" />}
              Criar usuário
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
