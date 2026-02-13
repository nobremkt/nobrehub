# Regras de Mensageria WhatsApp Business API (Nobre Hub)

> [!IMPORTANT]
> **Correção de Entendimento (13/02/2026)**
> O envio de **Template** NÃO é obrigatório para iniciar toda conversa. Ele é obrigatório APENAS quando a **janela de 24 horas** está fechada.

## Regra da Janela de 24 Horas

1. **Janela Aberta**:
   - Inicia quando o contato (cliente) envia uma mensagem.
   - Dura 24 horas a partir da última mensagem recebida.
   - **Permite**: Envio de mensagens de texto livre, áudio, imagem, vídeo, arquivos.
   - **Não requer**: Template pré-aprovado.

2. **Janela Fechada**:
   - Ocorre quando passaram-se mais de 24 horas desde a última mensagem do cliente.
   - **Bloqueio**: O WhatsApp bloqueia o envio de mensagens livres.
   - **Solução**: Para reabrir a conversa, é OBRIGATÓRIO enviar um **Message Template** (Modelo de Mensagem) pré-aprovado pela Meta (ex: "Bom dia, podemos continuar?", "Atualização do seu pedido").
   - Se o cliente responder ao template, a janela se abre novamente por mais 24h.

## Implementação no Sistema

- **Indicador Visual**: O chat deve mostrar claramente se a janela está aberta ou fechada.
- **Bloqueio de Input**: O campo de texto deve ser bloqueado APENAS se a janela estiver fechada (`isSessionExpired`).
- **Ação Requerida**: Se fechada, exibir botão "Enviar Template" ou permitir selecionar um template.
