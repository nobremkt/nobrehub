-- Fix: messages_type_check constraint is missing 'system' type
-- The trigger fn_conversation_system_message() inserts type='system' messages  
-- but the constraint doesn't allow it. Also add 'reaction' and 'contacts' types.
ALTER TABLE public.messages DROP CONSTRAINT messages_type_check;
ALTER TABLE public.messages ADD CONSTRAINT messages_type_check 
  CHECK (type = ANY (ARRAY[
    'text'::text, 'image'::text, 'video'::text, 'audio'::text, 
    'document'::text, 'sticker'::text, 'location'::text,
    'system'::text, 'reaction'::text, 'contacts'::text
  ]));
