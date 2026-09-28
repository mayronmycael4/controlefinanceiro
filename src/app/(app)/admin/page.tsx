import { redirect } from "next/navigation";
import { Users } from "lucide-react";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { NovoUsuarioDialog } from "@/components/forms/novo-usuario";
import { EntrarComoButton } from "@/components/forms/entrar-como-button";
import { ExcluirItem } from "@/components/excluir-item";
import { getActiveDefaultPasswordCount, getAllUsers, getCurrentUser } from "@/lib/queries";

export default async function AdminPage() {
  const me = await getCurrentUser();
  if (!me) redirect("/login");
  if (me.role !== "admin") redirect("/dashboard");

  const [usuarios, senhasPadraoAtivas] = await Promise.all([getAllUsers(), getActiveDefaultPasswordCount()]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Administração</h1>
          <p className="text-muted-foreground">
            Gerencie os usuários que têm acesso ao sistema.
          </p>
        </div>
        <NovoUsuarioDialog />
      </div>

      {senhasPadraoAtivas > 0 && (
        <Card className="border-destructive/50">
          <CardHeader>
            <CardTitle className="text-destructive">Ação de segurança necessária</CardTitle>
            <CardDescription>{senhasPadraoAtivas} conta(s) ativa(s) ainda usa(m) a senha temporária legada. No próximo login com essa senha, o titular será obrigado a substituí-la. Não exibimos os nomes nem os hashes aqui.</CardDescription>
          </CardHeader>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="size-5 text-muted-foreground" />
            Usuários
          </CardTitle>
          <CardDescription>
            {usuarios.filter((u) => !u.deletedAt).length} conta(s) ativa(s) · {usuarios.filter((u) => u.deletedAt).length} excluída(s)/arquivada(s). As contas arquivadas podem ser acessadas somente pela administração.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col divide-y">
          {usuarios.map((u) => (
            <div key={u.id} className="flex items-center justify-between gap-3 py-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">{u.name}</span>
                  {u.role === "admin" && <Badge variant="secondary">Admin</Badge>}
                  {u.id === me.id && <Badge variant="outline">Você</Badge>}
                  {u.deletedAt && <Badge variant="destructive">Excluída</Badge>}
                </div>
                <p className="text-sm text-muted-foreground">{u.email}</p>
                {u.deletedAt && (
                  <p className="text-xs text-muted-foreground">
                    Excluída em {u.deletedAt.toLocaleDateString("pt-BR")} · dados preservados para administração
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2">
                {u.id !== me.id && (
                  <>
                    <EntrarComoButton userId={u.id} />
                    {!u.deletedAt && <ExcluirItem kind="user" id={u.id} nome={u.name} />}
                  </>
                )}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
