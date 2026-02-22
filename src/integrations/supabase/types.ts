export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      journal_entries: {
        Row: {
          body_he: string | null
          created_at: string | null
          id: string
          title_he: string | null
          user_id: string
        }
        Insert: {
          body_he?: string | null
          created_at?: string | null
          id?: string
          title_he?: string | null
          user_id: string
        }
        Update: {
          body_he?: string | null
          created_at?: string | null
          id?: string
          title_he?: string | null
          user_id?: string
        }
        Relationships: []
      }
      orders: {
        Row: {
          id: string
          mini_choices_json: Json | null
          mini_scenario_he: string | null
          official_definition_he: string | null
          red_flags_json: Json | null
          source_url: string | null
          title_he: string
          type: string
          what_to_do_steps_json: Json | null
        }
        Insert: {
          id: string
          mini_choices_json?: Json | null
          mini_scenario_he?: string | null
          official_definition_he?: string | null
          red_flags_json?: Json | null
          source_url?: string | null
          title_he: string
          type: string
          what_to_do_steps_json?: Json | null
        }
        Update: {
          id?: string
          mini_choices_json?: Json | null
          mini_scenario_he?: string | null
          official_definition_he?: string | null
          red_flags_json?: Json | null
          source_url?: string | null
          title_he?: string
          type?: string
          what_to_do_steps_json?: Json | null
        }
        Relationships: []
      }
      progress: {
        Row: {
          id: string
          module_key: string
          status: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          id?: string
          module_key: string
          status?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          id?: string
          module_key?: string
          status?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      responses: {
        Row: {
          choice: number | null
          created_at: string | null
          id: string
          reflection_text: string | null
          scenario_id: string | null
          selected_values_json: Json | null
          tension_discipline_responsibility: number | null
          tension_mission_human: number | null
          user_id: string
        }
        Insert: {
          choice?: number | null
          created_at?: string | null
          id?: string
          reflection_text?: string | null
          scenario_id?: string | null
          selected_values_json?: Json | null
          tension_discipline_responsibility?: number | null
          tension_mission_human?: number | null
          user_id: string
        }
        Update: {
          choice?: number | null
          created_at?: string | null
          id?: string
          reflection_text?: string | null
          scenario_id?: string | null
          selected_values_json?: Json | null
          tension_discipline_responsibility?: number | null
          tension_mission_human?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "responses_scenario_id_fkey"
            columns: ["scenario_id"]
            isOneToOne: false
            referencedRelation: "scenarios"
            referencedColumns: ["id"]
          },
        ]
      }
      scenarios: {
        Row: {
          choices_json: Json | null
          feedback_json: Json | null
          id: string
          reflection_question_he: string | null
          story_he: string | null
          tags_json: Json | null
          title_he: string
          value_conflicts_json: Json | null
        }
        Insert: {
          choices_json?: Json | null
          feedback_json?: Json | null
          id: string
          reflection_question_he?: string | null
          story_he?: string | null
          tags_json?: Json | null
          title_he: string
          value_conflicts_json?: Json | null
        }
        Update: {
          choices_json?: Json | null
          feedback_json?: Json | null
          id?: string
          reflection_question_he?: string | null
          story_he?: string | null
          tags_json?: Json | null
          title_he?: string
          value_conflicts_json?: Json | null
        }
        Relationships: []
      }
      user_dilemmas: {
        Row: {
          created_at: string | null
          id: string
          status: string
          story_he: string
          title_he: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          status?: string
          story_he: string
          title_he: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          status?: string
          story_he?: string
          title_he?: string
          user_id?: string
        }
        Relationships: []
      }
      user_meta: {
        Row: {
          intro_video_completed: boolean | null
          user_id: string
        }
        Insert: {
          intro_video_completed?: boolean | null
          user_id: string
        }
        Update: {
          intro_video_completed?: boolean | null
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      values: {
        Row: {
          example_safe_he: string | null
          id: string
          official_definition_he: string | null
          quick_exercise_question_he: string | null
          source_url: string | null
          title_he: string
          youth_microcopy_he: string | null
        }
        Insert: {
          example_safe_he?: string | null
          id: string
          official_definition_he?: string | null
          quick_exercise_question_he?: string | null
          source_url?: string | null
          title_he: string
          youth_microcopy_he?: string | null
        }
        Update: {
          example_safe_he?: string | null
          id?: string
          official_definition_he?: string | null
          quick_exercise_question_he?: string | null
          source_url?: string | null
          title_he?: string
          youth_microcopy_he?: string | null
        }
        Relationships: []
      }
      weekly_polls: {
        Row: {
          created_at: string | null
          id: string
          options_json: Json
          question_he: string
          week_key: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          options_json: Json
          question_he: string
          week_key: string
        }
        Update: {
          created_at?: string | null
          id?: string
          options_json?: Json
          question_he?: string
          week_key?: string
        }
        Relationships: []
      }
      weekly_votes: {
        Row: {
          created_at: string | null
          id: string
          option_index: number
          poll_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          option_index: number
          poll_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          option_index?: number
          poll_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "weekly_votes_poll_id_fkey"
            columns: ["poll_id"]
            isOneToOne: false
            referencedRelation: "weekly_polls"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_poll_results: { Args: { p_poll_id: string }; Returns: Json }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
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
  public: {
    Enums: {
      app_role: ["admin", "user"],
    },
  },
} as const
