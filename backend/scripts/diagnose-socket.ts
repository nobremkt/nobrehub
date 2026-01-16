
import { io } from 'socket.io-client';
import fetch from 'node-fetch';

const SOCKET_URL = 'http://localhost:3000';
const CONVERSATION_ID = '9e10b54a-8b29-4009-9d2f-f205ca1aed85';
const PHONE_NUMBER = '553598231509';

console.log('🔍 Starting Socket Diagnosis...');

const socket = io(SOCKET_URL, {
    transports: ['websocket', 'polling']
});

socket.on('connect', () => {
    console.log('✅ Connected to Socket!', socket.id);

    const eventName = `conversation:${CONVERSATION_ID}:message`;
    console.log(`🎧 Listening for event: ${eventName}`);

    socket.on(eventName, (data) => {
        console.log('🎉 RECEIVED MESSAGE VIA SOCKET!');
        console.log('📦 Data:', data);
        process.exit(0); // Success!
    });

    socket.on('debug:webhook_received', (data) => {
        console.log('🔵 GLOBAL DEBUG RECEIVED:', data);
    });

    socket.onAny((event, ...args) => {
        console.log(`📨 Received ANY event: ${event}`);
    });

    // Trigger Webhook Simulation after 2 seconds
    setTimeout(triggerWebhook, 2000);
});

socket.on('connect_error', (err) => {
    console.error('❌ Connection Error:', err.message);
    process.exit(1);
});

async function triggerWebhook() {
    console.log('🚀 Triggering Webhook Simulation...');

    // 360Dialog Payload Simulation
    const payload = {
        contacts: [{
            profile: { name: "Test User" },
            wa_id: PHONE_NUMBER
        }],
        messages: [{
            from: PHONE_NUMBER,
            id: `wamid.TEST_${Date.now()}`,
            timestamp: Math.floor(Date.now() / 1000).toString(),
            text: { body: "Teste Socket IO " + new Date().toLocaleTimeString() },
            type: "text"
        }]
    };

    try {
        const response = await fetch(`${SOCKET_URL}/whatsapp/webhook`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (response.ok) {
            console.log('✅ Webhook sent successfully');
        } else {
            console.log('❌ Webhook failed:', response.status, await response.text());
        }
    } catch (error) {
        console.error('❌ Fetch Error:', error);
    }
}

// Timeout after 15 seconds
setTimeout(() => {
    console.log('⏰ Timeout! Message was not received via socket.');
    process.exit(1);
}, 15000);
