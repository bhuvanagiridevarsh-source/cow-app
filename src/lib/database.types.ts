// GENERATED from the database by Supabase (generate_typescript_types). Do not edit by hand.
// Regenerate after every migration that changes tables or functions.

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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      blocks: {
        Row: {
          blocked_id: string
          blocker_id: string
          created_at: string
        }
        Insert: {
          blocked_id: string
          blocker_id: string
          created_at?: string
        }
        Update: {
          blocked_id?: string
          blocker_id?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "blocks_blocked_id_fkey"
            columns: ["blocked_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blocks_blocker_id_fkey"
            columns: ["blocker_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      impact_ledger: {
        Row: {
          amount: number
          created_at: string
          id: number
          pickup_id: string | null
        }
        Insert: {
          amount: number
          created_at?: string
          id?: never
          pickup_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          id?: never
          pickup_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "impact_ledger_pickup_id_fkey"
            columns: ["pickup_id"]
            isOneToOne: true
            referencedRelation: "pickups"
            referencedColumns: ["id"]
          },
        ]
      }
      item_addresses: {
        Row: {
          exact_lat: number | null
          exact_lng: number | null
          item_id: string
          pickup_note: string | null
          street: string
          unit: string | null
          zip: string
        }
        Insert: {
          exact_lat?: number | null
          exact_lng?: number | null
          item_id: string
          pickup_note?: string | null
          street: string
          unit?: string | null
          zip: string
        }
        Update: {
          exact_lat?: number | null
          exact_lng?: number | null
          item_id?: string
          pickup_note?: string | null
          street?: string
          unit?: string | null
          zip?: string
        }
        Relationships: [
          {
            foreignKeyName: "item_addresses_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: true
            referencedRelation: "items"
            referencedColumns: ["id"]
          },
        ]
      }
      items: {
        Row: {
          adult_home_confirmed: boolean
          approx_lat: number | null
          approx_lng: number | null
          category: Database["public"]["Enums"]["item_category"]
          condition: Database["public"]["Enums"]["item_condition"]
          confirmed_at: string | null
          created_at: string
          donor_id: string
          hidden_at: string | null
          id: string
          photo_path: string
          pickup_window_end: string
          pickup_window_start: string
          status: Database["public"]["Enums"]["item_status"]
          title: string
          town: string
          updated_at: string
          value: number
        }
        Insert: {
          adult_home_confirmed?: boolean
          approx_lat?: number | null
          approx_lng?: number | null
          category: Database["public"]["Enums"]["item_category"]
          condition: Database["public"]["Enums"]["item_condition"]
          confirmed_at?: string | null
          created_at?: string
          donor_id: string
          hidden_at?: string | null
          id?: string
          photo_path: string
          pickup_window_end: string
          pickup_window_start: string
          status?: Database["public"]["Enums"]["item_status"]
          title: string
          town: string
          updated_at?: string
          value: number
        }
        Update: {
          adult_home_confirmed?: boolean
          approx_lat?: number | null
          approx_lng?: number | null
          category?: Database["public"]["Enums"]["item_category"]
          condition?: Database["public"]["Enums"]["item_condition"]
          confirmed_at?: string | null
          created_at?: string
          donor_id?: string
          hidden_at?: string | null
          id?: string
          photo_path?: string
          pickup_window_end?: string
          pickup_window_start?: string
          status?: Database["public"]["Enums"]["item_status"]
          title?: string
          town?: string
          updated_at?: string
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "items_donor_id_fkey"
            columns: ["donor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      pickups: {
        Row: {
          accepted_at: string | null
          adult_attending: boolean
          cancelled_by: string | null
          closed_at: string | null
          collected_at: string | null
          confirmed_at: string | null
          confirmed_by: string | null
          donor_id: string | null
          hours_awarded: number
          id: string
          item_category: Database["public"]["Enums"]["item_category"]
          item_id: string | null
          item_title: string
          item_value: number
          requested_at: string
          status: Database["public"]["Enums"]["pickup_status"]
          volunteer_id: string | null
        }
        Insert: {
          accepted_at?: string | null
          adult_attending?: boolean
          cancelled_by?: string | null
          closed_at?: string | null
          collected_at?: string | null
          confirmed_at?: string | null
          confirmed_by?: string | null
          donor_id?: string | null
          hours_awarded?: number
          id?: string
          item_category: Database["public"]["Enums"]["item_category"]
          item_id?: string | null
          item_title: string
          item_value: number
          requested_at?: string
          status?: Database["public"]["Enums"]["pickup_status"]
          volunteer_id?: string | null
        }
        Update: {
          accepted_at?: string | null
          adult_attending?: boolean
          cancelled_by?: string | null
          closed_at?: string | null
          collected_at?: string | null
          confirmed_at?: string | null
          confirmed_by?: string | null
          donor_id?: string | null
          hours_awarded?: number
          id?: string
          item_category?: Database["public"]["Enums"]["item_category"]
          item_id?: string | null
          item_title?: string
          item_value?: number
          requested_at?: string
          status?: Database["public"]["Enums"]["pickup_status"]
          volunteer_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pickups_cancelled_by_fkey"
            columns: ["cancelled_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pickups_confirmed_by_fkey"
            columns: ["confirmed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pickups_donor_id_fkey"
            columns: ["donor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pickups_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pickups_volunteer_id_fkey"
            columns: ["volunteer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          accepted_terms_at: string
          ambassador_requested_at: string | null
          birth_month: number
          birth_year: number
          created_at: string
          guardian_consent_at: string | null
          guardian_email: string | null
          guardian_name: string | null
          id: string
          is_admin: boolean
          name: string
          role: Database["public"]["Enums"]["user_role"]
          terms_version: string
          updated_at: string
          verified_ambassador: boolean
          zip: string
        }
        Insert: {
          accepted_terms_at: string
          ambassador_requested_at?: string | null
          birth_month: number
          birth_year: number
          created_at?: string
          guardian_consent_at?: string | null
          guardian_email?: string | null
          guardian_name?: string | null
          id: string
          is_admin?: boolean
          name: string
          role: Database["public"]["Enums"]["user_role"]
          terms_version: string
          updated_at?: string
          verified_ambassador?: boolean
          zip: string
        }
        Update: {
          accepted_terms_at?: string
          ambassador_requested_at?: string | null
          birth_month?: number
          birth_year?: number
          created_at?: string
          guardian_consent_at?: string | null
          guardian_email?: string | null
          guardian_name?: string | null
          id?: string
          is_admin?: boolean
          name?: string
          role?: Database["public"]["Enums"]["user_role"]
          terms_version?: string
          updated_at?: string
          verified_ambassador?: boolean
          zip?: string
        }
        Relationships: []
      }
      reports: {
        Row: {
          admin_notes: string | null
          created_at: string
          details: string | null
          id: string
          item_id: string | null
          pickup_id: string | null
          reason: Database["public"]["Enums"]["report_reason"]
          reported_user_id: string | null
          reporter_id: string | null
          resolved_at: string | null
          status: Database["public"]["Enums"]["report_status"]
        }
        Insert: {
          admin_notes?: string | null
          created_at?: string
          details?: string | null
          id?: string
          item_id?: string | null
          pickup_id?: string | null
          reason: Database["public"]["Enums"]["report_reason"]
          reported_user_id?: string | null
          reporter_id?: string | null
          resolved_at?: string | null
          status?: Database["public"]["Enums"]["report_status"]
        }
        Update: {
          admin_notes?: string | null
          created_at?: string
          details?: string | null
          id?: string
          item_id?: string | null
          pickup_id?: string | null
          reason?: Database["public"]["Enums"]["report_reason"]
          reported_user_id?: string | null
          reporter_id?: string | null
          resolved_at?: string | null
          status?: Database["public"]["Enums"]["report_status"]
        }
        Relationships: [
          {
            foreignKeyName: "reports_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_pickup_id_fkey"
            columns: ["pickup_id"]
            isOneToOne: false
            referencedRelation: "pickups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_reported_user_id_fkey"
            columns: ["reported_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_reporter_id_fkey"
            columns: ["reporter_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      settings: {
        Row: {
          allowed_zip_prefixes: string[]
          base_impact_amount: number
          goal_amount: number
          goal_label: string
          hours_per_pickup: number
          id: boolean
          max_active_claims_ambassador: number
          max_active_claims_volunteer: number
          max_active_listings_per_donor: number
          max_item_value: number
          min_pickup_age: number
          minor_donors_require_adult_home: boolean
          minors_require_adult_on_pickup: boolean
          report_hide_threshold: number
          updated_at: string
        }
        Insert: {
          allowed_zip_prefixes?: string[]
          base_impact_amount?: number
          goal_amount?: number
          goal_label?: string
          hours_per_pickup?: number
          id?: boolean
          max_active_claims_ambassador?: number
          max_active_claims_volunteer?: number
          max_active_listings_per_donor?: number
          max_item_value?: number
          min_pickup_age?: number
          minor_donors_require_adult_home?: boolean
          minors_require_adult_on_pickup?: boolean
          report_hide_threshold?: number
          updated_at?: string
        }
        Update: {
          allowed_zip_prefixes?: string[]
          base_impact_amount?: number
          goal_amount?: number
          goal_label?: string
          hours_per_pickup?: number
          id?: boolean
          max_active_claims_ambassador?: number
          max_active_claims_volunteer?: number
          max_active_listings_per_donor?: number
          max_item_value?: number
          min_pickup_age?: number
          minor_donors_require_adult_home?: boolean
          minors_require_adult_on_pickup?: boolean
          report_hide_threshold?: number
          updated_at?: string
        }
        Relationships: []
      }
      zip_centroids: {
        Row: {
          lat: number
          lng: number
          zip: string
        }
        Insert: {
          lat: number
          lng: number
          zip: string
        }
        Update: {
          lat?: number
          lng?: number
          zip?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      accept_terms: { Args: { p_terms_version: string }; Returns: undefined }
      block_user: { Args: { p_user_id: string }; Returns: undefined }
      cancel_pickup: { Args: { p_pickup_id: string }; Returns: undefined }
      complete_profile: {
        Args: {
          p_birth_month: number
          p_birth_year: number
          p_guardian_consent?: boolean
          p_guardian_email?: string
          p_guardian_name?: string
          p_name: string
          p_role: Database["public"]["Enums"]["user_role"]
          p_terms_version: string
          p_zip: string
        }
        Returns: {
          accepted_terms_at: string
          ambassador_requested_at: string | null
          birth_month: number
          birth_year: number
          created_at: string
          guardian_consent_at: string | null
          guardian_email: string | null
          guardian_name: string | null
          id: string
          is_admin: boolean
          name: string
          role: Database["public"]["Enums"]["user_role"]
          terms_version: string
          updated_at: string
          verified_ambassador: boolean
          zip: string
        }
        SetofOptions: {
          from: "*"
          to: "profiles"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      confirm_pickup: { Args: { p_pickup_id: string }; Returns: undefined }
      create_item: {
        Args: {
          p_adult_home_confirmed?: boolean
          p_category: Database["public"]["Enums"]["item_category"]
          p_condition: Database["public"]["Enums"]["item_condition"]
          p_exact_lat?: number
          p_exact_lng?: number
          p_photo_path: string
          p_pickup_note?: string
          p_street: string
          p_title: string
          p_town: string
          p_unit?: string
          p_value: number
          p_window_end: string
          p_window_start: string
          p_zip: string
        }
        Returns: string
      }
      delete_my_account: { Args: never; Returns: undefined }
      impact_total: { Args: never; Returns: number }
      mark_collected: { Args: { p_pickup_id: string }; Returns: undefined }
      my_blocked_users: {
        Args: never
        Returns: {
          blocked_at: string
          display_name: string
          user_id: string
        }[]
      }
      my_stats: { Args: never; Returns: Json }
      pickup_counterpart: { Args: { p_pickup_id: string }; Returns: Json }
      report: {
        Args: {
          p_details?: string
          p_item_id?: string
          p_pickup_id?: string
          p_reason: Database["public"]["Enums"]["report_reason"]
          p_user_id?: string
        }
        Returns: string
      }
      request_ambassador: { Args: never; Returns: undefined }
      request_pickups: {
        Args: { p_adult_attending?: boolean; p_item_ids: string[] }
        Returns: {
          item_id: string
          pickup_id: string
          result: string
        }[]
      }
      respond_to_request: {
        Args: { p_accept: boolean; p_pickup_id: string }
        Returns: undefined
      }
      unblock_user: { Args: { p_user_id: string }; Returns: undefined }
      update_item: {
        Args: {
          p_adult_home_confirmed?: boolean
          p_category: Database["public"]["Enums"]["item_category"]
          p_condition: Database["public"]["Enums"]["item_condition"]
          p_exact_lat?: number
          p_exact_lng?: number
          p_item_id: string
          p_photo_path: string
          p_pickup_note?: string
          p_street: string
          p_title: string
          p_town: string
          p_unit?: string
          p_value: number
          p_window_end: string
          p_window_start: string
          p_zip: string
        }
        Returns: undefined
      }
      update_profile: {
        Args: {
          p_guardian_email?: string
          p_guardian_name?: string
          p_name: string
          p_role: Database["public"]["Enums"]["user_role"]
          p_zip: string
        }
        Returns: {
          accepted_terms_at: string
          ambassador_requested_at: string | null
          birth_month: number
          birth_year: number
          created_at: string
          guardian_consent_at: string | null
          guardian_email: string | null
          guardian_name: string | null
          id: string
          is_admin: boolean
          name: string
          role: Database["public"]["Enums"]["user_role"]
          terms_version: string
          updated_at: string
          verified_ambassador: boolean
          zip: string
        }
        SetofOptions: {
          from: "*"
          to: "profiles"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      user_hours: { Args: { p_user_id?: string }; Returns: number }
      withdraw_item: { Args: { p_item_id: string }; Returns: undefined }
    }
    Enums: {
      item_category: "furniture" | "electronics" | "appliances" | "other"
      item_condition: "new" | "good" | "fair"
      item_status:
        | "listed"
        | "requested"
        | "accepted"
        | "collected"
        | "confirmed"
        | "withdrawn"
        | "removed"
      pickup_status:
        | "requested"
        | "accepted"
        | "declined"
        | "cancelled"
        | "collected"
        | "confirmed"
      report_reason:
        | "fake_listing"
        | "inappropriate"
        | "unsafe"
        | "no_show"
        | "harassment"
        | "other"
      report_status: "open" | "resolved" | "dismissed"
      user_role: "donor" | "volunteer" | "ambassador"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      item_category: ["furniture", "electronics", "appliances", "other"],
      item_condition: ["new", "good", "fair"],
      item_status: [
        "listed",
        "requested",
        "accepted",
        "collected",
        "confirmed",
        "withdrawn",
        "removed",
      ],
      pickup_status: [
        "requested",
        "accepted",
        "declined",
        "cancelled",
        "collected",
        "confirmed",
      ],
      report_reason: [
        "fake_listing",
        "inappropriate",
        "unsafe",
        "no_show",
        "harassment",
        "other",
      ],
      report_status: ["open", "resolved", "dismissed"],
      user_role: ["donor", "volunteer", "ambassador"],
    },
  },
} as const
