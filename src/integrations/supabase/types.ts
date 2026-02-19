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
      profiles: {
        Row: {
          created_at: string
          full_name: string | null
          id: string
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      sales_bills: {
        Row: {
          battery_capacity: string | null
          battery_chemistry: string | null
          battery_make: string | null
          battery_manufacturing_year: string | null
          battery_number: string | null
          cgst_amount: number
          charger_number: string | null
          chassis_number: string
          controller_number: string | null
          created_at: string
          created_by: string
          customer_address: string
          customer_gst: string | null
          customer_mobile: string
          customer_name: string
          customer_pan: string | null
          customer_state: string
          ex_showroom_price: number
          hsn_sac_code: string
          id: string
          invoice_date: string
          invoice_number: string
          motor_number: string
          rounded_off: number | null
          sgst_amount: number
          taxable_price: number
          total_invoice_amount: number
          trade_certificate_no: string | null
          updated_at: string
          vehicle_color: string
          vehicle_model: string
        }
        Insert: {
          battery_capacity?: string | null
          battery_chemistry?: string | null
          battery_make?: string | null
          battery_manufacturing_year?: string | null
          battery_number?: string | null
          cgst_amount: number
          charger_number?: string | null
          chassis_number: string
          controller_number?: string | null
          created_at?: string
          created_by: string
          customer_address: string
          customer_gst?: string | null
          customer_mobile: string
          customer_name: string
          customer_pan?: string | null
          customer_state: string
          ex_showroom_price: number
          hsn_sac_code: string
          id?: string
          invoice_date?: string
          invoice_number: string
          motor_number: string
          rounded_off?: number | null
          sgst_amount: number
          taxable_price: number
          total_invoice_amount: number
          trade_certificate_no?: string | null
          updated_at?: string
          vehicle_color: string
          vehicle_model: string
        }
        Update: {
          battery_capacity?: string | null
          battery_chemistry?: string | null
          battery_make?: string | null
          battery_manufacturing_year?: string | null
          battery_number?: string | null
          cgst_amount?: number
          charger_number?: string | null
          chassis_number?: string
          controller_number?: string | null
          created_at?: string
          created_by?: string
          customer_address?: string
          customer_gst?: string | null
          customer_mobile?: string
          customer_name?: string
          customer_pan?: string | null
          customer_state?: string
          ex_showroom_price?: number
          hsn_sac_code?: string
          id?: string
          invoice_date?: string
          invoice_number?: string
          motor_number?: string
          rounded_off?: number | null
          sgst_amount?: number
          taxable_price?: number
          total_invoice_amount?: number
          trade_certificate_no?: string | null
          updated_at?: string
          vehicle_color?: string
          vehicle_model?: string
        }
        Relationships: []
      }
      service_bills: {
        Row: {
          apply_gst: boolean | null
          created_at: string
          created_by: string
          final_amount: number
          gst_amount: number | null
          id: string
          next_service_date: string | null
          sales_bill_id: string
          service_date: string
          service_items: Json
          service_notes: string | null
          sub_total: number
          updated_at: string
          vehicle_number: string | null
        }
        Insert: {
          apply_gst?: boolean | null
          created_at?: string
          created_by: string
          final_amount: number
          gst_amount?: number | null
          id?: string
          next_service_date?: string | null
          sales_bill_id: string
          service_date?: string
          service_items?: Json
          service_notes?: string | null
          sub_total: number
          updated_at?: string
          vehicle_number?: string | null
        }
        Update: {
          apply_gst?: boolean | null
          created_at?: string
          created_by?: string
          final_amount?: number
          gst_amount?: number | null
          id?: string
          next_service_date?: string | null
          sales_bill_id?: string
          service_date?: string
          service_items?: Json
          service_notes?: string | null
          sub_total?: number
          updated_at?: string
          vehicle_number?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "service_bills_sales_bill_id_fkey"
            columns: ["sales_bill_id"]
            isOneToOne: false
            referencedRelation: "sales_bills"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_invoice_number: { Args: never; Returns: string }
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
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
