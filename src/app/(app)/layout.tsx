import { redirect } from "next/navigation";
import { AppSidebar } from "@/components/app-sidebar";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { getRawSession, getCurrentUser, iniciaisDoNome } from "@/lib/queries";
import { stopImpersonatingForm } from "@/lib/actions";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getRawSession();
  if (!session) redirect("/login");

  const isImpersonating = !!session.impersonatingId;
  const actingUser = await getCurrentUser();
  if (!actingUser) redirect("/login");

  const user = {
    nome: actingUser.name,
    email: actingUser.email,
    iniciais: iniciaisDoNome(actingUser.name),
    role: session.user.role,
  };

  return (
    <TooltipProvider delayDuration={0}>
    <SidebarProvider>
      <AppSidebar user={user} />
      <SidebarInset>
        {isImpersonating && (
          <div className="flex items-center justify-between gap-2 bg-amber-500/15 px-4 py-2 text-sm text-amber-700 dark:text-amber-400">
            <span>
              Você está vendo como <strong>{actingUser.name}</strong> ({actingUser.email}).
            </span>
            <form action={stopImpersonatingForm}>
              <Button type="submit" size="sm" variant="outline">
                Voltar para administrador
              </Button>
            </form>
          </div>
        )}
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <div className="flex flex-col">
            <span className="text-sm font-semibold">Painel Financeiro</span>
            <span className="text-xs text-muted-foreground">
              Controle Financeiro
            </span>
          </div>
          <div className="ml-auto">
            <ThemeToggle />
          </div>


        </header>
        <main className="flex-1 p-4 md:p-6">{children}</main>
      </SidebarInset>
    </SidebarProvider>
    </TooltipProvider>
  );
}
