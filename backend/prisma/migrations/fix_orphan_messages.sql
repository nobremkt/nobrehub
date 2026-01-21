-- Fix orphan messages: Link messages without conversation_id to their lead's active/recent conversation
-- Run this after deploying the fix to /send-template endpoint
-- Table names use snake_case as defined in Prisma @@map

-- Step 1: Update messages that have lead_id but no conversation_id
UPDATE messages m
SET conversation_id = (
    SELECT c.id 
    FROM conversations c 
    WHERE c.lead_id = m.lead_id 
    ORDER BY c.last_message_at DESC NULLS LAST
    LIMIT 1
)
WHERE m.conversation_id IS NULL 
AND m.lead_id IS NOT NULL;

-- Step 2: Verify the fix
SELECT 
    COUNT(*) FILTER (WHERE conversation_id IS NOT NULL) as messages_with_conversation,
    COUNT(*) FILTER (WHERE conversation_id IS NULL AND lead_id IS NOT NULL) as orphan_messages_with_lead,
    COUNT(*) FILTER (WHERE conversation_id IS NULL AND lead_id IS NULL) as orphan_messages_no_lead
FROM messages;
