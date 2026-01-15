import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    // Find João Bartholo
    const joao = await prisma.user.findFirst({
        where: { name: { contains: 'Bartholo' } }
    });

    if (!joao) {
        console.log('❌ João Bartholo not found');
        return;
    }

    console.log(`✅ Found user: ${joao.name} (${joao.id})`);

    // Find or create a WhatsApp lead
    let lead = await prisma.lead.findFirst({
        where: { source: 'whatsapp' }
    });

    if (!lead) {
        lead = await prisma.lead.create({
            data: {
                name: 'Cliente Teste WhatsApp',
                phone: '5511999998888',
                source: 'whatsapp',
                pipeline: 'high_ticket',
                statusHT: 'novo'
            }
        });
        console.log(`✅ Created test lead: ${lead.name}`);
    } else {
        console.log(`✅ Found existing WhatsApp lead: ${lead.name}`);
    }

    // Check if conversation already exists
    let conversation = await prisma.conversation.findFirst({
        where: { leadId: lead.id, status: { not: 'closed' } }
    });

    if (conversation) {
        // Update to assign to João
        conversation = await prisma.conversation.update({
            where: { id: conversation.id },
            data: {
                assignedAgentId: joao.id,
                status: 'active'
            }
        });
        console.log(`✅ Updated existing conversation, assigned to ${joao.name}`);
    } else {
        // Create new conversation
        conversation = await prisma.conversation.create({
            data: {
                leadId: lead.id,
                assignedAgentId: joao.id,
                channel: 'whatsapp',
                status: 'active',
                pipeline: 'high_ticket',
                lastMessageAt: new Date()
            }
        });
        console.log(`✅ Created new conversation for ${lead.name}, assigned to ${joao.name}`);
    }

    // Add a test message
    await prisma.message.create({
        data: {
            conversationId: conversation.id,
            text: 'Olá, gostaria de mais informações sobre os serviços!',
            direction: 'in',
            type: 'text'
        }
    });
    console.log(`✅ Added test message to conversation`);

    console.log('\n🎉 Done! João Bartholo should now see this conversation in Atendimento.');
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
