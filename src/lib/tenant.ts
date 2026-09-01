import "server-only";

import { db as baseDb } from "@/lib/db";

// Modelos cujos dados pertencem a um usuário específico.
const TENANT_MODELS = new Set([
  "Account",
  "CreditCard",
  "Category",
  "Transaction",
  "Recurring",
  "Budget",
  "Goal",
  "Fii",
  "FiiTransaction",
  "FiiDividend",
]);

const WHERE_OPS = new Set([
  "findMany",
  "findFirst",
  "findFirstOrThrow",
  "findUnique",
  "findUniqueOrThrow",
  "count",
  "aggregate",
  "groupBy",
  "update",
  "updateMany",
  "delete",
  "deleteMany",
]);

/**
 * Retorna um client do Prisma "preso" a um usuário: toda leitura/escrita nos
 * modelos de dados financeiros é automaticamente filtrada/marcada com esse
 * userId, sem precisar repetir `where: { userId }` em cada query manualmente.
 */
export function scopedDb(userId: string) {
  return baseDb.$extends({
    query: {
      $allModels: {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        async $allOperations({ model, operation, args, query }: any) {
          if (!model || !TENANT_MODELS.has(model)) return query(args);
          const a = args ?? {};

          if (WHERE_OPS.has(operation)) {
            a.where = { ...(a.where ?? {}), userId };
          }
          if (operation === "create") {
            a.data = { ...(a.data ?? {}), userId };
          }
          if (operation === "createMany") {
            a.data = Array.isArray(a.data)
              ? a.data.map((d: Record<string, unknown>) => ({ ...d, userId }))
              : { ...(a.data ?? {}), userId };
          }
          if (operation === "upsert") {
            a.where = { ...(a.where ?? {}), userId };
            a.create = { ...(a.create ?? {}), userId };
          }

          return query(a);
        },
      },
    },
  });
}
