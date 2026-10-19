# Arquitetura — estado real e evolução prevista

## Implementado nesta fundação
- `src/app/`: App Router com `/` (dashboard visual), `/accedi` e APIs com **falha fechada** (`/api/access/request` → 503; `/api/hotmart/webhook` → 503; `/api/library/[collectionId]` → 401).
- `src/components/`: interface interativa, busca por coleção e formulário italiano, sem assumir autenticação.
- `src/lib/catalog.ts`: seis coleções como metadados públicos; IDs internos NÃO são IDs Hotmart. Não persistem permissões.
- `src/lib/entitlements.ts`: política de conjunto de produtos baseada em **transações normalizadas e verificadas**, com tratamento conservador de status de reembolso para mesmo ID. **Não é processador de webhook real.**
- `src/db/index.ts`: conexão `pg` lazy e pool por instância limitado a 3, sem acesso inicial à DB. `src/db/schema/index.ts` intencionalmente sem tabelas, por ausência de eventos confirmados.
- `src/lib/env.ts`: valida URL de PostgreSQL sem expor seu valor. `src/lib/logger.ts`: Pino para mensagens servidor com política inicial de redaction.

## Arquitetura alvo (ainda não implementada)
```text
Hotmart (eventos assinados/verificados)
    → Next.js Route Handler na Netlify Function
    → validação/autenticidade/normalização + registro idempotente
    → PostgreSQL Supabase: compras por transação e produto + produtos ↔ coleções
    → permissões calculadas por transações válidas

Cliente → login e-mail → e-mail magic link → sessão HttpOnly
    → API de biblioteca autorizada por sessão + coleção
    → Storage Supabase privado → URL assinada e curta / streaming autorizado
    → progresso/favoritos por cliente

Administrador → autenticação própria → operações auditadas
```

**Cuidado:** a ordem dos webhooks pode ser arbitrária. Deduplicação exige evento identificável e reconciliação do status final; não aplicar eventos como simples `toggle`. Idempotência por `event_id` real (se disponível) + transação e tipo; avaliar amostras e documentação vigente antes de criar chaves. Em estornos, a função comercial de demonstração nunca reativa transação revogada. O backend real deve reconciliar reativações legítimas pela API autorizada da Hotmart, não por ordens supostas.

## Segurança planejada
- Autenticar webhooks com o mecanismo **documentado e efetivamente configurado** na Hotmart; não presumir que só cabeçalho `hottok` assegura autenticidade em todas as versões. Acesso a API para reconciliação quando aplicável.
- Separar e proteger autenticação admin da sessão do cliente. Implementar CSRF em operações de mudança, cookies HttpOnly/SameSite/Secure, rate limiting e magic links com tokens aleatórios armazenados como hash.
- Supabase service role somente no backend; Storage privado e autorização verificada antes de emitir URLs temporárias. Configurar RLS para limitar danos e nunca expor tabelas de compradores.
- Migrations geradas/revisadas no desenvolvimento e executadas somente com banco autorizado (idealmente conexão direta `DATABASE_URL_UNPOOLED`); nunca em build.
- Guardas sintáticos de lint ajudam, mas não provam autorização nem substituem revisão.

## Decisões de plataforma
O briefing prefere React+Vite, mas o usuário explicitamente pediu aplicar **o bootstrap Next.js** do toolkit. Escolha do bootstrap: Next.js 16.4.2 App Router, Node 22, TypeScript, Tailwind, npm, PostgreSQL+Drizzle. Netlify suporta Next.js OpenNext sem pin manual de adapter; route handlers são publicados automaticamente como funções, sem servidor persistente. Fonte: https://docs.netlify.com/build/frameworks/framework-setup-guides/nextjs/overview/ (consultada 2026-10-19).

## Limitações
Sem npm/cache de pacotes ou acesso ao repositório no terminal disponível; construção manual com dependências declaradas, sem lockfile e sem validação de resolução. Scripts e configurações precisam ser testados por instalação real antes de produção. Não foi possível entrar na sessão autenticada do Yarnl para análise visual por browser; apenas estrutura pública textual consultada.

## Atualização: autenticação administrativa
Implementados `/admin/accedi`, `/admin` e `/api/admin/session`: Supabase Auth com senha + TOTP e guarda servidor para identidade, AAL2, sessão e administrador ativo. Painel inicial sem dados comerciais. Configuração, revogação e limitações em [admin-setup.md](admin-setup.md). Não houve migração nem publicação nesta entrega.
