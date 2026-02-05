# Tarefas Nobre Hub

## Chat de Equipe
- [x] Lista de conversas mostra corretamente quem está online, mas a bolinha está clipada pela foto.
- [x] Ao abrir a conversa o online de cima está hardcoded.
- [x] Modal de criar nova conversa, se for em aba de fazer grupo, selecionar vários e depois voltar pra conversa privada, continua selecionado. E a seleção está com cor hardcoded.
- [x] Conversas longas scrollam a pagina toda para baixo, ao invés de só a janela de chat

---

## CRM
- [ ] Fechar venda e criar projeto (enviado para a lista de dist. da produção)
- [ ] Ação de atribuir vendedora em massa funcionando de verdade
- [ ] Ação de mover etapa em massa funcionando de verdade
- [ ] Ação de marcar como perdido em massa funcionando de verdade
- [ ] Ação de deletar em massa funcionando de verdade

---

## Modal360
- [x] Checklist deveria poder selecionar a atividade sem marcar ela como concluída.
- [x] Colocar click válido só na bolinha (checkbox)
- [x] Mudar/editar informações lockadas dos leads
- [ ] Aba de histórico mostrando linha do tempo real (não só criação e atualização)
- [ ] Aba de negócios salvando de verdade no banco ao editar
- [ ] Campo pra vendedora sugerir produtor ao criar projeto

---

## Base de Contatos
- [x] Fazer a formatação de numero de telefone funcionar com padrão 4-4 e 5-4.
- [ ] Quando uma alteração é feita no lead através da pagina de inbox, a alteração não acontece em tempo real na base de contatos, além disso se apertar o botão pra sincronizar com o inbox, ele importa o mesmo contato novamente, ficando duplicado só que com informações diferentes (editadas novas)
- [ ] Arrumar problemas de tema e design no tema branco

---

## Pagina de Membros
- [x] Tag de online some quando não está online, deveria mostrar 'Offline' ou outros estados...
- [x] Implementar modal de perfil de colaborador
- [ ] Tab de Métricas do perfil puxando dados reais (produção: pontos entregues, vendas: leads convertidos, pós-venda: pagamentos recebidos)
- [ ] Tab de Metas puxando projetos reais e calculando pontos

---

## Inbox
- [x] Seletor de código de área do país não está usando dropdown customizado.
- [x] Implementar as abas de 'Atribuídos a mim' e 'Não atribuídos' e 'Todos'
- [ ] Navegação mobile com swipe entre lista, chat e perfil

---

## Pós-Venda
- [ ] Implementar página de pós-venda
- [ ] Sistema de lista de distribuição de clientes (líder decide automático ou manual)
- [ ] Mostrar quem já atendeu esse cliente antes na lista de distribuição
- [ ] Sistema de boards/quadros individuais de cada uma (líder ou admin vê a lista de todos)
- [ ] Cada board mostra um inbox, com páginas e acesso ao histórico anterior do cliente (venda)
- [ ] Filtros/abas por status: Aguardando Projeto, Aguardando Alteração, Entregue, Aguardando Pagamento, Todos
- [ ] Ver status do projeto em tempo real (vindo da produção)
- [ ] Botão "Solicitar Alteração" (volta pro MESMO produtor)
- [ ] Botão "Marcar como Entregue"
- [ ] Botão "Cliente Aprovou"
- [ ] Botão "Pagamento Recebido" (cliente sai do inbox e volta pra base)

---

## Dashboard Inicial
- [x] Implementar estatísticas únicas para cada setor
- [ ] Arrumar erros de tooltip/tema
- [x] Tirar dados mock e conectar todas as fontes
- [x] Criar seção de dados de pós-venda
- [ ] Puxar tickets reais do pós-venda
- [ ] Puxar pagamentos reais do pós-venda
- [ ] Implementar filtro de data personalizado (modal date picker)

---

## Produção
- [ ] Lista de distribuição para produção (só líder vê)
- [ ] Mostrar produtor sugerido destacado na lista
- [ ] Mostrar observações da vendedora na lista
- [ ] Mostrar quem já produziu pra esse cliente na lista
- [ ] Botão "Distribuir Automaticamente" (balanceamento por pontos/projetos ativos)
- [ ] Botão "Atribuir para [Produtor]" (manual, mostra carga de cada um)
- [ ] Lógica de alterações: sempre volta pro MESMO produtor, nunca pra lista
- [ ] Ao criar projeto: vincular lead real (não mais hardcoded)
- [ ] Ao criar projeto: campo pra adicionar pontos extras (complexidade)

---

## Sistema de Pontos/Metas
- [ ] Ao finalizar projeto, somar pontos automaticamente pro produtor
- [ ] Pontos base do produto + pontos extras da vendedora
- [ ] Vídeos contam por duração (30s, 60s, 60+)

---

## Outros
- [ ] Sistema de pagina de status para projetos, criado automaticamente e link enviado para o cliente acompanhar o status.
- [ ] Marcação de notificação no teamchat, gaveta de notificações e toast clicável.
- [ ] Limpeza: remover dados mock/seed e console.logs
- [ ] Validar regras de segurança do Firebase pras novas coleções
- [ ] Testar fluxo completo: Lead → Venda → Projeto → Pós-Venda → Entrega → Pagamento
