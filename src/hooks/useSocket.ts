// useSocket - NOW USING FIREBASE
// This file now re-exports from FirebaseContext instead of SocketContext
// Providing drop-in compatibility for existing components

// OLD (Socket.io - DEPRECATED):
// export { useSocket, useSocketContext } from '../contexts/SocketContext';

// NEW (Firebase Realtime DB):
export { useFirebase as useSocket, useFirebaseContext as useSocketContext } from '../contexts/FirebaseContext';
