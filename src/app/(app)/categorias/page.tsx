import { Tag, ArrowUpRight, ArrowDownLeft } from "lucide-react";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CategoriaDialog, NovaCategoria } from "@/components/forms/nova-categoria";
import { ExcluirItem } from "@/components/excluir-item";
import { getCategoriesWithCount } from "@/lib/queries";

export default async function CategoriasPage() {
  const categorias = await getCategoriesWithCount();
  const despesas = categorias.filter((c) => c.kind === "despesa");
  const receitas = categorias.filter((c) => c.kind === "receita");

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Categorias</h1>
          <p className="text-muted-foreground">
            Organize e edite as categorias de receitas e despesas.
          </p>
        </div>
        <NovaCategoria />
      </div>

      <Grupo
        titulo="Despesas"
        icon={ArrowDownLeft}
        cor="text-destructive"
        itens={despesas}
      />
      <Grupo
        titulo="Receitas"
        icon={ArrowUpRight}
        cor="text-emerald-600 dark:text-emerald-500"
        itens={receitas}
      />
    </div>
  );
}

type Cat = {
  id: string;
  name: string;
  kind: string;
  color: string;
  _count: { transactions: number; recurrings: number };
};

function Grupo({
  titulo,
  icon: Icon,
  cor,
  itens,
}: {
  titulo: string;
  icon: typeof Tag;
  cor: string;
  itens: Cat[];
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Icon className={`size-4 ${cor}`} />
          {titulo}
          <Badge variant="secondary">{itens.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {itens.length === 0 ? (
          <div className="flex h-16 items-center justify-center text-sm text-muted-foreground">
            Nenhuma categoria de {titulo.toLowerCase()}.
          </div>
        ) : (
          <ul className="divide-y">
            {itens.map((c) => (
              <li key={c.id} className="flex items-center gap-3 py-2">
                <span
                  className="size-4 shrink-0 rounded-full"
                  style={{ backgroundColor: c.color }}
                />
                <span className="flex-1 font-medium">{c.name}</span>
                <span className="text-xs text-muted-foreground">
                  {c._count.transactions} lanç.
                  {c._count.recurrings > 0 && ` · ${c._count.recurrings} fixa(s)`}
                </span>
                <div className="flex items-center">
                  <CategoriaDialog
                    categoria={{
                      id: c.id,
                      name: c.name,
                      kind: c.kind,
                      color: c.color,
                    }}
                  />
                  <ExcluirItem kind="category" id={c.id} nome={c.name} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
