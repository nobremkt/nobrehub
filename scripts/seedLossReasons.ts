/**
 * Script para adicionar os motivos de perda padrão no Firebase
 * Execute com: npx ts-node scripts/seedLossReasons.ts
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, getDocs, query } from 'firebase/firestore';

// Firebase config - use as mesmas credenciais do projeto
const firebaseConfig = {
    apiKey: process.env.VITE_FIREBASE_API_KEY || "AIzaSyDyOmYxgjSZcHIidRMJ9cxA9j4CfpY3lYI",
    authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN || "nobrehub.firebaseapp.com",
    projectId: process.env.VITE_FIREBASE_PROJECT_ID || "nobrehub",
    storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET || "nobrehub.firebasestorage.app",
    messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "917217506220",
    appId: process.env.VITE_FIREBASE_APP_ID || "1:917217506220:web:1fb0f8f81ad5412b0d75fc"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const DEFAULT_LOSS_REASONS = [
    { name: 'Preço muito alto', order: 0 },
    { name: 'Momento errado / Não é prioridade', order: 1 },
    { name: 'Escolheu concorrente', order: 2 },
    { name: 'Sem orçamento', order: 3 },
    { name: 'Não respondeu / Sumiu', order: 4 },
    { name: 'Não era o perfil ideal', order: 5 },
    { name: 'Problema interno do lead', order: 6 },
    { name: 'Outro motivo', order: 7 },
];

async function seedLossReasons() {
    console.log('🚀 Iniciando seed dos motivos de perda...\n');

    // Verificar se já existem motivos
    const existingQuery = query(collection(db, 'loss_reasons'));
    const existingDocs = await getDocs(existingQuery);

    if (existingDocs.size > 0) {
        console.log(`⚠️  Já existem ${existingDocs.size} motivos de perda cadastrados.`);
        console.log('   Para evitar duplicatas, o seed não será executado.');
        console.log('   Se quiser recriar, delete os documentos existentes primeiro.\n');
        return;
    }

    // Adicionar cada motivo
    for (const reason of DEFAULT_LOSS_REASONS) {
        try {
            const docRef = await addDoc(collection(db, 'loss_reasons'), {
                name: reason.name,
                active: true,
                order: reason.order,
                createdAt: Date.now(),
                updatedAt: Date.now()
            });
            console.log(`✅ Criado: "${reason.name}" (ID: ${docRef.id})`);
        } catch (error) {
            console.error(`❌ Erro ao criar "${reason.name}":`, error);
        }
    }

    console.log('\n✨ Seed concluído com sucesso!');
    console.log(`   ${DEFAULT_LOSS_REASONS.length} motivos de perda criados.`);
}

seedLossReasons()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error('Erro fatal:', error);
        process.exit(1);
    });
