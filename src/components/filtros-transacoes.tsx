"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { X, Search } from "lucide-react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MESES } from "@/lib/constants";

const ALL = "all";

type Opt = { id: string; name: string };

export function FiltrosTransacoes({
  anos,
  contas = [],
  cartoes = [],
  tags = [],
}: {
  anos: number[];
  contas?: Opt[];
  cartoes?: Opt[];
  tags?: string[];
}) {
  const router = useRouter();
  const sp = useSearchParams();

  const now = new Date();
  const year = sp.get("year") ?? String(now.getFullYear());
  // Padrão do mês = mês atual; "all" mostra o ano inteiro.
  const month = sp.get("month") ?? String(now.getMonth() + 1);
  const day = sp.get("day") ?? ALL;
  const kind = sp.get("kind") ?? ALL;
  const status = sp.get("status") ?? ALL;
  const account = sp.get("account") ?? ALL;
  const card = sp.get("card") ?? ALL;
  const tag = sp.get("tag") ?? ALL;
  const q = sp.get("q") ?? "";
  const [busca, setBusca] = useState(q);

  function update(key: string, value: string) {
    const params = new URLSearchParams(sp.toString());
    if (value === ALL || !value) params.delete(key);
    else params.set(key, value);
    router.replace(`?${params.toString()}`, { scroll: false });
  }

  // Mês precisa persistir "all" (ano inteiro) como valor explícito na URL.
  function updateMonth(value: string) {
    const params = new URLSearchParams(sp.toString());
    params.set("month", value);
    if (value === ALL) params.delete("day");
    router.replace(`?${params.toString()}`, { scroll: false });
  }

  const temFiltro =
    month !== String(now.getMonth() + 1) ||
    day !== ALL ||
    kind !== ALL ||
    status !== ALL ||
    account !== ALL ||
    card !== ALL ||
    tag !== ALL ||
    q !== "";

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative w-full sm:w-56">
        <Search className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar descrição..."
          value={busca}
          onChange={(e) => {
            setBusca(e.target.value);
            update("q", e.target.value);
          }}
          className="pl-8"
        />
      </div>
      <Select value={year} onValueChange={(v) => update("year", v)}>
        <SelectTrigger className="w-[100px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {anos.map((a) => (
            <SelectItem key={a} value={String(a)}>
              {a}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={month} onValueChange={updateMonth}>
        <SelectTrigger className="w-[140px]">
          <SelectValue placeholder="Mês" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>Todos os meses</SelectItem>
          {MESES.map((m, i) => (
            <SelectItem key={m} value={String(i + 1)}>
              {m}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={day}
        onValueChange={(v) => update("day", v)}
        disabled={month === ALL}
      >
        <SelectTrigger className="w-[100px]">
          <SelectValue placeholder="Dia" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>Todo mês</SelectItem>
          {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
            <SelectItem key={d} value={String(d)}>
              Dia {d}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={kind} onValueChange={(v) => update("kind", v)}>
        <SelectTrigger className="w-[130px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>Tipo: todos</SelectItem>
          <SelectItem value="receita">Receitas</SelectItem>
          <SelectItem value="despesa">Despesas</SelectItem>
        </SelectContent>
      </Select>

      <Select value={status} onValueChange={(v) => update("status", v)}>
        <SelectTrigger className="w-[140px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>Status: todos</SelectItem>
          <SelectItem value="pago">Pagos</SelectItem>
          <SelectItem value="pendente">Pendentes</SelectItem>
        </SelectContent>
      </Select>

      {contas.length > 0 && (
        <Select value={account} onValueChange={(v) => update("account", v)}>
          <SelectTrigger className="w-[150px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Conta: todas</SelectItem>
            {contas.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {cartoes.length > 0 && (
        <Select value={card} onValueChange={(v) => update("card", v)}>
          <SelectTrigger className="w-[150px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Cartão: todos</SelectItem>
            {cartoes.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {tags.length > 0 && (
        <Select value={tag} onValueChange={(v) => update("tag", v)}>
          <SelectTrigger className="w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Etiqueta: todas</SelectItem>
            {tags.map((t) => (
              <SelectItem key={t} value={t}>
                #{t}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {temFiltro && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setBusca("");
            router.replace(`?year=${year}`, { scroll: false });
          }}
        >
          <X className="size-4" />
          Limpar
        </Button>
      )}
    </div>
  );
}
