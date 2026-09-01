"use client";

import { useTransition } from "react";
import { Pause, Play, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { toggleRecurringActive } from "@/lib/actions";

export function RecorrenteToggle({
  id,
  active,
}: {
  id: string;
  active: boolean;
}) {
  const [pending, start] = useTransition();

  return (
    <Button
      variant="ghost"
      size="icon"
      className="size-8 text-muted-foreground hover:text-foreground"
      disabled={pending}
      aria-label={active ? "Pausar recorrente" : "Ativar recorrente"}
      title={active ? "Pausar" : "Ativar"}
      onClick={() =>
        start(async () => {
          const res = await toggleRecurringActive(id);
          if (res.ok) toast.success(active ? "Pausada." : "Ativada.");
          else toast.error(res.error ?? "Erro.");
        })
      }
    >
      {pending ? (
        <Loader2 className="size-4 animate-spin" />
      ) : active ? (
        <Pause className="size-4" />
      ) : (
        <Play className="size-4" />
      )}
    </Button>
  );
}
