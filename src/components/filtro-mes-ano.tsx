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

export function FiltroMesAno({ anos }: { anos: number[] }) {
  const router = useRouter();
  const sp = useSearchParams();
  const now = new Date();
  const year = sp.get("year") ?? String(now.getFullYear());
  const month = sp.get("month") ?? String(now.getMonth() + 1);

  function update(key: string, value: string) {
    const params = new URLSearchParams(sp.toString());
    params.set(key, value);
    router.replace(`?${params.toString()}`, { scroll: false });
  }

  return (
    <div className="flex items-center gap-2">
      <Select value={month} onValueChange={(v) => update("month", v)}>
        <SelectTrigger className="w-[140px]">
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
  );
}
