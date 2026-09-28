"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { AlertTriangle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { deactivateMyAccount } from "@/lib/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ZonaRiscoConta() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [confirmation, setConfirmation] = useState("");

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    startTransition(async () => {
      const result = await deactivateMyAccount(form);
      if (!result.ok) {
        toast.error(result.error ?? "Não foi possível excluir a conta.");
        return;
      }
      router.replace("/conta-excluida");
      router.refresh();
    });
  }

  return (
    <Card className="border-destructive/50">
      <form onSubmit={submit}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="size-5" /> Zona de risco
          </CardTitle>
          <CardDescription>
            Excluir a conta encerra seu acesso imediatamente e revoga todas as sessões. Seus dados não serão apagados: ficarão arquivados e acessíveis somente à administração. Você poderá reativar a conta entrando novamente em até 90 dias.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="delete-account-password">Confirme sua senha atual</Label>
            <Input id="delete-account-password" name="password" type="password" autoComplete="current-password" required />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="delete-account-confirmation">Digite EXCLUIR para confirmar</Label>
            <Input id="delete-account-confirmation" name="confirmation" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} autoComplete="off" required />
          </div>
        </CardContent>
        <CardFooter>
          <Button variant="destructive" type="submit" disabled={pending || confirmation !== "EXCLUIR"}>
            {pending && <Loader2 className="size-4 animate-spin" />}
            Excluir minha conta
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
