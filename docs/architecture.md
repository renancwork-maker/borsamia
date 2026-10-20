# Architettura BorsaMia

- Next.js 16 App Router, Netlify OpenNext, Route Handlers Node, React, CSS local.
- PostgreSQL Supabase no schema `borsamia_private`, acessível somente pelo servidor. SQL canônico: `docs/sql/001-hotmart.sql`; upgrade para esquema anterior: `docs/sql/002-activate-collections.sql`.
- `product_mappings` determina coleção para product.id da Hotmart. `hotmart_events` registra eventos autenticados de modo idempotente. A view `current_entitlements` computa compras ativas e assinatura somente dentro de período pago verificado.
- Hottok da Hotmart validado no header, comparado com secret de ambiente. Sandbox/id=0 não autoriza. Eventos podem chegar fora de ordem; reembolso de transação prevalece.
- `SUBSCRIPTION_CANCELLATION` nunca estende prazo; verificação do próximo pagamento usa **apenas** `purchase.date_next_charge` de um evento de aprovação válido. Se faltar evidência, fecha acesso ao Club. `UPDATE_SUBSCRIPTION_CHARGE_DATE` é apenas registro e não cria permissão.
- Supabase Auth com OTP numerico e cookies HttpOnly (accesso + refresh); `authorizeCustomer` verifica sessão e e-mail no servidor. Não aceita só a digitação de e-mail para leitura de conteúdo privado.
- Metadados dos PDFs registrados em `borsamia_private.collection_files`. Arquivos reais em bucket Supabase Storage **privado** `borsamia-content`. `/api/library/[collectionId]` lista metadados após autorização; `/api/library/[collectionId]/[fileId]` verifica autorização de novo e redireciona para URL assinada curta.
- As quatro páginas de produto são páginas públicas de apresentação e exigem sessão + permissão para listar PDFs; não prometem arquivos fictícios.
- Ainda faltam implantação, SQL autorizado, teste real de pagamento, conteúdo digital real e configuração de SMTP. Sem esses serviços, funcionalidades de backend permanecem indisponíveis.
