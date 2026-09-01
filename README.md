# FinControle — Sistema de Controle Financeiro

Aplicação web para controle financeiro pessoal: contas, cartões de crédito (com faturas e parcelamento), transações, categorias, orçamento, metas de economia, relatórios com gráficos, previsão e fluxo de caixa.

## Tecnologias

- **Next.js 16** (App Router) + **React 19** + **TypeScript**
- **Tailwind CSS 4** + **shadcn/ui** (Radix)
- **Prisma 6** + **PostgreSQL** (hospedado no Supabase em produção)
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

# 2. Criar um arquivo .env com DATABASE_URL apontando para seu Postgres
#    (veja .env.example)

# 3. Aplicar o schema no banco
pnpm db:push

# 4. (Opcional) Popular com dados de exemplo
pnpm db:seed

# 5. Rodar em modo desenvolvimento
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

- PostgreSQL, hospedado gratuitamente no **Supabase**.
- O schema fica em **`prisma/schema.prisma`**.
- A conexão é configurada pela variável de ambiente `DATABASE_URL` (veja `.env.example`).
- Se mudar o schema, rode `pnpm db:push` de novo para aplicar as alterações no banco.

## Deploy (Vercel + Supabase)

1. Criar um projeto gratuito no [Supabase](https://supabase.com) e copiar a *connection string* (modo **Transaction pooler**, porta 6543).
2. Criar um projeto na [Vercel](https://vercel.com) importando este repositório do GitHub.
3. Configurar a variável de ambiente `DATABASE_URL` na Vercel com a connection string do Supabase.
4. O `postinstall: prisma generate` já está configurado em `package.json`, então o build da Vercel gera o Prisma Client automaticamente.
5. Cada `git push` na branch `main` gera um novo deploy automático.

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
