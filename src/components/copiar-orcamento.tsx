"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Copy, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { copyBudgetsFromPreviousMonth } from "@/lib/actions";

export function CopiarOrcamento({
  month,
  year,
}: {
  month: number;
  year: number;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();

  return (
    <Button
      variant="outline"
      disabled={pending}
      onClick={() =>
        start(async () => {
          const res = await copyBudgetsFromPreviousMonth(month, year);
          if (res.ok) {
            toast.success(
              `${res.copied} orçamento(s) copiado(s) do mês anterior.`
            );
            router.refresh();
          } else toast.error(res.error ?? "Erro ao copiar.");
        })
      }
    >
      {pending ? (
        <Loader2 className="size-4 animate-spin" />
      ) : (
        <Copy className="size-4" />
      )}
      Copiar do mês anterior
    </Button>
  );
}
