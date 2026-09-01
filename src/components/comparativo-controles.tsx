"use client";

import { useRouter, useSearchParams } from "next/navigation";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { MESES } from "@/lib/constants";

export function ComparativoControles({
  anos,
  meses,
}: {
  anos: number[];
  meses: string[]; // chaves YYYY-MM disponíveis (desc)
}) {
  const router = useRouter();
  const sp = useSearchParams();

  const kind = sp.get("kind") === "receita" ? "receita" : "despesa";
  const now = new Date();
  const year = sp.get("year") ?? String(now.getFullYear());
  const mesAtual = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const mesAnt = `${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, "0")}`;
  const ma = sp.get("ma") ?? mesAnt;
  const mb = sp.get("mb") ?? mesAtual;

  function update(key: string, value: string) {
    const params = new URLSearchParams(sp.toString());
    params.set(key, value);
    router.replace(`?${params.toString()}`, { scroll: false });
  }

  const opcoesMes = meses.length > 0 ? meses : [mesAtual, mesAnt];
  const label = (k: string) => {
    const [y, m] = k.split("-").map(Number);
    return `${MESES[m - 1]}/${y}`;
  };

  return (
    <div className="flex flex-wrap items-end gap-4">
      <div className="grid gap-1.5">
        <Label className="text-xs text-muted-foreground">Tipo</Label>
        <Tabs value={kind} onValueChange={(v) => update("kind", v)}>
          <TabsList>
            <TabsTrigger value="despesa">Despesas</TabsTrigger>
            <TabsTrigger value="receita">Receitas</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="grid gap-1.5">
        <Label className="text-xs text-muted-foreground">Ano (evolução)</Label>
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
      </div>

      <div className="grid gap-1.5">
        <Label className="text-xs text-muted-foreground">Comparar mês</Label>
        <Select value={ma} onValueChange={(v) => update("ma", v)}>
          <SelectTrigger className="w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {opcoesMes.map((k) => (
              <SelectItem key={k} value={k}>
                {label(k)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-1.5">
        <Label className="text-xs text-muted-foreground">com</Label>
        <Select value={mb} onValueChange={(v) => update("mb", v)}>
          <SelectTrigger className="w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {opcoesMes.map((k) => (
              <SelectItem key={k} value={k}>
                {label(k)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
