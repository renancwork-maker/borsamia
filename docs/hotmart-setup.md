# Ativação BorsaMia — Hotmart, Supabase e Netlify

**Leia antes de colocar à venda.** Este ZIP é código corrigido, não um deploy executado. Não foram fornecidos o banco Supabase, credenciais reais, Hotmart de produção nem os PDFs. Os IDs informados pelo proprietário foram adotados sem confirmação externa.

## A. Banco de dados (Supabase)

1. Faça backup antes de qualquer alteração.
2. Se o esquema `borsamia_private` ainda NÃO tiver as tabelas `product_mappings` e `hotmart_events`, execute **apenas** `docs/sql/001-hotmart.sql` no SQL Editor.
3. Se você já aplicou a versão de `001-hotmart.sql` do ZIP anterior, faça backup, revise e execute **apenas** `docs/sql/002-activate-collections.sql`. Não execute 001 e 002 em sequência num banco novo.
4. Confirme as quatro linhas no `borsamia_private.product_mappings`. O Club usa `plan_id=NULL` até você confirmar o ID real; produtos são identificados pelo `product.id` numérico cadastrado.
5. As tabelas estão em um schema privado, com permissões negadas para `anon` e `authenticated`. **Não exponha esse schema na Data API pública.** A aplicação usa `DATABASE_URL` administrativa, somente no servidor.
6. A view `current_entitlements` calcula acessos pelas transações de compra aprovadas, sem pagamentos reembolsados ou chargebacks. Cada Order Bump gera sua própria transação, sem ativar os demais produtos.
7. O Club só fica disponível quando um webhook aprovado, com `subscription.status=ACTIVE`, `subscription.subscriber.code` e `purchase.date_next_charge` futuro, comprovar o ciclo pago. Um evento de mera mudança de data não libera nem renova o Club. Cancelamentos sem reembolso não ampliam o período pago; expira na data de renovação verificada. Se a Hotmart real não enviar `date_next_charge` na aprovação, o evento ficará `needs_reconciliation` e você precisará ajustar a integração conforme o evento real/API oficial, antes de vender a assinatura.

Após aplicar `001-hotmart.sql`, execute também `docs/sql/003-resend-welcome.sql` antes de publicar a integração Resend. Leia `docs/RESEND-AUTOMATICO.md` para os passos de SMTP e e-mails de boas-vindas.

## B. Conteúdos digitais

1. Supabase → Storage → crie bucket **privado** chamado exatamente `borsamia-content` (public OFF).
2. Envie os PDFs e vídeos reais em subpastas, por exemplo `borse/modello-001.pdf`, `fodere/manuale.pdf`, `portachiavi/schema-001.pdf`, `club/2026-10/modello-01.pdf`.
3. No SQL Editor, registre cada arquivo que existir, de preferência com `visible=false` até revisar. Exemplo (substitua o caminho por um arquivo realmente enviado):

```sql
INSERT INTO borsamia_private.collection_files
 (collection_id, title_it, description_it, file_type, storage_path, display_order, visible)
VALUES ('fodere','Manuale di fodere','Misure, tasche, cerniere e rinforzi','pdf','fodere/manuale.pdf',1,true);
```

4. IDs internos admitidos: `borse`, `fodere`, `club`, `portachiavi-37`. Use nomes e descrições **somente em italiano**. Para o Club, registre os 12 novos materiais correspondentes a cada mês.
5. A página somente lista os materiais cadastrados. A rota `/api/library/<id-da-colecao>/<uuid-do-arquivo>` exige sessão e autorização de compra, e gera link assinado válido por 90 segundos. Não use bucket público ou URLs permanentes para conteúdo pago.
6. Se os PDFs não forem enviados, clientes com compras ativas verão uma mensagem informando que os materiais não foram cadastrados. **Não anuncie o produto como entregue enquanto faltarem os materiais.**

## C. Netlify → Site configuration → Environment variables

Variáveis obrigatórias (produções e Functions, não variáveis públicas):

```ini
APP_BASE_URL=https://borsamia.netlify.app
DATABASE_URL=<conexao-postgres-com-acesso-ao-schema-privado>
SUPABASE_URL=https://<seu-projeto>.supabase.co
SUPABASE_PUBLISHABLE_KEY=<chave-publishable>
SUPABASE_SERVICE_ROLE_KEY=<chave-service-role-servidor>
HOTMART_WEBHOOK_SECRET=<HOTTOK-REAL-DA-HOTMART>
HOTMART_WEBHOOK_ENABLED=true
CUSTOMER_ACCESS_ENABLED=true
RESEND_API_KEY=<chave-do-resend>
RESEND_FROM=BorsaMia <accesso@digitalco.site>
```

Ative as duas flags `true` **somente depois** que o SQL, os conteúdos, a autenticação e os testes tiverem passado. No início deixe `false`. Jamais use variáveis `NEXT_PUBLIC_` para credenciais. Redeploy após alterar variáveis.

Next.js 16 roda em Netlify com adaptador OpenNext automático: mantenha `netlify.toml`, não faça exportação estática.

## D. Supabase Auth — login sem senha

1. Habilite login por e-mail e configure SMTP transacional de produção para os compradores. Configure `Site URL` igual a `APP_BASE_URL` e redirecionamento permitido para `https://borsamia.netlify.app/accesso/conferma`.
2. Configure os templates Magic Link **e** Confirm Signup em italiano. Para que o fluxo do código funcione, o link deve ter a forma:

```html
<h2>Accedi alla tua biblioteca BorsaMia</h2>
<p>Conferma il tuo indirizzo e-mail per consultare i contenuti acquistati.</p>
<p><a href="{{ .SiteURL }}/accesso/conferma#token_hash={{ .TokenHash }}">Accedi alla mia biblioteca</a></p>
<p>Se non hai richiesto questo accesso, ignora questa e-mail.</p>
```

3. Cliente entra em `/accedi`, informa e-mail da compra, recebe link de titularidade, clica para confirmar, e entra em `/biblioteca`. Não há senha tradicional.
4. Atenção: o cliente deve ser capaz de receber e abrir o e-mail do próprio endereço. Somente digitar um e-mail encontrado na Hotmart **não é suficiente por segurança**.

## E. Hotmart → Ferramentas → Webhook

1. Configure destino: `https://borsamia.netlify.app/api/hotmart/webhook`.
2. Versão do evento: **2.0.0**.
3. Cadastre eventos dos 4 produtos reais: `8765000`, `8765113`, `8765856`, `8766213`.
4. Eventos recomendados: `PURCHASE_APPROVED`, `PURCHASE_COMPLETE`, `PURCHASE_REFUNDED`, `PURCHASE_CHARGEBACK`, `PURCHASE_CANCELED`, `PURCHASE_DELAYED` e `SUBSCRIPTION_CANCELLATION` para o Club. `UPDATE_SUBSCRIPTION_CHARGE_DATE` pode ser registrado, mas não libera acesso.
5. O segredo usado em `HOTMART_WEBHOOK_SECRET` deve ser o valor real do seu `Hottok` (verificação `X-HOTMART-HOTTOK`); **não publique nem armazene esse valor no repositório**. Se algum token real foi exposto em conversas ou capturas, solicite sua rotação.
6. Teste primeiro com flags ligadas e cenário controlado. Eventos de teste com `product.id=0`, `HTM_SANDBOX` ou IDs desconhecidos nunca liberam acesso real. O teste da Hotmart com esses dados serve para validar o recebimento da notificação, não a entrega do conteúdo.
7. Para validar liberação, faça uma transação real de teste autorizada (ou ambiente de homologação com IDs reais), depois confira o banco e login. Não edite `product.id` de webhooks de produção manualmente.

## F. Testes de aceite indispensáveis

- Compra principal libera **apenas** `borse`.
- Compra principal + Manual libera `borse` e `fodere`.
- Compra principal + Chaveiros libera `borse` e `portachiavi-37`.
- Compra apenas do Club (se autorizada comercialmente) libera **apenas** `club` enquanto durar o período pago validado.
- Reembolso do manual revoga só o manual; bolsa comprada separadamente permanece disponível.
- Webhooks repetidos não geram duplos acessos; cada compra possui transação própria; ordens de chegada diferentes devem funcionar.
- E-mail não adquirido não recebe links nem permissões. E-mail de outro comprador exige confirmação entregue ao titular.
- PDFs não estão disponíveis sem sessão ou sem permissão da coleção.
- Renovações pagas estendem Club ao novo `date_next_charge`; atraso confirmado bloqueia enquanto não houver nova renovação paga válida.
- Após uma compra aprovada, `disposition` deve ser `recorded` para produtos avulsos e para o Club com período pago verificado. `sandbox`, `unmapped` e `needs_reconciliation` são **sem liberação**.

Consulta de suporte (nunca compartilhar lista de e-mails de clientes publicamente):

```sql
SELECT event_type, product_id, disposition, received_at
FROM borsamia_private.hotmart_events ORDER BY received_at DESC LIMIT 20;
SELECT buyer_email, collection_id FROM borsamia_private.current_entitlements
WHERE buyer_email = 'comprador@example.com';
SELECT product_id, collection_id, access_kind, plan_id FROM borsamia_private.product_mappings;
```

## G. Validações locais

Rodar em um computador com as dependências apropriadas ao sistema operacional:

```bash
npm ci
npm run typecheck
npm test
npm run lint
npm run build
```

Os módulos `node_modules` do ZIP recebido eram do Windows e não foram incluídos neste pacote de distribuição. O TypeScript foi verificado neste ambiente, mas o build Next.js completo e a execução de testes Vitest dependem de pacotes nativos Linux não disponíveis sem acesso ao registro npm. Não trate a ausência dessa validação como sucesso em produção.

## Referências oficiais

- https://developers.hotmart.com/docs/en/2.0.0/webhook/purchase-webhook/
- https://developers.hotmart.com/docs/pt-BR/tutorials/use-webhook-for-subscriptions/
- https://supabase.com/docs/guides/auth/auth-email-passwordless
- https://docs.netlify.com/build/frameworks/framework-setup-guides/nextjs/overview/
