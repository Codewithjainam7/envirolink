// Database types for Supabase
// Run: npx supabase gen types typescript --project-id YOUR_PROJECT_ID > src/types/database.ts
// to generate these automatically

export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[];

export interface Database {
    public: {
        Tables: {
            reports: {
                Row: {
                    id: string;
                    report_id: string;
                    user_id: string | null;
                    category: 'illegal_dumping' | 'overflowing_bin' | 'littering' | 'construction_debris' | 'e_waste' | 'organic_waste';
                    severity: 'low' | 'medium' | 'high' | 'critical';
                    status: 'submitted' | 'under_review' | 'assigned' | 'in_progress' | 'resolved' | 'closed' | 'rejected';
                    description: string | null;
                    latitude: number;
                    longitude: number;
                    address: string;
                    locality: string;
                    city: string;
                    is_anonymous: boolean;
                    sla_hours: number;
                    sla_due_at: string;
                    is_sla_breach: boolean;
                    assigned_department_id: string | null;
                    assigned_department_name: string | null;
                    assigned_worker_id: string | null;
                    assigned_worker_name: string | null;
                    resolved_at: string | null;
                    resolution_notes: string | null;
                    created_at: string;
                    updated_at: string;
                };
                Insert: {
                    id?: string;
                    report_id?: string;
                    user_id?: string | null;
                    category: 'illegal_dumping' | 'overflowing_bin' | 'littering' | 'construction_debris' | 'e_waste' | 'organic_waste';
                    severity?: 'low' | 'medium' | 'high' | 'critical';
                    status?: 'submitted' | 'under_review' | 'assigned' | 'in_progress' | 'resolved' | 'closed' | 'rejected';
                    description?: string | null;
                    latitude: number;
                    longitude: number;
                    address: string;
                    locality: string;
                    city?: string;
                    is_anonymous?: boolean;
                    sla_hours?: number;
                    sla_due_at?: string;
                    is_sla_breach?: boolean;
                    assigned_department_id?: string | null;
                    assigned_department_name?: string | null;
                    assigned_worker_id?: string | null;
                    assigned_worker_name?: string | null;
                    resolved_at?: string | null;
                    resolution_notes?: string | null;
                    created_at?: string;
                    updated_at?: string;
                };
                Update: {
                    id?: string;
                    report_id?: string;
                    user_id?: string | null;
                    category?: 'illegal_dumping' | 'overflowing_bin' | 'littering' | 'construction_debris' | 'e_waste' | 'organic_waste';
                    severity?: 'low' | 'medium' | 'high' | 'critical';
                    status?: 'submitted' | 'under_review' | 'assigned' | 'in_progress' | 'resolved' | 'closed' | 'rejected';
                    description?: string | null;
                    latitude?: number;
                    longitude?: number;
                    address?: string;
                    locality?: string;
                    city?: string;
                    is_anonymous?: boolean;
                    sla_hours?: number;
                    sla_due_at?: string;
                    is_sla_breach?: boolean;
                    assigned_department_id?: string | null;
                    assigned_department_name?: string | null;
                    assigned_worker_id?: string | null;
                    assigned_worker_name?: string | null;
                    resolved_at?: string | null;
                    resolution_notes?: string | null;
                    created_at?: string;
                    updated_at?: string;
                };
            };
            report_images: {
                Row: {
                    id: string;
                    report_id: string;
                    url: string;
                    storage_path: string;
                    is_ai_analyzed: boolean;
                    ai_analysis: Json | null;
                    created_at: string;
                };
                Insert: {
                    id?: string;
                    report_id: string;
                    url: string;
                    storage_path: string;
                    is_ai_analyzed?: boolean;
                    ai_analysis?: Json | null;
                    created_at?: string;
                };
                Update: {
                    id?: string;
                    report_id?: string;
                    url?: string;
                    storage_path?: string;
                    is_ai_analyzed?: boolean;
                    ai_analysis?: Json | null;
                    created_at?: string;
                };
            };
            profiles: {
                Row: {
                    id: string;
                    email: string;
                    first_name: string;
                    last_name: string;
                    phone: string | null;
                    avatar_url: string | null;
                    role: 'citizen' | 'authority' | 'worker' | 'admin';
                    points: number;
                    reports_submitted: number;
                    reports_resolved: number;
                    created_at: string;
                    updated_at: string;
                };
                Insert: {
                    id: string;
                    email: string;
                    first_name: string;
                    last_name: string;
                    phone?: string | null;
                    avatar_url?: string | null;
                    role?: 'citizen' | 'authority' | 'worker' | 'admin';
                    points?: number;
                    reports_submitted?: number;
                    reports_resolved?: number;
                    created_at?: string;
                    updated_at?: string;
                };
                Update: {
                    id?: string;
                    email?: string;
                    first_name?: string;
                    last_name?: string;
                    phone?: string | null;
                    avatar_url?: string | null;
                    role?: 'citizen' | 'authority' | 'worker' | 'admin';
                    points?: number;
                    reports_submitted?: number;
                    reports_resolved?: number;
                    created_at?: string;
                    updated_at?: string;
                };
            };
            city_stats: {
                Row: {
                    id: string;
                    city: string;
                    total_reports: number;
                    resolved_reports: number;
                    active_reports: number;
                    resolution_rate: number;
                    avg_resolution_hours: number;
                    updated_at: string;
                };
                Insert: {
                    id?: string;
                    city: string;
                    total_reports?: number;
                    resolved_reports?: number;
                    active_reports?: number;
                    resolution_rate?: number;
                    avg_resolution_hours?: number;
                    updated_at?: string;
                };
                Update: {
                    id?: string;
                    city?: string;
                    total_reports?: number;
                    resolved_reports?: number;
                    active_reports?: number;
                    resolution_rate?: number;
                    avg_resolution_hours?: number;
                    updated_at?: string;
                };
            };
        };
        Views: {
            [_ in never]: never;
        };
        Functions: {
            [_ in never]: never;
        };
        Enums: {
            report_category: 'illegal_dumping' | 'overflowing_bin' | 'littering' | 'construction_debris' | 'e_waste' | 'organic_waste';
            report_severity: 'low' | 'medium' | 'high' | 'critical';
            report_status: 'submitted' | 'under_review' | 'assigned' | 'in_progress' | 'resolved' | 'closed' | 'rejected';
            user_role: 'citizen' | 'authority' | 'worker' | 'admin';
        };
    };
}

// Convenience types
export type Report = Database['public']['Tables']['reports']['Row'];
export type ReportInsert = Database['public']['Tables']['reports']['Insert'];
export type ReportUpdate = Database['public']['Tables']['reports']['Update'];

export type Profile = Database['public']['Tables']['profiles']['Row'];
export type ProfileInsert = Database['public']['Tables']['profiles']['Insert'];

export type ReportImage = Database['public']['Tables']['report_images']['Row'];
export type ReportImageInsert = Database['public']['Tables']['report_images']['Insert'];

export type CityStats = Database['public']['Tables']['city_stats']['Row'];
