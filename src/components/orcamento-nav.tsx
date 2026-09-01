"use client";

import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MESES } from "@/lib/constants";

export function OrcamentoNav({
  month,
  year,
  anos,
}: {
  month: number;
  year: number;
  anos: number[];
}) {
  const router = useRouter();

  function go(m: number, y: number) {
    router.replace(`?month=${m}&year=${y}`, { scroll: false });
  }
  function step(delta: number) {
    const d = new Date(year, month - 1 + delta, 1);
    go(d.getMonth() + 1, d.getFullYear());
  }

  const anosOpts = anos.includes(year) ? anos : [...anos, year].sort((a, b) => b - a);

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="ghost"
        size="icon"
        className="size-8"
        onClick={() => step(-1)}
        aria-label="Mês anterior"
      >
        <ChevronLeft className="size-4" />
      </Button>

      <Select value={String(month)} onValueChange={(v) => go(Number(v), year)}>
        <SelectTrigger className="w-[130px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {MESES.map((m, i) => (
            <SelectItem key={m} value={String(i + 1)}>
              {m}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={String(year)} onValueChange={(v) => go(month, Number(v))}>
        <SelectTrigger className="w-[90px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {anosOpts.map((a) => (
            <SelectItem key={a} value={String(a)}>
              {a}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Button
        variant="ghost"
        size="icon"
        className="size-8"
        onClick={() => step(1)}
        aria-label="Próximo mês"
      >
        <ChevronRight className="size-4" />
      </Button>
    </div>
  );
}
