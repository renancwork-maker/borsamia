# Acesso administrativo

## Configuração
O proprietário confirmou por consulta no Supabase o registro ativo do usuário em `borsamia_private.administrators`. A aplicação usa `user_id` e `revoked_at`, sem conceder acesso por comparação de e-mail. Nenhuma migração foi executada pelo agente.

No Netlify, configure as variáveis para o runtime (Functions):
- `SUPABASE_URL`: URL do projeto, por exemplo `https://xavmcflqtcudliyyrwzf.supabase.co`.
- `SUPABASE_PUBLISHABLE_KEY`: chave **publishable**, iniciada por `sb_publishable_`, obtida em Project Settings → API Keys. Essa chave é pública e é a única enviada ao formulário. Chaves secret/service-role não são aceitas nesse campo.
- `DATABASE_URL`: conexão PostgreSQL já configurada. O papel servidor precisa ler `borsamia_private.administrators` e `auth.sessions`; nunca conceder esses privilégios a `anon`/`authenticated`.
- `APP_BASE_URL`: origem HTTPS exata do site. Para desenvolvimento, `http://localhost:3000`. Não usar uma URL diferente da aberta no navegador.

Para execução local, coloque as mesmas variáveis em `.env.local` (ignorado pelo Git). Não coloque segredos no código ou no chat.

Em Authentication do Supabase, mantenha o provedor de e-mail/senha e a inscrição/verificação MFA TOTP habilitados. Revise os limites de Auth: tentativas de senha, desafios e verificação TOTP são enviados diretamente ao Supabase e estão sujeitos aos limites do provedor, inclusive HTTP 429. A aplicação não implementa um contador distribuído próprio. Os limites reais precisam ser testados no projeto remoto.

Depois de publicar o código e criar um novo deploy, abra `/admin/accedi`. Digite o e-mail e a senha criados no Supabase Auth. No primeiro acesso, adicione a chave mostrada a um aplicativo autenticador usando TOTP baseado no tempo e informe os seis dígitos. Nos próximos acessos, informe o código do fator já cadastrado.

## Comportamento e limites
- Tokens Supabase ficam somente em memória durante o login/MFA; não são gravados em localStorage. A chave TOTP aparece apenas durante o cadastro.
- Após validar assinatura, expiração, identidade, nível `aal2`, sessão Auth existente e permissão ativa, o backend cria cookie HttpOnly, SameSite Strict e Secure em produção.
- A sessão administrativa dura no máximo uma hora ou a validade restante do token, o que ocorrer primeiro. Sem renovação automática: entrar novamente após expirar.
- Cada acesso a `/admin` verifica novamente a permissão e a sessão. Falhas fecham o acesso. Novas APIs administrativas devem chamar a mesma guarda; proteger apenas a página não protege uma API.
- Logout limpa o cookie e solicita revogação da sessão no Supabase. Falha remota é informada; um token copiado pode continuar válido até expirar se a revogação não ocorrer.
- O painel confirma a autenticação, mas ainda não lista compradores, compras ou PDFs; esses módulos não existem. A autorização de clientes e arquivos permanece fechada.
- Recuperação de senha ou perda do autenticador deve ser tratada pelo proprietário no Supabase; não há fluxo de recuperação próprio nesta entrega.

## Revogação
Execute no SQL Editor, como proprietário, para remover o acesso administrativo:

```sql
update borsamia_private.administrators
set revoked_at = now()
where user_id = (
  select id from auth.users
  where lower(email) = 'renanc.work@gmail.com'
);
```

## Verificação antes de uso real
Testar no ambiente remoto: senha incorreta, primeiro cadastro TOTP, código errado, login correto, expiração, logout e repetição de cookie após logout, revogação administrativa, indisponibilidade do banco e limites 429 do Auth. Os testes unitários usam mocks, não comprovam a configuração remota nem a compatibilidade futura de `auth.sessions` (tabela gerenciada pelo Supabase). Não alterar essa tabela manualmente.

Fontes: [Supabase MFA](https://supabase.com/docs/guides/auth/auth-mfa), [TOTP](https://supabase.com/docs/guides/auth/auth-mfa/totp). API Next cookies/route handlers conferida na documentação instalada.
