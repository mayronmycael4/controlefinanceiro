import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function ContaExcluidaPage() {
  return (
    <main className="flex min-h-svh items-center justify-center p-6">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><CheckCircle2 className="size-5 text-emerald-600" />Conta excluída</CardTitle>
          <CardDescription>Seu acesso foi encerrado e suas sessões foram revogadas.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 text-sm text-muted-foreground">
          <p>Seus dados foram preservados em arquivo e não ficam mais disponíveis para esta conta.</p>
          <p>Se mudar de ideia, você pode entrar com seu e-mail e senha e reativar a conta em até 90 dias da exclusão. Depois desse prazo, a reativação pelo titular não estará disponível.</p>
          <Button asChild><Link href="/login">Ir para o login</Link></Button>
        </CardContent>
      </Card>
    </main>
  );
}
