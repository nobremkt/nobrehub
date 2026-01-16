
import { io } from "socket.io-client";

const SOCKET_URL = "http://localhost:3000";
// ID taken from the user's screenshot
const TARGET_CONVERSATION_ID = "9e10b54a-8b29-4089-9d2f-f205ca1aed85";

console.log(`Connecting to ${SOCKET_URL}...`);

const socket = io(SOCKET_URL, {
    transports: ["websocket", "polling"],
});

socket.on("connect", () => {
    console.log("✅ Connected! Socket ID:", socket.id);
    console.log(`👂 Listening for 'conversation:${TARGET_CONVERSATION_ID}:message'`);
});

// Specific listener
socket.on(`conversation:${TARGET_CONVERSATION_ID}:message`, (data) => {
    console.log("🔥 RECEIVED MESSAGE EVENT:", data);
});

// Wildcard listener (if client supports it, node client usually does via specific method or monkeypatch, but let's stick to specific first)
socket.onAny && socket.onAny((event, ...args) => {
    console.log(`📨 ANY EVENT: ${event}`, args);
});

socket.on("disconnect", (reason) => {
    console.log("❌ Disconnected. Reason:", reason);
});
