
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Configurações de colunas por setor (Replicated from Frontend)
const PIPELINE_TEMPLATES = {
    high_ticket: [
        { name: 'Novo Lead', color: 'slate', id: 'novo' },
        { name: 'Qualificado', color: 'amber', id: 'qualificado' },
        { name: 'Call Agendada', color: 'blue', id: 'call_agendada' },
        { name: 'Proposta', color: 'purple', id: 'proposta' },
        { name: 'Negociação', color: 'orange', id: 'negociacao' },
        { name: 'Fechado', color: 'emerald', id: 'fechado' },
        { name: 'Perdido', color: 'rose', id: 'perdido' }
    ],
    low_ticket: [
        { name: 'Novo', color: 'slate', id: 'novo' },
        { name: 'Atribuído', color: 'blue', id: 'atribuido' },
        { name: 'Em Negociação', color: 'amber', id: 'em_negociacao' },
        { name: 'Fechado', color: 'emerald', id: 'fechado' },
        { name: 'Perdido', color: 'rose', id: 'perdido' }
    ],
    production: [
        { name: 'A Fazer', color: 'slate', id: 'backlog' },
        { name: 'Em Produção', color: 'blue', id: 'fazendo' },
        { name: 'Revisão', color: 'orange', id: 'revisao' },
        { name: 'Entregue', color: 'emerald', id: 'concluido' }
    ],
    post_sales: [
        { name: 'Novo', color: 'slate', id: 'novo' },
        { name: 'Onboarding', color: 'indigo', id: 'onboarding' },
        { name: 'Acompanhamento', color: 'blue', id: 'acompanhamento' },
        { name: 'Renovação', color: 'amber', id: 'renovacao' },
        { name: 'Encerrado', color: 'emerald', id: 'encerrado' }
    ]
};

async function main() {
    console.log('🔄 Seeding Pipeline Stages...');

    for (const [pipelineType, stages] of Object.entries(PIPELINE_TEMPLATES)) {
        console.log(`Processing pipeline: ${pipelineType}`);

        let order = 0;
        for (const stage of stages) {
            // Check if exists by name/pipeline (since ID is uuid now, we can't use the 'id' from template directly as primary key unless we UUID it or store mapped ID)
            // To keep backward compat with Enums, we might want to store the "System Key" or just create them.
            // Since we want to display the EXISTING leads, we need to make sure we don't lose data.
            // But leads stored 'statusHT' = 'novo'.
            // If we switch to 'stageId', we need to migrate data. 
            // For now, this script just populates the "Option List" for the new dynamic Kanban.

            const existing = await prisma.pipelineStage.findFirst({
                where: {
                    pipeline: pipelineType as any,
                    name: stage.name
                }
            });

            if (!existing) {
                await prisma.pipelineStage.create({
                    data: {
                        name: stage.name,
                        pipeline: pipelineType as any,
                        color: stage.color,
                        order: order++,
                        isSystem: true // Initial templates are system stages
                    }
                });
                console.log(`  + Created stage: ${stage.name}`);
            } else {
                console.log(`  . Stage exists: ${stage.name}`);
                // Ensure system flag/order
                await prisma.pipelineStage.update({
                    where: { id: existing.id },
                    data: { order: order++, isSystem: true, color: stage.color }
                });
            }
        }
    }

    console.log('✅ Pipeline Stages seeded successfully.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
