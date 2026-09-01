# FinControle — Sistema de Controle Financeiro

Aplicação web para controle financeiro pessoal: contas, cartões de crédito (com faturas e parcelamento), transações, categorias, orçamento, metas de economia, relatórios com gráficos, previsão e fluxo de caixa.

## Tecnologias

- **Next.js 16** (App Router) + **React 19** + **TypeScript**
- **Tailwind CSS 4** + **shadcn/ui** (Radix)
- **Prisma 6** + **SQLite** (banco local em arquivo — não precisa de servidor)
- **Recharts** (gráficos) · **next-themes** (tema claro/escuro)
- Gerenciador de pacotes: **pnpm**

## Pré-requisitos

- **Node.js 18+** (recomendado 20+)
- **pnpm** (instale com `npm install -g pnpm`)

## Como iniciar (primeira vez)

Dentro da pasta do projeto:

```bash
# 1. Instalar as dependências
pnpm install

# 2. Criar o banco de dados (SQLite) a partir do schema
pnpm db:push

# 3. (Opcional) Popular com dados de exemplo
pnpm db:seed

# 4. Rodar em modo desenvolvimento
pnpm dev
```

Depois abra **http://localhost:3000** no navegador.

> Para rodar em outra porta: `pnpm dev -p 3007`

## Login

- **E-mail:** o e-mail do perfil (padrão `brucestrela@pm.me`)
- **Senha padrão:** `1234`

Você pode alterar nome, e-mail e senha em **Configurações**.

## Scripts disponíveis

| Comando | O que faz |
|---|---|
| `pnpm dev` | Inicia o servidor de desenvolvimento (hot reload) |
| `pnpm build` | Gera a build de produção |
| `pnpm start` | Roda a build de produção (após `build`) |
| `pnpm lint` | Roda o ESLint |
| `pnpm db:push` | Aplica o schema do Prisma no banco (cria/atualiza tabelas) |
| `pnpm db:seed` | Popula o banco com dados de exemplo |
| `pnpm db:studio` | Abre o Prisma Studio (visualizar/editar o banco) |

## Banco de dados

- É um arquivo SQLite em **`prisma/dev.db`** (criado pelo `db:push`).
- O schema fica em **`prisma/schema.prisma`**.
- Se mudar o schema, rode `pnpm db:push` de novo (no Windows, pare o `pnpm dev` antes para liberar o arquivo do Prisma).
- Para recomeçar do zero, apague `prisma/dev.db` e rode `pnpm db:push` + `pnpm db:seed`.

## Backup e restauração do banco

Como o banco é um único arquivo (`prisma/dev.db`), o backup é só **copiar esse arquivo**.

> Dica: pare o `pnpm dev` (ou feche o Prisma Studio) antes de copiar, para garantir que não há escrita em andamento.

```bash
# Fazer backup (com data no nome)
# Linux/macOS:
cp prisma/dev.db "backups/dev-$(date +%Y-%m-%d).db"

# Windows (PowerShell):
Copy-Item prisma/dev.db "backups/dev-$(Get-Date -Format yyyy-MM-dd).db"

# Restaurar: basta sobrescrever o arquivo pelo backup
# Linux/macOS:
cp "backups/dev-2026-07-05.db" prisma/dev.db
# Windows (PowerShell):
Copy-Item "backups/dev-2026-07-05.db" prisma/dev.db -Force
```

Você também pode exportar/importar via SQLite CLI (`sqlite3 prisma/dev.db .dump > backup.sql`) se preferir um dump em texto.

## Deploy

### VPS / Railway / Fly.io / Render (com disco persistente) — recomendado para SQLite

Como usamos SQLite (arquivo), o deploy mais simples é em um servidor **com disco persistente** (o arquivo `dev.db` precisa sobreviver aos reinícios).

```bash
pnpm install
pnpm db:push          # cria o banco no servidor (uma vez)
pnpm db:seed          # opcional
pnpm build
pnpm start            # sobe a build de produção (porta 3000)
```

- Garanta que a pasta `prisma/` fique num **volume persistente**.
- Defina a porta com `pnpm start -p <porta>` se necessário.

### Vercel / Netlify (serverless) — precisa de banco hospedado

Em plataformas **serverless** o sistema de arquivos é temporário/somente-leitura, então o `dev.db` **não persiste**. Para publicar na Vercel, troque o SQLite por um banco hospedado:

- **Turso** (libSQL, compatível com SQLite) — mudança mínima; usa o adapter `@prisma/adapter-libsql`.
- ou **PostgreSQL** (Neon, Supabase) — troque em `prisma/schema.prisma`:
  ```prisma
  datasource db {
    provider = "postgresql"
    url      = env("DATABASE_URL")
  }
  ```
  e configure a variável de ambiente `DATABASE_URL` na Vercel; rode `prisma migrate deploy` na build.

Passos gerais na Vercel: conectar o repositório → definir `DATABASE_URL` → deploy. (Sem um banco hospedado, o deploy roda mas os dados se perdem a cada requisição.)

## Estrutura (resumo)

```
prisma/            # schema do banco + seed
src/
  app/(app)/       # páginas internas (dashboard, contas, cartões, metas, fluxo...)
  app/login/       # tela de login
  components/      # componentes de UI e formulários
  lib/
    db.ts          # cliente Prisma
    queries.ts     # leituras/consultas
    actions.ts     # server actions (criar/editar/excluir)
```

## Funcionalidades

- **Contas & carteiras** e **cartões de crédito** (limite, fatura, fechamento/vencimento)
- **Transações** (receita/despesa, pago/pendente) com filtros por dia/mês/ano, tipo e busca
- **Parcelamento** no cartão e **repetição** por N vezes (semanal a anual)
- **Pagar fatura** do cartão (quita e libera o limite)
- **Transferência** entre contas
- **Categorias** com cores personalizadas
- **Orçamento** total e por categoria
- **Metas de economia** com progresso
- **Recorrentes/fixas** (assinaturas, salário)
- **Relatórios**, **balanço**, **previsão do mês**, **fluxo de caixa projetado** e **contas a vencer**
- Tema **claro/escuro**



- arrumar contas a pagar se eu Nào tiver saldo avisar, colcoa notificacao no dashobaard as que tiver pagar memso sendo recoorrente sair de lá, na aba trnsacoes o ano tem que ser o atual e o mesmo tbm, na aba recorrente tem icone de pausar e eu escolher a cor de como vai aparecer, em contras & carteiras colocar a opcaos de ver trsasncoes daquele item selecioanado, orcamento colocar a opcar de copar do mes anterios e ver todos os meses que quiser com navegacoes por ceta ou combobox,no contas a vernbcer as recorrente nao sai se eu pegueiu no mes sumir caso for mensal em recorrente adionar quizelka semtral e trimestral aniual.