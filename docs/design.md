# Direção de design e conteúdo

## Identidade e idiomas
Marca própria BorsaMia: bege, creme, blush, terracota, marrom e espaços generosos. Cabeçalho serifado editorial e corpo legível sem fonte externa obrigatória. O nome e a navegação são próprios; não usar mascote, imagem, logo ou CSS proprietários do Yarnl. Visual inicial é ilustrativo, com símbolos e fundos de cor; **fotografia real dos modelos depende de arquivos licenciados**.

Todos os componentes exibidos ao cliente devem usar IT-IT, inclusive loading, busca vazia, erro, validação e e-mail. `html lang="it-IT"`. Arquivo PDF sem versão italiana validada fica oculto, com indicação administrativa.

## Telas iniciais (implementadas como base visual)
- `/`: sidebar com La Mia Biblioteca, Le Mie Collezioni, Progetti in Corso, Preferiti, Completati, Il Mio Profilo; hero, seis coleções e busca por texto. As páginas secundárias atuais são apenas estados informativos locais, não dados de cliente.
- `/accedi`: formulário e-mail da compra; mensagem 503 honesta, nenhum link disparado. Não colocar mensagens que afirmem envio sem backend.
- Todos os cards começam bloqueados. Os produtos não comprados poderão aparecer, com cadeado. A identificação de adquirido só será feita a partir de sessão autorizada.

## Próximas interações
Lista de padrões em grades com fotos, filtros por dificuldade/categoria; detalhe do padrão em mobile e desktop, leitor PDF com paginação e zoom, contador de carreiras, salvar progresso/última página, favoritos e conclusão. Garantir foco visível, contraste, targets táteis ~44px, estado vazio útil, suporte a zoom do browser e preferência de movimento reduzido.

## Evidência e ressalva
A página pública de Yarnl demonstra biblioteca, filtros, projetos, favorito e configurações do visualizador; não foi executado login autenticado nem reproduzido comportamento interativo. Fonte: https://demo.yarnl.com/#current (consultado 2026-10-19).

## Atualização administrativa
`/admin/accedi`: formulário IT-IT com e-mail/senha, cadastro de autenticador por chave TOTP e verificação de seis dígitos. `/admin`: confirmação de acesso e logout, com estado honesto de ausência de módulos comerciais. Reutiliza estilos de login existentes.

Correção de apresentação: os campos de e-mail e senha permanecem visíveis quando faltam variáveis de ambiente; o botão Continuar fica desabilitado com mensagem IT-IT de indisponibilidade. Nenhuma chamada de autenticação ocorre nesse estado. É necessário configurar as quatro variáveis documentadas e publicar novamente para habilitar o envio.

Páginas `/prodotti/borse`, `/prodotti/fodere`, `/prodotti/club` e `/prodotti/portachiavi`: título IT-IT, descrição breve, informação de acesso restrito, estado de integração pendente e link para login. Reutilizam apresentação do login e não simulam arquivos disponíveis.
