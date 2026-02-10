
export const PIPELINE_STAGES = [
    { id: 'base', label: 'Base' },
    { id: 'prospeccao', label: 'Prospecção' },
    { id: 'conexao', label: 'Conexão' },
    { id: 'noshow', label: 'No-show' },
    { id: 'reuniao', label: 'Reunião' },
    { id: 'proposta', label: 'Proposta' },
    { id: 'negociacao', label: 'Negociação' },
    { id: 'finalizada', label: 'Finalizada' },
];

export const ACTIVITIES = [
    { id: 1, label: 'Cadastrar lead no sistema', stage: 'base' },
    { id: 2, label: 'Primeira tentativa de contato', stage: 'prospeccao' },
    { id: 3, label: 'Segunda tentativa de contato', stage: 'prospeccao' },
    { id: 4, label: 'Terceira tentativa de contato', stage: 'prospeccao' },
    { id: 5, label: 'Abordagem inicial bem-sucedida', stage: 'conexao' },
    { id: 6, label: 'Qualificação do lead', stage: 'conexao' },
    { id: 7, label: 'Tentativa de reagendamento (No-show)', stage: 'noshow' },
    { id: 8, label: 'Reunião de descoberta realizada', stage: 'reuniao' },
    { id: 9, label: 'Apresentação da solução', stage: 'reuniao' },
    { id: 10, label: 'Envio da proposta comercial', stage: 'proposta' },
    { id: 11, label: 'Follow-up da proposta', stage: 'proposta' },
    { id: 12, label: 'Negociação de valores', stage: 'negociacao' },
    { id: 13, label: 'Fechamento do contrato', stage: 'finalizada' },
];

/**
 * IDs de scripts que são mensagens direcionadas ao lead (cliente)
 * e podem exibir CTA de envio para o Inbox.
 */
export const SENDABLE_SCRIPT_IDS = new Set<number>([
    2, // Primeira tentativa de contato
    3, // Segunda tentativa de contato
    4, // Terceira tentativa de contato
    5, // Abordagem inicial
    7, // Reagendamento (no-show)
    9, // Apresentação da solução
    10, // Envio da proposta
    11, // Follow-up da proposta
]);

export const SCRIPTS: Record<number, { title: string; content: string }> = {
    1: {
        title: '📋 Cadastro do Lead',
        content: `Preencha todos os dados do lead corretamente no sistema:

• Nome completo
• Telefone/WhatsApp
• E-mail
• Empresa (se aplicável)
• Origem do lead
• Observações iniciais

Certifique-se de que todas as informações estão corretas antes de prosseguir.`,
    },
    2: {
        title: '📞 Primeira Tentativa de Contato',
        content: `Olá [NOME], tudo bem?

Aqui é o [SEU NOME] da [EMPRESA]. 

Vi que você demonstrou interesse em [PRODUTO/SERVIÇO] e estou entrando em contato para entender melhor suas necessidades.

Você tem alguns minutinhos para conversarmos?

---
Se não atender: deixar mensagem no WhatsApp e tentar novamente em 24h.`,
    },
    3: {
        title: '📞 Segunda Tentativa de Contato',
        content: `Olá [NOME]!

Tentei falar com você ontem mas não consegui. 

Estou entrando em contato novamente porque acredito que posso ajudar você com [BENEFÍCIO PRINCIPAL].

Qual o melhor horário para conversarmos?

---
Enviar também por WhatsApp com tom mais casual.`,
    },
    4: {
        title: '📞 Terceira e Última Tentativa',
        content: `Olá [NOME], boa tarde!

Essa é minha última tentativa de contato. 

Entendo que você deve estar ocupado, mas não quero deixar de oferecer [BENEFÍCIO].

Se tiver interesse, é só me responder que agendamos um horário que funcione para você.

Abraços!`,
    },
    5: {
        title: '🤝 Abordagem Inicial',
        content: `Ótimo falar com você, [NOME]!

Antes de mais nada, deixa eu te fazer algumas perguntas para entender melhor sua situação:

1. O que te levou a procurar [PRODUTO/SERVIÇO]?
2. Qual o maior desafio que você enfrenta hoje?
3. Já tentou alguma solução antes?
4. Qual seria o cenário ideal para você?

Baseado nisso, vou te mostrar como podemos ajudar.`,
    },
    6: {
        title: '✅ Script de Qualificação',
        content: `Perguntas de qualificação (BANT):

💰 BUDGET (Orçamento):
"Você já tem um orçamento definido para essa solução?"

⏰ AUTHORITY (Autoridade):
"Além de você, mais alguém participa dessa decisão?"

📋 NEED (Necessidade):
"Em uma escala de 1 a 10, o quanto resolver isso é urgente?"

📅 TIMELINE (Prazo):
"Quando você gostaria de ter isso implementado?"`,
    },
    7: {
        title: '🔄 Reagendamento (No-show)',
        content: `Olá [NOME]!

Percebi que não conseguimos nos falar no horário combinado. Tudo bem, sei como a rotina pode ser corrida!

Que tal reagendarmos para um momento mais tranquilo?

Tenho disponibilidade nos seguintes horários:
• [OPÇÃO 1]
• [OPÇÃO 2]
• [OPÇÃO 3]

Qual funciona melhor para você?`,
    },
    8: {
        title: '🎯 Reunião de Descoberta',
        content: `AGENDA DA REUNIÃO:

1. Apresentação (2 min)
2. Contexto e desafios do cliente (10 min)
3. Aprofundamento nas dores (10 min)
4. Apresentação da solução (15 min)
5. Casos de sucesso (5 min)
6. Próximos passos (3 min)

---
DICAS:
• Faça mais perguntas do que afirmações
• Anote os pontos principais
• Confirme entendimento: "Deixa eu ver se entendi..."`,
    },
    9: {
        title: '💡 Apresentação da Solução',
        content: `Baseado em tudo que você me contou, [NOME], vou te mostrar como [PRODUTO/SERVIÇO] resolve exatamente isso.

ESTRUTURA:
1. Recapitular as dores mencionadas
2. Apresentar a solução específica para cada dor
3. Mostrar resultados de clientes similares
4. Demonstrar o produto (se aplicável)

"Como você se vê usando essa solução no seu dia a dia?"`,
    },
    10: {
        title: '📄 Envio da Proposta',
        content: `Assunto: Proposta Comercial - [EMPRESA] para [CLIENTE]

Olá [NOME]!

Conforme conversamos, segue a proposta comercial personalizada para [EMPRESA DO CLIENTE].

📎 Em anexo você encontra:
• Escopo detalhado
• Investimento
• Condições de pagamento
• Cronograma de implementação

Fico no aguardo do seu retorno para tirar qualquer dúvida.

Abraços!`,
    },
    11: {
        title: '📬 Follow-up da Proposta',
        content: `Olá [NOME]!

Passando para saber se conseguiu analisar a proposta que enviei.

Tem alguma dúvida sobre:
• O escopo do projeto?
• As condições de pagamento?
• O cronograma?

Estou à disposição para uma call rápida se preferir!`,
    },
    12: {
        title: '💰 Negociação',
        content: `TÉCNICAS DE NEGOCIAÇÃO:

❌ Nunca dê desconto sem pedir algo em troca
✅ "Consigo um desconto de X% se fecharmos hoje"
✅ "Posso melhorar o prazo se aumentarmos o escopo"

OBJEÇÕES COMUNS:
• "Está caro" → Mostre o ROI
• "Preciso pensar" → Descubra a real objeção
• "Vou comparar" → Destaque os diferenciais

Sempre termine com próximo passo definido!`,
    },
    13: {
        title: '🎉 Fechamento',
        content: `Parabéns pelo fechamento!

CHECKLIST PÓS-VENDA:
☐ Enviar contrato para assinatura
☐ Confirmar dados de faturamento
☐ Agendar kickoff de implementação
☐ Apresentar ao time de sucesso do cliente
☐ Enviar kit de boas-vindas
☐ Registrar no CRM como "Ganho"

🏆 Celebre a conquista!`,
    },
};
