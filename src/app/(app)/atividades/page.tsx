import { redirect } from "next/navigation";
import { History } from "lucide-react";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getActivityLogs, getCurrentUser, getAllUsers } from "@/lib/queries";

export default async function AtividadesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const me = await getCurrentUser();
  if (!me) redirect("/login");
  const sp = await searchParams;
  const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
  const filterUserId = one(sp.user);
  const allUsers = one(sp.all) === "1";

  const isAdmin = me.role === "admin";
  const [logs, usuarios] = await Promise.all([
    getActivityLogs({ allUsers: isAdmin && allUsers, filterUserId }),
    isAdmin ? getAllUsers() : Promise.resolve([]),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Atividades</h1>
        <p className="text-muted-foreground">
          Histórico do que foi feito no sistema.
        </p>
      </div>

      {isAdmin && (
        <div className="flex flex-wrap gap-2 text-sm">
          <a
            href="/atividades"
            className={`rounded-md border px-3 py-1 ${!allUsers ? "bg-muted font-medium" : "text-muted-foreground"}`}
          >
            Minhas atividades
          </a>
          <a
            href="/atividades?all=1"
            className={`rounded-md border px-3 py-1 ${allUsers && !filterUserId ? "bg-muted font-medium" : "text-muted-foreground"}`}
          >
            Todos os usuários
          </a>
          {usuarios.map((u) => (
            <a
              key={u.id}
              href={`/atividades?all=1&user=${u.id}`}
              className={`rounded-md border px-3 py-1 ${filterUserId === u.id ? "bg-muted font-medium" : "text-muted-foreground"}`}
            >
              {u.name}
            </a>
          ))}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="size-5 text-muted-foreground" />
            Registro de atividades
          </CardTitle>
          <CardDescription>{logs.length} registro(s) mais recentes.</CardDescription>
        </CardHeader>
        <CardContent>
          {logs.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Nenhuma atividade registrada ainda.
            </p>
          ) : (
            <div className="flex flex-col divide-y">
              {logs.map((log) => (
                <div key={log.id} className="flex items-start justify-between gap-3 py-3">
                  <div>
                    <p className="text-sm">{log.description}</p>
                    <div className="mt-1 flex items-center gap-2">
                      <Badge variant="outline" className="font-mono text-[10px]">
                        {log.action}
                      </Badge>
                      {isAdmin && allUsers && (
                        <span className="text-xs text-muted-foreground">
                          {log.user.name}
                        </span>
                      )}
                    </div>
                  </div>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {log.createdAt.toLocaleString("pt-BR")}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
