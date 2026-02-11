export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1";
  };
  public: {
    Tables: {
      conversations: {
        Row: {
          assigned_to: string | null;
          channel: string | null;
          company: string | null;
          context: string | null;
          created_at: string | null;
          email: string | null;
          id: string;
          is_blocked: boolean | null;
          is_favorite: boolean | null;
          is_pinned: boolean | null;
          last_message_at: string | null;
          last_message_preview: string | null;
          lead_id: string | null;
          name: string | null;
          notes: string | null;
          phone: string;
          post_sales_id: string | null;
          profile_pic_url: string | null;
          status: string | null;
          tags: string[] | null;
          unread_count: number | null;
          updated_at: string | null;
        };
        Insert: {
          assigned_to?: string | null;
          channel?: string | null;
          company?: string | null;
          context?: string | null;
          created_at?: string | null;
          email?: string | null;
          id?: string;
          is_blocked?: boolean | null;
          is_favorite?: boolean | null;
          is_pinned?: boolean | null;
          last_message_at?: string | null;
          last_message_preview?: string | null;
          lead_id?: string | null;
          name?: string | null;
          notes?: string | null;
          phone: string;
          post_sales_id?: string | null;
          profile_pic_url?: string | null;
          status?: string | null;
          tags?: string[] | null;
          unread_count?: number | null;
          updated_at?: string | null;
        };
        Update: {
          assigned_to?: string | null;
          channel?: string | null;
          company?: string | null;
          context?: string | null;
          created_at?: string | null;
          email?: string | null;
          id?: string;
          is_blocked?: boolean | null;
          is_favorite?: boolean | null;
          is_pinned?: boolean | null;
          last_message_at?: string | null;
          last_message_preview?: string | null;
          lead_id?: string | null;
          name?: string | null;
          notes?: string | null;
          phone?: string;
          post_sales_id?: string | null;
          profile_pic_url?: string | null;
          status?: string | null;
          tags?: string[] | null;
          unread_count?: number | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "conversations_assigned_to_fkey";
            columns: ["assigned_to"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "conversations_lead_id_fkey";
            columns: ["lead_id"];
            isOneToOne: false;
            referencedRelation: "leads";
            referencedColumns: ["id"];
          },
        ];
      };
      goals: {
        Row: {
          created_at: string | null;
          daily_target: number | null;
          date: string;
          id: string;
          points_delivered: number | null;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          created_at?: string | null;
          daily_target?: number | null;
          date: string;
          id?: string;
          points_delivered?: number | null;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          created_at?: string | null;
          daily_target?: number | null;
          date?: string;
          id?: string;
          points_delivered?: number | null;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "goals_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      lead_activities: {
        Row: {
          created_at: string | null;
          description: string;
          id: string;
          lead_id: string;
          metadata: Json | null;
          type: string;
          user_id: string | null;
        };
        Insert: {
          created_at?: string | null;
          description: string;
          id?: string;
          lead_id: string;
          metadata?: Json | null;
          type: string;
          user_id?: string | null;
        };
        Update: {
          created_at?: string | null;
          description?: string;
          id?: string;
          lead_id?: string;
          metadata?: Json | null;
          type?: string;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "lead_activities_lead_id_fkey";
            columns: ["lead_id"];
            isOneToOne: false;
            referencedRelation: "leads";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "lead_activities_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      leads: {
        Row: {
          client_status: string | null;
          company: string | null;
          completed_at: string | null;
          created_at: string | null;
          current_sector: string | null;
          custom_fields: Json | null;
          deal_closed_at: string | null;
          deal_notes: string | null;
          deal_product_id: string | null;
          deal_status: string | null;
          deal_value: number | null;
          email: string | null;
          estimated_value: number | null;
          id: string;
          lost_at: string | null;
          lost_reason_id: string | null;
          name: string;
          notes: string | null;
          order: number | null;
          phone: string;
          pipeline: string;
          post_sales_assigned_at: string | null;
          post_sales_distribution_status: string | null;
          post_sales_id: string | null;
          previous_post_sales_ids: string[] | null;
          responsible_id: string | null;
          source: string | null;
          stage_id: string | null;
          tags: string[] | null;
          temperature: string | null;
          updated_at: string | null;
        };
        Insert: {
          client_status?: string | null;
          company?: string | null;
          completed_at?: string | null;
          created_at?: string | null;
          current_sector?: string | null;
          custom_fields?: Json | null;
          deal_closed_at?: string | null;
          deal_notes?: string | null;
          deal_product_id?: string | null;
          deal_status?: string | null;
          deal_value?: number | null;
          email?: string | null;
          estimated_value?: number | null;
          id?: string;
          lost_at?: string | null;
          lost_reason_id?: string | null;
          name: string;
          notes?: string | null;
          order?: number | null;
          phone: string;
          pipeline: string;
          post_sales_assigned_at?: string | null;
          post_sales_distribution_status?: string | null;
          post_sales_id?: string | null;
          previous_post_sales_ids?: string[] | null;
          responsible_id?: string | null;
          source?: string | null;
          stage_id?: string | null;
          tags?: string[] | null;
          temperature?: string | null;
          updated_at?: string | null;
        };
        Update: {
          client_status?: string | null;
          company?: string | null;
          completed_at?: string | null;
          created_at?: string | null;
          current_sector?: string | null;
          custom_fields?: Json | null;
          deal_closed_at?: string | null;
          deal_notes?: string | null;
          deal_product_id?: string | null;
          deal_status?: string | null;
          deal_value?: number | null;
          email?: string | null;
          estimated_value?: number | null;
          id?: string;
          lost_at?: string | null;
          lost_reason_id?: string | null;
          name?: string;
          notes?: string | null;
          order?: number | null;
          phone?: string;
          pipeline?: string;
          post_sales_assigned_at?: string | null;
          post_sales_distribution_status?: string | null;
          post_sales_id?: string | null;
          previous_post_sales_ids?: string[] | null;
          responsible_id?: string | null;
          source?: string | null;
          stage_id?: string | null;
          tags?: string[] | null;
          temperature?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "leads_deal_product_id_fkey";
            columns: ["deal_product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "leads_lost_reason_id_fkey";
            columns: ["lost_reason_id"];
            isOneToOne: false;
            referencedRelation: "loss_reasons";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "leads_post_sales_id_fkey";
            columns: ["post_sales_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "leads_responsible_id_fkey";
            columns: ["responsible_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "leads_stage_id_fkey";
            columns: ["stage_id"];
            isOneToOne: false;
            referencedRelation: "pipeline_stages";
            referencedColumns: ["id"];
          },
        ];
      };
      loss_reasons: {
        Row: {
          created_at: string | null;
          id: string;
          is_active: boolean | null;
          name: string;
        };
        Insert: {
          created_at?: string | null;
          id?: string;
          is_active?: boolean | null;
          name: string;
        };
        Update: {
          created_at?: string | null;
          id?: string;
          is_active?: boolean | null;
          name?: string;
        };
        Relationships: [];
      };
      messages: {
        Row: {
          content: string | null;
          conversation_id: string;
          created_at: string | null;
          id: string;
          media_mime_type: string | null;
          media_url: string | null;
          metadata: Json | null;
          reply_to_message_id: string | null;
          sender_id: string | null;
          sender_name: string | null;
          sender_type: string;
          status: string | null;
          type: string | null;
          whatsapp_message_id: string | null;
        };
        Insert: {
          content?: string | null;
          conversation_id: string;
          created_at?: string | null;
          id?: string;
          media_mime_type?: string | null;
          media_url?: string | null;
          metadata?: Json | null;
          reply_to_message_id?: string | null;
          sender_id?: string | null;
          sender_name?: string | null;
          sender_type: string;
          status?: string | null;
          type?: string | null;
          whatsapp_message_id?: string | null;
        };
        Update: {
          content?: string | null;
          conversation_id?: string;
          created_at?: string | null;
          id?: string;
          media_mime_type?: string | null;
          media_url?: string | null;
          metadata?: Json | null;
          reply_to_message_id?: string | null;
          sender_id?: string | null;
          sender_name?: string | null;
          sender_type?: string;
          status?: string | null;
          type?: string | null;
          whatsapp_message_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey";
            columns: ["conversation_id"];
            isOneToOne: false;
            referencedRelation: "conversations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "messages_reply_to_message_id_fkey";
            columns: ["reply_to_message_id"];
            isOneToOne: false;
            referencedRelation: "messages";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "messages_sender_id_fkey";
            columns: ["sender_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      pipeline_stages: {
        Row: {
          active: boolean | null;
          color: string;
          created_at: string | null;
          id: string;
          is_system_stage: boolean | null;
          name: string;
          order: number;
          pipeline: string;
        };
        Insert: {
          active?: boolean | null;
          color?: string;
          created_at?: string | null;
          id?: string;
          is_system_stage?: boolean | null;
          name: string;
          order: number;
          pipeline: string;
        };
        Update: {
          active?: boolean | null;
          color?: string;
          created_at?: string | null;
          id?: string;
          is_system_stage?: boolean | null;
          name?: string;
          order?: number;
          pipeline?: string;
        };
        Relationships: [];
      };
      products: {
        Row: {
          active: boolean | null;
          base_points: number | null;
          created_at: string | null;
          id: string;
          name: string;
        };
        Insert: {
          active?: boolean | null;
          base_points?: number | null;
          created_at?: string | null;
          id?: string;
          name: string;
        };
        Update: {
          active?: boolean | null;
          base_points?: number | null;
          created_at?: string | null;
          id?: string;
          name?: string;
        };
        Relationships: [];
      };
      project_checklist_items: {
        Row: {
          completed: boolean | null;
          id: string;
          order: number | null;
          project_id: string;
          text: string;
        };
        Insert: {
          completed?: boolean | null;
          id?: string;
          order?: number | null;
          project_id: string;
          text: string;
        };
        Update: {
          completed?: boolean | null;
          id?: string;
          order?: number | null;
          project_id?: string;
          text?: string;
        };
        Relationships: [
          {
            foreignKeyName: "project_checklist_items_project_id_fkey";
            columns: ["project_id"];
            isOneToOne: false;
            referencedRelation: "projects";
            referencedColumns: ["id"];
          },
        ];
      };
      projects: {
        Row: {
          assigned_at: string | null;
          assigned_by_leader_id: string | null;
          base_points: number | null;
          client_approval_status: string | null;
          client_approved_at: string | null;
          client_feedback: string | null;
          client_revision_count: number | null;
          created_at: string | null;
          delivered_at: string | null;
          delivered_to_client_at: string | null;
          delivered_to_client_by: string | null;
          distribution_status: string | null;
          drive_link: string | null;
          due_date: string | null;
          duration_category: string | null;
          extra_points: number | null;
          id: string;
          internal_revision_count: number | null;
          lead_id: string;
          name: string;
          notes: string | null;
          payment_received_at: string | null;
          payment_received_by: string | null;
          payment_status: string | null;
          post_sales_assigned_at: string | null;
          post_sales_id: string | null;
          post_sales_name: string | null;
          priority: string | null;
          producer_id: string | null;
          product_id: string | null;
          product_type: string | null;
          source: string | null;
          status: string;
          status_page_token: string | null;
          status_page_url: string | null;
          suggested_producer_id: string | null;
          suggested_producer_name: string | null;
          suggestion_notes: string | null;
          total_points: number | null;
          updated_at: string | null;
        };
        Insert: {
          assigned_at?: string | null;
          assigned_by_leader_id?: string | null;
          base_points?: number | null;
          client_approval_status?: string | null;
          client_approved_at?: string | null;
          client_feedback?: string | null;
          client_revision_count?: number | null;
          created_at?: string | null;
          delivered_at?: string | null;
          delivered_to_client_at?: string | null;
          delivered_to_client_by?: string | null;
          distribution_status?: string | null;
          drive_link?: string | null;
          due_date?: string | null;
          duration_category?: string | null;
          extra_points?: number | null;
          id?: string;
          internal_revision_count?: number | null;
          lead_id: string;
          name: string;
          notes?: string | null;
          payment_received_at?: string | null;
          payment_received_by?: string | null;
          payment_status?: string | null;
          post_sales_assigned_at?: string | null;
          post_sales_id?: string | null;
          post_sales_name?: string | null;
          priority?: string | null;
          producer_id?: string | null;
          product_id?: string | null;
          product_type?: string | null;
          source?: string | null;
          status?: string;
          status_page_token?: string | null;
          status_page_url?: string | null;
          suggested_producer_id?: string | null;
          suggested_producer_name?: string | null;
          suggestion_notes?: string | null;
          total_points?: number | null;
          updated_at?: string | null;
        };
        Update: {
          assigned_at?: string | null;
          assigned_by_leader_id?: string | null;
          base_points?: number | null;
          client_approval_status?: string | null;
          client_approved_at?: string | null;
          client_feedback?: string | null;
          client_revision_count?: number | null;
          created_at?: string | null;
          delivered_at?: string | null;
          delivered_to_client_at?: string | null;
          delivered_to_client_by?: string | null;
          distribution_status?: string | null;
          drive_link?: string | null;
          due_date?: string | null;
          duration_category?: string | null;
          extra_points?: number | null;
          id?: string;
          internal_revision_count?: number | null;
          lead_id?: string;
          name?: string;
          notes?: string | null;
          payment_received_at?: string | null;
          payment_received_by?: string | null;
          payment_status?: string | null;
          post_sales_assigned_at?: string | null;
          post_sales_id?: string | null;
          post_sales_name?: string | null;
          priority?: string | null;
          producer_id?: string | null;
          product_id?: string | null;
          product_type?: string | null;
          source?: string | null;
          status?: string;
          status_page_token?: string | null;
          status_page_url?: string | null;
          suggested_producer_id?: string | null;
          suggested_producer_name?: string | null;
          suggestion_notes?: string | null;
          total_points?: number | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "projects_assigned_by_leader_id_fkey";
            columns: ["assigned_by_leader_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "projects_delivered_to_client_by_fkey";
            columns: ["delivered_to_client_by"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "projects_lead_id_fkey";
            columns: ["lead_id"];
            isOneToOne: false;
            referencedRelation: "leads";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "projects_post_sales_id_fkey";
            columns: ["post_sales_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "projects_producer_id_fkey";
            columns: ["producer_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "projects_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "projects_suggested_producer_id_fkey";
            columns: ["suggested_producer_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      revision_history: {
        Row: {
          created_at: string | null;
          id: string;
          project_id: string;
          reason: string | null;
          requested_by: string | null;
          requested_by_name: string | null;
          type: string;
        };
        Insert: {
          created_at?: string | null;
          id?: string;
          project_id: string;
          reason?: string | null;
          requested_by?: string | null;
          requested_by_name?: string | null;
          type: string;
        };
        Update: {
          created_at?: string | null;
          id?: string;
          project_id?: string;
          reason?: string | null;
          requested_by?: string | null;
          requested_by_name?: string | null;
          type?: string;
        };
        Relationships: [
          {
            foreignKeyName: "revision_history_project_id_fkey";
            columns: ["project_id"];
            isOneToOne: false;
            referencedRelation: "projects";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "revision_history_requested_by_fkey";
            columns: ["requested_by"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      team_chat_channels: {
        Row: {
          admin_ids: string[] | null;
          created_at: string | null;
          created_by: string | null;
          id: string;
          last_message_at: string | null;
          last_message_content: string | null;
          last_message_sender_id: string | null;
          last_message_type: string | null;
          member_ids: string[];
          name: string;
          photo_url: string | null;
          type: string | null;
          updated_at: string | null;
        };
        Insert: {
          admin_ids?: string[] | null;
          created_at?: string | null;
          created_by?: string | null;
          id?: string;
          last_message_at?: string | null;
          last_message_content?: string | null;
          last_message_sender_id?: string | null;
          last_message_type?: string | null;
          member_ids?: string[];
          name: string;
          photo_url?: string | null;
          type?: string | null;
          updated_at?: string | null;
        };
        Update: {
          admin_ids?: string[] | null;
          created_at?: string | null;
          created_by?: string | null;
          id?: string;
          last_message_at?: string | null;
          last_message_content?: string | null;
          last_message_sender_id?: string | null;
          last_message_type?: string | null;
          member_ids?: string[];
          name?: string;
          photo_url?: string | null;
          type?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "team_chat_channels_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      team_chat_messages: {
        Row: {
          channel_id: string;
          content: string | null;
          created_at: string | null;
          id: string;
          media_url: string | null;
          sender_id: string;
          sender_name: string;
          type: string | null;
        };
        Insert: {
          channel_id: string;
          content?: string | null;
          created_at?: string | null;
          id?: string;
          media_url?: string | null;
          sender_id: string;
          sender_name: string;
          type?: string | null;
        };
        Update: {
          channel_id?: string;
          content?: string | null;
          created_at?: string | null;
          id?: string;
          media_url?: string | null;
          sender_id?: string;
          sender_name?: string;
          type?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "team_chat_messages_channel_id_fkey";
            columns: ["channel_id"];
            isOneToOne: false;
            referencedRelation: "team_chat_channels";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "team_chat_messages_sender_id_fkey";
            columns: ["sender_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      users: {
        Row: {
          active: boolean | null;
          avatar_url: string | null;
          created_at: string | null;
          department: string | null;
          email: string;
          id: string;
          name: string;
          phone: string | null;
          role: string;
          updated_at: string | null;
        };
        Insert: {
          active?: boolean | null;
          avatar_url?: string | null;
          created_at?: string | null;
          department?: string | null;
          email: string;
          id?: string;
          name: string;
          phone?: string | null;
          role: string;
          updated_at?: string | null;
        };
        Update: {
          active?: boolean | null;
          avatar_url?: string | null;
          created_at?: string | null;
          department?: string | null;
          email?: string;
          id?: string;
          name?: string;
          phone?: string | null;
          role?: string;
          updated_at?: string | null;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      is_admin_or_leader: { Args: never; Returns: boolean };
      user_role: { Args: never; Returns: string };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<
  keyof Database,
  "public"
>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {},
  },
} as const;
