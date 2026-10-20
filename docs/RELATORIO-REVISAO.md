> **Atualização (acesso sem link):** a versão atual substitui o Magic Link por OTP de 6 dígitos e sessão renovável. Consulte `LEIA-PRIMEIRO-ACESSO-SEM-LINK.txt`. O restante deste relatório refere-se à versão anterior.

# Relatório de auditoria e correções — BorsaMia

Data: 2026-10-20. Fonte: ZIP recebido nesta conversa. O conteúdo abaixo descreve **código local corrigido**, não publicação automática na Netlify.

## Encontrado no ZIP original

- Next.js 16.4.2 + Netlify configurado para OpenNext, com quatro páginas de produto praticamente vazias.
- Endpoint Hotmart verificava token e salvava eventos, mas não concedia o Club por período pago; mapeamento trazia `plan_id=1412417` não confirmado.
- Biblioteca de comprador era texto genérico; API de arquivos retornava sempre 401.
- Não existiam imagens, PDFs, tutorial real, 101 modelos, 37 chaveiros nem 12 modelos mensais.
- Variáveis de ambiente de produção não incluídas; banco privado não confirmado como migrado.

## Implementações deste pacote

- Quatro páginas `/prodotti/...`, homepage e `/biblioteca` com fotografias ilustrativas distintas e texto comercial correto em italiano, inclusive avisos de assinatura recorrente e de itens digitais.
- Metadados ligados estritamente aos quatro IDs informados: 8765000, 8765113, 8765856 e 8766213.
- Parser de eventos de compra com `order_bump.parent_purchase_transaction`, `subscription.status`, `purchase.date_next_charge` e tratamento de variantes CANCELLED/OVERDUE; preserva prevenção de sandbox e idempotência.
- SQL novo 001 e migração 002 compatível com esquema anterior. View agrupa aquisições por transação e calcula Club somente por período pago futuro comunicado num evento autenticado, com revogação de transações reembolsadas e bloqueio após atraso relevante.
- API de metadados e abertura de conteúdo com dupla checagem de sessão e de produtos comprados; links assinados de 90 segundos no bucket privado `borsamia-content`.
- Login por e-mail e Magic Link, com redirecionamento explícito e template italiano documentado.
- Documentação de implementação completa em `docs/hotmart-setup.md`.

## Verificações realizadas

- `node node_modules/typescript/bin/tsc --noEmit`: **sem erros**.
- `node node_modules/eslint/bin/eslint.js .`: **0 erros**, 2 avisos históricos de export default anônimo em arquivos de configuração.
- `node scripts/validate-structure.mjs`: estrutura esperada validada.
- Vitest: **não executado** — dependência nativa Rolldown enviada do Windows e dependências para Linux indisponíveis offline.
- `next build`: **não executado com sucesso** — o binário `@next/swc-linux-x64-gnu` estava ausente e a rede do registro npm indisponível. Execute os comandos npm num ambiente com internet, antes de produção.
- SQL não aplicado a banco real; compra/estorno/renovação real não testados; armazenamento e e-mails reais não conectados.

## Limites que não são solucionáveis por código sozinho

- Fazer upload de arquivos de conteúdo **reais** e em italiano, antes da comercialização. As fotos editoriais não são os 101 esquemas nem o manual.
- Aplicar a migração certa no Supabase autorizado, configurar `DATABASE_URL`, Storage, Auth/SMTP e secrets no Netlify.
- Configurar webhook no painel Hotmart e verificar transações verdadeiras e datas da assinatura. Eventos de teste com product.id=0 não demonstram entrega real.
- Fazer deploy autorizado para Netlify e executar checklist de testes fim a fim.

**Não afirmar que o acesso foi liberado em produção somente porque os arquivos de código foram corrigidos.**
