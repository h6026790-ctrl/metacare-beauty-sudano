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
      addresses: {
        Row: {
          city_id: string
          created_at: string
          id: string
          is_default: boolean
          neighborhood_id: string | null
          notes: string | null
          profile_id: string
          state_id: string
          street: string
        }
        Insert: {
          city_id: string
          created_at?: string
          id?: string
          is_default?: boolean
          neighborhood_id?: string | null
          notes?: string | null
          profile_id: string
          state_id: string
          street: string
        }
        Update: {
          city_id?: string
          created_at?: string
          id?: string
          is_default?: boolean
          neighborhood_id?: string | null
          notes?: string | null
          profile_id?: string
          state_id?: string
          street?: string
        }
        Relationships: [
          {
            foreignKeyName: "addresses_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "addresses_neighborhood_id_fkey"
            columns: ["neighborhood_id"]
            isOneToOne: false
            referencedRelation: "neighborhoods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "addresses_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "addresses_state_id_fkey"
            columns: ["state_id"]
            isOneToOne: false
            referencedRelation: "states"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          actor_id: string | null
          at: string
          entity_id: string | null
          entity_type: string
          id: string
          metadata: Json | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          at?: string
          entity_id?: string | null
          entity_type: string
          id?: string
          metadata?: Json | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          at?: string
          entity_id?: string | null
          entity_type?: string
          id?: string
          metadata?: Json | null
        }
        Relationships: []
      }
      auth_rate_limits: {
        Row: {
          attempts: number
          bucket: string
          updated_at: string
          window_start: string
        }
        Insert: {
          attempts?: number
          bucket: string
          updated_at?: string
          window_start?: string
        }
        Update: {
          attempts?: number
          bucket?: string
          updated_at?: string
          window_start?: string
        }
        Relationships: []
      }
      brands: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          logo_url: string | null
          name_ar: string
          name_en: string
          slug: string
          sort_order: number
          tagline_ar: string | null
          tagline_en: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          logo_url?: string | null
          name_ar: string
          name_en: string
          slug: string
          sort_order?: number
          tagline_ar?: string | null
          tagline_en?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          logo_url?: string | null
          name_ar?: string
          name_en?: string
          slug?: string
          sort_order?: number
          tagline_ar?: string | null
          tagline_en?: string | null
        }
        Relationships: []
      }
      cart_items: {
        Row: {
          added_at: string
          cart_id: string
          product_id: string
          qty: number
        }
        Insert: {
          added_at?: string
          cart_id: string
          product_id: string
          qty: number
        }
        Update: {
          added_at?: string
          cart_id?: string
          product_id?: string
          qty?: number
        }
        Relationships: [
          {
            foreignKeyName: "cart_items_cart_id_fkey"
            columns: ["cart_id"]
            isOneToOne: false
            referencedRelation: "carts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cart_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "catalog_authenticated"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cart_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "catalog_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cart_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      carts: {
        Row: {
          id: string
          profile_id: string
          updated_at: string
        }
        Insert: {
          id?: string
          profile_id: string
          updated_at?: string
        }
        Update: {
          id?: string
          profile_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "carts_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          icon: string | null
          id: string
          is_active: boolean
          name_ar: string
          name_en: string
          slug: string
          sort_order: number
        }
        Insert: {
          icon?: string | null
          id?: string
          is_active?: boolean
          name_ar: string
          name_en: string
          slug: string
          sort_order?: number
        }
        Update: {
          icon?: string | null
          id?: string
          is_active?: boolean
          name_ar?: string
          name_en?: string
          slug?: string
          sort_order?: number
        }
        Relationships: []
      }
      cities: {
        Row: {
          id: string
          is_active: boolean
          name_ar: string
          name_en: string
          sort_order: number
          state_id: string
        }
        Insert: {
          id?: string
          is_active?: boolean
          name_ar: string
          name_en: string
          sort_order?: number
          state_id: string
        }
        Update: {
          id?: string
          is_active?: boolean
          name_ar?: string
          name_en?: string
          sort_order?: number
          state_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cities_state_id_fkey"
            columns: ["state_id"]
            isOneToOne: false
            referencedRelation: "states"
            referencedColumns: ["id"]
          },
        ]
      }
      delivery_assignments: {
        Row: {
          agent_id: string | null
          assigned_at: string
          assigned_by: string | null
          completed_at: string | null
          courier_name: string | null
          courier_note: string | null
          courier_phone: string | null
          id: string
          order_id: string
          qr_expires_at: string
          qr_token: string
        }
        Insert: {
          agent_id?: string | null
          assigned_at?: string
          assigned_by?: string | null
          completed_at?: string | null
          courier_name?: string | null
          courier_note?: string | null
          courier_phone?: string | null
          id?: string
          order_id: string
          qr_expires_at?: string
          qr_token?: string
        }
        Update: {
          agent_id?: string | null
          assigned_at?: string
          assigned_by?: string | null
          completed_at?: string | null
          courier_name?: string | null
          courier_note?: string | null
          courier_phone?: string | null
          id?: string
          order_id?: string
          qr_expires_at?: string
          qr_token?: string
        }
        Relationships: [
          {
            foreignKeyName: "delivery_assignments_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: true
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory: {
        Row: {
          product_id: string
          stock: number
          updated_at: string
        }
        Insert: {
          product_id: string
          stock?: number
          updated_at?: string
        }
        Update: {
          product_id?: string
          stock?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: true
            referencedRelation: "catalog_authenticated"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: true
            referencedRelation: "catalog_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: true
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      neighborhoods: {
        Row: {
          city_id: string
          delivery_fee_sdg: number
          id: string
          is_active: boolean
          name_ar: string
          name_en: string
          sort_order: number
        }
        Insert: {
          city_id: string
          delivery_fee_sdg?: number
          id?: string
          is_active?: boolean
          name_ar: string
          name_en: string
          sort_order?: number
        }
        Update: {
          city_id?: string
          delivery_fee_sdg?: number
          id?: string
          is_active?: boolean
          name_ar?: string
          name_en?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "neighborhoods_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          channel: string
          created_at: string
          id: string
          payload: Json | null
          profile_id: string | null
          sent_at: string | null
          template: string
        }
        Insert: {
          channel: string
          created_at?: string
          id?: string
          payload?: Json | null
          profile_id?: string | null
          sent_at?: string | null
          template: string
        }
        Update: {
          channel?: string
          created_at?: string
          id?: string
          payload?: Json | null
          profile_id?: string | null
          sent_at?: string | null
          template?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          id: string
          name_snapshot: string
          order_id: string
          price_sdg: number
          product_id: string
          qty: number
        }
        Insert: {
          id?: string
          name_snapshot: string
          order_id: string
          price_sdg: number
          product_id: string
          qty: number
        }
        Update: {
          id?: string
          name_snapshot?: string
          order_id?: string
          price_sdg?: number
          product_id?: string
          qty?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "catalog_authenticated"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "catalog_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      order_notes: {
        Row: {
          author_id: string | null
          body: string
          created_at: string
          id: string
          order_id: string
        }
        Insert: {
          author_id?: string | null
          body: string
          created_at?: string
          id?: string
          order_id: string
        }
        Update: {
          author_id?: string | null
          body?: string
          created_at?: string
          id?: string
          order_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_notes_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      order_number_counters: {
        Row: {
          bucket: string
          last_seq: number
          updated_at: string
        }
        Insert: {
          bucket: string
          last_seq?: number
          updated_at?: string
        }
        Update: {
          bucket?: string
          last_seq?: number
          updated_at?: string
        }
        Relationships: []
      }
      order_status_history: {
        Row: {
          actor_id: string | null
          at: string
          id: string
          note: string | null
          order_id: string
          status: Database["public"]["Enums"]["order_status"]
        }
        Insert: {
          actor_id?: string | null
          at?: string
          id?: string
          note?: string | null
          order_id: string
          status: Database["public"]["Enums"]["order_status"]
        }
        Update: {
          actor_id?: string | null
          at?: string
          id?: string
          note?: string | null
          order_id?: string
          status?: Database["public"]["Enums"]["order_status"]
        }
        Relationships: [
          {
            foreignKeyName: "order_status_history_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          address_city: string
          address_neighborhood: string | null
          address_notes: string | null
          address_state: string
          address_street: string
          archived_at: string | null
          assigned_staff_id: string | null
          contact_name: string
          contact_phone: string
          contact_whatsapp: string
          cutoff_bucket: string
          delivery_sdg: number
          expires_at: string | null
          id: string
          number: string | null
          payment_confirmed_at: string | null
          payment_confirmed_by: string | null
          payment_reference: string | null
          placed_at: string
          profile_id: string
          status: Database["public"]["Enums"]["order_status"]
          stock_restored_at: string | null
          subtotal_sdg: number
          total_sdg: number
        }
        Insert: {
          address_city: string
          address_neighborhood?: string | null
          address_notes?: string | null
          address_state: string
          address_street: string
          archived_at?: string | null
          assigned_staff_id?: string | null
          contact_name: string
          contact_phone: string
          contact_whatsapp: string
          cutoff_bucket?: string
          delivery_sdg?: number
          expires_at?: string | null
          id?: string
          number?: string | null
          payment_confirmed_at?: string | null
          payment_confirmed_by?: string | null
          payment_reference?: string | null
          placed_at?: string
          profile_id: string
          status?: Database["public"]["Enums"]["order_status"]
          stock_restored_at?: string | null
          subtotal_sdg?: number
          total_sdg?: number
        }
        Update: {
          address_city?: string
          address_neighborhood?: string | null
          address_notes?: string | null
          address_state?: string
          address_street?: string
          archived_at?: string | null
          assigned_staff_id?: string | null
          contact_name?: string
          contact_phone?: string
          contact_whatsapp?: string
          cutoff_bucket?: string
          delivery_sdg?: number
          expires_at?: string | null
          id?: string
          number?: string | null
          payment_confirmed_at?: string | null
          payment_confirmed_by?: string | null
          payment_reference?: string | null
          placed_at?: string
          profile_id?: string
          status?: Database["public"]["Enums"]["order_status"]
          stock_restored_at?: string | null
          subtotal_sdg?: number
          total_sdg?: number
        }
        Relationships: [
          {
            foreignKeyName: "orders_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      product_images: {
        Row: {
          id: string
          product_id: string
          sort_order: number
          url: string
        }
        Insert: {
          id?: string
          product_id: string
          sort_order?: number
          url: string
        }
        Update: {
          id?: string
          product_id?: string
          sort_order?: number
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_images_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "catalog_authenticated"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_images_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "catalog_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_images_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          brand_id: string | null
          category_id: string | null
          compare_at_sdg: number | null
          created_at: string
          description_ar: string | null
          description_en: string | null
          id: string
          image_url: string | null
          is_active: boolean
          is_available: boolean
          is_best_seller: boolean
          is_featured: boolean
          is_new: boolean
          is_on_sale: boolean | null
          is_pick_of_day: boolean
          name_ar: string
          name_en: string
          price_sdg: number
          slug: string
          updated_at: string
        }
        Insert: {
          brand_id?: string | null
          category_id?: string | null
          compare_at_sdg?: number | null
          created_at?: string
          description_ar?: string | null
          description_en?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          is_available?: boolean
          is_best_seller?: boolean
          is_featured?: boolean
          is_new?: boolean
          is_on_sale?: boolean | null
          is_pick_of_day?: boolean
          name_ar: string
          name_en: string
          price_sdg: number
          slug: string
          updated_at?: string
        }
        Update: {
          brand_id?: string | null
          category_id?: string | null
          compare_at_sdg?: number | null
          created_at?: string
          description_ar?: string | null
          description_en?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          is_available?: boolean
          is_best_seller?: boolean
          is_featured?: boolean
          is_new?: boolean
          is_on_sale?: boolean | null
          is_pick_of_day?: boolean
          name_ar?: string
          name_en?: string
          price_sdg?: number
          slug?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          full_name: string | null
          id: string
          phone: string | null
          updated_at: string
          whatsapp: string | null
        }
        Insert: {
          created_at?: string
          full_name?: string | null
          id: string
          phone?: string | null
          updated_at?: string
          whatsapp?: string | null
        }
        Update: {
          created_at?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
          whatsapp?: string | null
        }
        Relationships: []
      }
      registration_requests: {
        Row: {
          address_city_id: string | null
          address_neighborhood_id: string | null
          address_state_id: string | null
          approved_at: string | null
          approved_by: string | null
          created_at: string
          expires_at: string
          failed_attempts: number
          full_name: string
          id: string
          notes: string | null
          otp_code: string
          password_hash: string | null
          phone: string
          reject_reason: string | null
          rejected_at: string | null
          rejected_by: string | null
          request_type: string
          status: Database["public"]["Enums"]["registration_request_status"]
          street: string | null
          user_id: string | null
          verified_at: string | null
          whatsapp: string
        }
        Insert: {
          address_city_id?: string | null
          address_neighborhood_id?: string | null
          address_state_id?: string | null
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          expires_at?: string
          failed_attempts?: number
          full_name: string
          id?: string
          notes?: string | null
          otp_code: string
          password_hash?: string | null
          phone: string
          reject_reason?: string | null
          rejected_at?: string | null
          rejected_by?: string | null
          request_type?: string
          status?: Database["public"]["Enums"]["registration_request_status"]
          street?: string | null
          user_id?: string | null
          verified_at?: string | null
          whatsapp: string
        }
        Update: {
          address_city_id?: string | null
          address_neighborhood_id?: string | null
          address_state_id?: string | null
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          expires_at?: string
          failed_attempts?: number
          full_name?: string
          id?: string
          notes?: string | null
          otp_code?: string
          password_hash?: string | null
          phone?: string
          reject_reason?: string | null
          rejected_at?: string | null
          rejected_by?: string | null
          request_type?: string
          status?: Database["public"]["Enums"]["registration_request_status"]
          street?: string | null
          user_id?: string | null
          verified_at?: string | null
          whatsapp?: string
        }
        Relationships: [
          {
            foreignKeyName: "registration_requests_address_city_id_fkey"
            columns: ["address_city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "registration_requests_address_neighborhood_id_fkey"
            columns: ["address_neighborhood_id"]
            isOneToOne: false
            referencedRelation: "neighborhoods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "registration_requests_address_state_id_fkey"
            columns: ["address_state_id"]
            isOneToOne: false
            referencedRelation: "states"
            referencedColumns: ["id"]
          },
        ]
      }
      site_settings: {
        Row: {
          id: boolean
          maintenance_message_ar: string
          maintenance_message_en: string
          maintenance_mode: boolean
          updated_at: string
        }
        Insert: {
          id?: boolean
          maintenance_message_ar?: string
          maintenance_message_en?: string
          maintenance_mode?: boolean
          updated_at?: string
        }
        Update: {
          id?: boolean
          maintenance_message_ar?: string
          maintenance_message_en?: string
          maintenance_mode?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      states: {
        Row: {
          id: string
          is_active: boolean
          name_ar: string
          name_en: string
          sort_order: number
        }
        Insert: {
          id?: string
          is_active?: boolean
          name_ar: string
          name_en: string
          sort_order?: number
        }
        Update: {
          id?: string
          is_active?: boolean
          name_ar?: string
          name_en?: string
          sort_order?: number
        }
        Relationships: []
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
          role: Database["public"]["Enums"]["app_role"]
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
      wishlists: {
        Row: {
          added_at: string
          product_id: string
          profile_id: string
        }
        Insert: {
          added_at?: string
          product_id: string
          profile_id: string
        }
        Update: {
          added_at?: string
          product_id?: string
          profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wishlists_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "catalog_authenticated"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wishlists_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "catalog_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wishlists_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wishlists_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      catalog_authenticated: {
        Row: {
          brand_id: string | null
          brand_name_ar: string | null
          brand_name_en: string | null
          brand_slug: string | null
          category_id: string | null
          category_name_ar: string | null
          category_name_en: string | null
          category_slug: string | null
          compare_at_sdg: number | null
          created_at: string | null
          description_ar: string | null
          description_en: string | null
          has_discount: boolean | null
          id: string | null
          image_url: string | null
          in_stock: boolean | null
          is_best_seller: boolean | null
          is_featured: boolean | null
          is_new: boolean | null
          is_pick_of_day: boolean | null
          name_ar: string | null
          name_en: string | null
          price_sdg: number | null
          slug: string | null
        }
        Relationships: [
          {
            foreignKeyName: "products_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      catalog_public: {
        Row: {
          brand_id: string | null
          brand_name_ar: string | null
          brand_name_en: string | null
          brand_slug: string | null
          category_id: string | null
          category_name_ar: string | null
          category_name_en: string | null
          category_slug: string | null
          created_at: string | null
          description_ar: string | null
          description_en: string | null
          has_discount: boolean | null
          id: string | null
          image_url: string | null
          in_stock: boolean | null
          is_best_seller: boolean | null
          is_featured: boolean | null
          is_new: boolean | null
          is_pick_of_day: boolean | null
          name_ar: string | null
          name_en: string | null
          slug: string | null
        }
        Relationships: [
          {
            foreignKeyName: "products_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      claim_order: { Args: { _order_id: string }; Returns: Json }
      confirm_delivery_by_qr: {
        Args: { _order_id: string; _token: string }
        Returns: Json
      }
      expire_stale_orders: { Args: never; Returns: number }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_staff_or_admin: { Args: { _user_id: string }; Returns: boolean }
      place_order: {
        Args: {
          _address_city: string
          _address_neighborhood: string
          _address_notes: string
          _address_state: string
          _address_street: string
          _contact_name: string
          _contact_phone: string
          _contact_whatsapp: string
          _neighborhood_id: string
        }
        Returns: Json
      }
    }
    Enums: {
      app_role: "admin" | "staff" | "customer"
      order_status:
        | "new"
        | "review"
        | "paid"
        | "shipping"
        | "delivered"
        | "cancelled"
        | "returned"
      registration_request_status:
        | "pending"
        | "approved"
        | "rejected"
        | "verified"
        | "expired"
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
      app_role: ["admin", "staff", "customer"],
      order_status: [
        "new",
        "review",
        "paid",
        "shipping",
        "delivered",
        "cancelled",
        "returned",
      ],
      registration_request_status: [
        "pending",
        "approved",
        "rejected",
        "verified",
        "expired",
      ],
    },
  },
} as const
