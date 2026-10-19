# Onboarding local

## Ambiente
Node.js 22+; npm; conexão com registry do npm; terminal em **diretório do projeto extraído**. A montagem que gerou o ZIP não é o diretório de trabalho do usuário e não alterou o projeto em seu computador.

```bash
cd borsamia
npm install
npm run check:offline
npm run dev
```

Abra `http://localhost:3000`. Interface em italiano, funções de compra/login indisponíveis até integração. Para validar todos os componentes após instalação:

```bash
npm run check
```

`npm run check` executa lint, geração de tipos Next, TypeScript, typed lint, autochecagem de lint, Vitest e build. Sem `DATABASE_URL` a aplicação precisa fazer build; a conexão só acontece em `getDb`.

## Variáveis
Copiar `.env.example` para `.env.local` **somente quando existir um serviço configurado**. `DATABASE_URL` aponta para Supabase Postgres (ou ambiente de teste autorizado), `DATABASE_URL_UNPOOLED` poderá ser usado em migrações quando necessário. Demais variáveis exemplificam integrações **não implementadas**. Não usar `NEXT_PUBLIC_` para segredos.

## Database e fluxo comercial
Não rodar `db:migrate` até haver esquema baseado em ID de produto e transação reais, SQL revisado, permissões e conexão explicitamente autorizadas. Primeiro validar eventos de sandbox/conta Hotmart (sem divulgar dados de compradores), configurar produto mapeado, autenticidade e processamento duplicado/reembolsado.

## Netlify
1. Depois de testar localmente, iniciar repositório Git local e conectar à Netlify com autorização do proprietário.
2. Escolher Node 22 e Next.js detectado automaticamente; comando `npm run build` já no `netlify.toml`. Não usar redirect SPA `/* /index.html 200`.
3. Adicionar variáveis privadas somente no painel da Netlify e redeploy após atualização.
4. Validar em ambiente de teste os webhooks reais, magic link, arquivos protegidos e reembolso antes de vendas.

## Conteúdo
Somente publicar PDFs italianos e imagens de uso autorizado. Enquanto não chegarem os arquivos reais, os cards permanecem ilustrativos e bloqueados. Checkout links permanecem ausentes.
