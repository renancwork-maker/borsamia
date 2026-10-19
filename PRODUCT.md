# BorsaMia — La tua biblioteca creativa

## Problema e objetivo
O público de crochê na Itália encontra modelos, diagramas e PDFs dispersos e dificuldade para registrar projetos e progresso. O BorsaMia reunirá receitas, biblioteca personalizada, leitura e acompanhamento em um ambiente premium e responsivo. Não é uma landing page nem uma lista pública de downloads.

## Público e papéis
- **Cliente:** principalmente mulheres adultas na Itália; iniciantes, artesãs intermediárias e produtoras de peças para uso, presente ou venda. Login por e-mail comprovado, sem senha nem OTP digitado.
- **Administradora:** gerencia produtos, arquivos, compradores, transações e eventos; autenticação separada e reforçada.

## Produtos e identidade comercial
Cada item é uma coleção vendida separadamente na Hotmart. Identificadores comerciais reais e URLs de checkout ainda estão **pendentes**; IDs internos abaixo são identificadores de interface, não IDs da Hotmart.

| ID interno | Produto (IT-IT) | Quantidade |
|---|---|---:|
| `borse` | BorsaMia — Collezione di 101 Modelli di Borse all'Uncinetto | 101 |
| `portachiavi-37` | Collezione di 37 Modelli di Portachiavi all'Uncinetto | 37 |
| `portachiavi-21` | Collezione di 21 Modelli di Portachiavi all'Uncinetto | 21 |
| `macrame` | Collezione di 47 Modelli di Borse in Macramè | 47 |
| `bambini` | Collezione di 101 Modelli all'Uncinetto per Neonati e Bambini da 0 a 5 Anni | 101 |
| `fodere` | Manuale di Fodere per Borse all'Uncinetto | Sem contagem de modelos |

## Fluxos da versão inicial
1. **Compra:** Hotmart envia compra aprovada; backend valida autenticidade, normaliza evento, deduplica por identificador real, grava transação e concede permissão individual. Eventos podem chegar separadamente e fora de ordem.
2. **Login:** cliente informa e-mail da compra, recebe link de uso único com expiração, confirma a titularidade e obtém sessão segura em cookie HttpOnly. Sem senha, cadastro ou código digitado.
3. **Permissões:** compras aprovadas de diferentes produtos acumulam; reembolso, cancelamento ou chargeback removem apenas acesso da transação atingida; outra transação ativa do mesmo produto pode mantê-lo. Reconciliação deve consultar estado real quando necessário.
4. **Biblioteca:** coleções adquiridas, não adquiridas bloqueadas, busca, filtros, favoritos, projetos em andamento/concluídos, último modelo e progresso.
5. **Detalhe:** capa, texto em italiano, materiais, medidas, instruções, PDF protegido, páginas e zoom, contador de carreiras, favoritos e conclusão.
6. **Admin:** login próprio, compradores, transações, permissões manuais auditadas, uploads e classificação, mapeamento Hotmart e falhas de eventos.

## MVP priorizado (trabalho pós-bootstrap)
1. Mapeamento real produto Hotmart → coleção (incluindo os cinco order bumps); ingestão segura, armazenamento idempotente, reconciliação e testes de revogação.
2. E-mail da compra → magic link sem OTP → sessão segura; proteção anti-enumeração, expiração e limite de envio.
3. Biblioteca por permissões e entrega de PDFs privados após autorização do servidor.
4. Modelos e progresso (favoritos, contador, concluídos) persistidos.
5. Painel administrativo protegido para conteúdo e suporte.
6. Testes E2E, revisão de segurança, conexão Netlify/Supabase e publicação autorizada.

## Estado efetivamente criado neste bootstrap
- Interface inicial responsiva em italiano com as seis coleções, pesquisa local e navegação ilustrativa; **todas bloqueadas** sem sessão. Imagens são ilustrações/emoji provisórios, não fotografias nem PDFs reais.
- Formulário de acesso com validação e resposta de indisponibilidade **503**: não envia e-mail nem valida compra ainda.
- Endpoint de webhook responde **503** e não altera o banco. Endpoint de arquivos responde **401**. Permissões unit-testadas em função pura sobre transações já verificadas/normalizadas.
- Infraestrutura de Next.js, Netlify, Drizzle/PostgreSQL e documentação preparada. Sem migrations de negócio nem acesso a Supabase.

## Requisitos e restrições
- **Idioma:** 100% dos textos visíveis ao cliente em italiano (IT-IT), inclusive mensagens e e-mails. PDFs só publicados com versão italiana validada; nunca inventar tradução.
- **Host:** Netlify, sem processo Node persistente; Next.js 16 App Router com adaptador OpenNext oficial; rotas Next são hospedadas como funções serverless. Escolha deliberada pelo guia de bootstrap Next.js e compatibilidade Netlify, em lugar da preferência não obrigatória React/Vite.
- **Persistência:** Supabase PostgreSQL com Drizzle ORM + driver `pg`; limite de pool de conexões e conexão lazy. Storage privado Supabase após configuração. Sem segredos `NEXT_PUBLIC_*`.
- **Proteção:** permissões no backend, cookies seguros HttpOnly, arquivos nunca públicos, links assinados curtos depois da autorização; logs sem dados sensíveis; webhook autenticado, idempotente e reprocessável.
- **UI:** inspiração nos fluxos de Yarnl (biblioteca, progresso, PDF), sem copiar código, marca ou imagens. A demonstração não foi autenticada nesta execução.
- **Desempenho:** mobile-first, imagens otimizadas, lazy loading, PDF navegável e retenção do progresso.
- **Expansão:** produtos/coleções dirigidos por configuração de banco e IDs reais, sem `if` para combinações fixas de order bumps.

## Hipóteses reversíveis e decisões pendentes
- **Hipótese reversível:** dashboard começa com coleção não autenticada visível e bloqueada; durante o MVP, ajustar visibilidade pós-login e o percurso de compra.
- **Pendente indispensável:** credenciais da Hotmart, configuração de webhook, amostra real de payload com dados sensíveis removidos, identificadores dos seis produtos e tratamento do principal/order bump conforme eventos observados.
- **Pendente indispensável:** projeto Supabase e configurações de conexão/Storage, domínio Netlify, remetente e provedor de e-mail, política de sessão, autenticação administrativa, links autorizados para compra, fotos e PDFs italianos licenciados.
- **Segurança:** antes da verificação de titularidade, evitar distinção explícita entre e-mail inexistente e existente para limitar enumeração; após acesso legítimo, pode-se dar informação específica.

## Critérios de aceitação do produto (AINDA NÃO cumpridos)
- Uma transação aprovada real para cada SKU correto adiciona uma coleção; qualquer combinação de bumps libera exatamente a união das coleções válidas, independentemente da ordem dos eventos.
- Duplicatas são idempotentes; chargeback/reembolso/cancelamento retiram acesso só da transação afetada; outra compra ativa permanece; webhooks falsos não alteram acesso.
- Inserir o e-mail de outra pessoa não dá sessão; apenas uso do link com expiração entregue ao titular autentica; sessão respeita expiração e logout.
- Sem permissão, APIs e arquivos permanecem inacessíveis mesmo conhecendo URLs. Links temporários expiram.
- Cliente em celular pode filtrar, ler PDF, avançar páginas, atualizar contador e retomar projeto, com progresso persistido.
- Admin separada pode cadastrar PDF em italiano e auditar eventos; placeholders e PDFs sem tradução não aparecem como conteúdo vendido.

## Próxima entrega
Integração Hotmart segura com IDs reais, modelo de dados mínimo derivado de payload confirmado e testes de ingestão/deduplicação/reembolso, antes de implementar login e PDFs.

## Manutenção
Revisar este escopo quando houver dados reais ou novas decisões. Ver arquitetura em `docs/architecture.md` e validações em `docs/setup.md`.

## Atualização: acesso administrativo
Login administrativo por Supabase Auth, senha e TOTP implementado no código. Depende de configuração e validação remota; não equivale à entrega de gestão de compradores/transações/PDFs. Configuração em [docs/admin-setup.md](docs/admin-setup.md). O login de clientes continua pendente e separado.
