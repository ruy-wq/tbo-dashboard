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
      academy_courses: {
        Row: {
          category: string | null
          created_at: string
          description: Json | null
          id: string
          instructor: string | null
          level: string | null
          slug: string
          sort_order: number
          status: string
          tags: string[] | null
          thumbnail_url: string | null
          title: string
          total_modules: number
          updated_at: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          description?: Json | null
          id?: string
          instructor?: string | null
          level?: string | null
          slug: string
          sort_order?: number
          status?: string
          tags?: string[] | null
          thumbnail_url?: string | null
          title: string
          total_modules?: number
          updated_at?: string
        }
        Update: {
          category?: string | null
          created_at?: string
          description?: Json | null
          id?: string
          instructor?: string | null
          level?: string | null
          slug?: string
          sort_order?: number
          status?: string
          tags?: string[] | null
          thumbnail_url?: string | null
          title?: string
          total_modules?: number
          updated_at?: string
        }
        Relationships: []
      }
      academy_faq_items: {
        Row: {
          answer: string
          category: string
          created_at: string
          id: string
          is_published: boolean
          question: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          answer: string
          category?: string
          created_at?: string
          id?: string
          is_published?: boolean
          question: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          answer?: string
          category?: string
          created_at?: string
          id?: string
          is_published?: boolean
          question?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      academy_feed_likes: {
        Row: {
          created_at: string
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "academy_feed_likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "academy_feed_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      academy_feed_posts: {
        Row: {
          comments_count: number
          content: string
          created_at: string
          detail: string | null
          id: string
          likes_count: number
          metadata: Json | null
          type: string
          user_id: string
        }
        Insert: {
          comments_count?: number
          content: string
          created_at?: string
          detail?: string | null
          id?: string
          likes_count?: number
          metadata?: Json | null
          type: string
          user_id: string
        }
        Update: {
          comments_count?: number
          content?: string
          created_at?: string
          detail?: string | null
          id?: string
          likes_count?: number
          metadata?: Json | null
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      academy_forum_replies: {
        Row: {
          author_id: string
          body: string
          created_at: string
          id: string
          likes_count: number
          topic_id: string
        }
        Insert: {
          author_id: string
          body: string
          created_at?: string
          id?: string
          likes_count?: number
          topic_id: string
        }
        Update: {
          author_id?: string
          body?: string
          created_at?: string
          id?: string
          likes_count?: number
          topic_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "academy_forum_replies_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "academy_forum_topics"
            referencedColumns: ["id"]
          },
        ]
      }
      academy_forum_topics: {
        Row: {
          author_id: string
          body: string | null
          category: string
          created_at: string
          id: string
          is_hot: boolean
          is_pinned: boolean
          last_activity_at: string
          likes_count: number
          replies_count: number
          title: string
          updated_at: string
          views_count: number
        }
        Insert: {
          author_id: string
          body?: string | null
          category?: string
          created_at?: string
          id?: string
          is_hot?: boolean
          is_pinned?: boolean
          last_activity_at?: string
          likes_count?: number
          replies_count?: number
          title: string
          updated_at?: string
          views_count?: number
        }
        Update: {
          author_id?: string
          body?: string | null
          category?: string
          created_at?: string
          id?: string
          is_hot?: boolean
          is_pinned?: boolean
          last_activity_at?: string
          likes_count?: number
          replies_count?: number
          title?: string
          updated_at?: string
          views_count?: number
        }
        Relationships: []
      }
      academy_lessons: {
        Row: {
          created_at: string
          description: Json | null
          id: string
          is_free: boolean
          module_id: string
          sort_order: number
          status: string
          title: string
          updated_at: string
          video_duration_sec: number | null
          video_url: string | null
        }
        Insert: {
          created_at?: string
          description?: Json | null
          id?: string
          is_free?: boolean
          module_id: string
          sort_order?: number
          status?: string
          title: string
          updated_at?: string
          video_duration_sec?: number | null
          video_url?: string | null
        }
        Update: {
          created_at?: string
          description?: Json | null
          id?: string
          is_free?: boolean
          module_id?: string
          sort_order?: number
          status?: string
          title?: string
          updated_at?: string
          video_duration_sec?: number | null
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "academy_lessons_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "academy_modules"
            referencedColumns: ["id"]
          },
        ]
      }
      academy_live_class_registrations: {
        Row: {
          class_id: string
          id: string
          registered_at: string
          user_id: string
        }
        Insert: {
          class_id: string
          id?: string
          registered_at?: string
          user_id: string
        }
        Update: {
          class_id?: string
          id?: string
          registered_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "academy_live_class_registrations_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "academy_live_classes"
            referencedColumns: ["id"]
          },
        ]
      }
      academy_live_classes: {
        Row: {
          category: string
          created_at: string
          description: string | null
          duration_minutes: number
          id: string
          instructor_id: string | null
          instructor_name: string
          instructor_role: string | null
          max_attendees: number
          meeting_url: string | null
          recording_url: string | null
          scheduled_at: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          category?: string
          created_at?: string
          description?: string | null
          duration_minutes?: number
          id?: string
          instructor_id?: string | null
          instructor_name: string
          instructor_role?: string | null
          max_attendees?: number
          meeting_url?: string | null
          recording_url?: string | null
          scheduled_at: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          duration_minutes?: number
          id?: string
          instructor_id?: string | null
          instructor_name?: string
          instructor_role?: string | null
          max_attendees?: number
          meeting_url?: string | null
          recording_url?: string | null
          scheduled_at?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      academy_modules: {
        Row: {
          course_id: string
          created_at: string
          description: Json | null
          id: string
          sort_order: number
          title: string
          updated_at: string
        }
        Insert: {
          course_id: string
          created_at?: string
          description?: Json | null
          id?: string
          sort_order?: number
          title: string
          updated_at?: string
        }
        Update: {
          course_id?: string
          created_at?: string
          description?: Json | null
          id?: string
          sort_order?: number
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "academy_modules_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "academy_courses"
            referencedColumns: ["id"]
          },
        ]
      }
      academy_pdi_actions: {
        Row: {
          action: string
          completed: boolean
          created_at: string
          deadline: string | null
          id: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          action: string
          completed?: boolean
          created_at?: string
          deadline?: string | null
          id?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          action?: string
          completed?: boolean
          created_at?: string
          deadline?: string | null
          id?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      academy_pdi_skills: {
        Row: {
          created_at: string
          current_level: number
          id: string
          name: string
          target_level: number
          timeframe: string | null
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_level?: number
          id?: string
          name: string
          target_level?: number
          timeframe?: string | null
          type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_level?: number
          id?: string
          name?: string
          target_level?: number
          timeframe?: string | null
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      academy_resources: {
        Row: {
          category: string
          created_at: string
          description: string | null
          downloads_count: number
          external_url: string | null
          file_url: string | null
          id: string
          is_featured: boolean
          status: string
          thumbnail_url: string | null
          title: string
          type: string
          updated_at: string
        }
        Insert: {
          category?: string
          created_at?: string
          description?: string | null
          downloads_count?: number
          external_url?: string | null
          file_url?: string | null
          id?: string
          is_featured?: boolean
          status?: string
          thumbnail_url?: string | null
          title: string
          type: string
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          downloads_count?: number
          external_url?: string | null
          file_url?: string | null
          id?: string
          is_featured?: boolean
          status?: string
          thumbnail_url?: string | null
          title?: string
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      academy_support_tickets: {
        Row: {
          body: string
          category: string
          created_at: string
          id: string
          status: string
          subject: string
          updated_at: string
          user_id: string
        }
        Insert: {
          body: string
          category?: string
          created_at?: string
          id?: string
          status?: string
          subject: string
          updated_at?: string
          user_id: string
        }
        Update: {
          body?: string
          category?: string
          created_at?: string
          id?: string
          status?: string
          subject?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      agent_insights: {
        Row: {
          agent_name: string
          category: string | null
          confidence: number | null
          created_at: string | null
          description: string
          id: string
          insight_type: string | null
          is_active: boolean | null
          source_bu: string | null
          source_cluster: string | null
          times_applied: number | null
          times_successful: number | null
          title: string
        }
        Insert: {
          agent_name: string
          category?: string | null
          confidence?: number | null
          created_at?: string | null
          description: string
          id?: string
          insight_type?: string | null
          is_active?: boolean | null
          source_bu?: string | null
          source_cluster?: string | null
          times_applied?: number | null
          times_successful?: number | null
          title: string
        }
        Update: {
          agent_name?: string
          category?: string | null
          confidence?: number | null
          created_at?: string | null
          description?: string
          id?: string
          insight_type?: string | null
          is_active?: boolean | null
          source_bu?: string | null
          source_cluster?: string | null
          times_applied?: number | null
          times_successful?: number | null
          title?: string
        }
        Relationships: []
      }
      ai_chats: {
        Row: {
          context: string
          created_at: string
          id: string
          messages: Json
          metadata: Json | null
          tenant_id: string
          title: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          context?: string
          created_at?: string
          id?: string
          messages?: Json
          metadata?: Json | null
          tenant_id: string
          title?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          context?: string
          created_at?: string
          id?: string
          messages?: Json
          metadata?: Json | null
          tenant_id?: string
          title?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_chats_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      asset_scan_log: {
        Row: {
          batch_id: string
          completed_at: string | null
          created_at: string | null
          error_message: string | null
          folder_path: string
          id: string
          images_analyzed: number | null
          images_found: number | null
          images_hosted: number | null
          project_name: string | null
          started_at: string | null
          status: string
        }
        Insert: {
          batch_id: string
          completed_at?: string | null
          created_at?: string | null
          error_message?: string | null
          folder_path: string
          id?: string
          images_analyzed?: number | null
          images_found?: number | null
          images_hosted?: number | null
          project_name?: string | null
          started_at?: string | null
          status: string
        }
        Update: {
          batch_id?: string
          completed_at?: string | null
          created_at?: string | null
          error_message?: string | null
          folder_path?: string
          id?: string
          images_analyzed?: number | null
          images_found?: number | null
          images_hosted?: number | null
          project_name?: string | null
          started_at?: string | null
          status?: string
        }
        Relationships: []
      }
      audit_log: {
        Row: {
          action: string
          created_at: string | null
          details: Json | null
          entity_id: string
          entity_name: string | null
          entity_type: string
          from_state: string | null
          id: string
          metadata: Json | null
          reason: string | null
          tenant_id: string | null
          to_state: string | null
          user_id: string | null
          user_name: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          details?: Json | null
          entity_id: string
          entity_name?: string | null
          entity_type: string
          from_state?: string | null
          id?: string
          metadata?: Json | null
          reason?: string | null
          tenant_id?: string | null
          to_state?: string | null
          user_id?: string | null
          user_name?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          details?: Json | null
          entity_id?: string
          entity_name?: string | null
          entity_type?: string
          from_state?: string | null
          id?: string
          metadata?: Json | null
          reason?: string | null
          tenant_id?: string | null
          to_state?: string | null
          user_id?: string | null
          user_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_log_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_log_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "active_team"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_log_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string | null
          details: Json | null
          entity_id: string | null
          entity_type: string | null
          id: string
          ip_address: string | null
          metadata: Json | null
          resource_id: string | null
          resource_type: string | null
          tenant_id: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          details?: Json | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          resource_id?: string | null
          resource_type?: string | null
          tenant_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          details?: Json | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          resource_id?: string | null
          resource_type?: string | null
          tenant_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      bank_imports: {
        Row: {
          account_number: string | null
          bank_name: string | null
          created_at: string | null
          filename: string
          format: string
          id: string
          imported_by: string | null
          matched_count: number | null
          period_end: string | null
          period_start: string | null
          status: string | null
          tenant_id: string
          transaction_count: number | null
        }
        Insert: {
          account_number?: string | null
          bank_name?: string | null
          created_at?: string | null
          filename: string
          format: string
          id?: string
          imported_by?: string | null
          matched_count?: number | null
          period_end?: string | null
          period_start?: string | null
          status?: string | null
          tenant_id: string
          transaction_count?: number | null
        }
        Update: {
          account_number?: string | null
          bank_name?: string | null
          created_at?: string | null
          filename?: string
          format?: string
          id?: string
          imported_by?: string | null
          matched_count?: number | null
          period_end?: string | null
          period_start?: string | null
          status?: string | null
          tenant_id?: string
          transaction_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "bank_imports_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      bank_transactions: {
        Row: {
          amount: number
          balance: number | null
          created_at: string | null
          date: string
          description: string | null
          fitid: string | null
          id: string
          import_id: string
          match_status: string | null
          matched_transaction_id: string | null
          memo: string | null
          tenant_id: string
          type: string | null
        }
        Insert: {
          amount: number
          balance?: number | null
          created_at?: string | null
          date: string
          description?: string | null
          fitid?: string | null
          id?: string
          import_id: string
          match_status?: string | null
          matched_transaction_id?: string | null
          memo?: string | null
          tenant_id: string
          type?: string | null
        }
        Update: {
          amount?: number
          balance?: number | null
          created_at?: string | null
          date?: string
          description?: string | null
          fitid?: string | null
          id?: string
          import_id?: string
          match_status?: string | null
          matched_transaction_id?: string | null
          memo?: string | null
          tenant_id?: string
          type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bank_transactions_import_id_fkey"
            columns: ["import_id"]
            isOneToOne: false
            referencedRelation: "bank_imports"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bank_transactions_matched_transaction_id_fkey"
            columns: ["matched_transaction_id"]
            isOneToOne: false
            referencedRelation: "fin_transactions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bank_transactions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      bi_dashboards: {
        Row: {
          created_at: string
          created_by: string
          description: string | null
          filters: Json
          id: string
          is_default: boolean
          is_shared: boolean
          layout: Json
          name: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          description?: string | null
          filters?: Json
          id?: string
          is_default?: boolean
          is_shared?: boolean
          layout?: Json
          name: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string | null
          filters?: Json
          id?: string
          is_default?: boolean
          is_shared?: boolean
          layout?: Json
          name?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bi_dashboards_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "active_team"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bi_dashboards_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bi_dashboards_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      bi_widgets: {
        Row: {
          created_at: string
          dashboard_id: string
          data_source: string
          display_config: Json
          height: number
          id: string
          position_x: number
          position_y: number
          query_config: Json
          sort_order: number
          tenant_id: string
          title: string
          updated_at: string
          widget_type: string
          width: number
        }
        Insert: {
          created_at?: string
          dashboard_id: string
          data_source: string
          display_config?: Json
          height?: number
          id?: string
          position_x?: number
          position_y?: number
          query_config?: Json
          sort_order?: number
          tenant_id: string
          title: string
          updated_at?: string
          widget_type: string
          width?: number
        }
        Update: {
          created_at?: string
          dashboard_id?: string
          data_source?: string
          display_config?: Json
          height?: number
          id?: string
          position_x?: number
          position_y?: number
          query_config?: Json
          sort_order?: number
          tenant_id?: string
          title?: string
          updated_at?: string
          widget_type?: string
          width?: number
        }
        Relationships: [
          {
            foreignKeyName: "bi_widgets_dashboard_id_fkey"
            columns: ["dashboard_id"]
            isOneToOne: false
            referencedRelation: "bi_dashboards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bi_widgets_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      block_links: {
        Row: {
          block_id: string
          created_at: string | null
          id: string
          slug: string
          tenant_id: string
        }
        Insert: {
          block_id: string
          created_at?: string | null
          id?: string
          slug: string
          tenant_id: string
        }
        Update: {
          block_id?: string
          created_at?: string | null
          id?: string
          slug?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "block_links_block_id_fkey"
            columns: ["block_id"]
            isOneToOne: false
            referencedRelation: "page_blocks"
            referencedColumns: ["id"]
          },
        ]
      }
      blog_posts: {
        Row: {
          author_id: string | null
          body: string
          cover_url: string | null
          created_at: string
          excerpt: string | null
          id: string
          published_at: string | null
          slug: string
          status: Database["public"]["Enums"]["blog_post_status"]
          tags: string[]
          tenant_id: string
          title: string
          updated_at: string
        }
        Insert: {
          author_id?: string | null
          body?: string
          cover_url?: string | null
          created_at?: string
          excerpt?: string | null
          id?: string
          published_at?: string | null
          slug: string
          status?: Database["public"]["Enums"]["blog_post_status"]
          tags?: string[]
          tenant_id: string
          title: string
          updated_at?: string
        }
        Update: {
          author_id?: string | null
          body?: string
          cover_url?: string | null
          created_at?: string
          excerpt?: string | null
          id?: string
          published_at?: string | null
          slug?: string
          status?: Database["public"]["Enums"]["blog_post_status"]
          tags?: string[]
          tenant_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "blog_posts_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "active_team"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blog_posts_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blog_posts_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      blueprint_leads: {
        Row: {
          created_at: string | null
          email: string
          id: string
          name: string | null
          source: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          id?: string
          name?: string | null
          source?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
          name?: string | null
          source?: string | null
        }
        Relationships: []
      }
      brand_assets: {
        Row: {
          asset_type: string | null
          asset_url: string
          client: string | null
          created_at: string | null
          description: string | null
          drive_path: string | null
          id: string
          is_portfolio: boolean | null
          project_name: string
          quality_score: number | null
        }
        Insert: {
          asset_type?: string | null
          asset_url: string
          client?: string | null
          created_at?: string | null
          description?: string | null
          drive_path?: string | null
          id?: string
          is_portfolio?: boolean | null
          project_name: string
          quality_score?: number | null
        }
        Update: {
          asset_type?: string | null
          asset_url?: string
          client?: string | null
          created_at?: string | null
          description?: string | null
          drive_path?: string | null
          id?: string
          is_portfolio?: boolean | null
          project_name?: string
          quality_score?: number | null
        }
        Relationships: []
      }
      bu_costs: {
        Row: {
          bu: string
          capacity_hours_monthly: number
          id: string
          note: string | null
          tenant_id: string
          total_cost_monthly: number
          updated_at: string
        }
        Insert: {
          bu: string
          capacity_hours_monthly?: number
          id?: string
          note?: string | null
          tenant_id: string
          total_cost_monthly?: number
          updated_at?: string
        }
        Update: {
          bu?: string
          capacity_hours_monthly?: number
          id?: string
          note?: string | null
          tenant_id?: string
          total_cost_monthly?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bu_costs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      business_config: {
        Row: {
          id: string
          key: string
          tenant_id: string | null
          updated_at: string | null
          updated_by: string | null
          value: Json
        }
        Insert: {
          id?: string
          key: string
          tenant_id?: string | null
          updated_at?: string | null
          updated_by?: string | null
          value?: Json
        }
        Update: {
          id?: string
          key?: string
          tenant_id?: string | null
          updated_at?: string | null
          updated_by?: string | null
          value?: Json
        }
        Relationships: [
          {
            foreignKeyName: "business_config_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      calendar_events: {
        Row: {
          created_at: string
          description: string | null
          end_at: string | null
          google_event_id: string | null
          id: string
          is_all_day: boolean
          location: string | null
          organizer: string | null
          source: string | null
          start_at: string
          tenant_id: string
          title: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          end_at?: string | null
          google_event_id?: string | null
          id?: string
          is_all_day?: boolean
          location?: string | null
          organizer?: string | null
          source?: string | null
          start_at?: string
          tenant_id: string
          title?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          end_at?: string | null
          google_event_id?: string | null
          id?: string
          is_all_day?: boolean
          location?: string | null
          organizer?: string | null
          source?: string | null
          start_at?: string
          tenant_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "calendar_events_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      career_level_competencies: {
        Row: {
          competency_key: string
          competency_name: string
          competency_type: string
          created_at: string
          description: string | null
          expected_score: number
          id: string
          level_id: string
        }
        Insert: {
          competency_key: string
          competency_name: string
          competency_type: string
          created_at?: string
          description?: string | null
          expected_score: number
          id?: string
          level_id: string
        }
        Update: {
          competency_key?: string
          competency_name?: string
          competency_type?: string
          created_at?: string
          description?: string | null
          expected_score?: number
          id?: string
          level_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "career_level_competencies_level_id_fkey"
            columns: ["level_id"]
            isOneToOne: false
            referencedRelation: "career_levels"
            referencedColumns: ["id"]
          },
        ]
      }
      career_levels: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_transition_point: boolean
          name: string
          order_index: number
          slug: string
          track_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_transition_point?: boolean
          name: string
          order_index?: number
          slug: string
          track_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_transition_point?: boolean
          name?: string
          order_index?: number
          slug?: string
          track_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "career_levels_track_id_fkey"
            columns: ["track_id"]
            isOneToOne: false
            referencedRelation: "career_tracks"
            referencedColumns: ["id"]
          },
        ]
      }
      career_paths: {
        Row: {
          created_at: string
          description: string | null
          icon: string | null
          id: string
          name: string
          nucleo: string
          order_index: number
          tenant_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          name: string
          nucleo: string
          order_index?: number
          tenant_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          name?: string
          nucleo?: string
          order_index?: number
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "career_paths_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      career_progressions: {
        Row: {
          created_at: string
          from_level_id: string | null
          id: string
          notes: string | null
          profile_id: string
          promoted_at: string
          promoted_by: string | null
          tenant_id: string
          to_level_id: string
        }
        Insert: {
          created_at?: string
          from_level_id?: string | null
          id?: string
          notes?: string | null
          profile_id: string
          promoted_at?: string
          promoted_by?: string | null
          tenant_id: string
          to_level_id: string
        }
        Update: {
          created_at?: string
          from_level_id?: string | null
          id?: string
          notes?: string | null
          profile_id?: string
          promoted_at?: string
          promoted_by?: string | null
          tenant_id?: string
          to_level_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "career_progressions_from_level_id_fkey"
            columns: ["from_level_id"]
            isOneToOne: false
            referencedRelation: "career_levels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "career_progressions_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "active_team"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "career_progressions_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "career_progressions_promoted_by_fkey"
            columns: ["promoted_by"]
            isOneToOne: false
            referencedRelation: "active_team"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "career_progressions_promoted_by_fkey"
            columns: ["promoted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "career_progressions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "career_progressions_to_level_id_fkey"
            columns: ["to_level_id"]
            isOneToOne: false
            referencedRelation: "career_levels"
            referencedColumns: ["id"]
          },
        ]
      }
      career_tracks: {
        Row: {
          created_at: string
          id: string
          name: string
          order_index: number
          path_id: string
          track_type: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          order_index?: number
          path_id: string
          track_type: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          order_index?: number
          path_id?: string
          track_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "career_tracks_path_id_fkey"
            columns: ["path_id"]
            isOneToOne: false
            referencedRelation: "career_paths"
            referencedColumns: ["id"]
          },
        ]
      }
      changelog_entries: {
        Row: {
          author: string | null
          created_at: string | null
          description: string
          id: string
          module: string | null
          published_at: string
          tag: string | null
          title: string
          version: string
        }
        Insert: {
          author?: string | null
          created_at?: string | null
          description: string
          id?: string
          module?: string | null
          published_at: string
          tag?: string | null
          title: string
          version: string
        }
        Update: {
          author?: string | null
          created_at?: string | null
          description?: string
          id?: string
          module?: string | null
          published_at?: string
          tag?: string | null
          title?: string
          version?: string
        }
        Relationships: []
      }
      chat_attachments: {
        Row: {
          created_at: string | null
          file_name: string
          file_size: number | null
          file_type: string
          file_url: string
          id: string
          message_id: string
          thumbnail_url: string | null
        }
        Insert: {
          created_at?: string | null
          file_name: string
          file_size?: number | null
          file_type: string
          file_url: string
          id?: string
          message_id: string
          thumbnail_url?: string | null
        }
        Update: {
          created_at?: string | null
          file_name?: string
          file_size?: number | null
          file_type?: string
          file_url?: string
          id?: string
          message_id?: string
          thumbnail_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chat_attachments_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "chat_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_bookmarks: {
        Row: {
          created_at: string | null
          id: string
          message_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          message_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          message_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_bookmarks_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "chat_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_channel_favorites: {
        Row: {
          channel_id: string
          created_at: string
          user_id: string
        }
        Insert: {
          channel_id: string
          created_at?: string
          user_id: string
        }
        Update: {
          channel_id?: string
          created_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_channel_favorites_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "chat_channels"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_channel_members: {
        Row: {
          channel_id: string
          invited_by: string | null
          joined_at: string | null
          last_read_at: string | null
          role: string | null
          user_id: string
        }
        Insert: {
          channel_id: string
          invited_by?: string | null
          joined_at?: string | null
          last_read_at?: string | null
          role?: string | null
          user_id: string
        }
        Update: {
          channel_id?: string
          invited_by?: string | null
          joined_at?: string | null
          last_read_at?: string | null
          role?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_channel_members_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "chat_channels"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_channel_sections: {
        Row: {
          created_at: string | null
          created_by: string | null
          id: string
          is_collapsed: boolean | null
          name: string
          sort_order: number | null
          tenant_id: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_collapsed?: boolean | null
          name: string
          sort_order?: number | null
          tenant_id: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_collapsed?: boolean | null
          name?: string
          sort_order?: number | null
          tenant_id?: string
        }
        Relationships: []
      }
      chat_channels: {
        Row: {
          auto_archive_days: number
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          is_archived: boolean | null
          last_activity_at: string | null
          max_file_size_mb: number | null
          name: string
          section_id: string | null
          settings: Json | null
          tenant_id: string
          type: string | null
          welcome_message: string | null
        }
        Insert: {
          auto_archive_days?: number
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_archived?: boolean | null
          last_activity_at?: string | null
          max_file_size_mb?: number | null
          name: string
          section_id?: string | null
          settings?: Json | null
          tenant_id: string
          type?: string | null
          welcome_message?: string | null
        }
        Update: {
          auto_archive_days?: number
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_archived?: boolean | null
          last_activity_at?: string | null
          max_file_size_mb?: number | null
          name?: string
          section_id?: string | null
          settings?: Json | null
          tenant_id?: string
          type?: string | null
          welcome_message?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chat_channels_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "chat_channel_sections"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_message_history: {
        Row: {
          content: string
          edited_at: string
          edited_by: string | null
          id: string
          message_id: string
        }
        Insert: {
          content: string
          edited_at?: string
          edited_by?: string | null
          id?: string
          message_id: string
        }
        Update: {
          content?: string
          edited_at?: string
          edited_by?: string | null
          id?: string
          message_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_message_history_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "chat_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_messages: {
        Row: {
          channel_id: string
          content: string
          created_at: string | null
          deleted_at: string | null
          edited_at: string | null
          id: string
          is_pinned: boolean | null
          message_type: string | null
          metadata: Json | null
          reply_to: string | null
          scheduled_at: string | null
          sender_id: string
        }
        Insert: {
          channel_id: string
          content: string
          created_at?: string | null
          deleted_at?: string | null
          edited_at?: string | null
          id?: string
          is_pinned?: boolean | null
          message_type?: string | null
          metadata?: Json | null
          reply_to?: string | null
          scheduled_at?: string | null
          sender_id: string
        }
        Update: {
          channel_id?: string
          content?: string
          created_at?: string | null
          deleted_at?: string | null
          edited_at?: string | null
          id?: string
          is_pinned?: boolean | null
          message_type?: string | null
          metadata?: Json | null
          reply_to?: string | null
          scheduled_at?: string | null
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "chat_channels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_messages_reply_to_fkey"
            columns: ["reply_to"]
            isOneToOne: false
            referencedRelation: "chat_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_notification_prefs: {
        Row: {
          channel_id: string
          created_at: string | null
          id: string
          setting: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          channel_id: string
          created_at?: string | null
          id?: string
          setting?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          channel_id?: string
          created_at?: string | null
          id?: string
          setting?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_notification_prefs_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "chat_channels"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_poll_options: {
        Row: {
          id: string
          poll_id: string
          sort_order: number | null
          text: string
        }
        Insert: {
          id?: string
          poll_id: string
          sort_order?: number | null
          text: string
        }
        Update: {
          id?: string
          poll_id?: string
          sort_order?: number | null
          text?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_poll_options_poll_id_fkey"
            columns: ["poll_id"]
            isOneToOne: false
            referencedRelation: "chat_polls"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_poll_votes: {
        Row: {
          created_at: string | null
          id: string
          option_id: string
          poll_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          option_id: string
          poll_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          option_id?: string
          poll_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_poll_votes_option_id_fkey"
            columns: ["option_id"]
            isOneToOne: false
            referencedRelation: "chat_poll_options"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_poll_votes_poll_id_fkey"
            columns: ["poll_id"]
            isOneToOne: false
            referencedRelation: "chat_polls"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_polls: {
        Row: {
          allows_multiple: boolean | null
          closes_at: string | null
          created_at: string | null
          id: string
          is_anonymous: boolean | null
          message_id: string
          question: string
        }
        Insert: {
          allows_multiple?: boolean | null
          closes_at?: string | null
          created_at?: string | null
          id?: string
          is_anonymous?: boolean | null
          message_id: string
          question: string
        }
        Update: {
          allows_multiple?: boolean | null
          closes_at?: string | null
          created_at?: string | null
          id?: string
          is_anonymous?: boolean | null
          message_id?: string
          question?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_polls_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "chat_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_reactions: {
        Row: {
          created_at: string | null
          emoji: string
          id: string
          message_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          emoji: string
          id?: string
          message_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          emoji?: string
          id?: string
          message_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_reactions_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "chat_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_webhooks: {
        Row: {
          channel_id: string
          created_at: string
          created_by: string | null
          id: string
          is_active: boolean
          name: string
          tenant_id: string
          token: string
          updated_at: string
        }
        Insert: {
          channel_id: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          name: string
          tenant_id: string
          token?: string
          updated_at?: string
        }
        Update: {
          channel_id?: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          name?: string
          tenant_id?: string
          token?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_webhooks_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "chat_channels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_webhooks_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "active_team"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_webhooks_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_webhooks_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      client_activity_log: {
        Row: {
          action: string
          client_id: string
          created_at: string | null
          description: string | null
          id: string
          tenant_id: string
        }
        Insert: {
          action: string
          client_id: string
          created_at?: string | null
          description?: string | null
          id?: string
          tenant_id: string
        }
        Update: {
          action?: string
          client_id?: string
          created_at?: string | null
          description?: string | null
          id?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_activity_log_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "client_portal_access"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_activity_log_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      client_deliveries: {
        Row: {
          client_id: string
          created_at: string | null
          delivered_at: string | null
          description: string | null
          files: Json | null
          id: string
          project_id: string | null
          review_notes: string | null
          reviewed_at: string | null
          status: string
          tenant_id: string
          title: string
        }
        Insert: {
          client_id: string
          created_at?: string | null
          delivered_at?: string | null
          description?: string | null
          files?: Json | null
          id?: string
          project_id?: string | null
          review_notes?: string | null
          reviewed_at?: string | null
          status?: string
          tenant_id: string
          title: string
        }
        Update: {
          client_id?: string
          created_at?: string | null
          delivered_at?: string | null
          description?: string | null
          files?: Json | null
          id?: string
          project_id?: string | null
          review_notes?: string | null
          reviewed_at?: string | null
          status?: string
          tenant_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_deliveries_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "client_portal_access"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_deliveries_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      client_interactions: {
        Row: {
          client_id: string
          created_at: string
          date: string
          id: string
          notes: string | null
          tenant_id: string
          type: string
        }
        Insert: {
          client_id: string
          created_at?: string
          date?: string
          id?: string
          notes?: string | null
          tenant_id: string
          type?: string
        }
        Update: {
          client_id?: string
          created_at?: string
          date?: string
          id?: string
          notes?: string | null
          tenant_id?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_interactions_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_interactions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      client_messages: {
        Row: {
          client_id: string
          content: string
          created_at: string | null
          id: string
          sender_name: string
          sender_type: string
          tenant_id: string
        }
        Insert: {
          client_id: string
          content: string
          created_at?: string | null
          id?: string
          sender_name: string
          sender_type: string
          tenant_id: string
        }
        Update: {
          client_id?: string
          content?: string
          created_at?: string | null
          id?: string
          sender_name?: string
          sender_type?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_messages_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "client_portal_access"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_messages_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      client_portal_access: {
        Row: {
          access_token: string | null
          client_email: string
          client_id: string | null
          client_name: string
          created_at: string | null
          id: string
          is_active: boolean | null
          last_login: string | null
          tenant_id: string
        }
        Insert: {
          access_token?: string | null
          client_email: string
          client_id?: string | null
          client_name: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          last_login?: string | null
          tenant_id: string
        }
        Update: {
          access_token?: string | null
          client_email?: string
          client_id?: string | null
          client_name?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          last_login?: string | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_portal_access_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          address: string | null
          city: string | null
          cnpj: string | null
          contact_name: string | null
          created_at: string
          email: string | null
          id: string
          logo_url: string | null
          name: string
          next_action: string | null
          next_action_date: string | null
          notes: string | null
          omie_id: string | null
          phone: string | null
          rd_id: string | null
          relationship_status: string | null
          sales_owner: string | null
          segment: string | null
          source: string | null
          state: string | null
          status: string
          tenant_id: string
          trading_name: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          city?: string | null
          cnpj?: string | null
          contact_name?: string | null
          created_at?: string
          email?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          next_action?: string | null
          next_action_date?: string | null
          notes?: string | null
          omie_id?: string | null
          phone?: string | null
          rd_id?: string | null
          relationship_status?: string | null
          sales_owner?: string | null
          segment?: string | null
          source?: string | null
          state?: string | null
          status?: string
          tenant_id: string
          trading_name?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          city?: string | null
          cnpj?: string | null
          contact_name?: string | null
          created_at?: string
          email?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          next_action?: string | null
          next_action_date?: string | null
          notes?: string | null
          omie_id?: string | null
          phone?: string | null
          rd_id?: string | null
          relationship_status?: string | null
          sales_owner?: string | null
          segment?: string | null
          source?: string | null
          state?: string | null
          status?: string
          tenant_id?: string
          trading_name?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "clients_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      climate_survey_responses: {
        Row: {
          answers: Json
          id: string
          submitted_at: string
          survey_id: string
        }
        Insert: {
          answers?: Json
          id?: string
          submitted_at?: string
          survey_id: string
        }
        Update: {
          answers?: Json
          id?: string
          submitted_at?: string
          survey_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "climate_survey_responses_survey_id_fkey"
            columns: ["survey_id"]
            isOneToOne: false
            referencedRelation: "climate_surveys"
            referencedColumns: ["id"]
          },
        ]
      }
      climate_survey_tokens: {
        Row: {
          created_at: string
          email: string
          id: string
          survey_id: string
          token: string
          used: boolean
          used_at: string | null
        }
        Insert: {
          created_at?: string
          email?: string
          id?: string
          survey_id: string
          token?: string
          used?: boolean
          used_at?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          survey_id?: string
          token?: string
          used?: boolean
          used_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "climate_survey_tokens_survey_id_fkey"
            columns: ["survey_id"]
            isOneToOne: false
            referencedRelation: "climate_surveys"
            referencedColumns: ["id"]
          },
        ]
      }
      climate_surveys: {
        Row: {
          closes_at: string | null
          created_at: string
          created_by: string | null
          description: string | null
          edition: number
          id: string
          is_active: boolean
          questions: Json
          sections: Json
          tenant_id: string | null
          title: string
        }
        Insert: {
          closes_at?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          edition?: number
          id?: string
          is_active?: boolean
          questions?: Json
          sections?: Json
          tenant_id?: string | null
          title: string
        }
        Update: {
          closes_at?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          edition?: number
          id?: string
          is_active?: boolean
          questions?: Json
          sections?: Json
          tenant_id?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "climate_surveys_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "active_team"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "climate_surveys_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "climate_surveys_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      colaboradores: {
        Row: {
          auth_user_id: string | null
          buddy_id: string | null
          cadastrado_por: string | null
          cargo: string
          created_at: string | null
          data_inicio: string
          email: string
          exit_date: string | null
          exit_interview: Json | null
          exit_reason: string | null
          foto_url: string | null
          id: string
          nome: string
          onboarding_concluido_em: string | null
          perfil_acesso: string | null
          quiz_score_final: number | null
          status: string | null
          telefone: string | null
          tenant_id: string | null
          tipo_contrato: string | null
          tipo_onboarding: string | null
        }
        Insert: {
          auth_user_id?: string | null
          buddy_id?: string | null
          cadastrado_por?: string | null
          cargo: string
          created_at?: string | null
          data_inicio: string
          email: string
          exit_date?: string | null
          exit_interview?: Json | null
          exit_reason?: string | null
          foto_url?: string | null
          id?: string
          nome: string
          onboarding_concluido_em?: string | null
          perfil_acesso?: string | null
          quiz_score_final?: number | null
          status?: string | null
          telefone?: string | null
          tenant_id?: string | null
          tipo_contrato?: string | null
          tipo_onboarding?: string | null
        }
        Update: {
          auth_user_id?: string | null
          buddy_id?: string | null
          cadastrado_por?: string | null
          cargo?: string
          created_at?: string | null
          data_inicio?: string
          email?: string
          exit_date?: string | null
          exit_interview?: Json | null
          exit_reason?: string | null
          foto_url?: string | null
          id?: string
          nome?: string
          onboarding_concluido_em?: string | null
          perfil_acesso?: string | null
          quiz_score_final?: number | null
          status?: string | null
          telefone?: string | null
          tenant_id?: string | null
          tipo_contrato?: string | null
          tipo_onboarding?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "colaboradores_buddy_id_fkey"
            columns: ["buddy_id"]
            isOneToOne: false
            referencedRelation: "colaboradores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "colaboradores_buddy_id_fkey"
            columns: ["buddy_id"]
            isOneToOne: false
            referencedRelation: "vw_colaboradores_inativos"
            referencedColumns: ["colaborador_id"]
          },
          {
            foreignKeyName: "colaboradores_buddy_id_fkey"
            columns: ["buddy_id"]
            isOneToOne: false
            referencedRelation: "vw_progresso_onboarding"
            referencedColumns: ["colaborador_id"]
          },
          {
            foreignKeyName: "colaboradores_cadastrado_por_fkey"
            columns: ["cadastrado_por"]
            isOneToOne: false
            referencedRelation: "colaboradores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "colaboradores_cadastrado_por_fkey"
            columns: ["cadastrado_por"]
            isOneToOne: false
            referencedRelation: "vw_colaboradores_inativos"
            referencedColumns: ["colaborador_id"]
          },
          {
            foreignKeyName: "colaboradores_cadastrado_por_fkey"
            columns: ["cadastrado_por"]
            isOneToOne: false
            referencedRelation: "vw_progresso_onboarding"
            referencedColumns: ["colaborador_id"]
          },
          {
            foreignKeyName: "colaboradores_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      colaboradores_status_log: {
        Row: {
          alterado_em: string | null
          colaborador_id: string | null
          id: string
          status_anterior: string | null
          status_novo: string | null
        }
        Insert: {
          alterado_em?: string | null
          colaborador_id?: string | null
          id?: string
          status_anterior?: string | null
          status_novo?: string | null
        }
        Update: {
          alterado_em?: string | null
          colaborador_id?: string | null
          id?: string
          status_anterior?: string | null
          status_novo?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "colaboradores_status_log_colaborador_id_fkey"
            columns: ["colaborador_id"]
            isOneToOne: false
            referencedRelation: "colaboradores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "colaboradores_status_log_colaborador_id_fkey"
            columns: ["colaborador_id"]
            isOneToOne: false
            referencedRelation: "vw_colaboradores_inativos"
            referencedColumns: ["colaborador_id"]
          },
          {
            foreignKeyName: "colaboradores_status_log_colaborador_id_fkey"
            columns: ["colaborador_id"]
            isOneToOne: false
            referencedRelation: "vw_progresso_onboarding"
            referencedColumns: ["colaborador_id"]
          },
        ]
      }
      collaborator_history: {
        Row: {
          changed_at: string | null
          changed_by: string | null
          field_changed: string
          id: string
          new_value: string | null
          old_value: string | null
          tenant_id: string
          user_id: string
        }
        Insert: {
          changed_at?: string | null
          changed_by?: string | null
          field_changed: string
          id?: string
          new_value?: string | null
          old_value?: string | null
          tenant_id: string
          user_id: string
        }
        Update: {
          changed_at?: string | null
          changed_by?: string | null
          field_changed?: string
          id?: string
          new_value?: string | null
          old_value?: string | null
          tenant_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "collaborator_history_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      commercial_monthly_data: {
        Row: {
          created_at: string | null
          id: string
          leads_inbound: number | null
          produtos_vendidos: string | null
          prospeccoes_outbound: number | null
          rd_conversion_rate: number | null
          rd_deals_won: number | null
          rd_deals_won_value: number | null
          rd_leads_total: number | null
          rd_pipeline_value: number | null
          reunioes_agendadas: number | null
          reunioes_realizadas: number | null
          tenant_id: string
          updated_at: string | null
          updated_by: string | null
          vendas_quantidade: number | null
          vendas_valor: number | null
          year_month: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          leads_inbound?: number | null
          produtos_vendidos?: string | null
          prospeccoes_outbound?: number | null
          rd_conversion_rate?: number | null
          rd_deals_won?: number | null
          rd_deals_won_value?: number | null
          rd_leads_total?: number | null
          rd_pipeline_value?: number | null
          reunioes_agendadas?: number | null
          reunioes_realizadas?: number | null
          tenant_id: string
          updated_at?: string | null
          updated_by?: string | null
          vendas_quantidade?: number | null
          vendas_valor?: number | null
          year_month: string
        }
        Update: {
          created_at?: string | null
          id?: string
          leads_inbound?: number | null
          produtos_vendidos?: string | null
          prospeccoes_outbound?: number | null
          rd_conversion_rate?: number | null
          rd_deals_won?: number | null
          rd_deals_won_value?: number | null
          rd_leads_total?: number | null
          rd_pipeline_value?: number | null
          reunioes_agendadas?: number | null
          reunioes_realizadas?: number | null
          tenant_id?: string
          updated_at?: string | null
          updated_by?: string | null
          vendas_quantidade?: number | null
          vendas_valor?: number | null
          year_month?: string
        }
        Relationships: [
          {
            foreignKeyName: "commercial_monthly_data_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commercial_monthly_data_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "active_team"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commercial_monthly_data_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      company_context: {
        Row: {
          key: string
          tenant_id: string | null
          updated_at: string | null
          updated_by: string | null
          value: Json
        }
        Insert: {
          key: string
          tenant_id?: string | null
          updated_at?: string | null
          updated_by?: string | null
          value: Json
        }
        Update: {
          key?: string
          tenant_id?: string | null
          updated_at?: string | null
          updated_by?: string | null
          value?: Json
        }
        Relationships: [
          {
            foreignKeyName: "company_context_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_context_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "active_team"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_context_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      compras_aprovacoes: {
        Row: {
          aprovador: string
          comentario: string | null
          created_at: string
          decisao: string
          id: string
          pedido_id: string
          tenant_id: string
        }
        Insert: {
          aprovador: string
          comentario?: string | null
          created_at?: string
          decisao: string
          id?: string
          pedido_id: string
          tenant_id: string
        }
        Update: {
          aprovador?: string
          comentario?: string | null
          created_at?: string
          decisao?: string
          id?: string
          pedido_id?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "compras_aprovacoes_aprovador_fkey"
            columns: ["aprovador"]
            isOneToOne: false
            referencedRelation: "active_team"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "compras_aprovacoes_aprovador_fkey"
            columns: ["aprovador"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "compras_aprovacoes_pedido_id_fkey"
            columns: ["pedido_id"]
            isOneToOne: false
            referencedRelation: "compras_pedidos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "compras_aprovacoes_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      compras_itens: {
        Row: {
          created_at: string
          descricao: string
          id: string
          pedido_id: string
          quantidade: number
          sort_order: number
          tenant_id: string
          unidade: string | null
          valor_unit: number | null
        }
        Insert: {
          created_at?: string
          descricao: string
          id?: string
          pedido_id: string
          quantidade?: number
          sort_order?: number
          tenant_id: string
          unidade?: string | null
          valor_unit?: number | null
        }
        Update: {
          created_at?: string
          descricao?: string
          id?: string
          pedido_id?: string
          quantidade?: number
          sort_order?: number
          tenant_id?: string
          unidade?: string | null
          valor_unit?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "compras_itens_pedido_id_fkey"
            columns: ["pedido_id"]
            isOneToOne: false
            referencedRelation: "compras_pedidos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "compras_itens_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      compras_pedidos: {
        Row: {
          aprovado_por: string | null
          categoria_id: string | null
          created_at: string
          criado_por: string
          data_aprovacao: string | null
          data_necessidade: string | null
          data_solicitacao: string
          descricao: string | null
          id: string
          notes: string | null
          prioridade: string
          sort_order: number
          status: string
          tenant_id: string
          titulo: string
          updated_at: string
          valor_estimado: number | null
          valor_final: number | null
          vendor_id: string | null
        }
        Insert: {
          aprovado_por?: string | null
          categoria_id?: string | null
          created_at?: string
          criado_por: string
          data_aprovacao?: string | null
          data_necessidade?: string | null
          data_solicitacao?: string
          descricao?: string | null
          id?: string
          notes?: string | null
          prioridade?: string
          sort_order?: number
          status?: string
          tenant_id: string
          titulo: string
          updated_at?: string
          valor_estimado?: number | null
          valor_final?: number | null
          vendor_id?: string | null
        }
        Update: {
          aprovado_por?: string | null
          categoria_id?: string | null
          created_at?: string
          criado_por?: string
          data_aprovacao?: string | null
          data_necessidade?: string | null
          data_solicitacao?: string
          descricao?: string | null
          id?: string
          notes?: string | null
          prioridade?: string
          sort_order?: number
          status?: string
          tenant_id?: string
          titulo?: string
          updated_at?: string
          valor_estimado?: number | null
          valor_final?: number | null
          vendor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "compras_pedidos_aprovado_por_fkey"
            columns: ["aprovado_por"]
            isOneToOne: false
            referencedRelation: "active_team"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "compras_pedidos_aprovado_por_fkey"
            columns: ["aprovado_por"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "compras_pedidos_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "compras_vendor_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "compras_pedidos_criado_por_fkey"
            columns: ["criado_por"]
            isOneToOne: false
            referencedRelation: "active_team"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "compras_pedidos_criado_por_fkey"
            columns: ["criado_por"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "compras_pedidos_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "compras_pedidos_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "fin_vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      compras_vendor_categories: {
        Row: {
          color: string | null
          created_at: string
          id: string
          name: string
          sort_order: number
          tenant_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          id?: string
          name: string
          sort_order?: number
          tenant_id: string
        }
        Update: {
          color?: string | null
          created_at?: string
          id?: string
          name?: string
          sort_order?: number
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "compras_vendor_categories_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      contract_attachments: {
        Row: {
          contract_id: string
          created_at: string | null
          file_name: string
          file_path: string
          file_size: number | null
          id: string
          mime_type: string | null
          tenant_id: string | null
          uploaded_by: string | null
        }
        Insert: {
          contract_id: string
          created_at?: string | null
          file_name: string
          file_path: string
          file_size?: number | null
          id?: string
          mime_type?: string | null
          tenant_id?: string | null
          uploaded_by?: string | null
        }
        Update: {
          contract_id?: string
          created_at?: string | null
          file_name?: string
          file_path?: string
          file_size?: number | null
          id?: string
          mime_type?: string | null
          tenant_id?: string | null
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contract_attachments_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      contracts: {
        Row: {
          category: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          end_date: string | null
          file_name: string | null
          file_url: string | null
          id: string
          monthly_value: number | null
          person_id: string | null
          person_name: string | null
          project_name: string | null
          source_path: string | null
          start_date: string | null
          status: string | null
          tenant_id: string
          title: string
          type: string
          updated_at: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          end_date?: string | null
          file_name?: string | null
          file_url?: string | null
          id?: string
          monthly_value?: number | null
          person_id?: string | null
          person_name?: string | null
          project_name?: string | null
          source_path?: string | null
          start_date?: string | null
          status?: string | null
          tenant_id: string
          title: string
          type: string
          updated_at?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          end_date?: string | null
          file_name?: string | null
          file_url?: string | null
          id?: string
          monthly_value?: number | null
          person_id?: string | null
          person_name?: string | null
          project_name?: string | null
          source_path?: string | null
          start_date?: string | null
          status?: string | null
          tenant_id?: string
          title?: string
          type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contracts_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      convites: {
        Row: {
          colaborador_id: string | null
          created_at: string | null
          expira_em: string
          id: string
          token: string
          usado_em: string | null
        }
        Insert: {
          colaborador_id?: string | null
          created_at?: string | null
          expira_em: string
          id?: string
          token: string
          usado_em?: string | null
        }
        Update: {
          colaborador_id?: string | null
          created_at?: string | null
          expira_em?: string
          id?: string
          token?: string
          usado_em?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "convites_colaborador_id_fkey"
            columns: ["colaborador_id"]
            isOneToOne: false
            referencedRelation: "colaboradores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "convites_colaborador_id_fkey"
            columns: ["colaborador_id"]
            isOneToOne: false
            referencedRelation: "vw_colaboradores_inativos"
            referencedColumns: ["colaborador_id"]
          },
          {
            foreignKeyName: "convites_colaborador_id_fkey"
            columns: ["colaborador_id"]
            isOneToOne: false
            referencedRelation: "vw_progresso_onboarding"
            referencedColumns: ["colaborador_id"]
          },
        ]
      }
      crm_deals: {
        Row: {
          activities: Json | null
          bu: string | null
          cargo: string | null
          company: string | null
          contact: string | null
          contact_email: string | null
          contact_phone: string | null
          cost: number | null
          created_at: string | null
          expected_close: string | null
          id: string
          is_radar: boolean
          legacy_id: string | null
          loss_reason: string | null
          margin: number | null
          name: string
          next_action_date: string | null
          next_action_note: string | null
          notes: string | null
          owner_id: string | null
          owner_name: string | null
          padrao: string | null
          porte: string | null
          priority: string | null
          probability: number | null
          radar_score: number | null
          rd_deal_id: string | null
          rd_pipeline_id: string | null
          rd_pipeline_name: string | null
          rd_user_id: string | null
          risk_flag: boolean | null
          services: string[] | null
          source: string | null
          stage: string
          stakeholders: Json | null
          status_funil: string | null
          tags: string[] | null
          temperatura: string | null
          tenant_id: string | null
          uf: string | null
          updated_at: string | null
          value: number | null
        }
        Insert: {
          activities?: Json | null
          bu?: string | null
          cargo?: string | null
          company?: string | null
          contact?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          cost?: number | null
          created_at?: string | null
          expected_close?: string | null
          id?: string
          is_radar?: boolean
          legacy_id?: string | null
          loss_reason?: string | null
          margin?: number | null
          name: string
          next_action_date?: string | null
          next_action_note?: string | null
          notes?: string | null
          owner_id?: string | null
          owner_name?: string | null
          padrao?: string | null
          porte?: string | null
          priority?: string | null
          probability?: number | null
          radar_score?: number | null
          rd_deal_id?: string | null
          rd_pipeline_id?: string | null
          rd_pipeline_name?: string | null
          rd_user_id?: string | null
          risk_flag?: boolean | null
          services?: string[] | null
          source?: string | null
          stage?: string
          stakeholders?: Json | null
          status_funil?: string | null
          tags?: string[] | null
          temperatura?: string | null
          tenant_id?: string | null
          uf?: string | null
          updated_at?: string | null
          value?: number | null
        }
        Update: {
          activities?: Json | null
          bu?: string | null
          cargo?: string | null
          company?: string | null
          contact?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          cost?: number | null
          created_at?: string | null
          expected_close?: string | null
          id?: string
          is_radar?: boolean
          legacy_id?: string | null
          loss_reason?: string | null
          margin?: number | null
          name?: string
          next_action_date?: string | null
          next_action_note?: string | null
          notes?: string | null
          owner_id?: string | null
          owner_name?: string | null
          padrao?: string | null
          porte?: string | null
          priority?: string | null
          probability?: number | null
          radar_score?: number | null
          rd_deal_id?: string | null
          rd_pipeline_id?: string | null
          rd_pipeline_name?: string | null
          rd_user_id?: string | null
          risk_flag?: boolean | null
          services?: string[] | null
          source?: string | null
          stage?: string
          stakeholders?: Json | null
          status_funil?: string | null
          tags?: string[] | null
          temperatura?: string | null
          tenant_id?: string | null
          uf?: string | null
          updated_at?: string | null
          value?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "crm_deals_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "active_team"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_deals_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_deals_stage_fkey"
            columns: ["stage"]
            isOneToOne: false
            referencedRelation: "crm_stages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_deals_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_stages: {
        Row: {
          color: string | null
          id: string
          label: string
          sort_order: number
        }
        Insert: {
          color?: string | null
          id: string
          label: string
          sort_order: number
        }
        Update: {
          color?: string | null
          id?: string
          label?: string
          sort_order?: number
        }
        Relationships: []
      }
      cultura_item_versions: {
        Row: {
          content: string | null
          created_at: string
          edited_by: string | null
          id: string
          item_id: string
          title: string
          version: number
        }
        Insert: {
          content?: string | null
          created_at?: string
          edited_by?: string | null
          id?: string
          item_id: string
          title?: string
          version?: number
        }
        Update: {
          content?: string | null
          created_at?: string
          edited_by?: string | null
          id?: string
          item_id?: string
          title?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "cultura_item_versions_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "cultura_items"
            referencedColumns: ["id"]
          },
        ]
      }
      cultura_items: {
        Row: {
          author_id: string
          category: string
          content: string
          content_html: string | null
          created_at: string
          icon: string | null
          id: string
          metadata: Json | null
          order_index: number
          status: string
          tenant_id: string
          title: string
          updated_at: string
          version: number
        }
        Insert: {
          author_id: string
          category?: string
          content?: string
          content_html?: string | null
          created_at?: string
          icon?: string | null
          id?: string
          metadata?: Json | null
          order_index?: number
          status?: string
          tenant_id: string
          title?: string
          updated_at?: string
          version?: number
        }
        Update: {
          author_id?: string
          category?: string
          content?: string
          content_html?: string | null
          created_at?: string
          icon?: string | null
          id?: string
          metadata?: Json | null
          order_index?: number
          status?: string
          tenant_id?: string
          title?: string
          updated_at?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "cultura_items_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      culture_metric_config: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          metric_id: string
          tenant_id: string
          threshold: number | null
          updated_at: string | null
          weight: number | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          metric_id: string
          tenant_id: string
          threshold?: number | null
          updated_at?: string | null
          weight?: number | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          metric_id?: string
          tenant_id?: string
          threshold?: number | null
          updated_at?: string | null
          weight?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "culture_metric_config_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      culture_pages: {
        Row: {
          category: string | null
          content: string | null
          created_at: string | null
          created_by: string | null
          id: string
          is_published: boolean | null
          order_index: number | null
          slug: string
          tenant_id: string
          title: string
          updated_at: string | null
        }
        Insert: {
          category?: string | null
          content?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_published?: boolean | null
          order_index?: number | null
          slug: string
          tenant_id: string
          title: string
          updated_at?: string | null
        }
        Update: {
          category?: string | null
          content?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_published?: boolean | null
          order_index?: number | null
          slug?: string
          tenant_id?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "culture_pages_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      custom_database_rows: {
        Row: {
          created_at: string | null
          created_by: string | null
          database_id: string
          id: string
          order_index: number | null
          properties: Json
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          database_id: string
          id?: string
          order_index?: number | null
          properties?: Json
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          database_id?: string
          id?: string
          order_index?: number | null
          properties?: Json
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "custom_database_rows_database_id_fkey"
            columns: ["database_id"]
            isOneToOne: false
            referencedRelation: "custom_databases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "custom_database_rows_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      custom_databases: {
        Row: {
          color: string | null
          columns: Json
          created_at: string | null
          created_by: string | null
          default_view: string | null
          description: string | null
          icon: string | null
          id: string
          name: string
          tenant_id: string
          updated_at: string | null
          views: Json
        }
        Insert: {
          color?: string | null
          columns?: Json
          created_at?: string | null
          created_by?: string | null
          default_view?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          name: string
          tenant_id: string
          updated_at?: string | null
          views?: Json
        }
        Update: {
          color?: string | null
          columns?: Json
          created_at?: string | null
          created_by?: string | null
          default_view?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          name?: string
          tenant_id?: string
          updated_at?: string | null
          views?: Json
        }
        Relationships: [
          {
            foreignKeyName: "custom_databases_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      custom_field_definitions: {
        Row: {
          created_at: string
          field_type: string
          id: string
          is_required: boolean
          name: string
          options: Json | null
          order_index: number
          project_id: string
          tenant_id: string
        }
        Insert: {
          created_at?: string
          field_type?: string
          id?: string
          is_required?: boolean
          name: string
          options?: Json | null
          order_index?: number
          project_id: string
          tenant_id: string
        }
        Update: {
          created_at?: string
          field_type?: string
          id?: string
          is_required?: boolean
          name?: string
          options?: Json | null
          order_index?: number
          project_id?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "custom_field_definitions_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "custom_field_definitions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      custom_field_values: {
        Row: {
          definition_id: string
          id: string
          task_id: string
          tenant_id: string
          value_date: string | null
          value_json: Json | null
          value_number: number | null
          value_text: string | null
        }
        Insert: {
          definition_id: string
          id?: string
          task_id: string
          tenant_id: string
          value_date?: string | null
          value_json?: Json | null
          value_number?: number | null
          value_text?: string | null
        }
        Update: {
          definition_id?: string
          id?: string
          task_id?: string
          tenant_id?: string
          value_date?: string | null
          value_json?: Json | null
          value_number?: number | null
          value_text?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "custom_field_values_definition_id_fkey"
            columns: ["definition_id"]
            isOneToOne: false
            referencedRelation: "custom_field_definitions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "custom_field_values_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "custom_field_values_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      decisions: {
        Row: {
          created_at: string | null
          created_by: string | null
          decided_by: string | null
          description: string | null
          id: string
          legacy_id: string | null
          meeting_id: string | null
          project_id: string | null
          tasks_created: string[] | null
          tenant_id: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          decided_by?: string | null
          description?: string | null
          id?: string
          legacy_id?: string | null
          meeting_id?: string | null
          project_id?: string | null
          tasks_created?: string[] | null
          tenant_id?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          decided_by?: string | null
          description?: string | null
          id?: string
          legacy_id?: string | null
          meeting_id?: string | null
          project_id?: string | null
          tasks_created?: string[] | null
          tenant_id?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "decisions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "active_team"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "decisions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "decisions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      deliverables: {
        Row: {
          created_at: string | null
          created_by: string | null
          current_version: string | null
          id: string
          legacy_id: string | null
          name: string
          owner_id: string | null
          owner_name: string | null
          project_id: string | null
          project_name: string | null
          reviewer_id: string | null
          source: string | null
          status: string
          tenant_id: string | null
          title: string | null
          type: string | null
          updated_at: string | null
          versions: Json | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          current_version?: string | null
          id?: string
          legacy_id?: string | null
          name: string
          owner_id?: string | null
          owner_name?: string | null
          project_id?: string | null
          project_name?: string | null
          reviewer_id?: string | null
          source?: string | null
          status?: string
          tenant_id?: string | null
          title?: string | null
          type?: string | null
          updated_at?: string | null
          versions?: Json | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          current_version?: string | null
          id?: string
          legacy_id?: string | null
          name?: string
          owner_id?: string | null
          owner_name?: string | null
          project_id?: string | null
          project_name?: string | null
          reviewer_id?: string | null
          source?: string | null
          status?: string
          tenant_id?: string | null
          title?: string | null
          type?: string | null
          updated_at?: string | null
          versions?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "deliverables_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "active_team"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deliverables_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deliverables_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "active_team"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deliverables_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deliverables_reviewer_id_fkey"
            columns: ["reviewer_id"]
            isOneToOne: false
            referencedRelation: "active_team"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deliverables_reviewer_id_fkey"
            columns: ["reviewer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deliverables_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      demand_comments: {
        Row: {
          author_id: string
          content: string
          created_at: string | null
          demand_id: string
          id: string
          mentions: Json
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          author_id: string
          content?: string
          created_at?: string | null
          demand_id: string
          id?: string
          mentions?: Json
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          author_id?: string
          content?: string
          created_at?: string | null
          demand_id?: string
          id?: string
          mentions?: Json
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "demand_comments_demand_id_fkey"
            columns: ["demand_id"]
            isOneToOne: false
            referencedRelation: "demands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "demand_comments_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      demand_field_values: {
        Row: {
          created_at: string | null
          demand_id: string
          field_id: string
          id: string
          tenant_id: string
          updated_at: string | null
          value_json: Json
        }
        Insert: {
          created_at?: string | null
          demand_id: string
          field_id: string
          id?: string
          tenant_id: string
          updated_at?: string | null
          value_json?: Json
        }
        Update: {
          created_at?: string | null
          demand_id?: string
          field_id?: string
          id?: string
          tenant_id?: string
          updated_at?: string | null
          value_json?: Json
        }
        Relationships: [
          {
            foreignKeyName: "demand_field_values_demand_id_fkey"
            columns: ["demand_id"]
            isOneToOne: false
            referencedRelation: "demands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "demand_field_values_field_id_fkey"
            columns: ["field_id"]
            isOneToOne: false
            referencedRelation: "os_custom_fields"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "demand_field_values_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      demands: {
        Row: {
          bus: string[] | null
          created_at: string | null
          due_date: string | null
          due_date_end: string | null
          feito: boolean | null
          formalizacao: string | null
          id: string
          info: string | null
          item_principal: string | null
          milestones: string | null
          notion_page_id: string | null
          notion_project_name: string | null
          notion_url: string | null
          prioridade: string | null
          project_id: string | null
          responsible: string | null
          start_date: string | null
          status: string
          subitem: string | null
          tags: string[] | null
          tenant_id: string
          tipo_midia: string[] | null
          title: string
          updated_at: string | null
        }
        Insert: {
          bus?: string[] | null
          created_at?: string | null
          due_date?: string | null
          due_date_end?: string | null
          feito?: boolean | null
          formalizacao?: string | null
          id?: string
          info?: string | null
          item_principal?: string | null
          milestones?: string | null
          notion_page_id?: string | null
          notion_project_name?: string | null
          notion_url?: string | null
          prioridade?: string | null
          project_id?: string | null
          responsible?: string | null
          start_date?: string | null
          status?: string
          subitem?: string | null
          tags?: string[] | null
          tenant_id: string
          tipo_midia?: string[] | null
          title: string
          updated_at?: string | null
        }
        Update: {
          bus?: string[] | null
          created_at?: string | null
          due_date?: string | null
          due_date_end?: string | null
          feito?: boolean | null
          formalizacao?: string | null
          id?: string
          info?: string | null
          item_principal?: string | null
          milestones?: string | null
          notion_page_id?: string | null
          notion_project_name?: string | null
          notion_url?: string | null
          prioridade?: string | null
          project_id?: string | null
          responsible?: string | null
          start_date?: string | null
          status?: string
          subitem?: string | null
          tags?: string[] | null
          tenant_id?: string
          tipo_midia?: string[] | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "demands_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "demands_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      digest_logs: {
        Row: {
          content_html: string | null
          id: string
          recipient_email: string
          recipient_name: string | null
          sent_at: string | null
          snapshot: Json | null
          status: string | null
          subject: string
          type: string
        }
        Insert: {
          content_html?: string | null
          id?: string
          recipient_email: string
          recipient_name?: string | null
          sent_at?: string | null
          snapshot?: Json | null
          status?: string | null
          subject: string
          type?: string
        }
        Update: {
          content_html?: string | null
          id?: string
          recipient_email?: string
          recipient_name?: string | null
          sent_at?: string | null
          snapshot?: Json | null
          status?: string | null
          subject?: string
          type?: string
        }
        Relationships: []
      }
      document_versions: {
        Row: {
          changelog: string | null
          created_at: string | null
          document_id: string
          document_type: string
          file_name: string
          file_path: string
          file_size: number | null
          id: string
          is_current: boolean | null
          mime_type: string | null
          tenant_id: string | null
          thumbnail_path: string | null
          uploaded_by: string | null
          uploaded_by_name: string | null
          version: number
        }
        Insert: {
          changelog?: string | null
          created_at?: string | null
          document_id: string
          document_type?: string
          file_name: string
          file_path: string
          file_size?: number | null
          id?: string
          is_current?: boolean | null
          mime_type?: string | null
          tenant_id?: string | null
          thumbnail_path?: string | null
          uploaded_by?: string | null
          uploaded_by_name?: string | null
          version?: number
        }
        Update: {
          changelog?: string | null
          created_at?: string | null
          document_id?: string
          document_type?: string
          file_name?: string
          file_path?: string
          file_size?: number | null
          id?: string
          is_current?: boolean | null
          mime_type?: string | null
          tenant_id?: string | null
          thumbnail_path?: string | null
          uploaded_by?: string | null
          uploaded_by_name?: string | null
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "document_versions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_versions_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "active_team"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_versions_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      dre_settings: {
        Row: {
          id: string
          tax_rate: number | null
          tenant_id: string
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          id?: string
          tax_rate?: number | null
          tenant_id: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          id?: string
          tax_rate?: number | null
          tenant_id?: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "dre_settings_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: true
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      dynamic_templates: {
        Row: {
          category: string | null
          content: string
          created_at: string | null
          created_by: string | null
          created_by_name: string | null
          description: string | null
          id: string
          is_default: boolean | null
          last_used_at: string | null
          name: string
          type: string
          updated_at: string | null
          usage_count: number | null
          variables: Json | null
        }
        Insert: {
          category?: string | null
          content?: string
          created_at?: string | null
          created_by?: string | null
          created_by_name?: string | null
          description?: string | null
          id?: string
          is_default?: boolean | null
          last_used_at?: string | null
          name: string
          type?: string
          updated_at?: string | null
          usage_count?: number | null
          variables?: Json | null
        }
        Update: {
          category?: string | null
          content?: string
          created_at?: string | null
          created_by?: string | null
          created_by_name?: string | null
          description?: string | null
          id?: string
          is_default?: boolean | null
          last_used_at?: string | null
          name?: string
          type?: string
          updated_at?: string | null
          usage_count?: number | null
          variables?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "dynamic_templates_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "active_team"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dynamic_templates_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      email_calendar: {
        Row: {
          audience: string | null
          audience_filter: Json | null
          bu_focus: string | null
          content_source: string | null
          created_at: string | null
          day_of_week: number
          email_type: string
          id: string
          queue_id: string | null
          scheduled_date: string
          status: string | null
          template_type: string | null
          topic_hint: string | null
          updated_at: string | null
          week_number: number
          year: number
        }
        Insert: {
          audience?: string | null
          audience_filter?: Json | null
          bu_focus?: string | null
          content_source?: string | null
          created_at?: string | null
          day_of_week: number
          email_type: string
          id?: string
          queue_id?: string | null
          scheduled_date: string
          status?: string | null
          template_type?: string | null
          topic_hint?: string | null
          updated_at?: string | null
          week_number: number
          year: number
        }
        Update: {
          audience?: string | null
          audience_filter?: Json | null
          bu_focus?: string | null
          content_source?: string | null
          created_at?: string | null
          day_of_week?: number
          email_type?: string
          id?: string
          queue_id?: string | null
          scheduled_date?: string
          status?: string | null
          template_type?: string | null
          topic_hint?: string | null
          updated_at?: string | null
          week_number?: number
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "email_calendar_queue_id_fkey"
            columns: ["queue_id"]
            isOneToOne: false
            referencedRelation: "email_queue"
            referencedColumns: ["id"]
          },
        ]
      }
      email_campaign_log: {
        Row: {
          bounces: number | null
          bu_focus: string | null
          click_rate: number | null
          created_at: string | null
          emails_sent: number | null
          framework: string | null
          id: string
          mailchimp_campaign_id: string | null
          open_rate: number | null
          performance_grade: string | null
          queue_id: string | null
          revenue_attributed: number | null
          segment_target: string | null
          sent_at: string | null
          stats_fetched_at: string | null
          subject: string | null
          template_type: string | null
          unique_clicks: number | null
          unique_opens: number | null
          unsubscribes: number | null
        }
        Insert: {
          bounces?: number | null
          bu_focus?: string | null
          click_rate?: number | null
          created_at?: string | null
          emails_sent?: number | null
          framework?: string | null
          id?: string
          mailchimp_campaign_id?: string | null
          open_rate?: number | null
          performance_grade?: string | null
          queue_id?: string | null
          revenue_attributed?: number | null
          segment_target?: string | null
          sent_at?: string | null
          stats_fetched_at?: string | null
          subject?: string | null
          template_type?: string | null
          unique_clicks?: number | null
          unique_opens?: number | null
          unsubscribes?: number | null
        }
        Update: {
          bounces?: number | null
          bu_focus?: string | null
          click_rate?: number | null
          created_at?: string | null
          emails_sent?: number | null
          framework?: string | null
          id?: string
          mailchimp_campaign_id?: string | null
          open_rate?: number | null
          performance_grade?: string | null
          queue_id?: string | null
          revenue_attributed?: number | null
          segment_target?: string | null
          sent_at?: string | null
          stats_fetched_at?: string | null
          subject?: string | null
          template_type?: string | null
          unique_clicks?: number | null
          unique_opens?: number | null
          unsubscribes?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "email_campaign_log_queue_id_fkey"
            columns: ["queue_id"]
            isOneToOne: false
            referencedRelation: "email_queue"
            referencedColumns: ["id"]
          },
        ]
      }
      email_contacts: {
        Row: {
          auto_delete_at: string | null
          best_send_day: number | null
          best_send_hour: number | null
          bu_principal: string | null
          cadence_days: number | null
          cadence_tier: string | null
          cargo: string | null
          case_match: string | null
          cidade: string | null
          clicks_last_30d: number | null
          cliente: string | null
          contato: string | null
          created_at: string | null
          days_since_last_open: number | null
          descricao: string | null
          domain: string | null
          email: string | null
          emails_received: number | null
          empresa: string
          engagement_score: number | null
          engagement_segment: string | null
          estado: string | null
          fatigue_index: number | null
          flag_reason: string | null
          flag_resolved: boolean | null
          flagged_at: string | null
          id: string
          is_personal_email: boolean | null
          last_click_at: string | null
          last_clicked_at: string | null
          last_email_sent_at: string | null
          last_framework: string | null
          last_open_at: string | null
          last_opened_at: string | null
          last_pdca_cycle: string | null
          last_validated_at: string | null
          lead_score: number | null
          linkedin_url: string | null
          next_email_at: string | null
          obs_comercial: string | null
          opens_last_30d: number | null
          padrao: string | null
          porte: string | null
          preferred_bu: string | null
          preferred_template: string | null
          quality_tier: string | null
          source: string | null
          status_comercial: string | null
          tags: string[] | null
          telefone: string | null
          temperatura: string | null
          total_campaigns: number | null
          total_clicks: number | null
          total_opens: number | null
          updated_at: string | null
          validation_notes: string | null
        }
        Insert: {
          auto_delete_at?: string | null
          best_send_day?: number | null
          best_send_hour?: number | null
          bu_principal?: string | null
          cadence_days?: number | null
          cadence_tier?: string | null
          cargo?: string | null
          case_match?: string | null
          cidade?: string | null
          clicks_last_30d?: number | null
          cliente?: string | null
          contato?: string | null
          created_at?: string | null
          days_since_last_open?: number | null
          descricao?: string | null
          domain?: string | null
          email?: string | null
          emails_received?: number | null
          empresa: string
          engagement_score?: number | null
          engagement_segment?: string | null
          estado?: string | null
          fatigue_index?: number | null
          flag_reason?: string | null
          flag_resolved?: boolean | null
          flagged_at?: string | null
          id?: string
          is_personal_email?: boolean | null
          last_click_at?: string | null
          last_clicked_at?: string | null
          last_email_sent_at?: string | null
          last_framework?: string | null
          last_open_at?: string | null
          last_opened_at?: string | null
          last_pdca_cycle?: string | null
          last_validated_at?: string | null
          lead_score?: number | null
          linkedin_url?: string | null
          next_email_at?: string | null
          obs_comercial?: string | null
          opens_last_30d?: number | null
          padrao?: string | null
          porte?: string | null
          preferred_bu?: string | null
          preferred_template?: string | null
          quality_tier?: string | null
          source?: string | null
          status_comercial?: string | null
          tags?: string[] | null
          telefone?: string | null
          temperatura?: string | null
          total_campaigns?: number | null
          total_clicks?: number | null
          total_opens?: number | null
          updated_at?: string | null
          validation_notes?: string | null
        }
        Update: {
          auto_delete_at?: string | null
          best_send_day?: number | null
          best_send_hour?: number | null
          bu_principal?: string | null
          cadence_days?: number | null
          cadence_tier?: string | null
          cargo?: string | null
          case_match?: string | null
          cidade?: string | null
          clicks_last_30d?: number | null
          cliente?: string | null
          contato?: string | null
          created_at?: string | null
          days_since_last_open?: number | null
          descricao?: string | null
          domain?: string | null
          email?: string | null
          emails_received?: number | null
          empresa?: string
          engagement_score?: number | null
          engagement_segment?: string | null
          estado?: string | null
          fatigue_index?: number | null
          flag_reason?: string | null
          flag_resolved?: boolean | null
          flagged_at?: string | null
          id?: string
          is_personal_email?: boolean | null
          last_click_at?: string | null
          last_clicked_at?: string | null
          last_email_sent_at?: string | null
          last_framework?: string | null
          last_open_at?: string | null
          last_opened_at?: string | null
          last_pdca_cycle?: string | null
          last_validated_at?: string | null
          lead_score?: number | null
          linkedin_url?: string | null
          next_email_at?: string | null
          obs_comercial?: string | null
          opens_last_30d?: number | null
          padrao?: string | null
          porte?: string | null
          preferred_bu?: string | null
          preferred_template?: string | null
          quality_tier?: string | null
          source?: string | null
          status_comercial?: string | null
          tags?: string[] | null
          telefone?: string | null
          temperatura?: string | null
          total_campaigns?: number | null
          total_clicks?: number | null
          total_opens?: number | null
          updated_at?: string | null
          validation_notes?: string | null
        }
        Relationships: []
      }
      email_content_bank: {
        Row: {
          body_excerpt: string | null
          bu_focus: string | null
          click_rate: number | null
          created_at: string | null
          id: string
          open_rate: number | null
          performance_score: number | null
          source: string
          source_id: string | null
          subject: string | null
          template_type: string | null
          themes: string[] | null
          tone: string | null
        }
        Insert: {
          body_excerpt?: string | null
          bu_focus?: string | null
          click_rate?: number | null
          created_at?: string | null
          id?: string
          open_rate?: number | null
          performance_score?: number | null
          source: string
          source_id?: string | null
          subject?: string | null
          template_type?: string | null
          themes?: string[] | null
          tone?: string | null
        }
        Update: {
          body_excerpt?: string | null
          bu_focus?: string | null
          click_rate?: number | null
          created_at?: string | null
          id?: string
          open_rate?: number | null
          performance_score?: number | null
          source?: string
          source_id?: string | null
          subject?: string | null
          template_type?: string | null
          themes?: string[] | null
          tone?: string | null
        }
        Relationships: []
      }
      email_frameworks_log: {
        Row: {
          bu_focus: string | null
          created_at: string | null
          email_type: string | null
          framework: string
          id: string
          subject: string | null
          week_number: number
          year: number
        }
        Insert: {
          bu_focus?: string | null
          created_at?: string | null
          email_type?: string | null
          framework: string
          id?: string
          subject?: string | null
          week_number: number
          year: number
        }
        Update: {
          bu_focus?: string | null
          created_at?: string | null
          email_type?: string | null
          framework?: string
          id?: string
          subject?: string | null
          week_number?: number
          year?: number
        }
        Relationships: []
      }
      email_gold_standards: {
        Row: {
          bu: string | null
          created_at: string | null
          full_body: string
          headline: string | null
          id: string
          performance_data: Json | null
          source: string | null
          structure_notes: string | null
          template_type: string | null
          title: string
          tone: string | null
        }
        Insert: {
          bu?: string | null
          created_at?: string | null
          full_body: string
          headline?: string | null
          id?: string
          performance_data?: Json | null
          source?: string | null
          structure_notes?: string | null
          template_type?: string | null
          title: string
          tone?: string | null
        }
        Update: {
          bu?: string | null
          created_at?: string | null
          full_body?: string
          headline?: string | null
          id?: string
          performance_data?: Json | null
          source?: string | null
          structure_notes?: string | null
          template_type?: string | null
          title?: string
          tone?: string | null
        }
        Relationships: []
      }
      email_learning_memory: {
        Row: {
          bu: string | null
          category: string
          created_at: string | null
          id: string
          last_occurred_at: string | null
          lesson: string
          occurrence_count: number | null
          project_mentioned: string | null
          resolution_note: string | null
          resolved: boolean | null
          severity: string | null
          template_type: string | null
        }
        Insert: {
          bu?: string | null
          category: string
          created_at?: string | null
          id?: string
          last_occurred_at?: string | null
          lesson: string
          occurrence_count?: number | null
          project_mentioned?: string | null
          resolution_note?: string | null
          resolved?: boolean | null
          severity?: string | null
          template_type?: string | null
        }
        Update: {
          bu?: string | null
          category?: string
          created_at?: string | null
          id?: string
          last_occurred_at?: string | null
          lesson?: string
          occurrence_count?: number | null
          project_mentioned?: string | null
          resolution_note?: string | null
          resolved?: boolean | null
          severity?: string | null
          template_type?: string | null
        }
        Relationships: []
      }
      email_performance: {
        Row: {
          abuse_reports: number | null
          bounces: number | null
          bu_focus: string | null
          campaign_id: string
          click_rate: number | null
          clicks: number | null
          created_at: string | null
          emails_sent: number | null
          id: string
          open_rate: number | null
          queue_id: string | null
          segment_name: string | null
          subject: string | null
          synced_at: string | null
          template_type: string | null
          unique_opens: number | null
          unsubscribes: number | null
        }
        Insert: {
          abuse_reports?: number | null
          bounces?: number | null
          bu_focus?: string | null
          campaign_id: string
          click_rate?: number | null
          clicks?: number | null
          created_at?: string | null
          emails_sent?: number | null
          id?: string
          open_rate?: number | null
          queue_id?: string | null
          segment_name?: string | null
          subject?: string | null
          synced_at?: string | null
          template_type?: string | null
          unique_opens?: number | null
          unsubscribes?: number | null
        }
        Update: {
          abuse_reports?: number | null
          bounces?: number | null
          bu_focus?: string | null
          campaign_id?: string
          click_rate?: number | null
          clicks?: number | null
          created_at?: string | null
          emails_sent?: number | null
          id?: string
          open_rate?: number | null
          queue_id?: string | null
          segment_name?: string | null
          subject?: string | null
          synced_at?: string | null
          template_type?: string | null
          unique_opens?: number | null
          unsubscribes?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "email_performance_queue_id_fkey"
            columns: ["queue_id"]
            isOneToOne: false
            referencedRelation: "email_queue"
            referencedColumns: ["id"]
          },
        ]
      }
      email_project_cooldown: {
        Row: {
          bu: string | null
          email_subject: string | null
          id: string
          project_name: string
          used_at: string | null
        }
        Insert: {
          bu?: string | null
          email_subject?: string | null
          id?: string
          project_name: string
          used_at?: string | null
        }
        Update: {
          bu?: string | null
          email_subject?: string | null
          id?: string
          project_name?: string
          used_at?: string | null
        }
        Relationships: []
      }
      email_queue: {
        Row: {
          ab_group_id: string | null
          ab_variant: string | null
          approved_at: string | null
          body_text: string | null
          bu_focus: string | null
          click_rate: number | null
          created_at: string | null
          email_type: string
          error_message: string | null
          from_name: string | null
          generated_at: string | null
          html_content: string | null
          id: string
          lead_city: string | null
          lead_company: string | null
          lead_context: string | null
          lead_email: string | null
          lead_name: string | null
          mailchimp_campaign_id: string | null
          open_rate: number | null
          performance_score: number | null
          preview_text: string | null
          rejected_at: string | null
          reply_to: string | null
          scheduled_for: string | null
          segment_id: string
          segment_name: string
          sent_at: string | null
          signature_text: string | null
          status: string
          subject: string | null
          template_type: string | null
          tone: string
          updated_at: string | null
          week_number: number | null
          year: number | null
        }
        Insert: {
          ab_group_id?: string | null
          ab_variant?: string | null
          approved_at?: string | null
          body_text?: string | null
          bu_focus?: string | null
          click_rate?: number | null
          created_at?: string | null
          email_type?: string
          error_message?: string | null
          from_name?: string | null
          generated_at?: string | null
          html_content?: string | null
          id?: string
          lead_city?: string | null
          lead_company?: string | null
          lead_context?: string | null
          lead_email?: string | null
          lead_name?: string | null
          mailchimp_campaign_id?: string | null
          open_rate?: number | null
          performance_score?: number | null
          preview_text?: string | null
          rejected_at?: string | null
          reply_to?: string | null
          scheduled_for?: string | null
          segment_id?: string
          segment_name?: string
          sent_at?: string | null
          signature_text?: string | null
          status?: string
          subject?: string | null
          template_type?: string | null
          tone?: string
          updated_at?: string | null
          week_number?: number | null
          year?: number | null
        }
        Update: {
          ab_group_id?: string | null
          ab_variant?: string | null
          approved_at?: string | null
          body_text?: string | null
          bu_focus?: string | null
          click_rate?: number | null
          created_at?: string | null
          email_type?: string
          error_message?: string | null
          from_name?: string | null
          generated_at?: string | null
          html_content?: string | null
          id?: string
          lead_city?: string | null
          lead_company?: string | null
          lead_context?: string | null
          lead_email?: string | null
          lead_name?: string | null
          mailchimp_campaign_id?: string | null
          open_rate?: number | null
          performance_score?: number | null
          preview_text?: string | null
          rejected_at?: string | null
          reply_to?: string | null
          scheduled_for?: string | null
          segment_id?: string
          segment_name?: string
          sent_at?: string | null
          signature_text?: string | null
          status?: string
          subject?: string | null
          template_type?: string | null
          tone?: string
          updated_at?: string | null
          week_number?: number | null
          year?: number | null
        }
        Relationships: []
      }
      email_regeneration_log: {
        Row: {
          created_at: string | null
          id: string
          original_body: string | null
          original_bu_focus: string | null
          original_email_id: string | null
          original_email_type: string | null
          original_preview: string | null
          original_segment_name: string | null
          original_subject: string | null
          original_template_type: string | null
          original_tone: string | null
          regenerated_accepted: boolean | null
          regenerated_email_id: string | null
          regenerated_preview: string | null
          regenerated_subject: string | null
          rejected_by: string | null
          rejection_reason: string | null
          rejection_tags: string[] | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          original_body?: string | null
          original_bu_focus?: string | null
          original_email_id?: string | null
          original_email_type?: string | null
          original_preview?: string | null
          original_segment_name?: string | null
          original_subject?: string | null
          original_template_type?: string | null
          original_tone?: string | null
          regenerated_accepted?: boolean | null
          regenerated_email_id?: string | null
          regenerated_preview?: string | null
          regenerated_subject?: string | null
          rejected_by?: string | null
          rejection_reason?: string | null
          rejection_tags?: string[] | null
        }
        Update: {
          created_at?: string | null
          id?: string
          original_body?: string | null
          original_bu_focus?: string | null
          original_email_id?: string | null
          original_email_type?: string | null
          original_preview?: string | null
          original_segment_name?: string | null
          original_subject?: string | null
          original_template_type?: string | null
          original_tone?: string | null
          regenerated_accepted?: boolean | null
          regenerated_email_id?: string | null
          regenerated_preview?: string | null
          regenerated_subject?: string | null
          rejected_by?: string | null
          rejection_reason?: string | null
          rejection_tags?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "email_regeneration_log_original_email_id_fkey"
            columns: ["original_email_id"]
            isOneToOne: false
            referencedRelation: "email_queue"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_regeneration_log_regenerated_email_id_fkey"
            columns: ["regenerated_email_id"]
            isOneToOne: false
            referencedRelation: "email_queue"
            referencedColumns: ["id"]
          },
        ]
      }
      email_score_history: {
        Row: {
          audience: string | null
          bu: string | null
          created_at: string | null
          email_subject: string | null
          id: string
          problems: Json | null
          project_mentioned: string | null
          regeneration_reason: string | null
          score_contexto: number | null
          score_copy: number | null
          score_funil: number | null
          score_overall: number | null
          score_tecnica: number | null
          score_tom_voz: number | null
          score_visual: number | null
          template_type: string | null
          was_approved: boolean | null
          was_regenerated: boolean | null
        }
        Insert: {
          audience?: string | null
          bu?: string | null
          created_at?: string | null
          email_subject?: string | null
          id?: string
          problems?: Json | null
          project_mentioned?: string | null
          regeneration_reason?: string | null
          score_contexto?: number | null
          score_copy?: number | null
          score_funil?: number | null
          score_overall?: number | null
          score_tecnica?: number | null
          score_tom_voz?: number | null
          score_visual?: number | null
          template_type?: string | null
          was_approved?: boolean | null
          was_regenerated?: boolean | null
        }
        Update: {
          audience?: string | null
          bu?: string | null
          created_at?: string | null
          email_subject?: string | null
          id?: string
          problems?: Json | null
          project_mentioned?: string | null
          regeneration_reason?: string | null
          score_contexto?: number | null
          score_copy?: number | null
          score_funil?: number | null
          score_overall?: number | null
          score_tecnica?: number | null
          score_tom_voz?: number | null
          score_visual?: number | null
          template_type?: string | null
          was_approved?: boolean | null
          was_regenerated?: boolean | null
        }
        Relationships: []
      }
      email_success_examples: {
        Row: {
          audience: string | null
          body_preview: string | null
          bu: string
          click_rate: number | null
          created_at: string | null
          cta: string | null
          headline: string
          id: string
          is_benchmark: boolean | null
          open_rate: number | null
          project_mentioned: string | null
          score_contexto: number | null
          score_overall: number
          subject: string
          template_type: string
        }
        Insert: {
          audience?: string | null
          body_preview?: string | null
          bu: string
          click_rate?: number | null
          created_at?: string | null
          cta?: string | null
          headline: string
          id?: string
          is_benchmark?: boolean | null
          open_rate?: number | null
          project_mentioned?: string | null
          score_contexto?: number | null
          score_overall: number
          subject: string
          template_type: string
        }
        Update: {
          audience?: string | null
          body_preview?: string | null
          bu?: string
          click_rate?: number | null
          created_at?: string | null
          cta?: string | null
          headline?: string
          id?: string
          is_benchmark?: boolean | null
          open_rate?: number | null
          project_mentioned?: string | null
          score_contexto?: number | null
          score_overall?: number
          subject?: string
          template_type?: string
        }
        Relationships: []
      }
      employee_culture_metrics: {
        Row: {
          collaboration_index: number | null
          computed_at: string | null
          created_at: string | null
          culture_score: number | null
          employee_id: string
          feedback_engagement: number | null
          feedback_given: number | null
          id: string
          one_on_one_participation: number | null
          peer_review_score: number | null
          period: string
          raw_data: Json | null
          tenant_id: string
          values_alignment: number | null
        }
        Insert: {
          collaboration_index?: number | null
          computed_at?: string | null
          created_at?: string | null
          culture_score?: number | null
          employee_id: string
          feedback_engagement?: number | null
          feedback_given?: number | null
          id?: string
          one_on_one_participation?: number | null
          peer_review_score?: number | null
          period: string
          raw_data?: Json | null
          tenant_id: string
          values_alignment?: number | null
        }
        Update: {
          collaboration_index?: number | null
          computed_at?: string | null
          created_at?: string | null
          culture_score?: number | null
          employee_id?: string
          feedback_engagement?: number | null
          feedback_given?: number | null
          id?: string
          one_on_one_participation?: number | null
          peer_review_score?: number | null
          period?: string
          raw_data?: Json | null
          tenant_id?: string
          values_alignment?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "employee_culture_metrics_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_impact_metrics: {
        Row: {
          computed_at: string | null
          created_at: string | null
          decision_participation: number | null
          employee_id: string
          id: string
          impact_score: number | null
          okr_completion: number | null
          on_time_delivery: number | null
          period: string
          project_margin: number | null
          raw_data: Json | null
          recognitions_received: number | null
          rework_rate: number | null
          tenant_id: string
        }
        Insert: {
          computed_at?: string | null
          created_at?: string | null
          decision_participation?: number | null
          employee_id: string
          id?: string
          impact_score?: number | null
          okr_completion?: number | null
          on_time_delivery?: number | null
          period: string
          project_margin?: number | null
          raw_data?: Json | null
          recognitions_received?: number | null
          rework_rate?: number | null
          tenant_id: string
        }
        Update: {
          computed_at?: string | null
          created_at?: string | null
          decision_participation?: number | null
          employee_id?: string
          id?: string
          impact_score?: number | null
          okr_completion?: number | null
          on_time_delivery?: number | null
          period?: string
          project_margin?: number | null
          raw_data?: Json | null
          recognitions_received?: number | null
          rework_rate?: number | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "employee_impact_metrics_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_performance_snapshot: {
        Row: {
          created_at: string | null
          culture_score: number | null
          employee_id: string
          final_score: number | null
          id: string
          impact_score: number | null
          period: string
          skill_score: number | null
          tenant_id: string
          trend: string | null
        }
        Insert: {
          created_at?: string | null
          culture_score?: number | null
          employee_id: string
          final_score?: number | null
          id?: string
          impact_score?: number | null
          period: string
          skill_score?: number | null
          tenant_id: string
          trend?: string | null
        }
        Update: {
          created_at?: string | null
          culture_score?: number | null
          employee_id?: string
          final_score?: number | null
          id?: string
          impact_score?: number | null
          period?: string
          skill_score?: number | null
          tenant_id?: string
          trend?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employee_performance_snapshot_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_skill_scores: {
        Row: {
          created_at: string | null
          employee_id: string
          evaluated_by: string | null
          expected_level: number | null
          id: string
          level_percentage: number
          notes: string | null
          period: string
          skill_id: string
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          employee_id: string
          evaluated_by?: string | null
          expected_level?: number | null
          id?: string
          level_percentage: number
          notes?: string | null
          period: string
          skill_id: string
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          employee_id?: string
          evaluated_by?: string | null
          expected_level?: number | null
          id?: string
          level_percentage?: number
          notes?: string | null
          period?: string
          skill_id?: string
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employee_skill_scores_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      enrichment_log: {
        Row: {
          applied: boolean | null
          confidence: number | null
          contact_id: string | null
          created_at: string | null
          field_enriched: string
          id: string
          new_value: string | null
          old_value: string | null
          source: string
        }
        Insert: {
          applied?: boolean | null
          confidence?: number | null
          contact_id?: string | null
          created_at?: string | null
          field_enriched: string
          id?: string
          new_value?: string | null
          old_value?: string | null
          source: string
        }
        Update: {
          applied?: boolean | null
          confidence?: number | null
          contact_id?: string | null
          created_at?: string | null
          field_enriched?: string
          id?: string
          new_value?: string | null
          old_value?: string | null
          source?: string
        }
        Relationships: [
          {
            foreignKeyName: "enrichment_log_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "email_contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      feedbacks: {
        Row: {
          created_at: string | null
          from_user: string
          id: string
          message: string
          tenant_id: string
          to_user: string
          type: string
          visibility: string | null
        }
        Insert: {
          created_at?: string | null
          from_user: string
          id?: string
          message: string
          tenant_id: string
          to_user: string
          type: string
          visibility?: string | null
        }
        Update: {
          created_at?: string | null
          from_user?: string
          id?: string
          message?: string
          tenant_id?: string
          to_user?: string
          type?: string
          visibility?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "feedbacks_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      fin_bank_accounts: {
        Row: {
          account_number: string | null
          account_type: string | null
          agency: string | null
          balance: number | null
          bank_code: string | null
          bank_name: string | null
          created_at: string | null
          id: string
          is_active: boolean | null
          name: string
          omie_id: string | null
          omie_synced_at: string | null
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          account_number?: string | null
          account_type?: string | null
          agency?: string | null
          balance?: number | null
          bank_code?: string | null
          bank_name?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          omie_id?: string | null
          omie_synced_at?: string | null
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          account_number?: string | null
          account_type?: string | null
          agency?: string | null
          balance?: number | null
          bank_code?: string | null
          bank_name?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          omie_id?: string | null
          omie_synced_at?: string | null
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fin_bank_accounts_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      fin_cash_entries: {
        Row: {
          amount: number
          created_at: string
          id: string
          note: string | null
          recorded_at: string
          tenant_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          note?: string | null
          recorded_at?: string
          tenant_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          note?: string | null
          recorded_at?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fin_cash_entries_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      fin_categories: {
        Row: {
          color: string | null
          created_at: string | null
          icon: string | null
          id: string
          is_active: boolean | null
          name: string
          omie_id: string | null
          omie_synced_at: string | null
          parent_id: string | null
          slug: string
          tenant_id: string
          type: string
          updated_at: string | null
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          omie_id?: string | null
          omie_synced_at?: string | null
          parent_id?: string | null
          slug: string
          tenant_id: string
          type: string
          updated_at?: string | null
        }
        Update: {
          color?: string | null
          created_at?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          omie_id?: string | null
          omie_synced_at?: string | null
          parent_id?: string | null
          slug?: string
          tenant_id?: string
          type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fin_categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "fin_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fin_categories_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      fin_clients: {
        Row: {
          cnpj: string | null
          contact_name: string | null
          created_at: string | null
          email: string | null
          id: string
          is_active: boolean | null
          name: string
          notes: string | null
          omie_id: string | null
          omie_synced_at: string | null
          phone: string | null
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          cnpj?: string | null
          contact_name?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          notes?: string | null
          omie_id?: string | null
          omie_synced_at?: string | null
          phone?: string | null
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          cnpj?: string | null
          contact_name?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          notes?: string | null
          omie_id?: string | null
          omie_synced_at?: string | null
          phone?: string | null
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fin_clients_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      fin_cost_centers: {
        Row: {
          category: string | null
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          requires_project: boolean | null
          slug: string
          tenant_id: string
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          requires_project?: boolean | null
          slug: string
          tenant_id: string
        }
        Update: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          requires_project?: boolean | null
          slug?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fin_cost_centers_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      fin_transactions: {
        Row: {
          amount: number
          bank_account: string | null
          category_id: string | null
          client_id: string | null
          cost_center_id: string | null
          created_at: string | null
          created_by: string | null
          date: string
          description: string
          document_number: string | null
          due_date: string | null
          id: string
          invoice_id: string | null
          is_realized: boolean | null
          notes: string | null
          omie_id: string | null
          paid_date: string | null
          payment_method: string | null
          project_id: string | null
          recurrence: string | null
          recurrence_end: string | null
          status: string | null
          tags: string[] | null
          tenant_id: string
          type: string
          updated_at: string | null
          vendor_id: string | null
        }
        Insert: {
          amount: number
          bank_account?: string | null
          category_id?: string | null
          client_id?: string | null
          cost_center_id?: string | null
          created_at?: string | null
          created_by?: string | null
          date: string
          description: string
          document_number?: string | null
          due_date?: string | null
          id?: string
          invoice_id?: string | null
          is_realized?: boolean | null
          notes?: string | null
          omie_id?: string | null
          paid_date?: string | null
          payment_method?: string | null
          project_id?: string | null
          recurrence?: string | null
          recurrence_end?: string | null
          status?: string | null
          tags?: string[] | null
          tenant_id: string
          type: string
          updated_at?: string | null
          vendor_id?: string | null
        }
        Update: {
          amount?: number
          bank_account?: string | null
          category_id?: string | null
          client_id?: string | null
          cost_center_id?: string | null
          created_at?: string | null
          created_by?: string | null
          date?: string
          description?: string
          document_number?: string | null
          due_date?: string | null
          id?: string
          invoice_id?: string | null
          is_realized?: boolean | null
          notes?: string | null
          omie_id?: string | null
          paid_date?: string | null
          payment_method?: string | null
          project_id?: string | null
          recurrence?: string | null
          recurrence_end?: string | null
          status?: string | null
          tags?: string[] | null
          tenant_id?: string
          type?: string
          updated_at?: string | null
          vendor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fin_transactions_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "fin_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fin_transactions_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "fin_clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fin_transactions_cost_center_id_fkey"
            columns: ["cost_center_id"]
            isOneToOne: false
            referencedRelation: "fin_cost_centers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fin_transactions_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fin_transactions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fin_transactions_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "fin_vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      fin_vendors: {
        Row: {
          category: string | null
          cnpj: string | null
          created_at: string | null
          email: string | null
          id: string
          is_active: boolean | null
          name: string
          notes: string | null
          omie_id: string | null
          omie_synced_at: string | null
          phone: string | null
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          category?: string | null
          cnpj?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          notes?: string | null
          omie_id?: string | null
          omie_synced_at?: string | null
          phone?: string | null
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          category?: string | null
          cnpj?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          notes?: string | null
          omie_id?: string | null
          omie_synced_at?: string | null
          phone?: string | null
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fin_vendors_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      finance_ai_suggestions: {
        Row: {
          confidence: number | null
          context_json: Json
          created_at: string
          id: string
          input_hash: string
          latency_ms: number | null
          model_used: string
          reasoning: string | null
          resolved_at: string | null
          resolved_by: string | null
          status: string
          suggestion_json: Json
          tenant_id: string
          tokens_used: number | null
          type: string
        }
        Insert: {
          confidence?: number | null
          context_json?: Json
          created_at?: string
          id?: string
          input_hash: string
          latency_ms?: number | null
          model_used?: string
          reasoning?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
          suggestion_json: Json
          tenant_id: string
          tokens_used?: number | null
          type: string
        }
        Update: {
          confidence?: number | null
          context_json?: Json
          created_at?: string
          id?: string
          input_hash?: string
          latency_ms?: number | null
          model_used?: string
          reasoning?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
          suggestion_json?: Json
          tenant_id?: string
          tokens_used?: number | null
          type?: string
        }
        Relationships: []
      }
      finance_bank_accounts: {
        Row: {
          account_number: string | null
          account_type: string | null
          agency: string | null
          balance: number | null
          bank_code: string | null
          bank_name: string | null
          created_at: string | null
          id: string
          is_active: boolean | null
          last_sync_at: string | null
          name: string
          notes: string | null
          omie_id: string | null
          omie_synced_at: string | null
          status: string
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          account_number?: string | null
          account_type?: string | null
          agency?: string | null
          balance?: number | null
          bank_code?: string | null
          bank_name?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          last_sync_at?: string | null
          name: string
          notes?: string | null
          omie_id?: string | null
          omie_synced_at?: string | null
          status?: string
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          account_number?: string | null
          account_type?: string | null
          agency?: string | null
          balance?: number | null
          bank_code?: string | null
          bank_name?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          last_sync_at?: string | null
          name?: string
          notes?: string | null
          omie_id?: string | null
          omie_synced_at?: string | null
          status?: string
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "finance_bank_accounts_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      finance_bank_statements: {
        Row: {
          amount: number
          balance: number | null
          bank_account_id: string | null
          category: string | null
          created_at: string | null
          date: string
          description: string | null
          document_number: string | null
          id: string
          omie_id: string | null
          omie_raw: Json | null
          tenant_id: string
          type: string
          updated_at: string | null
        }
        Insert: {
          amount?: number
          balance?: number | null
          bank_account_id?: string | null
          category?: string | null
          created_at?: string | null
          date: string
          description?: string | null
          document_number?: string | null
          id?: string
          omie_id?: string | null
          omie_raw?: Json | null
          tenant_id: string
          type?: string
          updated_at?: string | null
        }
        Update: {
          amount?: number
          balance?: number | null
          bank_account_id?: string | null
          category?: string | null
          created_at?: string | null
          date?: string
          description?: string | null
          document_number?: string | null
          id?: string
          omie_id?: string | null
          omie_raw?: Json | null
          tenant_id?: string
          type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "finance_bank_statements_bank_account_id_fkey"
            columns: ["bank_account_id"]
            isOneToOne: false
            referencedRelation: "finance_bank_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "finance_bank_statements_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      finance_bank_transactions: {
        Row: {
          amount: number
          bank_account_id: string
          category: string | null
          created_at: string
          description: string
          finance_tx_id: string | null
          id: string
          ofx_id: string | null
          reconciled: boolean
          reconciled_at: string | null
          reconciled_by: string | null
          reference_id: string | null
          tenant_id: string
          transaction_date: string
          type: string
        }
        Insert: {
          amount: number
          bank_account_id: string
          category?: string | null
          created_at?: string
          description?: string
          finance_tx_id?: string | null
          id?: string
          ofx_id?: string | null
          reconciled?: boolean
          reconciled_at?: string | null
          reconciled_by?: string | null
          reference_id?: string | null
          tenant_id: string
          transaction_date: string
          type: string
        }
        Update: {
          amount?: number
          bank_account_id?: string
          category?: string | null
          created_at?: string
          description?: string
          finance_tx_id?: string | null
          id?: string
          ofx_id?: string | null
          reconciled?: boolean
          reconciled_at?: string | null
          reconciled_by?: string | null
          reference_id?: string | null
          tenant_id?: string
          transaction_date?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "finance_bank_transactions_bank_account_id_fkey"
            columns: ["bank_account_id"]
            isOneToOne: false
            referencedRelation: "finance_bank_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "finance_bank_transactions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      finance_boletos: {
        Row: {
          amount: number
          bank_return_code: string | null
          barcode: string
          created_at: string
          created_by: string | null
          digitable_line: string
          due_date: string
          id: string
          instructions: string | null
          invoice_id: string | null
          nosso_numero: string
          paid_amount: number | null
          paid_at: string | null
          payer_address: string | null
          payer_document: string | null
          payer_name: string | null
          remessa_sent_at: string | null
          status: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          amount: number
          bank_return_code?: string | null
          barcode: string
          created_at?: string
          created_by?: string | null
          digitable_line: string
          due_date: string
          id?: string
          instructions?: string | null
          invoice_id?: string | null
          nosso_numero: string
          paid_amount?: number | null
          paid_at?: string | null
          payer_address?: string | null
          payer_document?: string | null
          payer_name?: string | null
          remessa_sent_at?: string | null
          status?: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          amount?: number
          bank_return_code?: string | null
          barcode?: string
          created_at?: string
          created_by?: string | null
          digitable_line?: string
          due_date?: string
          id?: string
          instructions?: string | null
          invoice_id?: string | null
          nosso_numero?: string
          paid_amount?: number | null
          paid_at?: string | null
          payer_address?: string | null
          payer_document?: string | null
          payer_name?: string | null
          remessa_sent_at?: string | null
          status?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "finance_boletos_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      finance_categories: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          name: string
          omie_id: string | null
          tenant_id: string
          type: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          omie_id?: string | null
          tenant_id: string
          type?: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          omie_id?: string | null
          tenant_id?: string
          type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "finance_categories_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      finance_chart_of_accounts: {
        Row: {
          code: string
          created_at: string
          dre_group: string
          dre_order: number
          id: string
          is_active: boolean
          name: string
          omie_id: string | null
          parent_id: string | null
          tenant_id: string
          tipo: string
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          dre_group: string
          dre_order?: number
          id?: string
          is_active?: boolean
          name: string
          omie_id?: string | null
          parent_id?: string | null
          tenant_id: string
          tipo: string
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          dre_group?: string
          dre_order?: number
          id?: string
          is_active?: boolean
          name?: string
          omie_id?: string | null
          parent_id?: string | null
          tenant_id?: string
          tipo?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "finance_chart_of_accounts_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "finance_chart_of_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "finance_chart_of_accounts_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      finance_clients: {
        Row: {
          cnpj: string | null
          contact_name: string | null
          created_at: string | null
          email: string | null
          id: string
          is_active: boolean | null
          name: string
          notes: string | null
          omie_id: string | null
          omie_synced_at: string | null
          phone: string | null
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          cnpj?: string | null
          contact_name?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          notes?: string | null
          omie_id?: string | null
          omie_synced_at?: string | null
          phone?: string | null
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          cnpj?: string | null
          contact_name?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          notes?: string | null
          omie_id?: string | null
          omie_synced_at?: string | null
          phone?: string | null
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "finance_clients_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      finance_cost_centers: {
        Row: {
          business_unit_override: string | null
          code: string
          created_at: string | null
          id: string
          is_active: boolean | null
          name: string
          omie_id: string | null
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          business_unit_override?: string | null
          code: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          omie_id?: string | null
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          business_unit_override?: string | null
          code?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          omie_id?: string | null
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "finance_cost_centers_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      finance_data_quality_log: {
        Row: {
          anomalies_flagged: number
          confidence_score: number | null
          counterpart_resolved: number
          created_at: string
          details: Json
          errors: Json
          finished_at: string | null
          id: string
          paid_amount_fixed: number
          rateio_split: number
          reconciled: number
          started_at: string
          status_fixed: number
          tenant_id: string
          trigger_source: string
        }
        Insert: {
          anomalies_flagged?: number
          confidence_score?: number | null
          counterpart_resolved?: number
          created_at?: string
          details?: Json
          errors?: Json
          finished_at?: string | null
          id?: string
          paid_amount_fixed?: number
          rateio_split?: number
          reconciled?: number
          started_at?: string
          status_fixed?: number
          tenant_id: string
          trigger_source?: string
        }
        Update: {
          anomalies_flagged?: number
          confidence_score?: number | null
          counterpart_resolved?: number
          created_at?: string
          details?: Json
          errors?: Json
          finished_at?: string | null
          id?: string
          paid_amount_fixed?: number
          rateio_split?: number
          reconciled?: number
          started_at?: string
          status_fixed?: number
          tenant_id?: string
          trigger_source?: string
        }
        Relationships: [
          {
            foreignKeyName: "finance_data_quality_log_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      finance_dre_snapshots: {
        Row: {
          computed_at: string
          created_at: string
          custo_producao: number
          deducoes: number
          depreciacao: number
          desp_admin: number
          desp_marketing: number
          desp_outros: number
          desp_pessoal: number
          desp_tecnologia: number
          ebit: number | null
          ebitda: number | null
          id: string
          irpj_csll: number
          lair: number | null
          lucro_bruto: number | null
          lucro_liquido: number | null
          meta_ebitda: number | null
          meta_receita: number | null
          month: string
          notes: string | null
          receita_bruta: number
          receita_liquida: number | null
          result_financeiro: number
          source: string
          tenant_id: string
          total_desp_op: number | null
          updated_at: string
        }
        Insert: {
          computed_at?: string
          created_at?: string
          custo_producao?: number
          deducoes?: number
          depreciacao?: number
          desp_admin?: number
          desp_marketing?: number
          desp_outros?: number
          desp_pessoal?: number
          desp_tecnologia?: number
          ebit?: number | null
          ebitda?: number | null
          id?: string
          irpj_csll?: number
          lair?: number | null
          lucro_bruto?: number | null
          lucro_liquido?: number | null
          meta_ebitda?: number | null
          meta_receita?: number | null
          month: string
          notes?: string | null
          receita_bruta?: number
          receita_liquida?: number | null
          result_financeiro?: number
          source?: string
          tenant_id: string
          total_desp_op?: number | null
          updated_at?: string
        }
        Update: {
          computed_at?: string
          created_at?: string
          custo_producao?: number
          deducoes?: number
          depreciacao?: number
          desp_admin?: number
          desp_marketing?: number
          desp_outros?: number
          desp_pessoal?: number
          desp_tecnologia?: number
          ebit?: number | null
          ebitda?: number | null
          id?: string
          irpj_csll?: number
          lair?: number | null
          lucro_bruto?: number | null
          lucro_liquido?: number | null
          meta_ebitda?: number | null
          meta_receita?: number | null
          month?: string
          notes?: string | null
          receita_bruta?: number
          receita_liquida?: number | null
          result_financeiro?: number
          source?: string
          tenant_id?: string
          total_desp_op?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "finance_dre_snapshots_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      finance_notas_fiscais: {
        Row: {
          aliquota_cofins: number
          aliquota_csll: number
          aliquota_ir: number
          aliquota_iss: number
          aliquota_pis: number
          chave_acesso: string | null
          codigo_cnae: string | null
          codigo_municipio: string | null
          codigo_tributacao_municipio: string | null
          created_at: string
          created_by: string | null
          data_cancelamento: string | null
          data_competencia: string | null
          data_emissao: string | null
          discriminacao: string | null
          id: string
          iss_retido: boolean
          motivo_cancelamento: string | null
          natureza_operacao: number
          numero: string | null
          numero_rps: string | null
          pdf_url: string | null
          prestador_cnpj: string | null
          prestador_im: string | null
          prestador_razao: string | null
          protocolo: string | null
          regime_especial_tributacao: number | null
          serie: string | null
          serie_rps: string | null
          status: string
          tenant_id: string
          tipo: string
          tomador_cnpj: string | null
          tomador_cpf: string | null
          tomador_email: string | null
          tomador_endereco: Json | null
          tomador_razao: string | null
          transaction_id: string | null
          updated_at: string
          updated_by: string | null
          valor_base_calculo: number
          valor_cofins: number
          valor_csll: number
          valor_deducoes: number
          valor_desconto_condicionado: number
          valor_desconto_incondicionado: number
          valor_ir: number
          valor_iss: number
          valor_liquido: number
          valor_pis: number
          valor_servicos: number
          valor_total_impostos: number
          xml_url: string | null
        }
        Insert: {
          aliquota_cofins?: number
          aliquota_csll?: number
          aliquota_ir?: number
          aliquota_iss?: number
          aliquota_pis?: number
          chave_acesso?: string | null
          codigo_cnae?: string | null
          codigo_municipio?: string | null
          codigo_tributacao_municipio?: string | null
          created_at?: string
          created_by?: string | null
          data_cancelamento?: string | null
          data_competencia?: string | null
          data_emissao?: string | null
          discriminacao?: string | null
          id?: string
          iss_retido?: boolean
          motivo_cancelamento?: string | null
          natureza_operacao?: number
          numero?: string | null
          numero_rps?: string | null
          pdf_url?: string | null
          prestador_cnpj?: string | null
          prestador_im?: string | null
          prestador_razao?: string | null
          protocolo?: string | null
          regime_especial_tributacao?: number | null
          serie?: string | null
          serie_rps?: string | null
          status?: string
          tenant_id: string
          tipo?: string
          tomador_cnpj?: string | null
          tomador_cpf?: string | null
          tomador_email?: string | null
          tomador_endereco?: Json | null
          tomador_razao?: string | null
          transaction_id?: string | null
          updated_at?: string
          updated_by?: string | null
          valor_base_calculo?: number
          valor_cofins?: number
          valor_csll?: number
          valor_deducoes?: number
          valor_desconto_condicionado?: number
          valor_desconto_incondicionado?: number
          valor_ir?: number
          valor_iss?: number
          valor_liquido?: number
          valor_pis?: number
          valor_servicos?: number
          valor_total_impostos?: number
          xml_url?: string | null
        }
        Update: {
          aliquota_cofins?: number
          aliquota_csll?: number
          aliquota_ir?: number
          aliquota_iss?: number
          aliquota_pis?: number
          chave_acesso?: string | null
          codigo_cnae?: string | null
          codigo_municipio?: string | null
          codigo_tributacao_municipio?: string | null
          created_at?: string
          created_by?: string | null
          data_cancelamento?: string | null
          data_competencia?: string | null
          data_emissao?: string | null
          discriminacao?: string | null
          id?: string
          iss_retido?: boolean
          motivo_cancelamento?: string | null
          natureza_operacao?: number
          numero?: string | null
          numero_rps?: string | null
          pdf_url?: string | null
          prestador_cnpj?: string | null
          prestador_im?: string | null
          prestador_razao?: string | null
          protocolo?: string | null
          regime_especial_tributacao?: number | null
          serie?: string | null
          serie_rps?: string | null
          status?: string
          tenant_id?: string
          tipo?: string
          tomador_cnpj?: string | null
          tomador_cpf?: string | null
          tomador_email?: string | null
          tomador_endereco?: Json | null
          tomador_razao?: string | null
          transaction_id?: string | null
          updated_at?: string
          updated_by?: string | null
          valor_base_calculo?: number
          valor_cofins?: number
          valor_csll?: number
          valor_deducoes?: number
          valor_desconto_condicionado?: number
          valor_desconto_incondicionado?: number
          valor_ir?: number
          valor_iss?: number
          valor_liquido?: number
          valor_pis?: number
          valor_servicos?: number
          valor_total_impostos?: number
          xml_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "finance_notas_fiscais_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "finance_notas_fiscais_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "finance_transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      finance_operational_indicators: {
        Row: {
          churn_clientes_perdidos: number | null
          created_at: string | null
          created_by: string | null
          custos_fixos: number | null
          folha_pagamento: number | null
          headcount: number | null
          id: string
          meta_margem: number | null
          meta_receita: number | null
          month: string
          notes: string | null
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          churn_clientes_perdidos?: number | null
          created_at?: string | null
          created_by?: string | null
          custos_fixos?: number | null
          folha_pagamento?: number | null
          headcount?: number | null
          id?: string
          meta_margem?: number | null
          meta_receita?: number | null
          month: string
          notes?: string | null
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          churn_clientes_perdidos?: number | null
          created_at?: string | null
          created_by?: string | null
          custos_fixos?: number | null
          folha_pagamento?: number | null
          headcount?: number | null
          id?: string
          meta_margem?: number | null
          meta_receita?: number | null
          month?: string
          notes?: string | null
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "finance_operational_indicators_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      finance_reconciliation_log: {
        Row: {
          bank_tx_id: string
          created_at: string
          finance_tx_id: string
          id: string
          method: string
          reconciled_by: string | null
          reversed_at: string | null
          reversed_by: string | null
          score: number | null
          tenant_id: string
        }
        Insert: {
          bank_tx_id: string
          created_at?: string
          finance_tx_id: string
          id?: string
          method: string
          reconciled_by?: string | null
          reversed_at?: string | null
          reversed_by?: string | null
          score?: number | null
          tenant_id: string
        }
        Update: {
          bank_tx_id?: string
          created_at?: string
          finance_tx_id?: string
          id?: string
          method?: string
          reconciled_by?: string | null
          reversed_at?: string | null
          reversed_by?: string | null
          score?: number | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "finance_reconciliation_log_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      finance_reconciliation_rules: {
        Row: {
          auto_match: boolean
          category: string | null
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean
          name: string
          pattern: string
          priority: number
          tenant_id: string
          updated_at: string
        }
        Insert: {
          auto_match?: boolean
          category?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          pattern: string
          priority?: number
          tenant_id: string
          updated_at?: string
        }
        Update: {
          auto_match?: boolean
          category?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          pattern?: string
          priority?: number
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "finance_reconciliation_rules_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      finance_recurring_rules: {
        Row: {
          amount: number
          bank_account: string | null
          business_unit: string | null
          category_id: string | null
          cost_center_id: string | null
          counterpart: string | null
          counterpart_doc: string | null
          created_at: string
          created_by: string | null
          day_of_month: number
          description: string
          end_month: string | null
          frequency: string
          id: string
          is_active: boolean
          notes: string | null
          payment_method: string | null
          start_month: string
          tags: string[] | null
          tenant_id: string
          type: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          amount: number
          bank_account?: string | null
          business_unit?: string | null
          category_id?: string | null
          cost_center_id?: string | null
          counterpart?: string | null
          counterpart_doc?: string | null
          created_at?: string
          created_by?: string | null
          day_of_month?: number
          description: string
          end_month?: string | null
          frequency?: string
          id?: string
          is_active?: boolean
          notes?: string | null
          payment_method?: string | null
          start_month: string
          tags?: string[] | null
          tenant_id: string
          type?: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          amount?: number
          bank_account?: string | null
          business_unit?: string | null
          category_id?: string | null
          cost_center_id?: string | null
          counterpart?: string | null
          counterpart_doc?: string | null
          created_at?: string
          created_by?: string | null
          day_of_month?: number
          description?: string
          end_month?: string | null
          frequency?: string
          id?: string
          is_active?: boolean
          notes?: string | null
          payment_method?: string | null
          start_month?: string
          tags?: string[] | null
          tenant_id?: string
          type?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "finance_recurring_rules_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "finance_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "finance_recurring_rules_cost_center_id_fkey"
            columns: ["cost_center_id"]
            isOneToOne: false
            referencedRelation: "finance_cost_centers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "finance_recurring_rules_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      finance_snapshots_daily: {
        Row: {
          created_at: string | null
          id: string
          payables_open: number | null
          receivables_open: number | null
          saldo_acumulado: number | null
          saldo_dia: number | null
          snapshot_date: string
          tenant_id: string
          total_despesas: number | null
          total_receitas: number | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          payables_open?: number | null
          receivables_open?: number | null
          saldo_acumulado?: number | null
          saldo_dia?: number | null
          snapshot_date: string
          tenant_id: string
          total_despesas?: number | null
          total_receitas?: number | null
        }
        Update: {
          created_at?: string | null
          id?: string
          payables_open?: number | null
          receivables_open?: number | null
          saldo_acumulado?: number | null
          saldo_dia?: number | null
          snapshot_date?: string
          tenant_id?: string
          total_despesas?: number | null
          total_receitas?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "finance_snapshots_daily_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      finance_tax_config: {
        Row: {
          aliquota_cofins: number
          aliquota_csll: number
          aliquota_ir: number
          aliquota_iss: number
          aliquota_pis: number
          cnpj: string | null
          codigo_cnae: string | null
          codigo_municipio: string | null
          created_at: string
          id: string
          incentivador_cultural: boolean
          optante_simples: boolean
          razao_social: string | null
          regime_tributario: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          aliquota_cofins?: number
          aliquota_csll?: number
          aliquota_ir?: number
          aliquota_iss?: number
          aliquota_pis?: number
          cnpj?: string | null
          codigo_cnae?: string | null
          codigo_municipio?: string | null
          created_at?: string
          id?: string
          incentivador_cultural?: boolean
          optante_simples?: boolean
          razao_social?: string | null
          regime_tributario?: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          aliquota_cofins?: number
          aliquota_csll?: number
          aliquota_ir?: number
          aliquota_iss?: number
          aliquota_pis?: number
          cnpj?: string | null
          codigo_cnae?: string | null
          codigo_municipio?: string | null
          created_at?: string
          id?: string
          incentivador_cultural?: boolean
          optante_simples?: boolean
          razao_social?: string | null
          regime_tributario?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "finance_tax_config_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: true
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      finance_team_payroll: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          is_active: boolean
          month: string
          name: string
          notes: string | null
          profile_id: string | null
          role: string
          salary: number
          section: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          month: string
          name: string
          notes?: string | null
          profile_id?: string | null
          role?: string
          salary?: number
          section?: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          month?: string
          name?: string
          notes?: string | null
          profile_id?: string | null
          role?: string
          salary?: number
          section?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "finance_team_payroll_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "active_team"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "finance_team_payroll_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "finance_team_payroll_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      finance_transactions: {
        Row: {
          amount: number
          bank_account: string | null
          bank_account_id: string | null
          business_unit: string | null
          category_id: string | null
          client_id: string | null
          contract_id: string | null
          cost_center_id: string | null
          counterpart: string | null
          counterpart_doc: string | null
          created_at: string | null
          created_by: string | null
          date: string
          description: string
          dq_flags: string[] | null
          dq_last_checked_at: string | null
          due_date: string | null
          id: string
          notes: string | null
          omie_categoria_codigo: string | null
          omie_departamento_codigo: string | null
          omie_desconto: number | null
          omie_id: string | null
          omie_juros: number | null
          omie_multa: number | null
          omie_num_titulo: string | null
          omie_raw: Json | null
          omie_synced_at: string | null
          paid_amount: number | null
          paid_date: string | null
          payment_method: string | null
          project_id: string | null
          reconciled_source: string | null
          recurring_rule_id: string | null
          responsible_id: string | null
          status: string
          tags: string[] | null
          tenant_id: string
          type: string
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          amount?: number
          bank_account?: string | null
          bank_account_id?: string | null
          business_unit?: string | null
          category_id?: string | null
          client_id?: string | null
          contract_id?: string | null
          cost_center_id?: string | null
          counterpart?: string | null
          counterpart_doc?: string | null
          created_at?: string | null
          created_by?: string | null
          date?: string
          description: string
          dq_flags?: string[] | null
          dq_last_checked_at?: string | null
          due_date?: string | null
          id?: string
          notes?: string | null
          omie_categoria_codigo?: string | null
          omie_departamento_codigo?: string | null
          omie_desconto?: number | null
          omie_id?: string | null
          omie_juros?: number | null
          omie_multa?: number | null
          omie_num_titulo?: string | null
          omie_raw?: Json | null
          omie_synced_at?: string | null
          paid_amount?: number | null
          paid_date?: string | null
          payment_method?: string | null
          project_id?: string | null
          reconciled_source?: string | null
          recurring_rule_id?: string | null
          responsible_id?: string | null
          status?: string
          tags?: string[] | null
          tenant_id: string
          type?: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          amount?: number
          bank_account?: string | null
          bank_account_id?: string | null
          business_unit?: string | null
          category_id?: string | null
          client_id?: string | null
          contract_id?: string | null
          cost_center_id?: string | null
          counterpart?: string | null
          counterpart_doc?: string | null
          created_at?: string | null
          created_by?: string | null
          date?: string
          description?: string
          dq_flags?: string[] | null
          dq_last_checked_at?: string | null
          due_date?: string | null
          id?: string
          notes?: string | null
          omie_categoria_codigo?: string | null
          omie_departamento_codigo?: string | null
          omie_desconto?: number | null
          omie_id?: string | null
          omie_juros?: number | null
          omie_multa?: number | null
          omie_num_titulo?: string | null
          omie_raw?: Json | null
          omie_synced_at?: string | null
          paid_amount?: number | null
          paid_date?: string | null
          payment_method?: string | null
          project_id?: string | null
          reconciled_source?: string | null
          recurring_rule_id?: string | null
          responsible_id?: string | null
          status?: string
          tags?: string[] | null
          tenant_id?: string
          type?: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "finance_transactions_bank_account_id_fkey"
            columns: ["bank_account_id"]
            isOneToOne: false
            referencedRelation: "finance_bank_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "finance_transactions_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "finance_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "finance_transactions_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "finance_transactions_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "finance_transactions_cost_center_id_fkey"
            columns: ["cost_center_id"]
            isOneToOne: false
            referencedRelation: "finance_cost_centers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "finance_transactions_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "finance_transactions_recurring_rule_id_fkey"
            columns: ["recurring_rule_id"]
            isOneToOne: false
            referencedRelation: "finance_recurring_rules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "finance_transactions_responsible_id_fkey"
            columns: ["responsible_id"]
            isOneToOne: false
            referencedRelation: "active_team"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "finance_transactions_responsible_id_fkey"
            columns: ["responsible_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "finance_transactions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      finance_vendors: {
        Row: {
          category: string | null
          cnpj: string | null
          created_at: string | null
          email: string | null
          id: string
          is_active: boolean | null
          name: string
          notes: string | null
          omie_id: string | null
          omie_synced_at: string | null
          phone: string | null
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          category?: string | null
          cnpj?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          notes?: string | null
          omie_id?: string | null
          omie_synced_at?: string | null
          phone?: string | null
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          category?: string | null
          cnpj?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          notes?: string | null
          omie_id?: string | null
          omie_synced_at?: string | null
          phone?: string | null
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "finance_vendors_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      financial_data: {
        Row: {
          category: string
          id: string
          is_realized: boolean | null
          month: string
          notes: string | null
          subcategory: string | null
          tenant_id: string | null
          updated_at: string | null
          updated_by: string | null
          value: number
          year: number
        }
        Insert: {
          category: string
          id?: string
          is_realized?: boolean | null
          month: string
          notes?: string | null
          subcategory?: string | null
          tenant_id?: string | null
          updated_at?: string | null
          updated_by?: string | null
          value?: number
          year: number
        }
        Update: {
          category?: string
          id?: string
          is_realized?: boolean | null
          month?: string
          notes?: string | null
          subcategory?: string | null
          tenant_id?: string | null
          updated_at?: string | null
          updated_by?: string | null
          value?: number
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "financial_data_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      financial_targets: {
        Row: {
          id: string
          target_type: string
          updated_at: string | null
          updated_by: string | null
          value: number
          year: number
        }
        Insert: {
          id?: string
          target_type: string
          updated_at?: string | null
          updated_by?: string | null
          value?: number
          year: number
        }
        Update: {
          id?: string
          target_type?: string
          updated_at?: string | null
          updated_by?: string | null
          value?: number
          year?: number
        }
        Relationships: []
      }
      fireflies_sync_log: {
        Row: {
          errors: Json | null
          finished_at: string | null
          id: string
          meetings_created: number | null
          meetings_fetched: number | null
          meetings_updated: number | null
          started_at: string | null
          status: string | null
          tenant_id: string
          transcriptions_synced: number | null
          trigger_source: string | null
          triggered_by: string | null
        }
        Insert: {
          errors?: Json | null
          finished_at?: string | null
          id?: string
          meetings_created?: number | null
          meetings_fetched?: number | null
          meetings_updated?: number | null
          started_at?: string | null
          status?: string | null
          tenant_id: string
          transcriptions_synced?: number | null
          trigger_source?: string | null
          triggered_by?: string | null
        }
        Update: {
          errors?: Json | null
          finished_at?: string | null
          id?: string
          meetings_created?: number | null
          meetings_fetched?: number | null
          meetings_updated?: number | null
          started_at?: string | null
          status?: string | null
          tenant_id?: string
          transcriptions_synced?: number | null
          trigger_source?: string | null
          triggered_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fireflies_sync_log_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      hr_calendar_events: {
        Row: {
          id: string
          tenant_id: string
          title: string
          description: string | null
          category: string
          start_date: string
          end_date: string | null
          is_all_day: boolean | null
          recurrence_rule: string | null
          color: string | null
          visibility: string | null
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          title: string
          description?: string | null
          category: string
          start_date: string
          end_date?: string | null
          is_all_day?: boolean | null
          recurrence_rule?: string | null
          color?: string | null
          visibility?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          title?: string
          description?: string | null
          category?: string
          start_date?: string
          end_date?: string | null
          is_all_day?: boolean | null
          recurrence_rule?: string | null
          color?: string | null
          visibility?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "hr_calendar_events_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      impact_metric_config: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          is_inverted: boolean | null
          metric_id: string
          tenant_id: string
          threshold: number | null
          updated_at: string | null
          weight: number | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          is_inverted?: boolean | null
          metric_id: string
          tenant_id: string
          threshold?: number | null
          updated_at?: string | null
          weight?: number | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          is_inverted?: boolean | null
          metric_id?: string
          tenant_id?: string
          threshold?: number | null
          updated_at?: string | null
          weight?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "impact_metric_config_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      inbox_notifications: {
        Row: {
          body: string | null
          created_at: string | null
          id: string
          is_read: boolean | null
          metadata: Json | null
          read_at: string | null
          tenant_id: string
          title: string
          type: string
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          metadata?: Json | null
          read_at?: string | null
          tenant_id: string
          title: string
          type?: string
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          metadata?: Json | null
          read_at?: string | null
          tenant_id?: string
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "inbox_notifications_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      integration_configs: {
        Row: {
          access_token_encrypted: string | null
          api_key_encrypted: string | null
          api_secret_encrypted: string | null
          created_at: string | null
          id: string
          is_active: boolean | null
          last_sync_at: string | null
          last_sync_error: string | null
          last_sync_status: string | null
          provider: string
          refresh_token_encrypted: string | null
          settings: Json | null
          tenant_id: string
          token_expires_at: string | null
          updated_at: string | null
        }
        Insert: {
          access_token_encrypted?: string | null
          api_key_encrypted?: string | null
          api_secret_encrypted?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          last_sync_at?: string | null
          last_sync_error?: string | null
          last_sync_status?: string | null
          provider: string
          refresh_token_encrypted?: string | null
          settings?: Json | null
          tenant_id: string
          token_expires_at?: string | null
          updated_at?: string | null
        }
        Update: {
          access_token_encrypted?: string | null
          api_key_encrypted?: string | null
          api_secret_encrypted?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          last_sync_at?: string | null
          last_sync_error?: string | null
          last_sync_status?: string | null
          provider?: string
          refresh_token_encrypted?: string | null
          settings?: Json | null
          tenant_id?: string
          token_expires_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "integration_configs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      knowledge_items: {
        Row: {
          author_id: string | null
          author_name: string | null
          category: string
          content: string | null
          created_at: string | null
          description: string | null
          id: string
          tags: string[] | null
          tenant_id: string | null
          title: string
          updated_at: string | null
          url: string | null
        }
        Insert: {
          author_id?: string | null
          author_name?: string | null
          category?: string
          content?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          tags?: string[] | null
          tenant_id?: string | null
          title: string
          updated_at?: string | null
          url?: string | null
        }
        Update: {
          author_id?: string | null
          author_name?: string | null
          category?: string
          content?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          tags?: string[] | null
          tenant_id?: string | null
          title?: string
          updated_at?: string | null
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "knowledge_items_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "active_team"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "knowledge_items_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "knowledge_items_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      knowledge_sop_steps: {
        Row: {
          content: string | null
          content_html: string | null
          created_at: string | null
          id: string
          media_url: string | null
          order_index: number
          sop_id: string
          step_type: string
          title: string
          updated_at: string | null
        }
        Insert: {
          content?: string | null
          content_html?: string | null
          created_at?: string | null
          id?: string
          media_url?: string | null
          order_index?: number
          sop_id: string
          step_type?: string
          title: string
          updated_at?: string | null
        }
        Update: {
          content?: string | null
          content_html?: string | null
          created_at?: string | null
          id?: string
          media_url?: string | null
          order_index?: number
          sop_id?: string
          step_type?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "knowledge_sop_steps_sop_id_fkey"
            columns: ["sop_id"]
            isOneToOne: false
            referencedRelation: "knowledge_sops"
            referencedColumns: ["id"]
          },
        ]
      }
      knowledge_sop_versions: {
        Row: {
          change_summary: string | null
          content: string | null
          created_at: string | null
          edited_by: string | null
          id: string
          sop_id: string
          title: string
          version: number
        }
        Insert: {
          change_summary?: string | null
          content?: string | null
          created_at?: string | null
          edited_by?: string | null
          id?: string
          sop_id: string
          title: string
          version: number
        }
        Update: {
          change_summary?: string | null
          content?: string | null
          created_at?: string | null
          edited_by?: string | null
          id?: string
          sop_id?: string
          title?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "knowledge_sop_versions_sop_id_fkey"
            columns: ["sop_id"]
            isOneToOne: false
            referencedRelation: "knowledge_sops"
            referencedColumns: ["id"]
          },
        ]
      }
      knowledge_sops: {
        Row: {
          author_id: string | null
          bu: string
          category: string
          content: string | null
          content_html: string | null
          created_at: string | null
          description: string | null
          id: string
          last_reviewed_at: string | null
          last_reviewed_by: string | null
          order_index: number | null
          priority: string
          slug: string
          status: string
          tags: string[] | null
          tenant_id: string
          title: string
          updated_at: string | null
          version: number
        }
        Insert: {
          author_id?: string | null
          bu: string
          category?: string
          content?: string | null
          content_html?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          last_reviewed_at?: string | null
          last_reviewed_by?: string | null
          order_index?: number | null
          priority?: string
          slug: string
          status?: string
          tags?: string[] | null
          tenant_id: string
          title: string
          updated_at?: string | null
          version?: number
        }
        Update: {
          author_id?: string | null
          bu?: string
          category?: string
          content?: string | null
          content_html?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          last_reviewed_at?: string | null
          last_reviewed_by?: string | null
          order_index?: number | null
          priority?: string
          slug?: string
          status?: string
          tags?: string[] | null
          tenant_id?: string
          title?: string
          updated_at?: string | null
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "knowledge_sops_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_clusters: {
        Row: {
          avg_click_rate: number | null
          avg_open_rate: number | null
          best_send_day: string | null
          best_send_hour: string | null
          cadence_per_week: number | null
          cluster_id: string
          cluster_name: string
          description: string | null
          id: string
          porte: string | null
          segment: string | null
          total_contacts: number | null
          updated_at: string | null
        }
        Insert: {
          avg_click_rate?: number | null
          avg_open_rate?: number | null
          best_send_day?: string | null
          best_send_hour?: string | null
          cadence_per_week?: number | null
          cluster_id: string
          cluster_name: string
          description?: string | null
          id?: string
          porte?: string | null
          segment?: string | null
          total_contacts?: number | null
          updated_at?: string | null
        }
        Update: {
          avg_click_rate?: number | null
          avg_open_rate?: number | null
          best_send_day?: string | null
          best_send_hour?: string | null
          cadence_per_week?: number | null
          cluster_id?: string
          cluster_name?: string
          description?: string | null
          id?: string
          porte?: string | null
          segment?: string | null
          total_contacts?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      likes: {
        Row: {
          created_at: string | null
          id: string
          target_id: string
          target_type: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          target_id: string
          target_type: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          target_id?: string
          target_type?: string
          user_id?: string
        }
        Relationships: []
      }
      market_research: {
        Row: {
          author_id: string | null
          category: string | null
          created_at: string | null
          description: string | null
          id: string
          published_at: string | null
          status: string | null
          tags: string[] | null
          tenant_id: string
          title: string
          updated_at: string | null
        }
        Insert: {
          author_id?: string | null
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          published_at?: string | null
          status?: string | null
          tags?: string[] | null
          tenant_id: string
          title: string
          updated_at?: string | null
        }
        Update: {
          author_id?: string | null
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          published_at?: string | null
          status?: string | null
          tags?: string[] | null
          tenant_id?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "market_research_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      market_sources: {
        Row: {
          created_at: string | null
          id: string
          notes: string | null
          research_id: string | null
          source_type: string | null
          title: string
          url: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          notes?: string | null
          research_id?: string | null
          source_type?: string | null
          title: string
          url?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          notes?: string | null
          research_id?: string | null
          source_type?: string | null
          title?: string
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "market_sources_research_id_fkey"
            columns: ["research_id"]
            isOneToOne: false
            referencedRelation: "market_research"
            referencedColumns: ["id"]
          },
        ]
      }
      meeting_participants: {
        Row: {
          created_at: string | null
          display_name: string | null
          email: string | null
          id: string
          is_tbo: boolean | null
          meeting_id: string
          profile_id: string | null
          tenant_id: string
        }
        Insert: {
          created_at?: string | null
          display_name?: string | null
          email?: string | null
          id?: string
          is_tbo?: boolean | null
          meeting_id: string
          profile_id?: string | null
          tenant_id: string
        }
        Update: {
          created_at?: string | null
          display_name?: string | null
          email?: string | null
          id?: string
          is_tbo?: boolean | null
          meeting_id?: string
          profile_id?: string | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "meeting_participants_meeting_id_fkey"
            columns: ["meeting_id"]
            isOneToOne: false
            referencedRelation: "meetings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meeting_participants_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "active_team"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meeting_participants_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meeting_participants_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      meeting_transcriptions: {
        Row: {
          created_at: string | null
          end_time: number | null
          id: string
          meeting_id: string
          raw_index: number | null
          speaker_email: string | null
          speaker_name: string | null
          start_time: number | null
          tenant_id: string
          text: string
        }
        Insert: {
          created_at?: string | null
          end_time?: number | null
          id?: string
          meeting_id: string
          raw_index?: number | null
          speaker_email?: string | null
          speaker_name?: string | null
          start_time?: number | null
          tenant_id: string
          text: string
        }
        Update: {
          created_at?: string | null
          end_time?: number | null
          id?: string
          meeting_id?: string
          raw_index?: number | null
          speaker_email?: string | null
          speaker_name?: string | null
          start_time?: number | null
          tenant_id?: string
          text?: string
        }
        Relationships: [
          {
            foreignKeyName: "meeting_transcriptions_meeting_id_fkey"
            columns: ["meeting_id"]
            isOneToOne: false
            referencedRelation: "meetings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meeting_transcriptions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      meetings: {
        Row: {
          action_items: Json | null
          agenda: string | null
          audio_url: string | null
          category: string | null
          created_at: string | null
          created_by: string | null
          date: string | null
          duration_minutes: number | null
          fireflies_id: string | null
          fireflies_url: string | null
          host_email: string | null
          id: string
          keywords: string[] | null
          legacy_id: string | null
          meeting_link: string | null
          name: string | null
          notes: string | null
          organizer_email: string | null
          overview: string | null
          participants: string[] | null
          project_id: string | null
          project_name: string | null
          short_summary: string | null
          status: string
          summary: string | null
          sync_source: string | null
          synced_at: string | null
          tenant_id: string | null
          time: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          action_items?: Json | null
          agenda?: string | null
          audio_url?: string | null
          category?: string | null
          created_at?: string | null
          created_by?: string | null
          date?: string | null
          duration_minutes?: number | null
          fireflies_id?: string | null
          fireflies_url?: string | null
          host_email?: string | null
          id?: string
          keywords?: string[] | null
          legacy_id?: string | null
          meeting_link?: string | null
          name?: string | null
          notes?: string | null
          organizer_email?: string | null
          overview?: string | null
          participants?: string[] | null
          project_id?: string | null
          project_name?: string | null
          short_summary?: string | null
          status?: string
          summary?: string | null
          sync_source?: string | null
          synced_at?: string | null
          tenant_id?: string | null
          time?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          action_items?: Json | null
          agenda?: string | null
          audio_url?: string | null
          category?: string | null
          created_at?: string | null
          created_by?: string | null
          date?: string | null
          duration_minutes?: number | null
          fireflies_id?: string | null
          fireflies_url?: string | null
          host_email?: string | null
          id?: string
          keywords?: string[] | null
          legacy_id?: string | null
          meeting_link?: string | null
          name?: string | null
          notes?: string | null
          organizer_email?: string | null
          overview?: string | null
          participants?: string[] | null
          project_id?: string | null
          project_name?: string | null
          short_summary?: string | null
          status?: string
          summary?: string | null
          sync_source?: string | null
          synced_at?: string | null
          tenant_id?: string | null
          time?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "meetings_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "active_team"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meetings_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meetings_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      monthly_closings: {
        Row: {
          created_at: string | null
          id: string
          locked: boolean | null
          locked_at: string | null
          locked_by: string | null
          month: number
          notes: string | null
          snapshot: Json | null
          tenant_id: string | null
          updated_at: string | null
          year: number
        }
        Insert: {
          created_at?: string | null
          id?: string
          locked?: boolean | null
          locked_at?: string | null
          locked_by?: string | null
          month: number
          notes?: string | null
          snapshot?: Json | null
          tenant_id?: string | null
          updated_at?: string | null
          year: number
        }
        Update: {
          created_at?: string | null
          id?: string
          locked?: boolean | null
          locked_at?: string | null
          locked_by?: string | null
          month?: number
          notes?: string | null
          snapshot?: Json | null
          tenant_id?: string | null
          updated_at?: string | null
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "monthly_closings_locked_by_fkey"
            columns: ["locked_by"]
            isOneToOne: false
            referencedRelation: "active_team"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "monthly_closings_locked_by_fkey"
            columns: ["locked_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "monthly_closings_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      my_tasks_order: {
        Row: {
          section_id: string | null
          sort_order: number
          task_id: string
          user_id: string
        }
        Insert: {
          section_id?: string | null
          sort_order?: number
          task_id: string
          user_id: string
        }
        Update: {
          section_id?: string | null
          sort_order?: number
          task_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "my_tasks_order_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "my_tasks_sections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "my_tasks_order_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "os_tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      my_tasks_preferences: {
        Row: {
          filters: Json
          group_by: string
          show_completed: boolean
          sort_by: string
          sort_direction: string
          tenant_id: string
          updated_at: string
          user_id: string
          view_mode: string
        }
        Insert: {
          filters?: Json
          group_by?: string
          show_completed?: boolean
          sort_by?: string
          sort_direction?: string
          tenant_id: string
          updated_at?: string
          user_id: string
          view_mode?: string
        }
        Update: {
          filters?: Json
          group_by?: string
          show_completed?: boolean
          sort_by?: string
          sort_direction?: string
          tenant_id?: string
          updated_at?: string
          user_id?: string
          view_mode?: string
        }
        Relationships: [
          {
            foreignKeyName: "my_tasks_preferences_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      my_tasks_rules: {
        Row: {
          action_config: Json
          action_type: string
          created_at: string
          id: string
          is_active: boolean
          tenant_id: string
          trigger_config: Json
          trigger_type: string
          user_id: string
        }
        Insert: {
          action_config?: Json
          action_type: string
          created_at?: string
          id?: string
          is_active?: boolean
          tenant_id: string
          trigger_config?: Json
          trigger_type: string
          user_id: string
        }
        Update: {
          action_config?: Json
          action_type?: string
          created_at?: string
          id?: string
          is_active?: boolean
          tenant_id?: string
          trigger_config?: Json
          trigger_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "my_tasks_rules_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      my_tasks_sections: {
        Row: {
          created_at: string
          id: string
          is_default: boolean
          name: string
          sort_order: number
          tenant_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_default?: boolean
          name: string
          sort_order?: number
          tenant_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_default?: boolean
          name?: string
          sort_order?: number
          tenant_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "my_tasks_sections_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          action_url: string | null
          actor_id: string | null
          body: string | null
          created_at: string | null
          entity_id: string | null
          entity_type: string | null
          id: string
          read: boolean | null
          tenant_id: string | null
          title: string
          trigger_type: string | null
          type: string | null
          user_id: string
        }
        Insert: {
          action_url?: string | null
          actor_id?: string | null
          body?: string | null
          created_at?: string | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          read?: boolean | null
          tenant_id?: string | null
          title: string
          trigger_type?: string | null
          type?: string | null
          user_id: string
        }
        Update: {
          action_url?: string | null
          actor_id?: string | null
          body?: string | null
          created_at?: string | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          read?: boolean | null
          tenant_id?: string | null
          title?: string
          trigger_type?: string | null
          type?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "active_team"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notion_integrations: {
        Row: {
          access_token: string
          connected_at: string | null
          connected_by: string | null
          id: string
          owner_name: string | null
          tenant_id: string
          workspace_id: string | null
          workspace_name: string | null
        }
        Insert: {
          access_token: string
          connected_at?: string | null
          connected_by?: string | null
          id?: string
          owner_name?: string | null
          tenant_id: string
          workspace_id?: string | null
          workspace_name?: string | null
        }
        Update: {
          access_token?: string
          connected_at?: string | null
          connected_by?: string | null
          id?: string
          owner_name?: string | null
          tenant_id?: string
          workspace_id?: string | null
          workspace_name?: string | null
        }
        Relationships: []
      }
      okr_checkins: {
        Row: {
          author_id: string
          confidence: string | null
          created_at: string | null
          id: string
          key_result_id: string
          new_value: number
          notes: string | null
          previous_value: number | null
          tenant_id: string
        }
        Insert: {
          author_id: string
          confidence?: string | null
          created_at?: string | null
          id?: string
          key_result_id: string
          new_value: number
          notes?: string | null
          previous_value?: number | null
          tenant_id: string
        }
        Update: {
          author_id?: string
          confidence?: string | null
          created_at?: string | null
          id?: string
          key_result_id?: string
          new_value?: number
          notes?: string | null
          previous_value?: number | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "okr_checkins_key_result_id_fkey"
            columns: ["key_result_id"]
            isOneToOne: false
            referencedRelation: "okr_key_results"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "okr_checkins_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      okr_cycles: {
        Row: {
          created_at: string
          end_date: string | null
          id: string
          is_active: boolean
          name: string
          start_date: string
          tenant_id: string
        }
        Insert: {
          created_at?: string
          end_date?: string | null
          id?: string
          is_active?: boolean
          name?: string
          start_date?: string
          tenant_id: string
        }
        Update: {
          created_at?: string
          end_date?: string | null
          id?: string
          is_active?: boolean
          name?: string
          start_date?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "okr_cycles_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      okr_key_results: {
        Row: {
          confidence: string | null
          created_at: string | null
          current_value: number | null
          id: string
          metric_type: string | null
          objective_id: string
          owner_id: string | null
          start_value: number | null
          status: string | null
          target_value: number
          tenant_id: string
          title: string
          unit: string | null
          updated_at: string | null
        }
        Insert: {
          confidence?: string | null
          created_at?: string | null
          current_value?: number | null
          id?: string
          metric_type?: string | null
          objective_id: string
          owner_id?: string | null
          start_value?: number | null
          status?: string | null
          target_value: number
          tenant_id: string
          title: string
          unit?: string | null
          updated_at?: string | null
        }
        Update: {
          confidence?: string | null
          created_at?: string | null
          current_value?: number | null
          id?: string
          metric_type?: string | null
          objective_id?: string
          owner_id?: string | null
          start_value?: number | null
          status?: string | null
          target_value?: number
          tenant_id?: string
          title?: string
          unit?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "okr_key_results_objective_id_fkey"
            columns: ["objective_id"]
            isOneToOne: false
            referencedRelation: "okr_objectives"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "okr_key_results_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      okr_objectives: {
        Row: {
          bu: string | null
          created_at: string | null
          description: string | null
          id: string
          level: string
          owner_id: string
          parent_id: string | null
          period: string
          progress: number | null
          status: string | null
          tenant_id: string
          title: string
          updated_at: string | null
        }
        Insert: {
          bu?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          level?: string
          owner_id: string
          parent_id?: string | null
          period: string
          progress?: number | null
          status?: string | null
          tenant_id: string
          title: string
          updated_at?: string | null
        }
        Update: {
          bu?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          level?: string
          owner_id?: string
          parent_id?: string | null
          period?: string
          progress?: number | null
          status?: string | null
          tenant_id?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "okr_objectives_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "okr_objectives"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "okr_objectives_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      omie_sync_log: {
        Row: {
          bank_accounts_synced: number | null
          categories_synced: number | null
          clients_synced: number | null
          current_phase: string | null
          duration_ms: number | null
          errors: Json | null
          extrato_synced: number | null
          finished_at: string | null
          id: string
          payables_synced: number | null
          receivables_synced: number | null
          started_at: string | null
          status: string | null
          tenant_id: string
          trigger_source: string | null
          triggered_by: string | null
          updated_at: string | null
          vendors_synced: number | null
        }
        Insert: {
          bank_accounts_synced?: number | null
          categories_synced?: number | null
          clients_synced?: number | null
          current_phase?: string | null
          duration_ms?: number | null
          errors?: Json | null
          extrato_synced?: number | null
          finished_at?: string | null
          id?: string
          payables_synced?: number | null
          receivables_synced?: number | null
          started_at?: string | null
          status?: string | null
          tenant_id: string
          trigger_source?: string | null
          triggered_by?: string | null
          updated_at?: string | null
          vendors_synced?: number | null
        }
        Update: {
          bank_accounts_synced?: number | null
          categories_synced?: number | null
          clients_synced?: number | null
          current_phase?: string | null
          duration_ms?: number | null
          errors?: Json | null
          extrato_synced?: number | null
          finished_at?: string | null
          id?: string
          payables_synced?: number | null
          receivables_synced?: number | null
          started_at?: string | null
          status?: string | null
          tenant_id?: string
          trigger_source?: string | null
          triggered_by?: string | null
          updated_at?: string | null
          vendors_synced?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "omie_sync_log_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      onboarding_atividades: {
        Row: {
          acao_conclusao: string | null
          descricao: string | null
          dia_id: string | null
          id: string
          obrigatorio: boolean | null
          ordem: number
          score_minimo: number | null
          tempo_estimado_min: number | null
          tipo: string
          titulo: string
          url_conteudo: string | null
        }
        Insert: {
          acao_conclusao?: string | null
          descricao?: string | null
          dia_id?: string | null
          id?: string
          obrigatorio?: boolean | null
          ordem: number
          score_minimo?: number | null
          tempo_estimado_min?: number | null
          tipo: string
          titulo: string
          url_conteudo?: string | null
        }
        Update: {
          acao_conclusao?: string | null
          descricao?: string | null
          dia_id?: string | null
          id?: string
          obrigatorio?: boolean | null
          ordem?: number
          score_minimo?: number | null
          tempo_estimado_min?: number | null
          tipo?: string
          titulo?: string
          url_conteudo?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "onboarding_atividades_dia_id_fkey"
            columns: ["dia_id"]
            isOneToOne: false
            referencedRelation: "onboarding_dias"
            referencedColumns: ["id"]
          },
        ]
      }
      onboarding_checkins: {
        Row: {
          agendado_para: string | null
          anotacoes: string | null
          colaborador_id: string | null
          dia_numero: number | null
          duracao_min: number | null
          id: string
          realizado: boolean | null
          realizado_em: string | null
          responsavel_id: string | null
        }
        Insert: {
          agendado_para?: string | null
          anotacoes?: string | null
          colaborador_id?: string | null
          dia_numero?: number | null
          duracao_min?: number | null
          id?: string
          realizado?: boolean | null
          realizado_em?: string | null
          responsavel_id?: string | null
        }
        Update: {
          agendado_para?: string | null
          anotacoes?: string | null
          colaborador_id?: string | null
          dia_numero?: number | null
          duracao_min?: number | null
          id?: string
          realizado?: boolean | null
          realizado_em?: string | null
          responsavel_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "onboarding_checkins_colaborador_id_fkey"
            columns: ["colaborador_id"]
            isOneToOne: false
            referencedRelation: "colaboradores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "onboarding_checkins_colaborador_id_fkey"
            columns: ["colaborador_id"]
            isOneToOne: false
            referencedRelation: "vw_colaboradores_inativos"
            referencedColumns: ["colaborador_id"]
          },
          {
            foreignKeyName: "onboarding_checkins_colaborador_id_fkey"
            columns: ["colaborador_id"]
            isOneToOne: false
            referencedRelation: "vw_progresso_onboarding"
            referencedColumns: ["colaborador_id"]
          },
          {
            foreignKeyName: "onboarding_checkins_responsavel_id_fkey"
            columns: ["responsavel_id"]
            isOneToOne: false
            referencedRelation: "colaboradores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "onboarding_checkins_responsavel_id_fkey"
            columns: ["responsavel_id"]
            isOneToOne: false
            referencedRelation: "vw_colaboradores_inativos"
            referencedColumns: ["colaborador_id"]
          },
          {
            foreignKeyName: "onboarding_checkins_responsavel_id_fkey"
            columns: ["responsavel_id"]
            isOneToOne: false
            referencedRelation: "vw_progresso_onboarding"
            referencedColumns: ["colaborador_id"]
          },
        ]
      }
      onboarding_dias: {
        Row: {
          carga: string | null
          duracao_checkin_min: number | null
          id: string
          numero: number
          tem_checkin_humano: boolean | null
          tema: string | null
          tipo_onboarding: string
          titulo: string
        }
        Insert: {
          carga?: string | null
          duracao_checkin_min?: number | null
          id?: string
          numero: number
          tem_checkin_humano?: boolean | null
          tema?: string | null
          tipo_onboarding: string
          titulo: string
        }
        Update: {
          carga?: string | null
          duracao_checkin_min?: number | null
          id?: string
          numero?: number
          tem_checkin_humano?: boolean | null
          tema?: string | null
          tipo_onboarding?: string
          titulo?: string
        }
        Relationships: []
      }
      onboarding_dias_liberados: {
        Row: {
          colaborador_id: string | null
          concluido: boolean | null
          concluido_em: string | null
          dia_id: string | null
          id: string
          liberado_em: string | null
        }
        Insert: {
          colaborador_id?: string | null
          concluido?: boolean | null
          concluido_em?: string | null
          dia_id?: string | null
          id?: string
          liberado_em?: string | null
        }
        Update: {
          colaborador_id?: string | null
          concluido?: boolean | null
          concluido_em?: string | null
          dia_id?: string | null
          id?: string
          liberado_em?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "onboarding_dias_liberados_colaborador_id_fkey"
            columns: ["colaborador_id"]
            isOneToOne: false
            referencedRelation: "colaboradores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "onboarding_dias_liberados_colaborador_id_fkey"
            columns: ["colaborador_id"]
            isOneToOne: false
            referencedRelation: "vw_colaboradores_inativos"
            referencedColumns: ["colaborador_id"]
          },
          {
            foreignKeyName: "onboarding_dias_liberados_colaborador_id_fkey"
            columns: ["colaborador_id"]
            isOneToOne: false
            referencedRelation: "vw_progresso_onboarding"
            referencedColumns: ["colaborador_id"]
          },
          {
            foreignKeyName: "onboarding_dias_liberados_dia_id_fkey"
            columns: ["dia_id"]
            isOneToOne: false
            referencedRelation: "onboarding_dias"
            referencedColumns: ["id"]
          },
        ]
      }
      onboarding_notificacoes: {
        Row: {
          colaborador_id: string | null
          destinatario: string | null
          enviado_em: string | null
          gatilho: string | null
          id: string
          lida: boolean | null
          lida_em: string | null
          mensagem: string | null
          status: string | null
          tipo: string | null
        }
        Insert: {
          colaborador_id?: string | null
          destinatario?: string | null
          enviado_em?: string | null
          gatilho?: string | null
          id?: string
          lida?: boolean | null
          lida_em?: string | null
          mensagem?: string | null
          status?: string | null
          tipo?: string | null
        }
        Update: {
          colaborador_id?: string | null
          destinatario?: string | null
          enviado_em?: string | null
          gatilho?: string | null
          id?: string
          lida?: boolean | null
          lida_em?: string | null
          mensagem?: string | null
          status?: string | null
          tipo?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "onboarding_notificacoes_colaborador_id_fkey"
            columns: ["colaborador_id"]
            isOneToOne: false
            referencedRelation: "colaboradores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "onboarding_notificacoes_colaborador_id_fkey"
            columns: ["colaborador_id"]
            isOneToOne: false
            referencedRelation: "vw_colaboradores_inativos"
            referencedColumns: ["colaborador_id"]
          },
          {
            foreignKeyName: "onboarding_notificacoes_colaborador_id_fkey"
            columns: ["colaborador_id"]
            isOneToOne: false
            referencedRelation: "vw_progresso_onboarding"
            referencedColumns: ["colaborador_id"]
          },
        ]
      }
      onboarding_progresso: {
        Row: {
          atividade_id: string | null
          colaborador_id: string | null
          concluido: boolean | null
          concluido_em: string | null
          feedback_rating: number | null
          id: string
          resposta_tarefa: string | null
          score: number | null
          tempo_gasto_seg: number | null
          tentativas: number | null
        }
        Insert: {
          atividade_id?: string | null
          colaborador_id?: string | null
          concluido?: boolean | null
          concluido_em?: string | null
          feedback_rating?: number | null
          id?: string
          resposta_tarefa?: string | null
          score?: number | null
          tempo_gasto_seg?: number | null
          tentativas?: number | null
        }
        Update: {
          atividade_id?: string | null
          colaborador_id?: string | null
          concluido?: boolean | null
          concluido_em?: string | null
          feedback_rating?: number | null
          id?: string
          resposta_tarefa?: string | null
          score?: number | null
          tempo_gasto_seg?: number | null
          tentativas?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "onboarding_progresso_atividade_id_fkey"
            columns: ["atividade_id"]
            isOneToOne: false
            referencedRelation: "onboarding_atividades"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "onboarding_progresso_colaborador_id_fkey"
            columns: ["colaborador_id"]
            isOneToOne: false
            referencedRelation: "colaboradores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "onboarding_progresso_colaborador_id_fkey"
            columns: ["colaborador_id"]
            isOneToOne: false
            referencedRelation: "vw_colaboradores_inativos"
            referencedColumns: ["colaborador_id"]
          },
          {
            foreignKeyName: "onboarding_progresso_colaborador_id_fkey"
            columns: ["colaborador_id"]
            isOneToOne: false
            referencedRelation: "vw_progresso_onboarding"
            referencedColumns: ["colaborador_id"]
          },
        ]
      }
      onboarding_templates: {
        Row: {
          created_at: string | null
          created_by: string | null
          id: string
          is_default: boolean | null
          name: string
          steps: Json
          tenant_id: string
          type: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_default?: boolean | null
          name: string
          steps?: Json
          tenant_id: string
          type: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_default?: boolean | null
          name?: string
          steps?: Json
          tenant_id?: string
          type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "onboarding_templates_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      one_on_one_actions: {
        Row: {
          ai_confidence: number | null
          assignee_id: string | null
          category: string | null
          completed: boolean | null
          completed_at: string | null
          created_at: string | null
          due_date: string | null
          id: string
          one_on_one_id: string
          pdi_link_id: string | null
          source: string | null
          tenant_id: string
          text: string
        }
        Insert: {
          ai_confidence?: number | null
          assignee_id?: string | null
          category?: string | null
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string | null
          due_date?: string | null
          id?: string
          one_on_one_id: string
          pdi_link_id?: string | null
          source?: string | null
          tenant_id: string
          text: string
        }
        Update: {
          ai_confidence?: number | null
          assignee_id?: string | null
          category?: string | null
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string | null
          due_date?: string | null
          id?: string
          one_on_one_id?: string
          pdi_link_id?: string | null
          source?: string | null
          tenant_id?: string
          text?: string
        }
        Relationships: [
          {
            foreignKeyName: "one_on_one_actions_one_on_one_id_fkey"
            columns: ["one_on_one_id"]
            isOneToOne: false
            referencedRelation: "one_on_ones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "one_on_one_actions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      one_on_one_transcript_logs: {
        Row: {
          ai_actions: Json | null
          ai_model: string | null
          ai_summary: string | null
          completed_at: string | null
          created_at: string | null
          error_message: string | null
          id: string
          meeting_id: string | null
          one_on_one_id: string
          raw_transcript: string | null
          status: string | null
          tenant_id: string
          tokens_used: number | null
        }
        Insert: {
          ai_actions?: Json | null
          ai_model?: string | null
          ai_summary?: string | null
          completed_at?: string | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          meeting_id?: string | null
          one_on_one_id: string
          raw_transcript?: string | null
          status?: string | null
          tenant_id: string
          tokens_used?: number | null
        }
        Update: {
          ai_actions?: Json | null
          ai_model?: string | null
          ai_summary?: string | null
          completed_at?: string | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          meeting_id?: string | null
          one_on_one_id?: string
          raw_transcript?: string | null
          status?: string | null
          tenant_id?: string
          tokens_used?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "one_on_one_transcript_logs_meeting_id_fkey"
            columns: ["meeting_id"]
            isOneToOne: false
            referencedRelation: "meetings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "one_on_one_transcript_logs_one_on_one_id_fkey"
            columns: ["one_on_one_id"]
            isOneToOne: false
            referencedRelation: "one_on_ones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "one_on_one_transcript_logs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      one_on_ones: {
        Row: {
          collaborator_id: string
          created_at: string | null
          created_by: string | null
          fireflies_meeting_id: string | null
          google_event_id: string | null
          id: string
          leader_id: string
          notes: string | null
          recurrence: string | null
          ritual_type_id: string | null
          scheduled_at: string
          status: string | null
          tenant_id: string
          transcript_processed_at: string | null
          transcript_summary: string | null
          updated_at: string | null
        }
        Insert: {
          collaborator_id: string
          created_at?: string | null
          created_by?: string | null
          fireflies_meeting_id?: string | null
          google_event_id?: string | null
          id?: string
          leader_id: string
          notes?: string | null
          recurrence?: string | null
          ritual_type_id?: string | null
          scheduled_at: string
          status?: string | null
          tenant_id: string
          transcript_processed_at?: string | null
          transcript_summary?: string | null
          updated_at?: string | null
        }
        Update: {
          collaborator_id?: string
          created_at?: string | null
          created_by?: string | null
          fireflies_meeting_id?: string | null
          google_event_id?: string | null
          id?: string
          leader_id?: string
          notes?: string | null
          recurrence?: string | null
          ritual_type_id?: string | null
          scheduled_at?: string
          status?: string | null
          tenant_id?: string
          transcript_processed_at?: string | null
          transcript_summary?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "one_on_ones_fireflies_meeting_id_fkey"
            columns: ["fireflies_meeting_id"]
            isOneToOne: false
            referencedRelation: "meetings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "one_on_ones_ritual_type_id_fkey"
            columns: ["ritual_type_id"]
            isOneToOne: false
            referencedRelation: "ritual_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "one_on_ones_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      operating_criteria: {
        Row: {
          id: string
          key: string
          label: string | null
          updated_at: string | null
          updated_by: string | null
          value: number
        }
        Insert: {
          id?: string
          key: string
          label?: string | null
          updated_at?: string | null
          updated_by?: string | null
          value?: number
        }
        Update: {
          id?: string
          key?: string
          label?: string | null
          updated_at?: string | null
          updated_by?: string | null
          value?: number
        }
        Relationships: []
      }
      os_custom_fields: {
        Row: {
          config_json: Json | null
          created_at: string | null
          id: string
          is_visible: boolean | null
          name: string
          order_index: number
          project_id: string | null
          scope: string
          tenant_id: string
          type: string
          updated_at: string | null
        }
        Insert: {
          config_json?: Json | null
          created_at?: string | null
          id?: string
          is_visible?: boolean | null
          name: string
          order_index?: number
          project_id?: string | null
          scope?: string
          tenant_id: string
          type: string
          updated_at?: string | null
        }
        Update: {
          config_json?: Json | null
          created_at?: string | null
          id?: string
          is_visible?: boolean | null
          name?: string
          order_index?: number
          project_id?: string | null
          scope?: string
          tenant_id?: string
          type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "os_custom_fields_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "os_custom_fields_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      os_sections: {
        Row: {
          color: string | null
          created_at: string | null
          default_assignee_id: string | null
          default_priority: string | null
          default_status: string | null
          id: string
          order_index: number
          project_id: string
          tenant_id: string
          title: string
          updated_at: string | null
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          default_assignee_id?: string | null
          default_priority?: string | null
          default_status?: string | null
          id?: string
          order_index?: number
          project_id: string
          tenant_id: string
          title?: string
          updated_at?: string | null
        }
        Update: {
          color?: string | null
          created_at?: string | null
          default_assignee_id?: string | null
          default_priority?: string | null
          default_status?: string | null
          id?: string
          order_index?: number
          project_id?: string
          tenant_id?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "os_sections_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "os_sections_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      os_task_field_values: {
        Row: {
          created_at: string | null
          field_id: string
          id: string
          task_id: string
          tenant_id: string
          updated_at: string | null
          value_json: Json
        }
        Insert: {
          created_at?: string | null
          field_id: string
          id?: string
          task_id: string
          tenant_id: string
          updated_at?: string | null
          value_json?: Json
        }
        Update: {
          created_at?: string | null
          field_id?: string
          id?: string
          task_id?: string
          tenant_id?: string
          updated_at?: string | null
          value_json?: Json
        }
        Relationships: [
          {
            foreignKeyName: "os_task_field_values_field_id_fkey"
            columns: ["field_id"]
            isOneToOne: false
            referencedRelation: "os_custom_fields"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "os_task_field_values_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "os_tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "os_task_field_values_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      os_tasks: {
        Row: {
          assignee_id: string | null
          assignee_name: string | null
          completed_at: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          due_date: string | null
          id: string
          is_completed: boolean | null
          is_milestone: boolean
          legacy_demand_id: string | null
          notion_page_id: string | null
          order_index: number
          parent_id: string | null
          priority: string | null
          project_id: string | null
          section_id: string | null
          start_date: string | null
          status: string
          tenant_id: string
          title: string
          updated_at: string | null
        }
        Insert: {
          assignee_id?: string | null
          assignee_name?: string | null
          completed_at?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          is_completed?: boolean | null
          is_milestone?: boolean
          legacy_demand_id?: string | null
          notion_page_id?: string | null
          order_index?: number
          parent_id?: string | null
          priority?: string | null
          project_id?: string | null
          section_id?: string | null
          start_date?: string | null
          status?: string
          tenant_id: string
          title?: string
          updated_at?: string | null
        }
        Update: {
          assignee_id?: string | null
          assignee_name?: string | null
          completed_at?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          is_completed?: boolean | null
          is_milestone?: boolean
          legacy_demand_id?: string | null
          notion_page_id?: string | null
          order_index?: number
          parent_id?: string | null
          priority?: string | null
          project_id?: string | null
          section_id?: string | null
          start_date?: string | null
          status?: string
          tenant_id?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "os_tasks_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "os_tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "os_tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "os_tasks_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "os_sections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "os_tasks_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      page_blocks: {
        Row: {
          content: Json | null
          created_at: string | null
          created_by: string
          id: string
          page_id: string
          parent_block_id: string | null
          position: number
          props: Json | null
          tenant_id: string
          type: string
          updated_at: string | null
          updated_by: string
        }
        Insert: {
          content?: Json | null
          created_at?: string | null
          created_by: string
          id?: string
          page_id: string
          parent_block_id?: string | null
          position?: number
          props?: Json | null
          tenant_id: string
          type?: string
          updated_at?: string | null
          updated_by: string
        }
        Update: {
          content?: Json | null
          created_at?: string | null
          created_by?: string
          id?: string
          page_id?: string
          parent_block_id?: string | null
          position?: number
          props?: Json | null
          tenant_id?: string
          type?: string
          updated_at?: string | null
          updated_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "page_blocks_page_id_fkey"
            columns: ["page_id"]
            isOneToOne: false
            referencedRelation: "pages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "page_blocks_parent_block_id_fkey"
            columns: ["parent_block_id"]
            isOneToOne: false
            referencedRelation: "page_blocks"
            referencedColumns: ["id"]
          },
        ]
      }
      pages: {
        Row: {
          content: Json | null
          cover_url: string | null
          created_at: string | null
          created_by: string
          has_blocks: boolean | null
          icon: string | null
          id: string
          is_deleted: boolean | null
          space_id: string
          tenant_id: string
          title: string
          updated_at: string | null
          updated_by: string
        }
        Insert: {
          content?: Json | null
          cover_url?: string | null
          created_at?: string | null
          created_by: string
          has_blocks?: boolean | null
          icon?: string | null
          id?: string
          is_deleted?: boolean | null
          space_id: string
          tenant_id: string
          title?: string
          updated_at?: string | null
          updated_by: string
        }
        Update: {
          content?: Json | null
          cover_url?: string | null
          created_at?: string | null
          created_by?: string
          has_blocks?: boolean | null
          icon?: string | null
          id?: string
          is_deleted?: boolean | null
          space_id?: string
          tenant_id?: string
          title?: string
          updated_at?: string | null
          updated_by?: string
        }
        Relationships: []
      }
      pdis: {
        Row: {
          created_at: string | null
          id: string
          last_updated_at: string | null
          person_id: string
          status: string
          tenant_id: string
          title: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          last_updated_at?: string | null
          person_id: string
          status?: string
          tenant_id: string
          title?: string
        }
        Update: {
          created_at?: string | null
          id?: string
          last_updated_at?: string | null
          person_id?: string
          status?: string
          tenant_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "pdis_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "active_team"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pdis_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pdis_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      performance_cycles: {
        Row: {
          created_at: string | null
          created_by: string | null
          end_date: string | null
          id: string
          name: string
          period: string | null
          start_date: string | null
          status: string | null
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          end_date?: string | null
          id?: string
          name: string
          period?: string | null
          start_date?: string | null
          status?: string | null
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          end_date?: string | null
          id?: string
          name?: string
          period?: string | null
          start_date?: string | null
          status?: string | null
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "performance_cycles_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      performance_reviews: {
        Row: {
          average: number | null
          comment: string | null
          created_at: string | null
          cycle_id: string
          gaps: string[] | null
          highlights: string[] | null
          id: string
          review_type: string
          reviewer: string
          scores: Json
          status: string | null
          submitted_at: string | null
          target_user: string
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          average?: number | null
          comment?: string | null
          created_at?: string | null
          cycle_id: string
          gaps?: string[] | null
          highlights?: string[] | null
          id?: string
          review_type: string
          reviewer: string
          scores?: Json
          status?: string | null
          submitted_at?: string | null
          target_user: string
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          average?: number | null
          comment?: string | null
          created_at?: string | null
          cycle_id?: string
          gaps?: string[] | null
          highlights?: string[] | null
          id?: string
          review_type?: string
          reviewer?: string
          scores?: Json
          status?: string | null
          submitted_at?: string | null
          target_user?: string
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "performance_reviews_cycle_id_fkey"
            columns: ["cycle_id"]
            isOneToOne: false
            referencedRelation: "performance_cycles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "performance_reviews_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      permissions: {
        Row: {
          action: string
          created_at: string | null
          description: string | null
          id: string
          label: string
          module: string
          sort_order: number | null
        }
        Insert: {
          action: string
          created_at?: string | null
          description?: string | null
          id?: string
          label: string
          module: string
          sort_order?: number | null
        }
        Update: {
          action?: string
          created_at?: string | null
          description?: string | null
          id?: string
          label?: string
          module?: string
          sort_order?: number | null
        }
        Relationships: []
      }
      person_skills: {
        Row: {
          category: string | null
          certification_expiry: string | null
          certification_name: string | null
          created_at: string | null
          id: string
          person_id: string
          proficiency_level: number | null
          skill_name: string
          tenant_id: string
          updated_at: string | null
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          category?: string | null
          certification_expiry?: string | null
          certification_name?: string | null
          created_at?: string | null
          id?: string
          person_id: string
          proficiency_level?: number | null
          skill_name: string
          tenant_id: string
          updated_at?: string | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          category?: string | null
          certification_expiry?: string | null
          certification_name?: string | null
          created_at?: string | null
          id?: string
          person_id?: string
          proficiency_level?: number | null
          skill_name?: string
          tenant_id?: string
          updated_at?: string | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "person_skills_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      person_tasks: {
        Row: {
          assigned_by: string | null
          category: string | null
          created_at: string | null
          description: string | null
          due_date: string | null
          id: string
          person_id: string
          priority: string | null
          status: string | null
          tenant_id: string
          title: string
          updated_at: string | null
        }
        Insert: {
          assigned_by?: string | null
          category?: string | null
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          person_id: string
          priority?: string | null
          status?: string | null
          tenant_id: string
          title: string
          updated_at?: string | null
        }
        Update: {
          assigned_by?: string | null
          category?: string | null
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          person_id?: string
          priority?: string | null
          status?: string | null
          tenant_id?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      policies: {
        Row: {
          category: string
          content_md: string | null
          created_at: string
          created_by: string | null
          effective_date: string | null
          id: string
          image_url: string | null
          next_review_at: string | null
          owner_user_id: string | null
          review_cycle_days: number | null
          slug: string
          status: string
          summary: string | null
          tenant_id: string
          title: string
          updated_at: string
          updated_by: string | null
          version: number
        }
        Insert: {
          category?: string
          content_md?: string | null
          created_at?: string
          created_by?: string | null
          effective_date?: string | null
          id?: string
          image_url?: string | null
          next_review_at?: string | null
          owner_user_id?: string | null
          review_cycle_days?: number | null
          slug: string
          status?: string
          summary?: string | null
          tenant_id: string
          title: string
          updated_at?: string
          updated_by?: string | null
          version?: number
        }
        Update: {
          category?: string
          content_md?: string | null
          created_at?: string
          created_by?: string | null
          effective_date?: string | null
          id?: string
          image_url?: string | null
          next_review_at?: string | null
          owner_user_id?: string | null
          review_cycle_days?: number | null
          slug?: string
          status?: string
          summary?: string | null
          tenant_id?: string
          title?: string
          updated_at?: string
          updated_by?: string | null
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "policies_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "active_team"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "policies_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "policies_owner_user_id_fkey"
            columns: ["owner_user_id"]
            isOneToOne: false
            referencedRelation: "active_team"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "policies_owner_user_id_fkey"
            columns: ["owner_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "policies_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "policies_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "active_team"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "policies_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      policy_revisions: {
        Row: {
          change_note: string | null
          content_md: string | null
          id: string
          policy_id: string
          updated_at: string
          updated_by: string | null
          version: number
        }
        Insert: {
          change_note?: string | null
          content_md?: string | null
          id?: string
          policy_id: string
          updated_at?: string
          updated_by?: string | null
          version: number
        }
        Update: {
          change_note?: string | null
          content_md?: string | null
          id?: string
          policy_id?: string
          updated_at?: string
          updated_by?: string | null
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "policy_revisions_policy_id_fkey"
            columns: ["policy_id"]
            isOneToOne: false
            referencedRelation: "policies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "policy_revisions_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "active_team"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "policy_revisions_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      pricing_premises: {
        Row: {
          commission_pct: number
          id: string
          package_discount_pct: number
          target_margin_pct: number
          tax_pct: number
          tenant_id: string
          updated_at: string
          updated_by: string | null
          urgency_multiplier: number
        }
        Insert: {
          commission_pct?: number
          id?: string
          package_discount_pct?: number
          target_margin_pct?: number
          tax_pct?: number
          tenant_id: string
          updated_at?: string
          updated_by?: string | null
          urgency_multiplier?: number
        }
        Update: {
          commission_pct?: number
          id?: string
          package_discount_pct?: number
          target_margin_pct?: number
          tax_pct?: number
          tenant_id?: string
          updated_at?: string
          updated_by?: string | null
          urgency_multiplier?: number
        }
        Relationships: [
          {
            foreignKeyName: "pricing_premises_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: true
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          address_cep: string | null
          address_city: string | null
          address_number: string | null
          address_state: string | null
          address_street: string | null
          avatar_url: string | null
          away_timeout_minutes: number | null
          bio: string | null
          birth_date: string | null
          bu: string | null
          career_level_id: string | null
          career_path_id: string | null
          cargo: string | null
          contract_type: string | null
          created_at: string | null
          department: string | null
          dnd_enabled: boolean | null
          dnd_end_time: string | null
          dnd_start_time: string | null
          document_cnpj: string | null
          email: string | null
          exit_date: string | null
          exit_interview: Json | null
          exit_reason: string | null
          first_login_completed: boolean | null
          full_name: string
          id: string
          is_active: boolean | null
          is_coordinator: boolean | null
          last_seen_at: string | null
          manager_id: string | null
          media_avaliacao: number | null
          module_tours_completed: Json | null
          nivel_atual: string | null
          onboarding_checklist: Json | null
          onboarding_wizard_completed: boolean | null
          phone: string | null
          preferences: Json
          proximo_nivel: string | null
          role: string
          salary_pj: number | null
          start_date: string | null
          status: string | null
          status_emoji: string | null
          status_expires_at: string | null
          status_text: string | null
          team_id: string | null
          tenant_id: string | null
          updated_at: string | null
          username: string
        }
        Insert: {
          address_cep?: string | null
          address_city?: string | null
          address_number?: string | null
          address_state?: string | null
          address_street?: string | null
          avatar_url?: string | null
          away_timeout_minutes?: number | null
          bio?: string | null
          birth_date?: string | null
          bu?: string | null
          career_level_id?: string | null
          career_path_id?: string | null
          cargo?: string | null
          contract_type?: string | null
          created_at?: string | null
          department?: string | null
          dnd_enabled?: boolean | null
          dnd_end_time?: string | null
          dnd_start_time?: string | null
          document_cnpj?: string | null
          email?: string | null
          exit_date?: string | null
          exit_interview?: Json | null
          exit_reason?: string | null
          first_login_completed?: boolean | null
          full_name: string
          id: string
          is_active?: boolean | null
          is_coordinator?: boolean | null
          last_seen_at?: string | null
          manager_id?: string | null
          media_avaliacao?: number | null
          module_tours_completed?: Json | null
          nivel_atual?: string | null
          onboarding_checklist?: Json | null
          onboarding_wizard_completed?: boolean | null
          phone?: string | null
          preferences?: Json
          proximo_nivel?: string | null
          role?: string
          salary_pj?: number | null
          start_date?: string | null
          status?: string | null
          status_emoji?: string | null
          status_expires_at?: string | null
          status_text?: string | null
          team_id?: string | null
          tenant_id?: string | null
          updated_at?: string | null
          username: string
        }
        Update: {
          address_cep?: string | null
          address_city?: string | null
          address_number?: string | null
          address_state?: string | null
          address_street?: string | null
          avatar_url?: string | null
          away_timeout_minutes?: number | null
          bio?: string | null
          birth_date?: string | null
          bu?: string | null
          career_level_id?: string | null
          career_path_id?: string | null
          cargo?: string | null
          contract_type?: string | null
          created_at?: string | null
          department?: string | null
          dnd_enabled?: boolean | null
          dnd_end_time?: string | null
          dnd_start_time?: string | null
          document_cnpj?: string | null
          email?: string | null
          exit_date?: string | null
          exit_interview?: Json | null
          exit_reason?: string | null
          first_login_completed?: boolean | null
          full_name?: string
          id?: string
          is_active?: boolean | null
          is_coordinator?: boolean | null
          last_seen_at?: string | null
          manager_id?: string | null
          media_avaliacao?: number | null
          module_tours_completed?: Json | null
          nivel_atual?: string | null
          onboarding_checklist?: Json | null
          onboarding_wizard_completed?: boolean | null
          phone?: string | null
          preferences?: Json
          proximo_nivel?: string | null
          role?: string
          salary_pj?: number | null
          start_date?: string | null
          status?: string | null
          status_emoji?: string | null
          status_expires_at?: string | null
          status_text?: string | null
          team_id?: string | null
          tenant_id?: string | null
          updated_at?: string | null
          username?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_profiles_team_id"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_career_level_id_fkey"
            columns: ["career_level_id"]
            isOneToOne: false
            referencedRelation: "career_levels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_career_path_id_fkey"
            columns: ["career_path_id"]
            isOneToOne: false
            referencedRelation: "career_paths"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      project_activity: {
        Row: {
          action: string
          actor_id: string
          created_at: string
          entity_type: string
          field_name: string | null
          id: string
          metadata: Json | null
          new_value: string | null
          old_value: string | null
          project_id: string
          task_id: string | null
          tenant_id: string
        }
        Insert: {
          action: string
          actor_id: string
          created_at?: string
          entity_type: string
          field_name?: string | null
          id?: string
          metadata?: Json | null
          new_value?: string | null
          old_value?: string | null
          project_id: string
          task_id?: string | null
          tenant_id: string
        }
        Update: {
          action?: string
          actor_id?: string
          created_at?: string
          entity_type?: string
          field_name?: string | null
          id?: string
          metadata?: Json | null
          new_value?: string | null
          old_value?: string | null
          project_id?: string
          task_id?: string | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_activity_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_activity_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_activity_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      project_assets: {
        Row: {
          analyzed_at: string | null
          client_name: string
          created_at: string | null
          environment: string
          environment_detail: string | null
          file_extension: string
          file_size_bytes: number | null
          folder_name: string
          hosted_at: string | null
          hosted_url: string | null
          id: string
          is_hero: boolean | null
          original_filename: string
          original_path: string
          project_name: string
          project_slug: string
          quality_score: number | null
          scan_batch: string | null
          source_location: string
          source_year: string | null
          subfolder_path: string | null
          updated_at: string | null
          vision_summary: string | null
          vision_tags: string[] | null
        }
        Insert: {
          analyzed_at?: string | null
          client_name: string
          created_at?: string | null
          environment: string
          environment_detail?: string | null
          file_extension: string
          file_size_bytes?: number | null
          folder_name: string
          hosted_at?: string | null
          hosted_url?: string | null
          id?: string
          is_hero?: boolean | null
          original_filename: string
          original_path: string
          project_name: string
          project_slug: string
          quality_score?: number | null
          scan_batch?: string | null
          source_location: string
          source_year?: string | null
          subfolder_path?: string | null
          updated_at?: string | null
          vision_summary?: string | null
          vision_tags?: string[] | null
        }
        Update: {
          analyzed_at?: string | null
          client_name?: string
          created_at?: string | null
          environment?: string
          environment_detail?: string | null
          file_extension?: string
          file_size_bytes?: number | null
          folder_name?: string
          hosted_at?: string | null
          hosted_url?: string | null
          id?: string
          is_hero?: boolean | null
          original_filename?: string
          original_path?: string
          project_name?: string
          project_slug?: string
          quality_score?: number | null
          scan_batch?: string | null
          source_location?: string
          source_year?: string | null
          subfolder_path?: string | null
          updated_at?: string | null
          vision_summary?: string | null
          vision_tags?: string[] | null
        }
        Relationships: []
      }
      project_attachments: {
        Row: {
          created_at: string
          file_name: string
          file_path: string
          file_size: number
          id: string
          mime_type: string
          project_id: string | null
          task_id: string | null
          tenant_id: string
          uploaded_by: string | null
        }
        Insert: {
          created_at?: string
          file_name: string
          file_path: string
          file_size?: number
          id?: string
          mime_type?: string
          project_id?: string | null
          task_id?: string | null
          tenant_id: string
          uploaded_by?: string | null
        }
        Update: {
          created_at?: string
          file_name?: string
          file_path?: string
          file_size?: number
          id?: string
          mime_type?: string
          project_id?: string | null
          task_id?: string | null
          tenant_id?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_attachments_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_attachments_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_attachments_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      project_comments: {
        Row: {
          author_id: string
          content: string
          created_at: string
          id: string
          parent_id: string | null
          task_id: string | null
          tenant_id: string
          updated_at: string
        }
        Insert: {
          author_id: string
          content?: string
          created_at?: string
          id?: string
          parent_id?: string | null
          task_id?: string | null
          tenant_id: string
          updated_at?: string
        }
        Update: {
          author_id?: string
          content?: string
          created_at?: string
          id?: string
          parent_id?: string | null
          task_id?: string | null
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_comments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "project_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_comments_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_comments_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      project_contracts: {
        Row: {
          audiovisual_scope: Json | null
          audiovisual_status: string | null
          available_from: string | null
          branding_scope: Json | null
          branding_status: string | null
          cidade: string | null
          client: string
          client_fidelity: string | null
          client_history: string | null
          created_at: string | null
          digital3d_scope: Json | null
          digital3d_status: string | null
          drive_links: Json | null
          gamificacao_scope: Json | null
          gamificacao_status: string | null
          has_audiovisual: boolean | null
          has_branding: boolean | null
          has_digital3d: boolean | null
          has_gamificacao: boolean | null
          has_marketing: boolean | null
          has_portfolio_av: boolean | null
          has_portfolio_brand: boolean | null
          has_portfolio_d3d: boolean | null
          id: string
          launch_status: string | null
          marketing_scope: Json | null
          marketing_status: string | null
          notes: string | null
          project_name: string
          segment: string | null
          source_contract_id: string | null
          tipologia: string | null
          updated_at: string | null
        }
        Insert: {
          audiovisual_scope?: Json | null
          audiovisual_status?: string | null
          available_from?: string | null
          branding_scope?: Json | null
          branding_status?: string | null
          cidade?: string | null
          client: string
          client_fidelity?: string | null
          client_history?: string | null
          created_at?: string | null
          digital3d_scope?: Json | null
          digital3d_status?: string | null
          drive_links?: Json | null
          gamificacao_scope?: Json | null
          gamificacao_status?: string | null
          has_audiovisual?: boolean | null
          has_branding?: boolean | null
          has_digital3d?: boolean | null
          has_gamificacao?: boolean | null
          has_marketing?: boolean | null
          has_portfolio_av?: boolean | null
          has_portfolio_brand?: boolean | null
          has_portfolio_d3d?: boolean | null
          id?: string
          launch_status?: string | null
          marketing_scope?: Json | null
          marketing_status?: string | null
          notes?: string | null
          project_name: string
          segment?: string | null
          source_contract_id?: string | null
          tipologia?: string | null
          updated_at?: string | null
        }
        Update: {
          audiovisual_scope?: Json | null
          audiovisual_status?: string | null
          available_from?: string | null
          branding_scope?: Json | null
          branding_status?: string | null
          cidade?: string | null
          client?: string
          client_fidelity?: string | null
          client_history?: string | null
          created_at?: string | null
          digital3d_scope?: Json | null
          digital3d_status?: string | null
          drive_links?: Json | null
          gamificacao_scope?: Json | null
          gamificacao_status?: string | null
          has_audiovisual?: boolean | null
          has_branding?: boolean | null
          has_digital3d?: boolean | null
          has_gamificacao?: boolean | null
          has_marketing?: boolean | null
          has_portfolio_av?: boolean | null
          has_portfolio_brand?: boolean | null
          has_portfolio_d3d?: boolean | null
          id?: string
          launch_status?: string | null
          marketing_scope?: Json | null
          marketing_status?: string | null
          notes?: string | null
          project_name?: string
          segment?: string | null
          source_contract_id?: string | null
          tipologia?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      project_d3d_flows: {
        Row: {
          completed_at: string | null
          created_at: string
          created_by: string | null
          current_stage: string
          id: string
          project_id: string
          share_enabled: boolean
          share_token: string | null
          started_at: string | null
          tenant_id: string
          total_estimated_days: number | null
          updated_at: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          current_stage?: string
          id?: string
          project_id: string
          share_enabled?: boolean
          share_token?: string | null
          started_at?: string | null
          tenant_id: string
          total_estimated_days?: number | null
          updated_at?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          current_stage?: string
          id?: string
          project_id?: string
          share_enabled?: boolean
          share_token?: string | null
          started_at?: string | null
          tenant_id?: string
          total_estimated_days?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_d3d_flows_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: true
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_d3d_stages: {
        Row: {
          actual_days: number | null
          approval_feedback: string | null
          approved_by: string | null
          completed_at: string | null
          created_at: string
          estimated_days: number | null
          flow_id: string
          id: string
          image_url: string | null
          notes: string | null
          sort_order: number
          stage_key: string
          stage_type: string
          started_at: string | null
          status: string
          tenant_id: string
          updated_at: string
        }
        Insert: {
          actual_days?: number | null
          approval_feedback?: string | null
          approved_by?: string | null
          completed_at?: string | null
          created_at?: string
          estimated_days?: number | null
          flow_id: string
          id?: string
          image_url?: string | null
          notes?: string | null
          sort_order?: number
          stage_key: string
          stage_type?: string
          started_at?: string | null
          status?: string
          tenant_id: string
          updated_at?: string
        }
        Update: {
          actual_days?: number | null
          approval_feedback?: string | null
          approved_by?: string | null
          completed_at?: string | null
          created_at?: string
          estimated_days?: number | null
          flow_id?: string
          id?: string
          image_url?: string | null
          notes?: string | null
          sort_order?: number
          stage_key?: string
          stage_type?: string
          started_at?: string | null
          status?: string
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_d3d_stages_flow_id_fkey"
            columns: ["flow_id"]
            isOneToOne: false
            referencedRelation: "project_d3d_flows"
            referencedColumns: ["id"]
          },
        ]
      }
      project_files: {
        Row: {
          created_at: string | null
          google_file_id: string | null
          google_folder_id: string | null
          icon_link: string | null
          id: string
          last_modified_at: string | null
          last_modified_by: string | null
          mime_type: string | null
          name: string
          profile_id: string | null
          project_id: string | null
          size_bytes: number | null
          synced_at: string | null
          tenant_id: string
          thumbnail_link: string | null
          updated_at: string | null
          web_content_link: string | null
          web_view_link: string | null
        }
        Insert: {
          created_at?: string | null
          google_file_id?: string | null
          google_folder_id?: string | null
          icon_link?: string | null
          id?: string
          last_modified_at?: string | null
          last_modified_by?: string | null
          mime_type?: string | null
          name: string
          profile_id?: string | null
          project_id?: string | null
          size_bytes?: number | null
          synced_at?: string | null
          tenant_id: string
          thumbnail_link?: string | null
          updated_at?: string | null
          web_content_link?: string | null
          web_view_link?: string | null
        }
        Update: {
          created_at?: string | null
          google_file_id?: string | null
          google_folder_id?: string | null
          icon_link?: string | null
          id?: string
          last_modified_at?: string | null
          last_modified_by?: string | null
          mime_type?: string | null
          name?: string
          profile_id?: string | null
          project_id?: string | null
          size_bytes?: number | null
          synced_at?: string | null
          tenant_id?: string
          thumbnail_link?: string | null
          updated_at?: string | null
          web_content_link?: string | null
          web_view_link?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_files_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "active_team"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_files_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_files_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      project_images: {
        Row: {
          ambiente: string | null
          bu_name: string | null
          client: string | null
          created_at: string | null
          drive_path: string | null
          id: string
          image_type: string | null
          image_url: string
          is_hero: boolean | null
          project_name: string
          quality_score: number | null
          source: string | null
          tipologia: string | null
        }
        Insert: {
          ambiente?: string | null
          bu_name?: string | null
          client?: string | null
          created_at?: string | null
          drive_path?: string | null
          id?: string
          image_type?: string | null
          image_url: string
          is_hero?: boolean | null
          project_name: string
          quality_score?: number | null
          source?: string | null
          tipologia?: string | null
        }
        Update: {
          ambiente?: string | null
          bu_name?: string | null
          client?: string | null
          created_at?: string | null
          drive_path?: string | null
          id?: string
          image_type?: string | null
          image_url?: string
          is_hero?: boolean | null
          project_name?: string
          quality_score?: number | null
          source?: string | null
          tipologia?: string | null
        }
        Relationships: []
      }
      project_memberships: {
        Row: {
          granted_at: string | null
          granted_by: string | null
          id: string
          project_id: string
          role_id: string
          tenant_id: string
          user_id: string
        }
        Insert: {
          granted_at?: string | null
          granted_by?: string | null
          id?: string
          project_id: string
          role_id?: string
          tenant_id: string
          user_id: string
        }
        Update: {
          granted_at?: string | null
          granted_by?: string | null
          id?: string
          project_id?: string
          role_id?: string
          tenant_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_memberships_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_memberships_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      project_property_options: {
        Row: {
          bg: string
          category: string | null
          color: string
          created_at: string | null
          id: string
          key: string
          label: string
          property: string
          sort_order: number
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          bg?: string
          category?: string | null
          color?: string
          created_at?: string | null
          id?: string
          key: string
          label: string
          property: string
          sort_order?: number
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          bg?: string
          category?: string | null
          color?: string
          created_at?: string | null
          id?: string
          key?: string
          label?: string
          property?: string
          sort_order?: number
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_property_options_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      project_resources: {
        Row: {
          created_at: string | null
          created_by: string | null
          id: string
          label: string
          position: number
          project_id: string
          tenant_id: string
          type: string
          updated_at: string | null
          url: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          label: string
          position?: number
          project_id: string
          tenant_id: string
          type?: string
          updated_at?: string | null
          url: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          label?: string
          position?: number
          project_id?: string
          tenant_id?: string
          type?: string
          updated_at?: string | null
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_resources_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          bus: string[] | null
          client: string | null
          client_company: string | null
          client_id: string | null
          code: string | null
          construtora: string | null
          created_at: string | null
          due_date_end: string | null
          due_date_start: string | null
          google_folder_id: string | null
          id: string
          name: string
          notes: string | null
          notion_page_id: string | null
          notion_url: string | null
          owner_id: string | null
          owner_name: string | null
          priority: string | null
          proposal_id: string | null
          services: string[] | null
          source: string | null
          status: string
          tenant_id: string
          updated_at: string | null
          value: number | null
        }
        Insert: {
          bus?: string[] | null
          client?: string | null
          client_company?: string | null
          client_id?: string | null
          code?: string | null
          construtora?: string | null
          created_at?: string | null
          due_date_end?: string | null
          due_date_start?: string | null
          google_folder_id?: string | null
          id?: string
          name: string
          notes?: string | null
          notion_page_id?: string | null
          notion_url?: string | null
          owner_id?: string | null
          owner_name?: string | null
          priority?: string | null
          proposal_id?: string | null
          services?: string[] | null
          source?: string | null
          status?: string
          tenant_id: string
          updated_at?: string | null
          value?: number | null
        }
        Update: {
          bus?: string[] | null
          client?: string | null
          client_company?: string | null
          client_id?: string | null
          code?: string | null
          construtora?: string | null
          created_at?: string | null
          due_date_end?: string | null
          due_date_start?: string | null
          google_folder_id?: string | null
          id?: string
          name?: string
          notes?: string | null
          notion_page_id?: string | null
          notion_url?: string | null
          owner_id?: string | null
          owner_name?: string | null
          priority?: string | null
          proposal_id?: string | null
          services?: string[] | null
          source?: string | null
          status?: string
          tenant_id?: string
          updated_at?: string | null
          value?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "projects_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      proposal_items: {
        Row: {
          bu: string | null
          created_at: string
          description: string | null
          discount_pct: number | null
          id: string
          observations: string | null
          proposal_id: string
          quantity: number
          service_id: string | null
          sort_order: number | null
          subtotal: number | null
          tenant_id: string
          title: string
          unit_price: number
          updated_at: string
        }
        Insert: {
          bu?: string | null
          created_at?: string
          description?: string | null
          discount_pct?: number | null
          id?: string
          observations?: string | null
          proposal_id: string
          quantity?: number
          service_id?: string | null
          sort_order?: number | null
          subtotal?: number | null
          tenant_id: string
          title: string
          unit_price?: number
          updated_at?: string
        }
        Update: {
          bu?: string | null
          created_at?: string
          description?: string | null
          discount_pct?: number | null
          id?: string
          observations?: string | null
          proposal_id?: string
          quantity?: number
          service_id?: string | null
          sort_order?: number | null
          subtotal?: number | null
          tenant_id?: string
          title?: string
          unit_price?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "proposal_items_proposal_id_fkey"
            columns: ["proposal_id"]
            isOneToOne: false
            referencedRelation: "proposals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proposal_items_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proposal_items_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      proposals: {
        Row: {
          client: string | null
          company: string | null
          contact_email: string | null
          contact_name: string | null
          contact_phone: string | null
          created_at: string | null
          created_by: string | null
          deal_id: string | null
          discount_amount: number | null
          id: string
          legacy_id: string | null
          name: string
          notes: string | null
          owner_id: string | null
          owner_name: string | null
          package_discount_flag: boolean
          priority: string | null
          project_location: string | null
          project_type: string | null
          ref_code: string | null
          services: string[] | null
          status: string
          subtotal: number | null
          tenant_id: string | null
          updated_at: string | null
          urgency_flag: boolean
          valid_days: number
          value: number | null
        }
        Insert: {
          client?: string | null
          company?: string | null
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string | null
          created_by?: string | null
          deal_id?: string | null
          discount_amount?: number | null
          id?: string
          legacy_id?: string | null
          name: string
          notes?: string | null
          owner_id?: string | null
          owner_name?: string | null
          package_discount_flag?: boolean
          priority?: string | null
          project_location?: string | null
          project_type?: string | null
          ref_code?: string | null
          services?: string[] | null
          status?: string
          subtotal?: number | null
          tenant_id?: string | null
          updated_at?: string | null
          urgency_flag?: boolean
          valid_days?: number
          value?: number | null
        }
        Update: {
          client?: string | null
          company?: string | null
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string | null
          created_by?: string | null
          deal_id?: string | null
          discount_amount?: number | null
          id?: string
          legacy_id?: string | null
          name?: string
          notes?: string | null
          owner_id?: string | null
          owner_name?: string | null
          package_discount_flag?: boolean
          priority?: string | null
          project_location?: string | null
          project_type?: string | null
          ref_code?: string | null
          services?: string[] | null
          status?: string
          subtotal?: number | null
          tenant_id?: string | null
          updated_at?: string | null
          urgency_flag?: boolean
          valid_days?: number
          value?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "proposals_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "active_team"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proposals_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proposals_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "active_team"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proposals_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proposals_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      rd_config: {
        Row: {
          api_token: string | null
          base_url: string | null
          created_at: string | null
          enabled: boolean | null
          id: string
          last_sync: string | null
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          api_token?: string | null
          base_url?: string | null
          created_at?: string | null
          enabled?: boolean | null
          id?: string
          last_sync?: string | null
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          api_token?: string | null
          base_url?: string | null
          created_at?: string | null
          enabled?: boolean | null
          id?: string
          last_sync?: string | null
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rd_config_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: true
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      rd_sync_log: {
        Row: {
          contacts_synced: number | null
          created_at: string | null
          deals_synced: number | null
          errors: Json | null
          finished_at: string | null
          id: string
          organizations_synced: number | null
          started_at: string | null
          status: string
          tenant_id: string
          trigger_source: string | null
          triggered_by: string | null
        }
        Insert: {
          contacts_synced?: number | null
          created_at?: string | null
          deals_synced?: number | null
          errors?: Json | null
          finished_at?: string | null
          id?: string
          organizations_synced?: number | null
          started_at?: string | null
          status?: string
          tenant_id: string
          trigger_source?: string | null
          triggered_by?: string | null
        }
        Update: {
          contacts_synced?: number | null
          created_at?: string | null
          deals_synced?: number | null
          errors?: Json | null
          finished_at?: string | null
          id?: string
          organizations_synced?: number | null
          started_at?: string | null
          status?: string
          tenant_id?: string
          trigger_source?: string | null
          triggered_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rd_sync_log_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      recognition_redemptions: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          created_at: string | null
          id: string
          notes: string | null
          points_spent: number
          redeemed_at: string | null
          reward_id: string
          status: string | null
          tenant_id: string
          user_id: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string | null
          id?: string
          notes?: string | null
          points_spent: number
          redeemed_at?: string | null
          reward_id: string
          status?: string | null
          tenant_id: string
          user_id: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string | null
          id?: string
          notes?: string | null
          points_spent?: number
          redeemed_at?: string | null
          reward_id?: string
          status?: string | null
          tenant_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "recognition_redemptions_reward_id_fkey"
            columns: ["reward_id"]
            isOneToOne: false
            referencedRelation: "recognition_rewards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recognition_redemptions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      recognition_rewards: {
        Row: {
          active: boolean | null
          budget_quarter: number | null
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          image_url: string | null
          name: string
          points_required: number
          tenant_id: string
          type: string | null
          updated_at: string | null
          value_brl: number | null
        }
        Insert: {
          active?: boolean | null
          budget_quarter?: number | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          name: string
          points_required?: number
          tenant_id: string
          type?: string | null
          updated_at?: string | null
          value_brl?: number | null
        }
        Update: {
          active?: boolean | null
          budget_quarter?: number | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          name?: string
          points_required?: number
          tenant_id?: string
          type?: string | null
          updated_at?: string | null
          value_brl?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "recognition_rewards_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      recognitions: {
        Row: {
          created_at: string | null
          detection_context: string | null
          from_user: string
          id: string
          likes: number | null
          meeting_id: string | null
          message: string
          points: number | null
          reviewed: boolean | null
          source: string | null
          tenant_id: string
          to_user: string
          value_emoji: string | null
          value_id: string
          value_name: string | null
        }
        Insert: {
          created_at?: string | null
          detection_context?: string | null
          from_user: string
          id?: string
          likes?: number | null
          meeting_id?: string | null
          message: string
          points?: number | null
          reviewed?: boolean | null
          source?: string | null
          tenant_id: string
          to_user: string
          value_emoji?: string | null
          value_id: string
          value_name?: string | null
        }
        Update: {
          created_at?: string | null
          detection_context?: string | null
          from_user?: string
          id?: string
          likes?: number | null
          meeting_id?: string | null
          message?: string
          points?: number | null
          reviewed?: boolean | null
          source?: string | null
          tenant_id?: string
          to_user?: string
          value_emoji?: string | null
          value_id?: string
          value_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "recognitions_meeting_id_fkey"
            columns: ["meeting_id"]
            isOneToOne: false
            referencedRelation: "meetings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recognitions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      reconciliation_audit: {
        Row: {
          action: string
          bank_transaction_id: string | null
          confidence: number | null
          created_at: string | null
          fin_transaction_id: string | null
          id: string
          matched_by: string | null
          notes: string | null
          rule_id: string | null
          tenant_id: string
        }
        Insert: {
          action: string
          bank_transaction_id?: string | null
          confidence?: number | null
          created_at?: string | null
          fin_transaction_id?: string | null
          id?: string
          matched_by?: string | null
          notes?: string | null
          rule_id?: string | null
          tenant_id: string
        }
        Update: {
          action?: string
          bank_transaction_id?: string | null
          confidence?: number | null
          created_at?: string | null
          fin_transaction_id?: string | null
          id?: string
          matched_by?: string | null
          notes?: string | null
          rule_id?: string | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reconciliation_audit_bank_transaction_id_fkey"
            columns: ["bank_transaction_id"]
            isOneToOne: false
            referencedRelation: "bank_transactions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reconciliation_audit_fin_transaction_id_fkey"
            columns: ["fin_transaction_id"]
            isOneToOne: false
            referencedRelation: "fin_transactions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reconciliation_audit_rule_id_fkey"
            columns: ["rule_id"]
            isOneToOne: false
            referencedRelation: "reconciliation_rules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reconciliation_audit_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      reconciliation_rules: {
        Row: {
          auto_match: boolean | null
          category_id: string | null
          client_id: string | null
          created_at: string | null
          id: string
          is_active: boolean | null
          match_field: string
          name: string
          pattern: string
          priority: number | null
          tenant_id: string
          vendor_id: string | null
        }
        Insert: {
          auto_match?: boolean | null
          category_id?: string | null
          client_id?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          match_field: string
          name: string
          pattern: string
          priority?: number | null
          tenant_id: string
          vendor_id?: string | null
        }
        Update: {
          auto_match?: boolean | null
          category_id?: string | null
          client_id?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          match_field?: string
          name?: string
          pattern?: string
          priority?: number | null
          tenant_id?: string
          vendor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reconciliation_rules_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "fin_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reconciliation_rules_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "fin_clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reconciliation_rules_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reconciliation_rules_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "fin_vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      report_runs: {
        Row: {
          completed_at: string | null
          content: Json | null
          created_at: string | null
          error: string | null
          generated_at: string | null
          html_content: string | null
          id: string
          metadata: Json | null
          schedule_id: string | null
          status: string
          tenant_id: string
          type: string
        }
        Insert: {
          completed_at?: string | null
          content?: Json | null
          created_at?: string | null
          error?: string | null
          generated_at?: string | null
          html_content?: string | null
          id?: string
          metadata?: Json | null
          schedule_id?: string | null
          status?: string
          tenant_id: string
          type: string
        }
        Update: {
          completed_at?: string | null
          content?: Json | null
          created_at?: string | null
          error?: string | null
          generated_at?: string | null
          html_content?: string | null
          id?: string
          metadata?: Json | null
          schedule_id?: string | null
          status?: string
          tenant_id?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "report_runs_schedule_id_fkey"
            columns: ["schedule_id"]
            isOneToOne: false
            referencedRelation: "report_schedules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "report_runs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      report_schedules: {
        Row: {
          config: Json | null
          created_at: string | null
          created_by: string | null
          cron: string
          description: string | null
          enabled: boolean | null
          id: string
          name: string
          recipients: Json | null
          tenant_id: string
          type: string
          updated_at: string | null
        }
        Insert: {
          config?: Json | null
          created_at?: string | null
          created_by?: string | null
          cron?: string
          description?: string | null
          enabled?: boolean | null
          id?: string
          name: string
          recipients?: Json | null
          tenant_id: string
          type: string
          updated_at?: string | null
        }
        Update: {
          config?: Json | null
          created_at?: string | null
          created_by?: string | null
          cron?: string
          description?: string | null
          enabled?: boolean | null
          id?: string
          name?: string
          recipients?: Json | null
          tenant_id?: string
          type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "report_schedules_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      reportei_sync_runs: {
        Row: {
          accounts_synced: number | null
          details: Json | null
          error_message: string | null
          finished_at: string | null
          id: string
          metrics_upserted: number | null
          posts_upserted: number | null
          started_at: string
          status: string
          tenant_id: string
        }
        Insert: {
          accounts_synced?: number | null
          details?: Json | null
          error_message?: string | null
          finished_at?: string | null
          id?: string
          metrics_upserted?: number | null
          posts_upserted?: number | null
          started_at?: string
          status?: string
          tenant_id: string
        }
        Update: {
          accounts_synced?: number | null
          details?: Json | null
          error_message?: string | null
          finished_at?: string | null
          id?: string
          metrics_upserted?: number | null
          posts_upserted?: number | null
          started_at?: string
          status?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reportei_sync_runs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      review_annotations: {
        Row: {
          author_avatar_url: string | null
          author_id: string
          author_name: string
          content: string
          created_at: string
          id: string
          parent_id: string | null
          resolved: boolean
          resolved_at: string | null
          resolved_by: string | null
          tenant_id: string
          updated_at: string
          version_id: string
          x_pct: number | null
          y_pct: number | null
        }
        Insert: {
          author_avatar_url?: string | null
          author_id: string
          author_name?: string
          content?: string
          created_at?: string
          id?: string
          parent_id?: string | null
          resolved?: boolean
          resolved_at?: string | null
          resolved_by?: string | null
          tenant_id: string
          updated_at?: string
          version_id: string
          x_pct?: number | null
          y_pct?: number | null
        }
        Update: {
          author_avatar_url?: string | null
          author_id?: string
          author_name?: string
          content?: string
          created_at?: string
          id?: string
          parent_id?: string | null
          resolved?: boolean
          resolved_at?: string | null
          resolved_by?: string | null
          tenant_id?: string
          updated_at?: string
          version_id?: string
          x_pct?: number | null
          y_pct?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "review_annotations_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "review_annotations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "review_annotations_version_id_fkey"
            columns: ["version_id"]
            isOneToOne: false
            referencedRelation: "review_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      review_approvals: {
        Row: {
          created_at: string
          id: string
          notes: string | null
          status: string
          tenant_id: string
          updated_at: string
          user_id: string
          user_name: string
          version_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          notes?: string | null
          status?: string
          tenant_id: string
          updated_at?: string
          user_id: string
          user_name?: string
          version_id: string
        }
        Update: {
          created_at?: string
          id?: string
          notes?: string | null
          status?: string
          tenant_id?: string
          updated_at?: string
          user_id?: string
          user_name?: string
          version_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "review_approvals_version_id_fkey"
            columns: ["version_id"]
            isOneToOne: false
            referencedRelation: "review_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      review_projects: {
        Row: {
          client_name: string | null
          code: string | null
          created_at: string
          created_by: string
          description: string | null
          id: string
          name: string
          project_id: string | null
          share_enabled: boolean
          share_token: string | null
          status: string
          tenant_id: string
          thumbnail_url: string | null
          updated_at: string
          workflow_stage: string
        }
        Insert: {
          client_name?: string | null
          code?: string | null
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          name: string
          project_id?: string | null
          share_enabled?: boolean
          share_token?: string | null
          status?: string
          tenant_id: string
          thumbnail_url?: string | null
          updated_at?: string
          workflow_stage?: string
        }
        Update: {
          client_name?: string | null
          code?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          name?: string
          project_id?: string | null
          share_enabled?: boolean
          share_token?: string | null
          status?: string
          tenant_id?: string
          thumbnail_url?: string | null
          updated_at?: string
          workflow_stage?: string
        }
        Relationships: [
          {
            foreignKeyName: "review_projects_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      review_scenes: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          project_id: string
          scene_type: string
          sort_order: number
          tenant_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          project_id: string
          scene_type?: string
          sort_order?: number
          tenant_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          project_id?: string
          scene_type?: string
          sort_order?: number
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "review_scenes_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "review_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      review_share_links: {
        Row: {
          created_at: string
          created_by: string
          expires_at: string | null
          id: string
          is_active: boolean
          permissions: string
          project_id: string
          reviewer_email: string | null
          reviewer_name: string | null
          tenant_id: string
          token: string
        }
        Insert: {
          created_at?: string
          created_by: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          permissions?: string
          project_id: string
          reviewer_email?: string | null
          reviewer_name?: string | null
          tenant_id: string
          token?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          permissions?: string
          project_id?: string
          reviewer_email?: string | null
          reviewer_name?: string | null
          tenant_id?: string
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "review_share_links_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "review_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      review_versions: {
        Row: {
          created_at: string
          file_path: string | null
          file_size_bytes: number | null
          file_url: string
          height: number | null
          id: string
          mime_type: string | null
          scene_id: string
          status: string
          tenant_id: string
          thumbnail_url: string | null
          updated_at: string
          uploaded_by: string
          uploaded_by_name: string
          version_label: string
          version_number: number
          width: number | null
        }
        Insert: {
          created_at?: string
          file_path?: string | null
          file_size_bytes?: number | null
          file_url: string
          height?: number | null
          id?: string
          mime_type?: string | null
          scene_id: string
          status?: string
          tenant_id: string
          thumbnail_url?: string | null
          updated_at?: string
          uploaded_by: string
          uploaded_by_name?: string
          version_label: string
          version_number?: number
          width?: number | null
        }
        Update: {
          created_at?: string
          file_path?: string | null
          file_size_bytes?: number | null
          file_url?: string
          height?: number | null
          id?: string
          mime_type?: string | null
          scene_id?: string
          status?: string
          tenant_id?: string
          thumbnail_url?: string | null
          updated_at?: string
          uploaded_by?: string
          uploaded_by_name?: string
          version_label?: string
          version_number?: number
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "review_versions_scene_id_fkey"
            columns: ["scene_id"]
            isOneToOne: false
            referencedRelation: "review_scenes"
            referencedColumns: ["id"]
          },
        ]
      }
      ritual_types: {
        Row: {
          color: string | null
          created_at: string | null
          created_by: string | null
          default_agenda: string | null
          default_participants: string[] | null
          description: string | null
          duration_minutes: number | null
          frequency: string
          icon: string | null
          id: string
          is_active: boolean | null
          is_system: boolean | null
          name: string
          slug: string
          sort_order: number | null
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          created_by?: string | null
          default_agenda?: string | null
          default_participants?: string[] | null
          description?: string | null
          duration_minutes?: number | null
          frequency: string
          icon?: string | null
          id?: string
          is_active?: boolean | null
          is_system?: boolean | null
          name: string
          slug: string
          sort_order?: number | null
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          color?: string | null
          created_at?: string | null
          created_by?: string | null
          default_agenda?: string | null
          default_participants?: string[] | null
          description?: string | null
          duration_minutes?: number | null
          frequency?: string
          icon?: string | null
          id?: string
          is_active?: boolean | null
          is_system?: boolean | null
          name?: string
          slug?: string
          sort_order?: number | null
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ritual_types_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      role_permissions: {
        Row: {
          can_create: boolean | null
          can_delete: boolean | null
          can_edit: boolean | null
          can_export: boolean | null
          can_view: boolean | null
          created_at: string | null
          granted: boolean | null
          id: string
          module: string
          permission_id: string | null
          role_id: string
        }
        Insert: {
          can_create?: boolean | null
          can_delete?: boolean | null
          can_edit?: boolean | null
          can_export?: boolean | null
          can_view?: boolean | null
          created_at?: string | null
          granted?: boolean | null
          id?: string
          module: string
          permission_id?: string | null
          role_id: string
        }
        Update: {
          can_create?: boolean | null
          can_delete?: boolean | null
          can_edit?: boolean | null
          can_export?: boolean | null
          can_view?: boolean | null
          created_at?: string | null
          granted?: boolean | null
          id?: string
          module?: string
          permission_id?: string | null
          role_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "role_permissions_permission_id_fkey"
            columns: ["permission_id"]
            isOneToOne: false
            referencedRelation: "permissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "role_permissions_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
      roles: {
        Row: {
          color: string | null
          created_at: string | null
          description: string | null
          id: string
          is_default: boolean | null
          is_system: boolean | null
          label: string | null
          name: string
          slug: string
          sort_order: number | null
          tenant_id: string | null
          updated_at: string | null
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_default?: boolean | null
          is_system?: boolean | null
          label?: string | null
          name: string
          slug: string
          sort_order?: number | null
          tenant_id?: string | null
          updated_at?: string | null
        }
        Update: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_default?: boolean | null
          is_system?: boolean | null
          label?: string | null
          name?: string
          slug?: string
          sort_order?: number | null
          tenant_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "roles_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      rsm_accounts: {
        Row: {
          client_id: string | null
          created_at: string | null
          followers_count: number | null
          handle: string
          id: string
          is_active: boolean | null
          platform: string
          platform_id: string | null
          profile_url: string | null
          reportei_account_id: string | null
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          client_id?: string | null
          created_at?: string | null
          followers_count?: number | null
          handle: string
          id?: string
          is_active?: boolean | null
          platform: string
          platform_id?: string | null
          profile_url?: string | null
          reportei_account_id?: string | null
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          client_id?: string | null
          created_at?: string | null
          followers_count?: number | null
          handle?: string
          id?: string
          is_active?: boolean | null
          platform?: string
          platform_id?: string | null
          profile_url?: string | null
          reportei_account_id?: string | null
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rsm_accounts_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      rsm_ideas: {
        Row: {
          assigned_to: string | null
          category: string
          client_id: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          status: string
          tenant_id: string
          title: string
          updated_at: string | null
        }
        Insert: {
          assigned_to?: string | null
          category?: string
          client_id?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          status?: string
          tenant_id: string
          title: string
          updated_at?: string | null
        }
        Update: {
          assigned_to?: string | null
          category?: string
          client_id?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          status?: string
          tenant_id?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rsm_ideas_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      rsm_metrics: {
        Row: {
          account_id: string
          clicks: number | null
          created_at: string | null
          date: string
          engagement_rate: number | null
          followers: number | null
          following: number | null
          id: string
          impressions: number | null
          metadata: Json | null
          posts_count: number | null
          profile_views: number | null
          reach: number | null
          saves: number | null
          source: string
          tenant_id: string
        }
        Insert: {
          account_id: string
          clicks?: number | null
          created_at?: string | null
          date: string
          engagement_rate?: number | null
          followers?: number | null
          following?: number | null
          id?: string
          impressions?: number | null
          metadata?: Json | null
          posts_count?: number | null
          profile_views?: number | null
          reach?: number | null
          saves?: number | null
          source?: string
          tenant_id: string
        }
        Update: {
          account_id?: string
          clicks?: number | null
          created_at?: string | null
          date?: string
          engagement_rate?: number | null
          followers?: number | null
          following?: number | null
          id?: string
          impressions?: number | null
          metadata?: Json | null
          posts_count?: number | null
          profile_views?: number | null
          reach?: number | null
          saves?: number | null
          source?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "rsm_metrics_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "rsm_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rsm_metrics_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      rsm_posts: {
        Row: {
          account_id: string
          content: string | null
          created_at: string | null
          created_by: string | null
          external_post_id: string | null
          id: string
          media_urls: Json | null
          metrics: Json | null
          published_date: string | null
          scheduled_date: string | null
          source: string
          status: string
          tags: Json | null
          tenant_id: string
          title: string | null
          type: string
          updated_at: string | null
        }
        Insert: {
          account_id: string
          content?: string | null
          created_at?: string | null
          created_by?: string | null
          external_post_id?: string | null
          id?: string
          media_urls?: Json | null
          metrics?: Json | null
          published_date?: string | null
          scheduled_date?: string | null
          source?: string
          status?: string
          tags?: Json | null
          tenant_id: string
          title?: string | null
          type?: string
          updated_at?: string | null
        }
        Update: {
          account_id?: string
          content?: string | null
          created_at?: string | null
          created_by?: string | null
          external_post_id?: string | null
          id?: string
          media_urls?: Json | null
          metrics?: Json | null
          published_date?: string | null
          scheduled_date?: string | null
          source?: string
          status?: string
          tags?: Json | null
          tenant_id?: string
          title?: string | null
          type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rsm_posts_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "rsm_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rsm_posts_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      scorecard_config: {
        Row: {
          culture_weight: number | null
          elite_threshold: number | null
          evaluation_period: string | null
          high_perf_threshold: number | null
          id: string
          impact_weight: number | null
          skill_weight: number | null
          stable_threshold: number | null
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          culture_weight?: number | null
          elite_threshold?: number | null
          evaluation_period?: string | null
          high_perf_threshold?: number | null
          id?: string
          impact_weight?: number | null
          skill_weight?: number | null
          stable_threshold?: number | null
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          culture_weight?: number | null
          elite_threshold?: number | null
          evaluation_period?: string | null
          high_perf_threshold?: number | null
          id?: string
          impact_weight?: number | null
          skill_weight?: number | null
          stable_threshold?: number | null
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "scorecard_config_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: true
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      scorecard_skill_weights: {
        Row: {
          created_at: string | null
          expected_level: number | null
          id: string
          role_name: string
          skill_id: string
          tenant_id: string
          weight: number | null
        }
        Insert: {
          created_at?: string | null
          expected_level?: number | null
          id?: string
          role_name: string
          skill_id: string
          tenant_id: string
          weight?: number | null
        }
        Update: {
          created_at?: string | null
          expected_level?: number | null
          id?: string
          role_name?: string
          skill_id?: string
          tenant_id?: string
          weight?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "scorecard_skill_weights_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      scorecard_skills: {
        Row: {
          category: string | null
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          sort_order: number | null
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          id: string
          is_active?: boolean | null
          name: string
          sort_order?: number | null
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          sort_order?: number | null
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "scorecard_skills_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      service_price_history: {
        Row: {
          changed_by: string | null
          created_at: string
          effective_from: string
          id: string
          margin_pct: number | null
          price: number
          service_id: string
          tenant_id: string
        }
        Insert: {
          changed_by?: string | null
          created_at?: string
          effective_from?: string
          id?: string
          margin_pct?: number | null
          price: number
          service_id: string
          tenant_id: string
        }
        Update: {
          changed_by?: string | null
          created_at?: string
          effective_from?: string
          id?: string
          margin_pct?: number | null
          price?: number
          service_id?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_price_history_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_price_history_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      services: {
        Row: {
          base_price: number
          bu: string | null
          complexity_multiplier: number | null
          created_at: string
          created_by: string | null
          description: string | null
          hours_estimated: number | null
          id: string
          margin_pct: number | null
          min_price: number | null
          name: string
          revisions_included: number | null
          sort_order: number | null
          status: string
          tenant_id: string
          third_party_cost: number | null
          type: string
          unit: string
          updated_at: string
        }
        Insert: {
          base_price?: number
          bu?: string | null
          complexity_multiplier?: number | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          hours_estimated?: number | null
          id?: string
          margin_pct?: number | null
          min_price?: number | null
          name: string
          revisions_included?: number | null
          sort_order?: number | null
          status?: string
          tenant_id: string
          third_party_cost?: number | null
          type?: string
          unit?: string
          updated_at?: string
        }
        Update: {
          base_price?: number
          bu?: string | null
          complexity_multiplier?: number | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          hours_estimated?: number | null
          id?: string
          margin_pct?: number | null
          min_price?: number | null
          name?: string
          revisions_included?: number | null
          sort_order?: number | null
          status?: string
          tenant_id?: string
          third_party_cost?: number | null
          type?: string
          unit?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "services_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      sidebar_items: {
        Row: {
          allowed_roles: string[] | null
          archived_at: string | null
          archived_by: string | null
          created_at: string | null
          deleted_at: string | null
          deleted_by: string | null
          description: string | null
          icon: string | null
          icon_type: string | null
          icon_url: string | null
          icon_value: string | null
          id: string
          is_expanded: boolean | null
          is_visible: boolean | null
          metadata: Json | null
          name: string
          order_index: number
          parent_id: string | null
          route: string | null
          tenant_id: string
          type: string
          updated_at: string | null
        }
        Insert: {
          allowed_roles?: string[] | null
          archived_at?: string | null
          archived_by?: string | null
          created_at?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          description?: string | null
          icon?: string | null
          icon_type?: string | null
          icon_url?: string | null
          icon_value?: string | null
          id?: string
          is_expanded?: boolean | null
          is_visible?: boolean | null
          metadata?: Json | null
          name: string
          order_index: number
          parent_id?: string | null
          route?: string | null
          tenant_id: string
          type: string
          updated_at?: string | null
        }
        Update: {
          allowed_roles?: string[] | null
          archived_at?: string | null
          archived_by?: string | null
          created_at?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          description?: string | null
          icon?: string | null
          icon_type?: string | null
          icon_url?: string | null
          icon_value?: string | null
          id?: string
          is_expanded?: boolean | null
          is_visible?: boolean | null
          metadata?: Json | null
          name?: string
          order_index?: number
          parent_id?: string | null
          route?: string | null
          tenant_id?: string
          type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sidebar_items_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "sidebar_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sidebar_items_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      sidebar_user_state: {
        Row: {
          created_at: string | null
          id: string
          is_expanded: boolean | null
          is_pinned: boolean | null
          item_id: string
          last_accessed: string | null
          tenant_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_expanded?: boolean | null
          is_pinned?: boolean | null
          item_id: string
          last_accessed?: string | null
          tenant_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_expanded?: boolean | null
          is_pinned?: boolean | null
          item_id?: string
          last_accessed?: string | null
          tenant_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sidebar_user_state_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "sidebar_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sidebar_user_state_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      space_invitations: {
        Row: {
          created_at: string | null
          email: string
          expires_at: string | null
          id: string
          invited_by: string
          role: string
          space_id: string
          status: string
          tenant_id: string
          token: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          expires_at?: string | null
          id?: string
          invited_by: string
          role?: string
          space_id: string
          status?: string
          tenant_id: string
          token?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          expires_at?: string | null
          id?: string
          invited_by?: string
          role?: string
          space_id?: string
          status?: string
          tenant_id?: string
          token?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "space_invitations_space_id_fkey"
            columns: ["space_id"]
            isOneToOne: false
            referencedRelation: "sidebar_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "space_invitations_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      space_members: {
        Row: {
          created_at: string | null
          id: string
          invited_by: string | null
          joined_at: string | null
          role: string
          space_id: string
          tenant_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          invited_by?: string | null
          joined_at?: string | null
          role?: string
          space_id: string
          tenant_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          invited_by?: string | null
          joined_at?: string | null
          role?: string
          space_id?: string
          tenant_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "space_members_space_id_fkey"
            columns: ["space_id"]
            isOneToOne: false
            referencedRelation: "sidebar_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "space_members_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      sync_logs: {
        Row: {
          completed_at: string | null
          created_at: string | null
          direction: string | null
          entity_type: string | null
          error_details: Json | null
          id: string
          provider: string
          records_created: number | null
          records_errors: number | null
          records_fetched: number | null
          records_updated: number | null
          started_at: string | null
          status: string | null
          tenant_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          direction?: string | null
          entity_type?: string | null
          error_details?: Json | null
          id?: string
          provider: string
          records_created?: number | null
          records_errors?: number | null
          records_fetched?: number | null
          records_updated?: number | null
          started_at?: string | null
          status?: string | null
          tenant_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          direction?: string | null
          entity_type?: string | null
          error_details?: Json | null
          id?: string
          provider?: string
          records_created?: number | null
          records_errors?: number | null
          records_fetched?: number | null
          records_updated?: number | null
          started_at?: string | null
          status?: string | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sync_logs_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tags: {
        Row: {
          color: string | null
          created_at: string | null
          id: string
          name: string
          tenant_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          id?: string
          name: string
          tenant_id: string
        }
        Update: {
          color?: string | null
          created_at?: string | null
          id?: string
          name?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tags_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      talents: {
        Row: {
          city: string | null
          created_at: string | null
          created_by: string | null
          email: string | null
          full_name: string
          id: string
          linkedin_url: string | null
          notes: string | null
          phone: string | null
          portfolio_url: string | null
          seniority: string | null
          source: string | null
          specialty: string | null
          state: string | null
          status: string | null
          tags: string[] | null
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          city?: string | null
          created_at?: string | null
          created_by?: string | null
          email?: string | null
          full_name: string
          id?: string
          linkedin_url?: string | null
          notes?: string | null
          phone?: string | null
          portfolio_url?: string | null
          seniority?: string | null
          source?: string | null
          specialty?: string | null
          state?: string | null
          status?: string | null
          tags?: string[] | null
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          city?: string | null
          created_at?: string | null
          created_by?: string | null
          email?: string | null
          full_name?: string
          id?: string
          linkedin_url?: string | null
          notes?: string | null
          phone?: string | null
          portfolio_url?: string | null
          seniority?: string | null
          source?: string | null
          specialty?: string | null
          state?: string | null
          status?: string | null
          tags?: string[] | null
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "talents_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      task_assignees: {
        Row: {
          created_at: string
          id: string
          role: string | null
          task_id: string
          tenant_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: string | null
          task_id: string
          tenant_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: string | null
          task_id?: string
          tenant_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_assignees_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "os_tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_assignees_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      task_collaborators: {
        Row: {
          added_at: string | null
          task_id: string
          user_id: string
        }
        Insert: {
          added_at?: string | null
          task_id: string
          user_id: string
        }
        Update: {
          added_at?: string | null
          task_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_collaborators_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "os_tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      task_comments: {
        Row: {
          author_id: string
          content: Json
          created_at: string
          id: string
          parent_comment_id: string | null
          task_id: string
          updated_at: string
        }
        Insert: {
          author_id: string
          content: Json
          created_at?: string
          id?: string
          parent_comment_id?: string | null
          task_id: string
          updated_at?: string
        }
        Update: {
          author_id?: string
          content?: Json
          created_at?: string
          id?: string
          parent_comment_id?: string | null
          task_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_comments_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "active_team"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_comments_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_comments_parent_comment_id_fkey"
            columns: ["parent_comment_id"]
            isOneToOne: false
            referencedRelation: "task_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_comments_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "os_tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      task_custom_field_values: {
        Row: {
          created_at: string | null
          field_id: string
          id: string
          task_id: string
          updated_at: string | null
          value: Json | null
        }
        Insert: {
          created_at?: string | null
          field_id: string
          id?: string
          task_id: string
          updated_at?: string | null
          value?: Json | null
        }
        Update: {
          created_at?: string | null
          field_id?: string
          id?: string
          task_id?: string
          updated_at?: string | null
          value?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "task_custom_field_values_field_id_fkey"
            columns: ["field_id"]
            isOneToOne: false
            referencedRelation: "custom_field_definitions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_custom_field_values_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "os_tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      task_dependencies: {
        Row: {
          created_at: string | null
          dependency_type: string
          id: string
          predecessor_id: string
          successor_id: string
        }
        Insert: {
          created_at?: string | null
          dependency_type?: string
          id?: string
          predecessor_id: string
          successor_id: string
        }
        Update: {
          created_at?: string | null
          dependency_type?: string
          id?: string
          predecessor_id?: string
          successor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_dependencies_predecessor_id_fkey"
            columns: ["predecessor_id"]
            isOneToOne: false
            referencedRelation: "os_tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_dependencies_successor_id_fkey"
            columns: ["successor_id"]
            isOneToOne: false
            referencedRelation: "os_tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      task_followers: {
        Row: {
          created_at: string | null
          task_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          task_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          task_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_followers_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "os_tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      task_projects: {
        Row: {
          added_at: string | null
          project_id: string
          task_id: string
        }
        Insert: {
          added_at?: string | null
          project_id: string
          task_id: string
        }
        Update: {
          added_at?: string | null
          project_id?: string
          task_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_projects_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_projects_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "os_tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      task_tags: {
        Row: {
          created_at: string | null
          tag_id: string
          task_id: string
        }
        Insert: {
          created_at?: string | null
          tag_id: string
          task_id: string
        }
        Update: {
          created_at?: string | null
          tag_id?: string
          task_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_tags_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "os_tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          created_at: string | null
          created_by: string | null
          decision_id: string | null
          description: string | null
          due_date: string | null
          estimate_minutes: number | null
          id: string
          legacy_id: string | null
          owner_id: string | null
          owner_name: string | null
          phase: string | null
          priority: string | null
          project_id: string | null
          project_name: string | null
          sort_order: number | null
          source: string | null
          status: string
          tenant_id: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          decision_id?: string | null
          description?: string | null
          due_date?: string | null
          estimate_minutes?: number | null
          id?: string
          legacy_id?: string | null
          owner_id?: string | null
          owner_name?: string | null
          phase?: string | null
          priority?: string | null
          project_id?: string | null
          project_name?: string | null
          sort_order?: number | null
          source?: string | null
          status?: string
          tenant_id?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          decision_id?: string | null
          description?: string | null
          due_date?: string | null
          estimate_minutes?: number | null
          id?: string
          legacy_id?: string | null
          owner_id?: string | null
          owner_name?: string | null
          phase?: string | null
          priority?: string | null
          project_id?: string | null
          project_name?: string | null
          sort_order?: number | null
          source?: string | null
          status?: string
          tenant_id?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tasks_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "active_team"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "active_team"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      teams: {
        Row: {
          color: string | null
          created_at: string | null
          description: string | null
          icon: string | null
          id: string
          is_active: boolean | null
          manager_user_id: string | null
          name: string
          tenant_id: string
          updated_at: string | null
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          manager_user_id?: string | null
          name: string
          tenant_id: string
          updated_at?: string | null
        }
        Update: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          manager_user_id?: string | null
          name?: string
          tenant_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "teams_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_members: {
        Row: {
          id: string
          is_active: boolean | null
          joined_at: string | null
          role_id: string | null
          tenant_id: string
          user_id: string
        }
        Insert: {
          id?: string
          is_active?: boolean | null
          joined_at?: string | null
          role_id?: string | null
          tenant_id: string
          user_id: string
        }
        Update: {
          id?: string
          is_active?: boolean | null
          joined_at?: string | null
          role_id?: string | null
          tenant_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tenant_members_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
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
          created_at: string | null
          id: string
          is_active: boolean | null
          logo_url: string | null
          name: string
          settings: Json | null
          slug: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          name: string
          settings?: Json | null
          slug: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          name?: string
          settings?: Json | null
          slug?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      time_entries: {
        Row: {
          billable: boolean | null
          created_at: string | null
          date: string
          description: string | null
          duration_minutes: number
          end_time: string | null
          id: string
          legacy_id: string | null
          project_id: string | null
          project_name: string | null
          source: string | null
          start_time: string | null
          task_id: string | null
          task_name: string | null
          tenant_id: string | null
          updated_at: string | null
          user_id: string
          user_name: string | null
        }
        Insert: {
          billable?: boolean | null
          created_at?: string | null
          date: string
          description?: string | null
          duration_minutes?: number
          end_time?: string | null
          id?: string
          legacy_id?: string | null
          project_id?: string | null
          project_name?: string | null
          source?: string | null
          start_time?: string | null
          task_id?: string | null
          task_name?: string | null
          tenant_id?: string | null
          updated_at?: string | null
          user_id: string
          user_name?: string | null
        }
        Update: {
          billable?: boolean | null
          created_at?: string | null
          date?: string
          description?: string | null
          duration_minutes?: number
          end_time?: string | null
          id?: string
          legacy_id?: string | null
          project_id?: string | null
          project_name?: string | null
          source?: string | null
          start_time?: string | null
          task_id?: string | null
          task_name?: string | null
          tenant_id?: string | null
          updated_at?: string | null
          user_id?: string
          user_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "time_entries_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "time_entries_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "time_entries_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "active_team"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "time_entries_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_recent_icons: {
        Row: {
          icon_type: string
          icon_value: string
          id: string
          tenant_id: string
          used_at: string | null
          user_id: string
        }
        Insert: {
          icon_type: string
          icon_value: string
          id?: string
          tenant_id: string
          used_at?: string | null
          user_id: string
        }
        Update: {
          icon_type?: string
          icon_value?: string
          id?: string
          tenant_id?: string
          used_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_recent_icons_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      user_sidebar_preferences: {
        Row: {
          collapsed: Json
          group_items: Json
          group_order: Json
          id: string
          tenant_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          collapsed?: Json
          group_items?: Json
          group_order?: Json
          id?: string
          tenant_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          collapsed?: Json
          group_items?: Json
          group_order?: Json
          id?: string
          tenant_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      vacancies: {
        Row: {
          area: string | null
          closed_at: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          notes: string | null
          opened_at: string | null
          priority: string | null
          requirements: string | null
          responsible_id: string | null
          status: string | null
          tenant_id: string
          title: string
          updated_at: string | null
        }
        Insert: {
          area?: string | null
          closed_at?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          notes?: string | null
          opened_at?: string | null
          priority?: string | null
          requirements?: string | null
          responsible_id?: string | null
          status?: string | null
          tenant_id: string
          title: string
          updated_at?: string | null
        }
        Update: {
          area?: string | null
          closed_at?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          notes?: string | null
          opened_at?: string | null
          priority?: string | null
          requirements?: string | null
          responsible_id?: string | null
          status?: string | null
          tenant_id?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vacancies_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      vacancy_candidates: {
        Row: {
          id: string
          linked_at: string | null
          linked_by: string | null
          notes: string | null
          stage: string | null
          talent_id: string
          tenant_id: string
          vacancy_id: string
        }
        Insert: {
          id?: string
          linked_at?: string | null
          linked_by?: string | null
          notes?: string | null
          stage?: string | null
          talent_id: string
          tenant_id: string
          vacancy_id: string
        }
        Update: {
          id?: string
          linked_at?: string | null
          linked_by?: string | null
          notes?: string | null
          stage?: string | null
          talent_id?: string
          tenant_id?: string
          vacancy_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vacancy_candidates_talent_id_fkey"
            columns: ["talent_id"]
            isOneToOne: false
            referencedRelation: "talents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vacancy_candidates_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vacancy_candidates_vacancy_id_fkey"
            columns: ["vacancy_id"]
            isOneToOne: false
            referencedRelation: "vacancies"
            referencedColumns: ["id"]
          },
        ]
      }
      website_projects: {
        Row: {
          category: string
          client_name: string | null
          cover_url: string | null
          created_at: string
          description: string
          gallery: string[]
          highlights: string[]
          id: string
          location: string | null
          name: string
          published_at: string | null
          seo_description: string | null
          seo_title: string | null
          services: string[]
          slug: string
          sort_order: number
          status: Database["public"]["Enums"]["website_project_status"]
          tenant_id: string
          testimonial_author: string | null
          testimonial_text: string | null
          updated_at: string
          year: number | null
        }
        Insert: {
          category?: string
          client_name?: string | null
          cover_url?: string | null
          created_at?: string
          description?: string
          gallery?: string[]
          highlights?: string[]
          id?: string
          location?: string | null
          name: string
          published_at?: string | null
          seo_description?: string | null
          seo_title?: string | null
          services?: string[]
          slug: string
          sort_order?: number
          status?: Database["public"]["Enums"]["website_project_status"]
          tenant_id: string
          testimonial_author?: string | null
          testimonial_text?: string | null
          updated_at?: string
          year?: number | null
        }
        Update: {
          category?: string
          client_name?: string | null
          cover_url?: string | null
          created_at?: string
          description?: string
          gallery?: string[]
          highlights?: string[]
          id?: string
          location?: string | null
          name?: string
          published_at?: string | null
          seo_description?: string | null
          seo_title?: string | null
          services?: string[]
          slug?: string
          sort_order?: number
          status?: Database["public"]["Enums"]["website_project_status"]
          tenant_id?: string
          testimonial_author?: string | null
          testimonial_text?: string | null
          updated_at?: string
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "website_projects_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      website_sections: {
        Row: {
          content: Json
          cta_label: string | null
          cta_url: string | null
          id: string
          is_visible: boolean
          media_url: string | null
          page: string
          section_key: string
          sort_order: number
          subtitle: string | null
          tenant_id: string
          title: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          content?: Json
          cta_label?: string | null
          cta_url?: string | null
          id?: string
          is_visible?: boolean
          media_url?: string | null
          page: string
          section_key: string
          sort_order?: number
          subtitle?: string | null
          tenant_id: string
          title?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          content?: Json
          cta_label?: string | null
          cta_url?: string | null
          id?: string
          is_visible?: boolean
          media_url?: string | null
          page?: string
          section_key?: string
          sort_order?: number
          subtitle?: string | null
          tenant_id?: string
          title?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "website_sections_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "website_sections_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "active_team"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "website_sections_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      website_settings: {
        Row: {
          analytics_id: string | null
          contact_address: string | null
          contact_email: string | null
          contact_phone: string | null
          custom_scripts: string | null
          favicon_url: string | null
          id: string
          logo_url: string | null
          site_description: string | null
          site_title: string
          social_links: Json
          tenant_id: string
          updated_at: string
        }
        Insert: {
          analytics_id?: string | null
          contact_address?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          custom_scripts?: string | null
          favicon_url?: string | null
          id?: string
          logo_url?: string | null
          site_description?: string | null
          site_title?: string
          social_links?: Json
          tenant_id: string
          updated_at?: string
        }
        Update: {
          analytics_id?: string | null
          contact_address?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          custom_scripts?: string | null
          favicon_url?: string | null
          id?: string
          logo_url?: string | null
          site_description?: string | null
          site_title?: string
          social_links?: Json
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "website_settings_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: true
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      active_team: {
        Row: {
          avatar_url: string | null
          bu: string | null
          email: string | null
          full_name: string | null
          id: string | null
          is_coordinator: boolean | null
          role: string | null
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          bu?: string | null
          email?: string | null
          full_name?: string | null
          id?: string | null
          is_coordinator?: boolean | null
          role?: string | null
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          bu?: string | null
          email?: string | null
          full_name?: string | null
          id?: string | null
          is_coordinator?: boolean | null
          role?: string | null
          username?: string | null
        }
        Relationships: []
      }
      blog_posts_public: {
        Row: {
          author_avatar_url: string | null
          author_name: string | null
          body: string | null
          cover_url: string | null
          created_at: string | null
          excerpt: string | null
          id: string | null
          published_at: string | null
          slug: string | null
          tags: string[] | null
          title: string | null
          updated_at: string | null
        }
        Relationships: []
      }
      v_weekly_financial_summary: {
        Row: {
          deals_em_pipeline: number | null
          deals_ganhos_semana: number | null
          deals_perdidos_semana: number | null
          valor_ganho_semana: number | null
          valor_pipeline: number | null
          valor_ponderado_pipeline: number | null
        }
        Relationships: []
      }
      vw_colaboradores_inativos: {
        Row: {
          buddy_email: string | null
          buddy_id: string | null
          buddy_nome: string | null
          cargo: string | null
          colaborador_id: string | null
          dias_sem_atividade: number | null
          email: string | null
          nome: string | null
          tipo_onboarding: string | null
          ultima_atividade_em: string | null
        }
        Relationships: [
          {
            foreignKeyName: "colaboradores_buddy_id_fkey"
            columns: ["buddy_id"]
            isOneToOne: false
            referencedRelation: "colaboradores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "colaboradores_buddy_id_fkey"
            columns: ["buddy_id"]
            isOneToOne: false
            referencedRelation: "vw_colaboradores_inativos"
            referencedColumns: ["colaborador_id"]
          },
          {
            foreignKeyName: "colaboradores_buddy_id_fkey"
            columns: ["buddy_id"]
            isOneToOne: false
            referencedRelation: "vw_progresso_onboarding"
            referencedColumns: ["colaborador_id"]
          },
        ]
      }
      vw_progresso_onboarding: {
        Row: {
          atividades_concluidas: number | null
          buddy_id: string | null
          buddy_nome: string | null
          cargo: string | null
          colaborador_id: string | null
          data_inicio: string | null
          dias_concluidos: number | null
          email: string | null
          nome: string | null
          percentual_conclusao: number | null
          status: string | null
          tipo_onboarding: string | null
          total_atividades: number | null
          total_dias: number | null
          ultima_atividade: string | null
          ultima_atividade_em: string | null
        }
        Relationships: [
          {
            foreignKeyName: "colaboradores_buddy_id_fkey"
            columns: ["buddy_id"]
            isOneToOne: false
            referencedRelation: "colaboradores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "colaboradores_buddy_id_fkey"
            columns: ["buddy_id"]
            isOneToOne: false
            referencedRelation: "vw_colaboradores_inativos"
            referencedColumns: ["colaborador_id"]
          },
          {
            foreignKeyName: "colaboradores_buddy_id_fkey"
            columns: ["buddy_id"]
            isOneToOne: false
            referencedRelation: "vw_progresso_onboarding"
            referencedColumns: ["colaborador_id"]
          },
        ]
      }
    }
    Functions: {
      check_module_access: {
        Args: { p_module: string; p_user_id: string }
        Returns: boolean
      }
      check_permission: {
        Args: { p_action: string; p_module: string; p_user_id: string }
        Returns: boolean
      }
      deduplicate_contacts: {
        Args: never
        Returns: {
          remaining: number
          removed: number
        }[]
      }
      ensure_default_my_tasks_section: {
        Args: { p_tenant_id: string; p_user_id: string }
        Returns: string
      }
      get_all_roles_with_permissions: {
        Args: { p_tenant_id: string }
        Returns: {
          is_system: boolean
          permissions: Json
          role_color: string
          role_id: string
          role_label: string
          role_name: string
          role_slug: string
          role_sort_order: number
        }[]
      }
      get_colaborador_id: { Args: never; Returns: string }
      get_current_user_role: { Args: never; Returns: string }
      get_people_kpis: { Args: { p_tenant_id: string }; Returns: Json }
      get_perfil_acesso: { Args: never; Returns: string }
      get_role_level: { Args: { role_slug: string }; Returns: number }
      get_session_context: { Args: { p_tenant_id?: string }; Returns: Json }
      get_unread_counts: {
        Args: { p_tenant_id: string; p_user_id: string }
        Returns: {
          channel_id: string
          unread_count: number
        }[]
      }
      get_user_permissions: {
        Args: { p_user_id: string }
        Returns: {
          action: string
          granted: boolean
          module: string
        }[]
      }
      get_user_role_in_tenant:
        | { Args: { p_tenant_id: string }; Returns: string }
        | {
            Args: { p_tenant_id: string; p_user_id: string }
            Returns: {
              permissions: Json
              role_label: string
              role_name: string
            }[]
          }
      get_user_tenant_ids: { Args: never; Returns: string[] }
      is_academy_admin: { Args: never; Returns: boolean }
      is_dnd_active: { Args: { p_user_id: string }; Returns: boolean }
      is_finance_admin: { Args: { p_tenant_id: string }; Returns: boolean }
      is_founder_or_admin: { Args: never; Returns: boolean }
      is_month_locked: { Args: { check_date: string }; Returns: boolean }
      log_audit_event: {
        Args: {
          p_action: string
          p_entity_id?: string
          p_entity_type?: string
          p_metadata?: Json
        }
        Returns: string
      }
      run_lead_scoring: {
        Args: never
        Returns: {
          avg_score: number
          count: number
          tier: string
        }[]
      }
      update_last_seen: { Args: never; Returns: undefined }
      user_in_tenant: { Args: { p_tenant_id: string }; Returns: boolean }
    }
    Enums: {
      blog_post_status: "rascunho" | "revisao" | "publicado" | "arquivado"
      website_project_status: "rascunho" | "publicado" | "arquivado"
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
      blog_post_status: ["rascunho", "revisao", "publicado", "arquivado"],
      website_project_status: ["rascunho", "publicado", "arquivado"],
    },
  },
} as const
