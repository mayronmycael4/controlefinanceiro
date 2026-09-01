"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { LogIn } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { impersonateUser } from "@/lib/actions";

export function EntrarComoButton({ userId }: { userId: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();

  return (
    <Button
      variant="outline"
      size="sm"
      disabled={pending}
      onClick={() =>
        start(async () => {
          const res = await impersonateUser(userId);
          if (res.ok) {
            router.push("/dashboard");
            router.refresh();
          } else toast.error(res.error ?? "Erro ao entrar como este usuário.");
        })
      }
    >
      <LogIn className="size-4" />
      Entrar como
    </Button>
  );
}
