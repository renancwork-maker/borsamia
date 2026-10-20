> **ATTENZIONE — nuovo login via codice numerico**: qualsiasi indicazione storica sui link con `token_hash` è sostituita dalle istruzioni in `LEIA-PRIMEIRO-ACESSO-SEM-LINK.txt`.

# BorsaMia — Envio automático Resend + Hotmart

## O que foi implementado

- Compra Hotmart autêntica `PURCHASE_APPROVED` ou `PURCHASE_COMPLETE`, com produto mapeado e acesso confirmado: e-mail de boas-vindas em **italiano**.
- Cada produto principal e cada order bump é identificado pelo **próprio ID e transação Hotmart**; os e-mails listam apenas coleções que a consulta `current_entitlements` comprova como ativas no momento.
- As notificações da mesma compra que chegam como `PURCHASE_APPROVED` e `PURCHASE_COMPLETE` compartilham a mesma chave `(transaction_id, product_id)` para não duplicar o e-mail.
- Um order bump pode chegar **depois** da compra principal; nesse caso o sistema envia um e-mail adicional informando os acessos disponíveis. Se os dois chegarem antes do envio, o e-mail lista ambos.
- Sandbox, desconhecidos, reembolso, chargeback e assinaturas sem comprovação de período pago **não geram e-mail de boas-vindas**.
- Erros do Resend fazem o webhook responder 503: a Hotmart poderá reenviar o evento e a integração poderá tentar novamente. O banco registra tentativas; as requisições ao Resend usam idempotency key estável, mas nenhum sistema externo pode garantir exatamente uma entrega em todas as falhas possíveis.

## 1. Banco (obrigatório, ANTES de publicar esta versão)

No Supabase SQL Editor, depois de `001-hotmart.sql` (já aplicado ao projeto), execute **somente** `docs/sql/003-resend-welcome.sql`.

Não execute `001` novamente. Este upgrade cria a tabela privada `borsamia_private.welcome_deliveries` e não altera transações já registradas.

Consulta de monitoramento (sem expor e-mails):

```sql
SELECT status, attempts, sent_at, product_id
FROM borsamia_private.welcome_deliveries
ORDER BY sent_at DESC NULLS LAST
LIMIT 20;
```

## 2. Netlify — variáveis de produção

Já configuradas pelo usuário: `APP_BASE_URL=https://borsamia.netlify.app`, `DATABASE_URL`, `HOTMART_WEBHOOK_SECRET`, `RESEND_API_KEY`, `RESEND_FROM=BorsaMia <accesso@digitalco.site>`, `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`.

**Ainda conferir / adicionar:**

- `HOTMART_WEBHOOK_ENABLED=true` — sem isso o webhook retorna 503. Ative só após aplicar SQL e ter o webhook cadastrado corretamente.
- `CUSTOMER_ACCESS_ENABLED=true` — sem isso a página `/accedi` não permite enviar o link de login. Ative depois de configurar o Auth/SMTP e validar as permissões.
- `SUPABASE_SERVICE_ROLE_KEY` — necessária para gerar URLs assinadas de PDFs do bucket privado; armazenar apenas em ambiente de servidor.

Nunca colocar essas chaves em `NEXT_PUBLIC_*`, GitHub ou prints. `RESEND_API_KEY` e `HOTMART_WEBHOOK_SECRET` devem ficar protegidas como secret. Faça novo deploy após salvar as variáveis.

## 3. Supabase Auth: SMTP é uma configuração SEPARADA

A API `RESEND_API_KEY` na Netlify envia o **e-mail de boas-vindas**. A solicitação de **magic link** no código é feita pelo Supabase Auth (`signInWithOtp`); portanto o Auth precisa de SMTP configurado no Supabase.

Supabase → Authentication → SMTP Settings (ou Auth → SMTP): configure SMTP personalizado:

- Host: `smtp.resend.com`
- Porta: `465` (SSL/TLS, conforme a opção do painel)
- Usuário: `resend`
- Senha: a chave `re_...` do Resend, colada diretamente no painel do Supabase
- Remetente: `accesso@digitalco.site`
- Nome: `BorsaMia`

Confirme também o endereço e as URLs permitidas para `https://borsamia.netlify.app` e `https://borsamia.netlify.app/accesso/conferma` no Supabase Auth. Ajuste os templates **Magic Link** e **Confirm Signup** usando a orientação em `docs/hotmart-setup.md`; o código usa `#token_hash=...` e `verifyOtp(type: "email")`.

**Atenção:** o SMTP no Supabase não pode ser configurado apenas adicionando variáveis na Netlify. Teste o envio de link para um comprador de teste com acesso ativo antes de receber pedidos reais.

## 4. Publicação e testes

1. Aplique o SQL 003.
2. Configure SMTP do Supabase e os templates de login.
3. Confirme o bucket `borsamia-content` privado e os PDFs reais cadastrados em `collection_files` (senão o cliente recebe acesso mas não encontra os arquivos).
4. Adicione as variáveis pendentes, faça deploy do **código-fonte Next.js via Git ou Netlify CLI**, não arrastando o ZIP como site HTML estático.
5. Confirme o webhook Hotmart (versão 2.0.0, com `X-HOTMART-HOTTOK`) em `https://borsamia.netlify.app/api/hotmart/webhook`.
6. Faça testes autorizados: compra principal, cada order bump, combinação, reembolso, reenviar o mesmo evento e renovação válida do Club. Verifique `hotmart_events.disposition`, `current_entitlements`, `welcome_deliveries.status='sent'` e os e-mails no painel do Resend.
7. Verifique o login em `/accedi` e downloads privados reais antes de comercializar.

**Limitações:** não executamos compras reais, nem enviamos e-mails reais, nem alteramos o Supabase/Netlify remoto. Compras históricas registradas **antes** deste upgrade não são reprocessadas automaticamente; o envio novo ocorre mediante eventos autenticados que forem recebidos/reprocessados.
