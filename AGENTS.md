# BorsaMia — Instruções para agentes de desenvolvimento

Ler `PRODUCT.md` antes de alterar fluxos comerciais. As fontes canônicas são `PRODUCT.md`, `docs/architecture.md`, `docs/design.md`, `docs/quality.md`, `docs/setup.md`. Corrigir os documentos responsáveis junto das alterações de produto/código; não duplicar decisões.

## Linguagem e escopo
Todas as telas, mensagens, erros e e-mails destinados a clientes devem estar em italiano natural da Itália (IT-IT). Documentação de implementação pode ser em português; nomes de código em inglês. Não inventar PDFs, traduções, links Hotmart, IDs reais ou credenciais.

## Arquitetura, segurança e dados
Next.js App Router/TypeScript/Netlify OpenNext. Supabase PostgreSQL/Storage privados planejados; Drizzle e `pg` são módulos base, não dados implantados. Não criar tabelas com suposições sobre payload da Hotmart; validar evento real, mapear SKU de modo dinâmico, deduplicar por chave confiável e distinguir status da transação. Sucesso de compra no browser nunca concede acesso. Sessão por magic link de uso único e expiração; APIs e PDF devem verificar sessão + permissão **no backend**. Não expor service role, hottok, segredos ou URLs estáveis de PDF ao cliente. Nunca migrar banco sem destino explícito e autorização.

## Comandos
`npm run dev`; `npm run lint`; `npm run typecheck`; `npm run lint:typed`; `npm run lint:rules`; `npm test`; `npm run build`; `npm run check`; `npm run check:offline`. `db:generate` só depois de definir esquema; `db:migrate` requer autorização do banco de destino. Não adicionar hooks Git nem mudar configs globais.

## Regras de qualidade
Limite 350 linhas/arquivo (exceto testes); sem `console` direto em produção, usar logger servidor; não importar `getDb` em `src/app` ou componentes; operações Drizzle `update/delete` exigem WHERE; `no-floating-promises` e `no-misused-promises` no typed lint. Testar revogação, duplicidade, fora de ordem, transação repetida, autorização no PDF e rate limiting. Falha de integração deve manter o acesso fechado.

## Instruções Next.js
Usar documentação oficial da versão instalada em `node_modules/next/dist/docs` quando disponível e o guia oficial https://nextjs.org/docs/app . Next.js App Router e route handlers devem permanecer compatíveis com Netlify. Não copiar UI, arquivos, mascote nem logotipo do Yarnl.

## Evidência e revisão
`docs/setup.md` documenta ausência de rede/npm nesta montagem, portanto não afirmar que build/lint/serviços foram validados sem executar. Executar revisões read-only antes de expor funções com dados de compradores. Auditorias de dependências devem distinguir dev/prod. Sem publicação/push não autorizado.
