import { redirect } from "next/navigation";
import { PerfilForm, SenhaForm } from "@/components/forms/perfil-forms";
import { getCurrentUser } from "@/lib/queries";

export default async function ConfiguracoesPage() {
  const profile = await getCurrentUser();
  if (!profile) redirect("/login");

  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Configurações</h1>
        <p className="text-muted-foreground">
          Gerencie sua conta e preferências.
        </p>
      </div>

      <PerfilForm profile={profile} />
      <SenhaForm />
    </div>
  );
}
