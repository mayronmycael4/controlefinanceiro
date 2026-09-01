"use client";

import { useRouter, useSearchParams } from "next/navigation";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MESES } from "@/lib/constants";

const ALL = "all";

export function FiltroPeriodo({ anos }: { anos: number[] }) {
  const router = useRouter();
  const sp = useSearchParams();
  const year = sp.get("year") ?? String(anos[0] ?? new Date().getFullYear());
  const month = sp.get("month") ?? ALL;

  function update(key: string, value: string) {
    const params = new URLSearchParams(sp.toString());
    if (value === ALL) params.delete(key);
    else params.set(key, value);
    router.replace(`?${params.toString()}`, { scroll: false });
  }

  return (
    <div className="flex items-center gap-2">
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
      <Select value={month} onValueChange={(v) => update("month", v)}>
        <SelectTrigger className="w-[150px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>Ano inteiro</SelectItem>
          {MESES.map((m, i) => (
            <SelectItem key={m} value={String(i + 1)}>
              {m}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
