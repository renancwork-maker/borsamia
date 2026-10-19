# Qualidade e segurança

## Comandos e o que demonstram
- `npm run check:offline`: verificações estruturais estáticas sem pacotes — **executadas, 14 arquivos OK**; não provam compilação nem segurança. O parser TypeScript global também confirmou sintaxe de 19 arquivos; uma execução isolada de 5 casos de domínio passou sem dependências da aplicação.
- `npm run lint`: configura ESLint com presets Next e regras locais `350 linhas`, `no console` e fronteira de DB; requer npm instalado e execução posterior.
- `npm run typecheck`: `next typegen && tsc --noEmit`, requer dependências e compilação real.
- `npm run lint:typed`: `no-floating-promises` e `no-misused-promises`, requer dependências; medir tempo depois.
- `npm run lint:rules`: comprova presença de regras, **não faz** RuleTester extenso do toolkit original.
- `npm test`: Vitest em `src/lib/entitlements.test.ts`; cobre combinação de compras, isolamento de e-mail, status pendente, duplicata/estorno fora de ordem e conflito de transação. **Não executado via Vitest nesta montagem sem npm**.
- `npm run build`: Next build sem banco/segredos; pendente.
- `npm run db:generate`: só quando houver esquema; SQL deve ser revisado; não aplicado automaticamente.
- `npm audit --omit=dev` e `npm audit`: dependem de lockfile e rede, ainda pendentes; separar produção/desenvolvimento.

## Gates de autenticação e dinheiro (pendentes)
- Cobrir payloads reais aprovados/pending/reembolso/chargeback por ID de transação e produto; replays, duplicatas e ordem invertida.
- Verificar assinatura/segredo e reconciliar evento, gravar de modo atômico, reprocessar falhas e não gravar dados não autenticados.
- Códigos de acesso com TTL, uso único, tokens hash, rate limiting, cookie HttpOnly/Secure/SameSite, revogação de sessão, anti-enumeração.
- Teste de autorização negativo de PDF e API, sem URLs persistentes, com quaisquer sequências de produto/comprador; leitura de arquivos requer permissão verificável.
- Admin com identidade independente e trilha de auditoria.

## Revisão de segurança reproduzível
Fonte versionada por caminho: `https://github.com/soumatheusgomes/vibe-coding-toolkit/blob/main/docs/prompts/13-security-review.md`, consultada em 2026-10-19. Como SHA exato não ficou acessível ao terminal, consultar o commit antes de reproduzir; usar revisão read-only de repositório/diff com relatório privado, sem publicar segredos, e aplicar achados verificados. Não declarar segurança absoluta.

## Harness (adaptação nativa, não instalação Harness²)
Guia: `docs/tools/23-harness2.md` e `docs/prompts/15-harness-improvement.md` no repositório do toolkit, revisão `main` consultada 2026-10-19 (SHA pendente). Método: definir caso descartável → capturar evidência inicial → corrigir apenas falha observada em escopo autorizado → testar no mesmo input → manter somente melhoria comprovada. Não instalar harness2, chamar modelos externos ou mudar autenticação/faturamento.

Casos iniciais aplicáveis: estrutura do projeto e guardas de endpoints (ver `scripts/validate-structure.mjs`); checagens reais de agente novo, Context7, browser, E2E e serviços estão **não executadas**. Para reuso: "Execute os casos do docs/quality.md e registre o resultado em docs/setup.md; adapte o harness apenas após falha observada, preservando modelo/cliente e escopo".
