"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Wallet, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
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
import { ThemeToggle } from "@/components/theme-toggle";
import { authenticate } from "@/lib/actions";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("brucestrela@pm.me");
  const [senha, setSenha] = useState("");
  const [loading, setLoading] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !senha) {
      toast.error("Preencha e-mail e senha.");
      return;
    }
    setLoading(true);
    const fd = new FormData();
    fd.set("email", email);
    fd.set("password", senha);
    authenticate(fd).then((res) => {
      if (res.ok) {
        toast.success("Bem-vindo de volta!");
        router.push("/dashboard");
      } else {
        toast.error(res.error ?? "Não foi possível entrar.");
        setLoading(false);
      }
    });
  }

  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      {/* Painel do formulário */}
      <div className="flex flex-col gap-4 p-6 md:p-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 font-semibold">
            <div className="flex size-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <Wallet className="size-5" />
            </div>
            FinControle
          </div>
          <ThemeToggle />
        </div>

        <div className="flex flex-1 items-center justify-center">
          <Card className="w-full max-w-sm border-0 shadow-none sm:border sm:shadow-sm">
            <CardHeader>
              <CardTitle className="text-2xl">Entrar na sua conta</CardTitle>
              <CardDescription>
                Digite suas credenciais para acessar o painel financeiro.
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmit}>
              <CardContent className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="email">E-mail</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="voce@exemplo.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                  />
                </div>
                <div className="grid gap-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="senha">Senha</Label>
                    <button
                      type="button"
                      className="text-xs text-muted-foreground hover:text-foreground"
                      onClick={() => toast.info("Recuperação de senha (demo).")}
                    >
                      Esqueceu a senha?
                    </button>
                  </div>
                  <Input
                    id="senha"
                    type="password"
                    placeholder="••••••••"
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                    autoComplete="current-password"
                  />
                </div>
              </CardContent>
              <CardFooter className="mt-6 flex-col gap-3">
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading && <Loader2 className="size-4 animate-spin" />}
                  {loading ? "Entrando..." : "Entrar"}
                </Button>
                <p className="text-center text-sm text-muted-foreground">
                  Não tem conta?{" "}
                  <button
                    type="button"
                    className="font-medium text-foreground underline-offset-4 hover:underline"
                    onClick={() => toast.info("Cadastro (demo).")}
                  >
                    Cadastre-se
                  </button>
                </p>
              </CardFooter>
            </form>
          </Card>
        </div>
        <p className="text-center text-xs text-muted-foreground">
          Senha padrão: <span className="font-mono font-medium">1234</span>
        </p>
      </div>

      {/* Painel visual */}
      <div className="relative hidden bg-primary lg:block">
        <div className="absolute inset-0 flex flex-col justify-center gap-6 p-12 text-primary-foreground">
          <Wallet className="size-12 opacity-90" />
          <h2 className="text-3xl font-semibold leading-tight">
            Controle total das suas finanças.
          </h2>
          <p className="max-w-md text-primary-foreground/70">
            Acompanhe receitas, despesas e a evolução do seu saldo com
            dashboards e gráficos claros. Tudo em um só lugar.
          </p>
          <div className="grid grid-cols-3 gap-4 pt-4">
            <Stat label="Saldo" value="R$ 48,2k" />
            <Stat label="Receitas" value="R$ 21,4k" />
            <Stat label="Economia" value="+24,9%" />
          </div>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-primary-foreground/10 p-4">
      <div className="text-lg font-semibold">{value}</div>
      <div className="text-xs text-primary-foreground/60">{label}</div>
    </div>
  );
}
