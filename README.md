# BorsaMia — La tua biblioteca creativa

Base inicial (bootstrap) de webapp de crochê em italiano, inspirada nas funcionalidades de organização do Yarnl e preparada para publicação na Netlify. **Ainda não é um app comercial pronto para produção.** O acesso pela Hotmart, Supabase e conteúdo protegido precisam ser implementados e validados.

## Preparação local
Requer Node.js 22+, npm e conexão com npm registry. Após extrair a pasta:

```bash
npm install
npm run dev
```

Abra `http://localhost:3000`. Para checks completos (depois de instalar dependências):

```bash
npm run check
```

Para validar somente estrutura sem instalar pacotes: `npm run check:offline`.

## Deployment Netlify
Conecte o repositório à Netlify e use o framework Next.js reconhecido automaticamente; `netlify.toml` define `npm run build` e Node 22. O adaptador OpenNext gerencia funções para App Router/route handlers. Não criar redirecionamento SPA global. Inserir segredos privados na Netlify (NÃO no Git) somente quando os serviços estiverem configurados. Não faça deploy comercial antes do webhook, autenticação, storage e testes de acesso reais.

## Estado atual
- Dashboard com 6 coleções e busca em IT-IT; estado de acesso fechado por padrão.
- Tela `/accedi`; `/api/access/request` devolve 503, sem e-mail enviado.
- `/api/hotmart/webhook` devolve 503, sem registrar transações.
- `/api/library/:collectionId` devolve 401; nenhum PDF público.
- Modelo inicial de domínio comercial testável sem payloads ou IDs inventados.

## Documentação
`PRODUCT.md` (escopo/cenários), `AGENTS.md` (instruções de desenvolvimento), `docs/architecture.md` (decisões e fronteiras), `docs/design.md` (UI/Italiano), `docs/onboarding.md` (preparação local), `docs/quality.md` (testes e revisão) e `docs/setup.md` (evidências/pendências).

## Origem
Base planejada a partir do Vibe Coding Toolkit (prompt `11-next-project-bootstrap.md`). Este arquivo é um scaffold manual parcial, não uma instalação completa do toolkit; veja `docs/setup.md` para o motivo e os componentes ainda pendentes.
