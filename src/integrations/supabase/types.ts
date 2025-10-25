export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      churches: {
        Row: {
          contact_email: string
          created_at: string
          denomination: string | null
          email: string
          id: string
          key_ministries: Json | null
          location: string
          name: string
          owner_id: string
          service_times: Json | null
          social_handles: Json | null
          updated_at: string
          vision_statement: string
          website_url: string | null
        }
        Insert: {
          contact_email: string
          created_at?: string
          denomination?: string | null
          email: string
          id?: string
          key_ministries?: Json | null
          location: string
          name: string
          owner_id: string
          service_times?: Json | null
          social_handles?: Json | null
          updated_at?: string
          vision_statement: string
          website_url?: string | null
        }
        Update: {
          contact_email?: string
          created_at?: string
          denomination?: string | null
          email?: string
          id?: string
          key_ministries?: Json | null
          location?: string
          name?: string
          owner_id?: string
          service_times?: Json | null
          social_handles?: Json | null
          updated_at?: string
          vision_statement?: string
          website_url?: string | null
        }
        Relationships: []
      }
      generated_content: {
        Row: {
          bible_study_guide: string | null
          bible_study_guide_english: string | null
          church_id: string
          content_types: Json | null
          custom_cta: string | null
          devotional: string
          devotional_english: string | null
          facebook_post: string[] | null
          facebook_post_english: Json | null
          generated_at: string
          id: string
          instagram_post: string[] | null
          instagram_post_english: Json | null
          multi_language_versions: Json | null
          output_language: string | null
          output_languages: string[] | null
          platforms: Json
          posts_per_platform: number | null
          sermon_transcript_id: string | null
          tiktok_post: string[] | null
          tiktok_post_english: Json | null
          twitter_post: string[] | null
          twitter_post_english: Json | null
        }
        Insert: {
          bible_study_guide?: string | null
          bible_study_guide_english?: string | null
          church_id: string
          content_types?: Json | null
          custom_cta?: string | null
          devotional: string
          devotional_english?: string | null
          facebook_post?: string[] | null
          facebook_post_english?: Json | null
          generated_at?: string
          id?: string
          instagram_post?: string[] | null
          instagram_post_english?: Json | null
          multi_language_versions?: Json | null
          output_language?: string | null
          output_languages?: string[] | null
          platforms?: Json
          posts_per_platform?: number | null
          sermon_transcript_id?: string | null
          tiktok_post?: string[] | null
          tiktok_post_english?: Json | null
          twitter_post?: string[] | null
          twitter_post_english?: Json | null
        }
        Update: {
          bible_study_guide?: string | null
          bible_study_guide_english?: string | null
          church_id?: string
          content_types?: Json | null
          custom_cta?: string | null
          devotional?: string
          devotional_english?: string | null
          facebook_post?: string[] | null
          facebook_post_english?: Json | null
          generated_at?: string
          id?: string
          instagram_post?: string[] | null
          instagram_post_english?: Json | null
          multi_language_versions?: Json | null
          output_language?: string | null
          output_languages?: string[] | null
          platforms?: Json
          posts_per_platform?: number | null
          sermon_transcript_id?: string | null
          tiktok_post?: string[] | null
          tiktok_post_english?: Json | null
          twitter_post?: string[] | null
          twitter_post_english?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "generated_content_church_id_fkey"
            columns: ["church_id"]
            isOneToOne: false
            referencedRelation: "churches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "generated_content_sermon_transcript_id_fkey"
            columns: ["sermon_transcript_id"]
            isOneToOne: false
            referencedRelation: "sermon_transcripts"
            referencedColumns: ["id"]
          },
        ]
      }
      sermon_transcripts: {
        Row: {
          church_id: string
          file_name: string
          file_path: string
          id: string
          speaker_name: string | null
          transcript_text: string
          uploaded_at: string
          uploaded_by: string | null
        }
        Insert: {
          church_id: string
          file_name: string
          file_path: string
          id?: string
          speaker_name?: string | null
          transcript_text: string
          uploaded_at?: string
          uploaded_by?: string | null
        }
        Update: {
          church_id?: string
          file_name?: string
          file_path?: string
          id?: string
          speaker_name?: string | null
          transcript_text?: string
          uploaded_at?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sermon_transcripts_church_id_fkey"
            columns: ["church_id"]
            isOneToOne: false
            referencedRelation: "churches"
            referencedColumns: ["id"]
          },
        ]
      }
      style_guides: {
        Row: {
          church_id: string
          generated_at: string
          guide_content: string
          id: string
          sermon_documents: Json | null
          updated_at: string
          website_last_crawled_at: string | null
        }
        Insert: {
          church_id: string
          generated_at?: string
          guide_content: string
          id?: string
          sermon_documents?: Json | null
          updated_at?: string
          website_last_crawled_at?: string | null
        }
        Update: {
          church_id?: string
          generated_at?: string
          guide_content?: string
          id?: string
          sermon_documents?: Json | null
          updated_at?: string
          website_last_crawled_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "style_guides_church_id_fkey"
            columns: ["church_id"]
            isOneToOne: true
            referencedRelation: "churches"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          church_id: string
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          church_id: string
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          church_id?: string
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_church_id_fkey"
            columns: ["church_id"]
            isOneToOne: false
            referencedRelation: "churches"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_churches: {
        Args: { _user_id: string }
        Returns: {
          church_id: string
          role: Database["public"]["Enums"]["app_role"]
        }[]
      }
      has_role: {
        Args: {
          _church_id: string
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      user_owns_church: {
        Args: { _church_id: string; _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "owner" | "admin" | "editor" | "viewer"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      app_role: ["owner", "admin", "editor", "viewer"],
    },
  },
} as const

