"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  ArrowLeftRight,
  PieChart,
  Wallet,
  CreditCard,
  PiggyBank,
  Scale,
  Repeat,
  Tag,
  Target,
  LineChart,
  GitCompareArrows,
  ShieldCheck,
  Settings,
  LogOut,
  ChevronsUpDown,
  Landmark,
  History,
  Users,
} from "lucide-react";
import { toast } from "sonner";

import { logout } from "@/lib/actions";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export type NavUser = {
  nome: string;
  email: string;
  iniciais: string;
  role: string;
};

const navPrincipal = [
  { titulo: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { titulo: "Transações", url: "/transacoes", icon: ArrowLeftRight },
  { titulo: "Recorrentes", url: "/recorrentes", icon: Repeat },
  { titulo: "Contas & Cartões", url: "/contas", icon: CreditCard },
  { titulo: "Orçamento", url: "/orcamento", icon: PiggyBank },
  { titulo: "Metas", url: "/metas", icon: Target },
  { titulo: "FIIs", url: "/fiis", icon: Landmark },
  { titulo: "Posso comprar?", url: "/simulador", icon: ShieldCheck },
  { titulo: "Relatórios", url: "/relatorios", icon: PieChart },
  { titulo: "Comparativo", url: "/comparativo", icon: GitCompareArrows },
  { titulo: "Fluxo de caixa", url: "/fluxo", icon: LineChart },
  { titulo: "Balanço", url: "/balanco", icon: Scale },
];

const navGeral = [
  { titulo: "Categorias", url: "/categorias", icon: Tag },
  { titulo: "Atividades", url: "/atividades", icon: History },
  { titulo: "Configurações", url: "/configuracoes", icon: Settings },
];

const navAdmin = [{ titulo: "Administração", url: "/admin", icon: Users }];

export function AppSidebar({ user }: { user: NavUser }) {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/dashboard">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <Wallet className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">FinControle</span>
                  <span className="truncate text-xs text-muted-foreground">
                    Controle Financeiro
                  </span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navPrincipal.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === item.url}
                    tooltip={item.titulo}
                  >
                    <Link href={item.url}>
                      <item.icon />
                      <span>{item.titulo}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Geral</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navGeral.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === item.url}
                    tooltip={item.titulo}
                  >
                    <Link href={item.url}>
                      <item.icon />
                      <span>{item.titulo}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {user.role === "admin" && (
          <SidebarGroup>
            <SidebarGroupLabel>Administração</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {navAdmin.map((item) => (
                  <SidebarMenuItem key={item.url}>
                    <SidebarMenuButton
                      asChild
                      isActive={pathname === item.url}
                      tooltip={item.titulo}
                    >
                      <Link href={item.url}>
                        <item.icon />
                        <span>{item.titulo}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="data-[state=open]:bg-sidebar-accent"
                >
                  <Avatar className="size-8 rounded-lg">
                    <AvatarFallback className="rounded-lg bg-primary text-primary-foreground">
                      {user.iniciais}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">
                      {user.nome}
                    </span>
                    <span className="truncate text-xs text-muted-foreground">
                      {user.email}
                    </span>
                  </div>
                  <ChevronsUpDown className="ml-auto size-4" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-(--radix-dropdown-menu-trigger-width) min-w-56"
                side="top"
                align="end"
              >
                <DropdownMenuLabel className="font-normal">
                  <div className="grid gap-0.5">
                    <span className="font-semibold">{user.nome}</span>
                    <span className="text-xs text-muted-foreground">
                      {user.email}
                    </span>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/configuracoes">
                    <Settings />
                    Configurações
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => {
                    logout().then(() => {
                      toast.success("Sessão encerrada.");
                      router.push("/login");
                      router.refresh();
                    });
                  }}
                >
                  <LogOut />
                  Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
