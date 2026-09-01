"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { refreshFiiPrice, refreshAllFiiPrices } from "@/lib/actions";

export function AtualizarPrecoFii({ id }: { id: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();

  return (
    <Button
      variant="outline"
      size="icon"
      className="size-8"
      disabled={pending}
      aria-label="Atualizar cotação"
      onClick={() =>
        start(async () => {
          const res = await refreshFiiPrice(id);
          if (res.ok) {
            toast.success("Cotação atualizada.");
            router.refresh();
          } else toast.error(res.error ?? "Erro ao atualizar cotação.");
        })
      }
    >
      <RefreshCw className={pending ? "size-4 animate-spin" : "size-4"} />
    </Button>
  );
}

export function AtualizarTodosPrecosFii() {
  const router = useRouter();
  const [pending, start] = useTransition();

  return (
    <Button
      variant="outline"
      disabled={pending}
      onClick={() =>
        start(async () => {
          const res = await refreshAllFiiPrices();
          if (res.ok) {
            toast.success("Cotações atualizadas.");
            router.refresh();
          } else toast.error(res.error ?? "Erro ao atualizar cotações.");
        })
      }
    >
      <RefreshCw className={pending ? "size-4 animate-spin" : "size-4"} />
      Atualizar cotações
    </Button>
  );
}
