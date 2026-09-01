"use client";

import { useTransition } from "react";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  deleteAccount,
  deleteCreditCard,
  deleteBudget,
  deleteRecurring,
  deleteCategory,
  deleteGoal,
  deleteFii,
  deleteFiiTransaction,
  deleteFiiDividend,
} from "@/lib/actions";

const actions = {
  account: deleteAccount,
  card: deleteCreditCard,
  budget: deleteBudget,
  recurring: deleteRecurring,
  category: deleteCategory,
  goal: deleteGoal,
  fii: deleteFii,
  fiiTransaction: deleteFiiTransaction,
  fiiDividend: deleteFiiDividend,
};

export function ExcluirItem({
  kind,
  id,
  nome,
}: {
  kind: "account" | "card" | "budget" | "recurring" | "category" | "goal" | "fii" | "fiiTransaction" | "fiiDividend";
  id: string;
  nome: string;
}) {
  const [pending, start] = useTransition();

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="size-8 text-muted-foreground hover:text-destructive"
        >
          <Trash2 className="size-4" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Excluir “{nome}”?</AlertDialogTitle>
          <AlertDialogDescription>
            Esta ação não pode ser desfeita. As transações vinculadas ficarão sem
            este item (não serão apagadas).
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            disabled={pending}
            onClick={(e) => {
              e.preventDefault();
              start(async () => {
                const res = await actions[kind](id);
                if (res.ok) toast.success("Excluído.");
                else toast.error(res.error ?? "Erro ao excluir.");
              });
            }}
          >
            Excluir
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
