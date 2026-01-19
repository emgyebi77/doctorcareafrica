export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      appointments: {
        Row: any;
        Insert: any;
        Update: any;
        Relationships: any[];
      };
      doctors: {
        Row: any;
        Insert: any;
        Update: any;
        Relationships: any[];
      };
      patients: {
        Row: any;
        Insert: any;
        Update: any;
        Relationships: any[];
      };
      profiles: {
        Row: any;
        Insert: any;
        Update: any;
        Relationships: any[];
      };
      user_roles: {
        Row: any;
        Insert: any;
        Update: any;
        Relationships: any[];
      };
    };
    Views: {
      doctors_public: {
        Row: any;
        Insert: any;
        Update: any;
        Relationships: any[];
      };
    };
    Functions: {
      can_access_appointment: { Args: { _appointment_id: string }; Returns: boolean };
      can_access_doctor: { Args: { _doctor_id: string }; Returns: boolean };
      can_access_patient: { Args: { _patient_id: string }; Returns: boolean };
      has_role: { Args: { _role: any; _user_id: string }; Returns: boolean };
      is_admin_or_superadmin: { Args: never; Returns: boolean };
      is_doctor_owner: { Args: { _doctor_id: string }; Returns: boolean };
      is_patient_owner: { Args: { _patient_id: string }; Returns: boolean };
    };
    Enums: {
      app_role: "superadmin" | "admin" | "doctor" | "nurse" | "staff" | "patient";
    };
    CompositeTypes: Record<string, never>;
  };
};
