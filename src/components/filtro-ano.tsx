"use client";

import { useRouter, useSearchParams } from "next/navigation";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function FiltroAno({ anos }: { anos: number[] }) {
  const router = useRouter();
  const sp = useSearchParams();
  const year = sp.get("year") ?? String(new Date().getFullYear());

  function update(value: string) {
    const params = new URLSearchParams(sp.toString());
    params.set("year", value);
    router.replace(`?${params.toString()}`, { scroll: false });
  }

  return (
    <Select value={year} onValueChange={update}>
      <SelectTrigger className="w-[110px]">
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
  );
}
