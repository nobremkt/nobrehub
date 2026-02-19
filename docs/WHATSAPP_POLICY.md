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

- **Indicador Visual**: `SessionWarning` exibe 3 estados: ativo (verde), expirando (amarelo com countdown), expirado (vermelho).
- **Bloqueio de Input**: O campo de texto é bloqueado APENAS se a janela estiver expirada (`isSessionExpired`) E `needsTemplateFirst` for true.
- **Ação Requerida**: Se expirada, `SessionWarning` exibe botão "Enviar Template" que abre o `SendTemplateModal`.
- **Playbook**: O botão "Send to Chat" no Playbook também respeita a janela de 24h — se expirada, exibe toast orientando o uso de template.

### Arquivos relevantes
- `src/features/inbox/components/ChatView/SessionWarning.tsx` — Indicador visual + countdown
- `src/features/inbox/components/ChatView/ChatView.tsx` — `isInputBlocked` + `isSessionExpired` logic
- `src/features/inbox/components/SendTemplateModal/SendTemplateModal.tsx` — Modal de template
