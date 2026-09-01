"use client";

import { useTransition } from "react";
import { Loader2, User, Lock } from "lucide-react";
import { toast } from "sonner";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { updateProfile, changePassword } from "@/lib/actions";

export function PerfilForm({
  profile,
}: {
  profile: { name: string; email: string };
}) {
  const [pending, start] = useTransition();

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    start(async () => {
      const res = await updateProfile(fd);
      if (res.ok) toast.success("Perfil atualizado.");
      else toast.error(res.error ?? "Erro ao salvar.");
    });
  }

  return (
    <Card>
      <form onSubmit={onSubmit}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="size-5 text-muted-foreground" />
            Perfil
          </CardTitle>
          <CardDescription>Suas informações pessoais.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Nome</Label>
            <Input id="name" name="name" defaultValue={profile.name} required />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="email">E-mail</Label>
            <Input
              id="email"
              name="email"
              type="email"
              defaultValue={profile.email}
              required
            />
          </div>
        </CardContent>
        <CardFooter className="mt-4">
          <Button type="submit" disabled={pending}>
            {pending && <Loader2 className="size-4 animate-spin" />}
            Salvar perfil
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}

export function SenhaForm() {
  const [pending, start] = useTransition();

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    start(async () => {
      const res = await changePassword(fd);
      if (res.ok) {
        toast.success("Senha alterada com sucesso.");
        form.reset();
      } else {
        toast.error(res.error ?? "Erro ao alterar senha.");
      }
    });
  }

  return (
    <Card>
      <form onSubmit={onSubmit}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="size-5 text-muted-foreground" />
            Alterar senha
          </CardTitle>
          <CardDescription>
            A senha padrão é <span className="font-mono font-medium">1234</span>.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="currentPassword">Senha atual</Label>
            <Input
              id="currentPassword"
              name="currentPassword"
              type="password"
              placeholder="••••"
              autoComplete="current-password"
              required
            />
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="newPassword">Nova senha</Label>
              <Input
                id="newPassword"
                name="newPassword"
                type="password"
                placeholder="mín. 4 caracteres"
                autoComplete="new-password"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="confirmPassword">Confirmar nova senha</Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
              />
            </div>
          </div>
        </CardContent>
        <CardFooter className="mt-4">
          <Button type="submit" disabled={pending}>
            {pending && <Loader2 className="size-4 animate-spin" />}
            Alterar senha
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
