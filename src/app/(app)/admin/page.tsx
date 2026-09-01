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
import { getAllUsers, getCurrentUser } from "@/lib/queries";

export default async function AdminPage() {
  const me = await getCurrentUser();
  if (!me) redirect("/login");
  if (me.role !== "admin") redirect("/dashboard");

  const usuarios = await getAllUsers();

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

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="size-5 text-muted-foreground" />
            Usuários
          </CardTitle>
          <CardDescription>{usuarios.length} usuário(s) cadastrado(s).</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col divide-y">
          {usuarios.map((u) => (
            <div key={u.id} className="flex items-center justify-between gap-3 py-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">{u.name}</span>
                  {u.role === "admin" && <Badge variant="secondary">Admin</Badge>}
                  {u.id === me.id && <Badge variant="outline">Você</Badge>}
                </div>
                <p className="text-sm text-muted-foreground">{u.email}</p>
              </div>
              <div className="flex items-center gap-2">
                {u.id !== me.id && (
                  <>
                    <EntrarComoButton userId={u.id} />
                    <ExcluirItem kind="user" id={u.id} nome={u.name} />
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
