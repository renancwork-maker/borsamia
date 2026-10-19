# Setup — BorsaMia

Data de revisão: **2026-10-19**. Ambiente de geração: container Linux isolado (NÃO o diretório no computador do comprador). Diretório novo e vazio criado em `/mnt/data/borsamia` para exportação.

## Origem, revisão e limitações do toolkit
- Guia principal lido: https://raw.githubusercontent.com/soumatheusgomes/vibe-coding-toolkit/main/docs/prompts/11-next-project-bootstrap.md
- Consultados do mesmo branch `main` em 2026-10-19: `docs/04-project-bootstrap.md`, `docs/06-project-defaults.md`, `docs/tools/README.md`, `docs/tools/16-vercel-skills.md`, `templates/README.md`, `templates/project-docs/manifest.json`, `templates/product.md.template`, `docs/tools/17-nextjs-runtime-and-performance.md`, `docs/tools/18-postgresql-skills.md`, `docs/tools/23-harness2.md`, `docs/prompts/13-security-review.md`, `docs/prompts/15-harness-improvement.md`, `docs/07-harness-evaluation.md`, exemplos de ESLint e `.env.example`.
- **Revisão Git SHA: não obtida**: `git ls-remote` falhou por falta de DNS. Somente conteúdo público consultado pelo navegador de pesquisa; não afirmar revisão exata fixada. Fontes em `main` podem mudar.
- **Toolkit não clonado**, `create-next-app` não executado, templates integrais/skills/Context7 não instalados: terminal sem acesso a `github.com`, `raw.githubusercontent.com` e `registry.npmjs.org`. Foi construída uma fundação **manual compatível em intenção**, não reprodução integral do toolkit.

## Versões observadas e declaradas
- Node **v22.16.0**, npm **10.9.2**, Git **2.47.3** (observados). pnpm não encontrado; npm escolhido.
- Stable Next.js **16.4.2** consultado no npm em 2026-10-19, declarado no package.json. Sem `node_modules`, versão instalada **pendente**.
- React 19, TS 5, Tailwind 4, ESLint 9, Vitest 4, Drizzle/PostgreSQL, Zod, Pino e demais packages estão apenas declarados: resolução de versões, dependências peer e lockfile **não validados**.
- Fontes oficiais: https://nextjs.org/docs/app/getting-started/installation , https://nextjs.org/docs/app/api-reference/cli/create-next-app , https://docs.netlify.com/build/frameworks/framework-setup-guides/nextjs/overview/ (consultadas 2026-10-19).

## Escolhas e adaptações
- Next/App Router ao invés de React+Vite por instrução explícita do prompt de bootstrap Next; Netlify OpenNext oficialmente suporta route handlers, SSR e App Router. Adapter não fixado; `netlify.toml` sem SPA rewrite.
- Drizzle, PostgreSQL com Supabase planejado, Node serverless/lazy pool `max:3`, sem schema ficcional. Projeto/banco não criados, nenhuma migração ou SQL aplicado.
- Interface IT-IT inicial, coleções locais apenas informativas, bloqueio total de APIs até implementação real. Nenhum produto/URL inventado.
- ESLint: regras locais básicas inspiradas na proposta; **não** cópia literal do diretório inteiro `templates/eslint/eslint-rules`, nem RuleTester original; `eslint-plugin-drizzle` declarado e typed lint configurado, validação pendente.

## Matriz de capabilities do guia
| Capability | Estado | Motivo / próxima checagem |
|---|---|---|
| vercel-labs agent-skills + find-skills | pendente | npm/GitHub indisponíveis; não há arquivos de skills instalados nem lockfile verdadeiro |
| next-dev-loop | pendente | Next declarado 16.4.2; sem dependências/browser/`/_next/mcp` executado |
| next-bundle-optimizer | pendente | requer Next executável e `next analyze --help` |
| supabase-postgres-best-practices | pendente | PostgreSQL selecionado; instalar skill no projeto quando houver rede |
| gh-fix-ci | não selecionado | sem GitHub Actions/PR autorizada |
| differential-review | pendente | revisão read-only manual como fallback; sem skill instalada |
| shadcn | não selecionado | nenhuma biblioteca de UI escolhida; CSS local no protótipo |
| Sentry MCP | não selecionado | sem projeto/organização autorizados |
| Harness2 nativo | configurado, smoke estático apenas | descrição em `docs/quality.md`; CLI oficial não instalado |
| Ponytail full / Caveman / Superpowers / RTK | não disponíveis para inspeção neste container | não mudar plugins, globals ou preferências da máquina |
| Context7 | pendente | conexão live não disponível; não inventar query; consultar documentação oficial como fallback |
| Graphify | pendente | CLI ausente; exclusions `.graphifyignore` criado; graph não gerado |
| Yarnl demo autenticada | não executada | acesso interativo com credenciais demo não disponível no browser de pesquisa; estrutura pública consultada |

## Evidências de comandos — estados honestos
- **Validado:** presença de Node/npm/git; projeto novo criado e seus arquivos em disco.
- **Validado:** `npm run check:offline` (14 arquivos exigidos, endpoints fechados por padrão); `node scripts/verify-quality-rules.mjs` (3 regras disponíveis, mas sem RuleTester do toolkit).
- **Validado:** parser/transpilador TypeScript global verificou sintaxe de 19 arquivos `.ts/.tsx/.mts` (não fez checagem de tipos); `tsc --strict` isolado compilou `src/lib/entitlements.ts` para JS, e 5 verificações independentes de permissões passaram (não são os testes Vitest completos).
- **Pendente:** `npm install` (falha EAI_AGAIN por DNS), dependências resolvidas, `package-lock.json`, `npm run check`, `npm run db:generate` (sem schema), auditorias npm, porta HTTP, testes browser/E2E, hooks/skills/Context7/Graphify e integração real com serviços.
- **Não realizado:** login, envio de e-mail, conexão Supabase, processar payload Hotmart, uploads, deploy, push, migration.

## Pendências prioritárias para agente no projeto local com rede
1. `npm install`; verificar compatibilidade de dependências e registrar versões reais em `package-lock.json`. Se houver erro, consertar a combinação respeitando versões estáveis oficiais; sem `--force` ou `--legacy-peer-deps`.
2. Confrontar scaffold com saída do `create-next-app --help` e do toolkit na revisão Git fixada, mesclar os templates e regras faltantes **sem apagar alterações**.
3. Instalar web skills locais via `npx skills` com agentes utilizados e travar `skills-lock.json`; validar discovery; configurar Context7 somente no cliente apropriado, com autorização.
4. Executar `npm run check`, audit prod/dev, `npm run dev`, HTTP e validações do Next runtime; anotar resultados observados nesta página.
5. Antes de produção: implementar integrações Hotmart/Supabase/e-mail/admin, dados reais e testes de autorização, com segredos fornecidos pelo proprietário.

## Próxima tarefa MVP
A partir dos eventos Hotmart de teste (com dados pessoais removidos), implementar camada de ingestão autenticada/idempotente e mapeamento persistente SKU ↔ coleção, verificando aprovações e estornos de qualquer combinação de seis produtos. Não publicar enquanto a segurança real não for testada.

## Validação local da entrega administrativa — 2026-10-19
Esta execução ocorreu no Windows, no workspace local BorsaMia; as limitações do container original acima são históricas.
- Instalado `@supabase/supabase-js`, com atualização de package.json/package-lock.json.
- `npm test`: 16 testes passaram em 2 arquivos (11 administrativos e 5 de permissões comerciais).
- `npm run typecheck` e `npm run build`: passaram; rotas administrativas compiladas.
- ESLint normal e typed direcionados aos novos arquivos: passaram.
- `npm run check`: interrompido no lint por 9 erros preexistentes (CommonJS na regra local e apóstrofos JSX em telas existentes), além de 5 warnings. Não declarar o check completo aprovado.
- `npm audit --omit=dev`: 1 vulnerabilidade alta em drizzle-orm <0.45.2 (GHSA-gpj5-g38j-94v9); a consulta nova usa parâmetros e identificadores estáticos, mas a dependência requer atualização antes de produção. A instalação reportou 10 vulnerabilidades totais (4 moderadas, 6 altas), incluindo desenvolvimento; não confundir com o único achado de produção.
- Revisão estática: nenhuma consulta comercial exposta, nenhuma chave service-role enviada ao navegador, guarda servidor por UUID/MFA/sessão/registro ativo, consultas parametrizadas, origem obrigatória nas mutações, cookie HttpOnly e falha fechada. Não equivale a uma auditoria externa.
- Não executados: login/MFA real, teste remoto de logout/revogação/rate limiting, conexão ao Supabase e deploy. Não há `.env.local` configurado neste workspace. Nenhuma migração executada.
- Ativação e testes manuais: [admin-setup.md](admin-setup.md).

## Páginas de produtos — validação local
Criadas quatro páginas estáticas de entrada de produtos. ESLint dos arquivos alterados e `npm run build` passaram; build gerou `/prodotti/borse`, `/prodotti/fodere`, `/prodotti/club` e `/prodotti/portachiavi`. Sem publicação remota ou mudança em permissões/integrações.

## Diagnóstico do deploy de produtos
Deploy `6ad68780d72d53c4e7e743dd`, commit `539b712`, falhou no secrets scanning: o valor de SUPABASE_URL foi encontrado em docs/admin-setup.md. O build Next e as quatro páginas haviam sido gerados com sucesso. Produção permaneceu no commit anterior `2e85c90`, explicando o HTTP 404. Removido o valor concreto do documento, sem desativar o scanner. Correção local ainda requer envio ao GitHub e novo deploy. CLI local vinculada ao projeto borsamia somente para consultar logs; nenhum deploy iniciado nesta investigação.
