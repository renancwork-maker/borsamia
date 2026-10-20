# BorsaMia · La tua biblioteca creativa

Webapp Next.js 16 para conteúdos digitais de crochê, hospedável na **Netlify**.
A interface para consumidores é 100% em **italiano**. O painel de acesso usa validação de sessão Supabase, e as permissões de cada coleção são geradas a partir de eventos Hotmart verificados no servidor.

## Produtos configurados

| Produto | Hotmart | Página |
|---|---|---|
| 101 bolsas all’uncinetto | `8765000` | `/prodotti/borse` |
| Manuale di fodere | `8765113` | `/prodotti/fodere` |
| Club delle Tendenze (assinatura) | `8765856` | `/prodotti/club` |
| 37 portachiavi all’uncinetto | `8766213` | `/prodotti/portachiavi` |

## Como começar

1. Em Windows/macOS/Linux, instale Node 22+ e execute `npm ci` para instalar binários corretos para seu sistema.
2. Para desenvolvimento local: configure `.env.local` baseado em `.env.example` (sem compartilhar segredos). Execute `npm run dev`.
3. **Antes de ativar webhooks:** leia [`docs/hotmart-setup.md`](docs/hotmart-setup.md) na íntegra. Contém SQL novo e de upgrade, bucket privado, Supabase Auth, Hottok, testes de compras e deploy Netlify.
4. Para validação: `npm run typecheck && npm test && npm run lint && npm run build`.
5. Publique pela integração GitHub/Netlify e configure as variáveis de ambiente do site; não use static export.

## Estado do material entregue

A interface visual, página de cada produto, mecanismo de ingestão e de permissões, proteção de arquivos e estrutura para o Club foram corrigidos a partir do ZIP fornecido. **Não foram fornecidos os PDFs reais, os 101 modelos, os 37 modelos de chaveiros, os tutoriais do manual ou as novidades mensais.** As quatro fotografias são ilustrações editoriais e não ilustram precisamente os produtos adquiridos. Faça upload dos arquivos e cadastre os metadados no banco antes de publicar vendas.

**Os webhooks não foram implantados nem testados contra sua conta Hotmart real.** Testes locais não equivalem à prova de um fluxo de produção; valide pagamentos, cancelamentos, atrasos de assinatura e segurança após instalar as dependências e configurar os serviços.

O fluxo de assinatura é conservador: precisa de evidência do próximo pagamento no evento autenticado (`purchase.date_next_charge`) para conceder o Club. Enquanto o evento real não comprovar o período, a compra fica sinalizada para reconciliação e o Club permanece fechado por segurança.
