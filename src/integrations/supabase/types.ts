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
      approval_stages: {
        Row: {
          approver_id: string | null
          approver_role: Database["public"]["Enums"]["app_role"]
          created_at: string
          deadline_hours: number | null
          department_id: string
          escalation_to: string | null
          id: string
          service_id: string | null
          stage_name: string
          stage_order: number
          stage_type: Database["public"]["Enums"]["approval_stage_type"]
        }
        Insert: {
          approver_id?: string | null
          approver_role?: Database["public"]["Enums"]["app_role"]
          created_at?: string
          deadline_hours?: number | null
          department_id: string
          escalation_to?: string | null
          id?: string
          service_id?: string | null
          stage_name: string
          stage_order?: number
          stage_type?: Database["public"]["Enums"]["approval_stage_type"]
        }
        Update: {
          approver_id?: string | null
          approver_role?: Database["public"]["Enums"]["app_role"]
          created_at?: string
          deadline_hours?: number | null
          department_id?: string
          escalation_to?: string | null
          id?: string
          service_id?: string | null
          stage_name?: string
          stage_order?: number
          stage_type?: Database["public"]["Enums"]["approval_stage_type"]
        }
        Relationships: [
          {
            foreignKeyName: "approval_stages_approver_id_fkey"
            columns: ["approver_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "approval_stages_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "approval_stages_escalation_to_fkey"
            columns: ["escalation_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "approval_stages_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string
          event_type: Database["public"]["Enums"]["ticket_event_type"] | null
          id: string
          new_value: string | null
          old_value: string | null
          payload: Json | null
          ticket_id: string
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string
          event_type?: Database["public"]["Enums"]["ticket_event_type"] | null
          id?: string
          new_value?: string | null
          old_value?: string | null
          payload?: Json | null
          ticket_id: string
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string
          event_type?: Database["public"]["Enums"]["ticket_event_type"] | null
          id?: string
          new_value?: string | null
          old_value?: string | null
          payload?: Json | null
          ticket_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      automation_logs: {
        Row: {
          actions_executed: Json | null
          created_at: string
          error_message: string | null
          id: string
          rule_id: string
          success: boolean
          ticket_id: string | null
          trigger_event: string
        }
        Insert: {
          actions_executed?: Json | null
          created_at?: string
          error_message?: string | null
          id?: string
          rule_id: string
          success?: boolean
          ticket_id?: string | null
          trigger_event: string
        }
        Update: {
          actions_executed?: Json | null
          created_at?: string
          error_message?: string | null
          id?: string
          rule_id?: string
          success?: boolean
          ticket_id?: string | null
          trigger_event?: string
        }
        Relationships: [
          {
            foreignKeyName: "automation_logs_rule_id_fkey"
            columns: ["rule_id"]
            isOneToOne: false
            referencedRelation: "automation_rules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "automation_logs_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      automation_rules: {
        Row: {
          actions: Json
          conditions: Json
          created_at: string
          created_by: string
          description: string | null
          execution_count: number
          id: string
          is_active: boolean
          last_executed_at: string | null
          name: string
          trigger_event: string
          updated_at: string
        }
        Insert: {
          actions?: Json
          conditions?: Json
          created_at?: string
          created_by: string
          description?: string | null
          execution_count?: number
          id?: string
          is_active?: boolean
          last_executed_at?: string | null
          name: string
          trigger_event: string
          updated_at?: string
        }
        Update: {
          actions?: Json
          conditions?: Json
          created_at?: string
          created_by?: string
          description?: string | null
          execution_count?: number
          id?: string
          is_active?: boolean
          last_executed_at?: string | null
          name?: string
          trigger_event?: string
          updated_at?: string
        }
        Relationships: []
      }
      canned_responses: {
        Row: {
          category: string
          content: string
          created_at: string
          created_by: string
          id: string
          is_shared: boolean
          shortcut: string | null
          title: string
          updated_at: string
        }
        Insert: {
          category?: string
          content: string
          created_at?: string
          created_by: string
          id?: string
          is_shared?: boolean
          shortcut?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          category?: string
          content?: string
          created_at?: string
          created_by?: string
          id?: string
          is_shared?: boolean
          shortcut?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "canned_responses_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      departments: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      developer_access: {
        Row: {
          created_at: string
          developer_id: string
          id: string
          service_id: string | null
          system_id: string | null
        }
        Insert: {
          created_at?: string
          developer_id: string
          id?: string
          service_id?: string | null
          system_id?: string | null
        }
        Update: {
          created_at?: string
          developer_id?: string
          id?: string
          service_id?: string | null
          system_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "developer_access_developer_id_fkey"
            columns: ["developer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "developer_access_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "developer_access_system_id_fkey"
            columns: ["system_id"]
            isOneToOne: false
            referencedRelation: "systems"
            referencedColumns: ["id"]
          },
        ]
      }
      devices: {
        Row: {
          created_at: string
          fcm_token: string
          id: string
          last_seen_at: string
          platform: string
          user_id: string
        }
        Insert: {
          created_at?: string
          fcm_token: string
          id?: string
          last_seen_at?: string
          platform: string
          user_id: string
        }
        Update: {
          created_at?: string
          fcm_token?: string
          id?: string
          last_seen_at?: string
          platform?: string
          user_id?: string
        }
        Relationships: []
      }
      integration_configs: {
        Row: {
          api_endpoint: string | null
          config: Json | null
          created_at: string
          description: string | null
          error_message: string | null
          id: string
          is_active: boolean
          last_sync_at: string | null
          module_code: string
          module_name: string
          sync_direction: string
          sync_status: string | null
          tickets_received: number
          tickets_synced_back: number
          updated_at: string
        }
        Insert: {
          api_endpoint?: string | null
          config?: Json | null
          created_at?: string
          description?: string | null
          error_message?: string | null
          id?: string
          is_active?: boolean
          last_sync_at?: string | null
          module_code: string
          module_name: string
          sync_direction?: string
          sync_status?: string | null
          tickets_received?: number
          tickets_synced_back?: number
          updated_at?: string
        }
        Update: {
          api_endpoint?: string | null
          config?: Json | null
          created_at?: string
          description?: string | null
          error_message?: string | null
          id?: string
          is_active?: boolean
          last_sync_at?: string | null
          module_code?: string
          module_name?: string
          sync_direction?: string
          sync_status?: string | null
          tickets_received?: number
          tickets_synced_back?: number
          updated_at?: string
        }
        Relationships: []
      }
      internal_kb_articles: {
        Row: {
          author_id: string
          category: string
          content: string
          created_at: string
          helpful_count: number
          id: string
          is_published: boolean
          service_id: string | null
          tags: string[] | null
          title: string
          updated_at: string
          views_count: number
        }
        Insert: {
          author_id: string
          category?: string
          content: string
          created_at?: string
          helpful_count?: number
          id?: string
          is_published?: boolean
          service_id?: string | null
          tags?: string[] | null
          title: string
          updated_at?: string
          views_count?: number
        }
        Update: {
          author_id?: string
          category?: string
          content?: string
          created_at?: string
          helpful_count?: number
          id?: string
          is_published?: boolean
          service_id?: string | null
          tags?: string[] | null
          title?: string
          updated_at?: string
          views_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "internal_kb_articles_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "internal_kb_articles_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      knowledge_base_articles: {
        Row: {
          author_id: string
          category: string
          content: string
          created_at: string
          helpful_count: number
          id: string
          is_published: boolean
          service_id: string | null
          tags: string[] | null
          title: string
          updated_at: string
          views_count: number
        }
        Insert: {
          author_id: string
          category?: string
          content: string
          created_at?: string
          helpful_count?: number
          id?: string
          is_published?: boolean
          service_id?: string | null
          tags?: string[] | null
          title: string
          updated_at?: string
          views_count?: number
        }
        Update: {
          author_id?: string
          category?: string
          content?: string
          created_at?: string
          helpful_count?: number
          id?: string
          is_published?: boolean
          service_id?: string | null
          tags?: string[] | null
          title?: string
          updated_at?: string
          views_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "knowledge_base_articles_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          data: Json | null
          id: string
          is_read: boolean
          message: string
          ticket_id: string | null
          title: string
          type: string | null
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          data?: Json | null
          id?: string
          is_read?: boolean
          message: string
          ticket_id?: string | null
          title: string
          type?: string | null
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          data?: Json | null
          id?: string
          is_read?: boolean
          message?: string
          ticket_id?: string | null
          title?: string
          type?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          city: string | null
          country: string | null
          created_at: string
          department_id: string | null
          email: string
          employee_number: string | null
          full_name: string
          hire_date: string | null
          id: string
          is_active: boolean
          job_title: string | null
          manager_id: string | null
          mobile: string | null
          notify_approval: boolean | null
          notify_comment_added: boolean | null
          notify_sla_breach: boolean | null
          notify_status_changed: boolean | null
          notify_ticket_assigned: boolean | null
          notify_ticket_created: boolean | null
          notify_weekly_report: boolean | null
          phone: string | null
          preferred_language: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          department_id?: string | null
          email?: string
          employee_number?: string | null
          full_name?: string
          hire_date?: string | null
          id: string
          is_active?: boolean
          job_title?: string | null
          manager_id?: string | null
          mobile?: string | null
          notify_approval?: boolean | null
          notify_comment_added?: boolean | null
          notify_sla_breach?: boolean | null
          notify_status_changed?: boolean | null
          notify_ticket_assigned?: boolean | null
          notify_ticket_created?: boolean | null
          notify_weekly_report?: boolean | null
          phone?: string | null
          preferred_language?: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          department_id?: string | null
          email?: string
          employee_number?: string | null
          full_name?: string
          hire_date?: string | null
          id?: string
          is_active?: boolean
          job_title?: string | null
          manager_id?: string | null
          mobile?: string | null
          notify_approval?: boolean | null
          notify_comment_added?: boolean | null
          notify_sla_breach?: boolean | null
          notify_status_changed?: boolean | null
          notify_ticket_assigned?: boolean | null
          notify_ticket_created?: boolean | null
          notify_weekly_report?: boolean | null
          phone?: string | null
          preferred_language?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_manager_id_fkey"
            columns: ["manager_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      service_categories: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          service_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          service_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          service_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_categories_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      service_fields: {
        Row: {
          created_at: string
          field_name: string
          field_type: string
          id: string
          is_required: boolean
          options: Json | null
          service_id: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          field_name: string
          field_type?: string
          id?: string
          is_required?: boolean
          options?: Json | null
          service_id: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          field_name?: string
          field_type?: string
          id?: string
          is_required?: boolean
          options?: Json | null
          service_id?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "service_fields_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      services: {
        Row: {
          created_at: string
          default_assignment_group: string | null
          description: string | null
          id: string
          is_active: boolean
          name: string
          sla_policy_id: string | null
          system_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          default_assignment_group?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          sla_policy_id?: string | null
          system_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          default_assignment_group?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          sla_policy_id?: string | null
          system_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "services_default_assignment_group_fkey"
            columns: ["default_assignment_group"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "services_sla_policy_id_fkey"
            columns: ["sla_policy_id"]
            isOneToOne: false
            referencedRelation: "sla_policies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "services_system_id_fkey"
            columns: ["system_id"]
            isOneToOne: false
            referencedRelation: "systems"
            referencedColumns: ["id"]
          },
        ]
      }
      sla_policies: {
        Row: {
          created_at: string
          first_response_minutes: number
          id: string
          priority: Database["public"]["Enums"]["ticket_priority"]
          resolution_minutes: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          first_response_minutes?: number
          id?: string
          priority: Database["public"]["Enums"]["ticket_priority"]
          resolution_minutes?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          first_response_minutes?: number
          id?: string
          priority?: Database["public"]["Enums"]["ticket_priority"]
          resolution_minutes?: number
          updated_at?: string
        }
        Relationships: []
      }
      system_settings: {
        Row: {
          created_at: string
          id: string
          key: string
          updated_at: string
          value: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          key: string
          updated_at?: string
          value?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          key?: string
          updated_at?: string
          value?: string | null
        }
        Relationships: []
      }
      systems: {
        Row: {
          code: string
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
        }
        Insert: {
          code: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
        }
        Update: {
          code?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
        }
        Relationships: []
      }
      tenant_members: {
        Row: {
          id: string
          joined_at: string
          role: string
          tenant_id: string
          user_id: string
        }
        Insert: {
          id?: string
          joined_at?: string
          role?: string
          tenant_id: string
          user_id: string
        }
        Update: {
          id?: string
          joined_at?: string
          role?: string
          tenant_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tenant_members_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenants: {
        Row: {
          accent_color: string | null
          created_at: string
          custom_domain: string | null
          favicon_url: string | null
          features: Json | null
          id: string
          is_active: boolean
          logo_url: string | null
          max_tickets_per_month: number | null
          max_users: number | null
          name: string
          owner_id: string
          plan: string
          primary_color: string | null
          slug: string
          updated_at: string
        }
        Insert: {
          accent_color?: string | null
          created_at?: string
          custom_domain?: string | null
          favicon_url?: string | null
          features?: Json | null
          id?: string
          is_active?: boolean
          logo_url?: string | null
          max_tickets_per_month?: number | null
          max_users?: number | null
          name: string
          owner_id: string
          plan?: string
          primary_color?: string | null
          slug: string
          updated_at?: string
        }
        Update: {
          accent_color?: string | null
          created_at?: string
          custom_domain?: string | null
          favicon_url?: string | null
          features?: Json | null
          id?: string
          is_active?: boolean
          logo_url?: string | null
          max_tickets_per_month?: number | null
          max_users?: number | null
          name?: string
          owner_id?: string
          plan?: string
          primary_color?: string | null
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      ticket_approvals: {
        Row: {
          approver_id: string | null
          created_at: string
          deadline_at: string | null
          decided_at: string | null
          delegated_at: string | null
          delegated_to: string | null
          id: string
          is_escalated: boolean | null
          notes: string | null
          stage_id: string
          status: Database["public"]["Enums"]["approval_status"]
          ticket_id: string
        }
        Insert: {
          approver_id?: string | null
          created_at?: string
          deadline_at?: string | null
          decided_at?: string | null
          delegated_at?: string | null
          delegated_to?: string | null
          id?: string
          is_escalated?: boolean | null
          notes?: string | null
          stage_id: string
          status?: Database["public"]["Enums"]["approval_status"]
          ticket_id: string
        }
        Update: {
          approver_id?: string | null
          created_at?: string
          deadline_at?: string | null
          decided_at?: string | null
          delegated_at?: string | null
          delegated_to?: string | null
          id?: string
          is_escalated?: boolean | null
          notes?: string | null
          stage_id?: string
          status?: Database["public"]["Enums"]["approval_status"]
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ticket_approvals_approver_id_fkey"
            columns: ["approver_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ticket_approvals_delegated_to_fkey"
            columns: ["delegated_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ticket_approvals_stage_id_fkey"
            columns: ["stage_id"]
            isOneToOne: false
            referencedRelation: "approval_stages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ticket_approvals_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      ticket_attachments: {
        Row: {
          created_at: string
          file_name: string
          file_size: number | null
          file_url: string
          id: string
          mime_type: string | null
          storage_key: string | null
          ticket_id: string
          uploaded_by: string
        }
        Insert: {
          created_at?: string
          file_name: string
          file_size?: number | null
          file_url: string
          id?: string
          mime_type?: string | null
          storage_key?: string | null
          ticket_id: string
          uploaded_by: string
        }
        Update: {
          created_at?: string
          file_name?: string
          file_size?: number | null
          file_url?: string
          id?: string
          mime_type?: string | null
          storage_key?: string | null
          ticket_id?: string
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "ticket_attachments_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      ticket_comments: {
        Row: {
          author_id: string
          content: string
          created_at: string
          id: string
          note_type: Database["public"]["Enums"]["note_type"]
          ticket_id: string
        }
        Insert: {
          author_id: string
          content: string
          created_at?: string
          id?: string
          note_type?: Database["public"]["Enums"]["note_type"]
          ticket_id: string
        }
        Update: {
          author_id?: string
          content?: string
          created_at?: string
          id?: string
          note_type?: Database["public"]["Enums"]["note_type"]
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ticket_comments_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ticket_comments_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      ticket_field_values: {
        Row: {
          created_at: string
          field_id: string
          id: string
          ticket_id: string
          value: string | null
        }
        Insert: {
          created_at?: string
          field_id: string
          id?: string
          ticket_id: string
          value?: string | null
        }
        Update: {
          created_at?: string
          field_id?: string
          id?: string
          ticket_id?: string
          value?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ticket_field_values_field_id_fkey"
            columns: ["field_id"]
            isOneToOne: false
            referencedRelation: "service_fields"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ticket_field_values_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      ticket_ratings: {
        Row: {
          created_at: string
          feedback: string | null
          id: string
          rating: number
          ticket_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          feedback?: string | null
          id?: string
          rating: number
          ticket_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          feedback?: string | null
          id?: string
          rating?: number
          ticket_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ticket_ratings_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: true
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      ticket_templates: {
        Row: {
          category_id: string | null
          created_at: string
          created_by: string
          description: string
          id: string
          is_shared: boolean
          name: string
          priority: Database["public"]["Enums"]["ticket_priority"]
          service_id: string | null
          system_id: string | null
          title: string
          updated_at: string
        }
        Insert: {
          category_id?: string | null
          created_at?: string
          created_by: string
          description?: string
          id?: string
          is_shared?: boolean
          name: string
          priority?: Database["public"]["Enums"]["ticket_priority"]
          service_id?: string | null
          system_id?: string | null
          title?: string
          updated_at?: string
        }
        Update: {
          category_id?: string | null
          created_at?: string
          created_by?: string
          description?: string
          id?: string
          is_shared?: boolean
          name?: string
          priority?: Database["public"]["Enums"]["ticket_priority"]
          service_id?: string | null
          system_id?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ticket_templates_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "service_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ticket_templates_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ticket_templates_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ticket_templates_system_id_fkey"
            columns: ["system_id"]
            isOneToOne: false
            referencedRelation: "systems"
            referencedColumns: ["id"]
          },
        ]
      }
      ticket_time_entries: {
        Row: {
          created_at: string
          description: string | null
          duration_minutes: number
          ended_at: string | null
          id: string
          is_running: boolean
          started_at: string | null
          ticket_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          duration_minutes?: number
          ended_at?: string | null
          id?: string
          is_running?: boolean
          started_at?: string | null
          ticket_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          duration_minutes?: number
          ended_at?: string | null
          id?: string
          is_running?: boolean
          started_at?: string | null
          ticket_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ticket_time_entries_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ticket_time_entries_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      tickets: {
        Row: {
          assigned_agent_id: string | null
          category_id: string | null
          closed_at: string | null
          code: string | null
          created_at: string
          department_id: string | null
          description: string
          external_payload: Json | null
          external_reference: string | null
          first_response_at: string | null
          id: string
          last_activity_at: string
          priority: Database["public"]["Enums"]["ticket_priority"]
          requester_id: string
          resolution_summary: string | null
          resolved_at: string | null
          service_id: string | null
          sla_first_response_due_at: string | null
          sla_resolution_due_at: string | null
          source_system: Database["public"]["Enums"]["source_system"]
          status: Database["public"]["Enums"]["ticket_status"]
          ticket_number: number
          title: string
          updated_at: string
        }
        Insert: {
          assigned_agent_id?: string | null
          category_id?: string | null
          closed_at?: string | null
          code?: string | null
          created_at?: string
          department_id?: string | null
          description: string
          external_payload?: Json | null
          external_reference?: string | null
          first_response_at?: string | null
          id?: string
          last_activity_at?: string
          priority?: Database["public"]["Enums"]["ticket_priority"]
          requester_id: string
          resolution_summary?: string | null
          resolved_at?: string | null
          service_id?: string | null
          sla_first_response_due_at?: string | null
          sla_resolution_due_at?: string | null
          source_system?: Database["public"]["Enums"]["source_system"]
          status?: Database["public"]["Enums"]["ticket_status"]
          ticket_number?: number
          title: string
          updated_at?: string
        }
        Update: {
          assigned_agent_id?: string | null
          category_id?: string | null
          closed_at?: string | null
          code?: string | null
          created_at?: string
          department_id?: string | null
          description?: string
          external_payload?: Json | null
          external_reference?: string | null
          first_response_at?: string | null
          id?: string
          last_activity_at?: string
          priority?: Database["public"]["Enums"]["ticket_priority"]
          requester_id?: string
          resolution_summary?: string | null
          resolved_at?: string | null
          service_id?: string | null
          sla_first_response_due_at?: string | null
          sla_resolution_due_at?: string | null
          source_system?: Database["public"]["Enums"]["source_system"]
          status?: Database["public"]["Enums"]["ticket_status"]
          ticket_number?: number
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tickets_assigned_agent_id_fkey"
            columns: ["assigned_agent_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "service_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_requester_id_fkey"
            columns: ["requester_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      webhook_endpoints: {
        Row: {
          created_at: string
          created_by: string
          events: string[]
          failure_count: number
          headers: Json | null
          id: string
          is_active: boolean
          last_triggered_at: string | null
          name: string
          secret: string | null
          updated_at: string
          url: string
        }
        Insert: {
          created_at?: string
          created_by: string
          events?: string[]
          failure_count?: number
          headers?: Json | null
          id?: string
          is_active?: boolean
          last_triggered_at?: string | null
          name: string
          secret?: string | null
          updated_at?: string
          url: string
        }
        Update: {
          created_at?: string
          created_by?: string
          events?: string[]
          failure_count?: number
          headers?: Json | null
          id?: string
          is_active?: boolean
          last_triggered_at?: string | null
          name?: string
          secret?: string | null
          updated_at?: string
          url?: string
        }
        Relationships: []
      }
      webhook_logs: {
        Row: {
          created_at: string
          event_type: string
          id: string
          payload: Json | null
          response_body: string | null
          response_status: number | null
          success: boolean
          webhook_id: string
        }
        Insert: {
          created_at?: string
          event_type: string
          id?: string
          payload?: Json | null
          response_body?: string | null
          response_status?: number | null
          success?: boolean
          webhook_id: string
        }
        Update: {
          created_at?: string
          event_type?: string
          id?: string
          payload?: Json | null
          response_body?: string | null
          response_status?: number | null
          success?: boolean
          webhook_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "webhook_logs_webhook_id_fkey"
            columns: ["webhook_id"]
            isOneToOne: false
            referencedRelation: "webhook_endpoints"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_messages: {
        Row: {
          body: string | null
          created_at: string
          direction: string
          from_number: string
          id: string
          media_url: string | null
          status: string | null
          ticket_id: string | null
          to_number: string
          twilio_sid: string | null
        }
        Insert: {
          body?: string | null
          created_at?: string
          direction: string
          from_number: string
          id?: string
          media_url?: string | null
          status?: string | null
          ticket_id?: string | null
          to_number: string
          twilio_sid?: string | null
        }
        Update: {
          body?: string | null
          created_at?: string
          direction?: string
          from_number?: string
          id?: string
          media_url?: string | null
          status?: string | null
          ticket_id?: string | null
          to_number?: string
          twilio_sid?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_messages_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      backfill_ticket_approvals: {
        Args: { _ticket_id: string }
        Returns: {
          inserted_count: number
          matched_stages: number
        }[]
      }
      decrement_helpful: { Args: { article_id: string }; Returns: undefined }
      developer_can_access_ticket: {
        Args: { _developer_id: string; _ticket_id: string }
        Returns: boolean
      }
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
      increment_helpful: { Args: { article_id: string }; Returns: undefined }
      increment_views: { Args: { article_id: string }; Returns: undefined }
      send_email_notification_via_edge: {
        Args: {
          _details?: string
          _event_type: string
          _recipient_email: string
          _recipient_name: string
          _ticket_id: string
          _ticket_number: number
          _ticket_title: string
        }
        Returns: undefined
      }
      services_without_approval_coverage: {
        Args: never
        Returns: {
          active_tickets_count: number
          service_id: string
          service_name: string
          system_name: string
        }[]
      }
      tickets_missing_approvals: {
        Args: never
        Returns: {
          expected_stages_count: number
          service_name: string
          ticket_id: string
          ticket_number: number
          ticket_title: string
        }[]
      }
    }
    Enums: {
      app_role: "admin" | "agent" | "requester" | "developer"
      approval_stage_type: "sequential" | "parallel"
      approval_status: "pending" | "approved" | "rejected"
      note_type: "public" | "private"
      source_system:
        | "PORTAL"
        | "ERP"
        | "LMS"
        | "CPAY"
        | "SIS"
        | "EDUMALLS"
        | "SMART_SCHOOL"
        | "DASHBOARD"
        | "HR"
      ticket_event_type:
        | "status_changed"
        | "assigned"
        | "priority_changed"
        | "department_changed"
        | "comment_added"
        | "attachment_added"
        | "created"
        | "resolved"
        | "closed"
        | "reopened"
      ticket_priority: "low" | "medium" | "high" | "urgent"
      ticket_status:
        | "new"
        | "open"
        | "in_progress"
        | "waiting_on_customer"
        | "resolved"
        | "closed"
        | "reopened"
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
      app_role: ["admin", "agent", "requester", "developer"],
      approval_stage_type: ["sequential", "parallel"],
      approval_status: ["pending", "approved", "rejected"],
      note_type: ["public", "private"],
      source_system: [
        "PORTAL",
        "ERP",
        "LMS",
        "CPAY",
        "SIS",
        "EDUMALLS",
        "SMART_SCHOOL",
        "DASHBOARD",
        "HR",
      ],
      ticket_event_type: [
        "status_changed",
        "assigned",
        "priority_changed",
        "department_changed",
        "comment_added",
        "attachment_added",
        "created",
        "resolved",
        "closed",
        "reopened",
      ],
      ticket_priority: ["low", "medium", "high", "urgent"],
      ticket_status: [
        "new",
        "open",
        "in_progress",
        "waiting_on_customer",
        "resolved",
        "closed",
        "reopened",
      ],
    },
  },
} as const
