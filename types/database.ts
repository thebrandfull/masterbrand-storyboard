export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      brands: {
        Row: {
          id: string
          name: string
          mission: string | null
          voice_tone: string | null
          target_audience: string | null
          visual_lexicon: string | null
          dos: string[] | null
          donts: string[] | null
          proof_points: string[] | null
          cta_library: string[] | null
          negative_prompts: string[] | null
          platform_constraints: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          mission?: string | null
          voice_tone?: string | null
          target_audience?: string | null
          visual_lexicon?: string | null
          dos?: string[] | null
          donts?: string[] | null
          proof_points?: string[] | null
          cta_library?: string[] | null
          negative_prompts?: string[] | null
          platform_constraints?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          mission?: string | null
          voice_tone?: string | null
          target_audience?: string | null
          visual_lexicon?: string | null
          dos?: string[] | null
          donts?: string[] | null
          proof_points?: string[] | null
          cta_library?: string[] | null
          negative_prompts?: string[] | null
          platform_constraints?: Json | null
          created_at?: string
        }
      }
      topics: {
        Row: {
          id: string
          brand_id: string
          label: string
          weight: number
          min_frequency: number | null
          max_frequency: number | null
          examples: string[] | null
          created_at: string
        }
        Insert: {
          id?: string
          brand_id: string
          label: string
          weight?: number
          min_frequency?: number | null
          max_frequency?: number | null
          examples?: string[] | null
          created_at?: string
        }
        Update: {
          id?: string
          brand_id?: string
          label?: string
          weight?: number
          min_frequency?: number | null
          max_frequency?: number | null
          examples?: string[] | null
          created_at?: string
        }
      }
      content_items: {
        Row: {
          id: string
          brand_id: string
          date_target: string
          platform: string
          status: 'idea' | 'prompted' | 'generated' | 'enhanced' | 'qc' | 'scheduled' | 'published'
          notes: string | null
          attachments: Json | null
          blocker_reason: string | null
          files: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          brand_id: string
          date_target: string
          platform: string
          status?: 'idea' | 'prompted' | 'generated' | 'enhanced' | 'qc' | 'scheduled' | 'published'
          notes?: string | null
          attachments?: Json | null
          blocker_reason?: string | null
          files?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          brand_id?: string
          date_target?: string
          platform?: string
          status?: 'idea' | 'prompted' | 'generated' | 'enhanced' | 'qc' | 'scheduled' | 'published'
          notes?: string | null
          attachments?: Json | null
          blocker_reason?: string | null
          files?: Json | null
          created_at?: string
          updated_at?: string
        }
      }
      generations: {
        Row: {
          id: string
          content_item_id: string
          prompt_text: string
          title: string
          description: string
          tags: string[] | null
          thumbnail_brief: string | null
          model_params: Json | null
          critique_score: number | null
          created_at: string
        }
        Insert: {
          id?: string
          content_item_id: string
          prompt_text: string
          title: string
          description: string
          tags?: string[] | null
          thumbnail_brief?: string | null
          model_params?: Json | null
          critique_score?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          content_item_id?: string
          prompt_text?: string
          title?: string
          description?: string
          tags?: string[] | null
          thumbnail_brief?: string | null
          model_params?: Json | null
          critique_score?: number | null
          created_at?: string
        }
      }
      assets: {
        Row: {
          id: string
          content_item_id: string
          type: 'video' | 'thumbnail'
          url: string
          provider_meta: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          content_item_id: string
          type: 'video' | 'thumbnail'
          url: string
          provider_meta?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          content_item_id?: string
          type?: 'video' | 'thumbnail'
          url?: string
          provider_meta?: Json | null
          created_at?: string
        }
      }
      templates: {
        Row: {
          id: string
          brand_id: string
          prompt_template: string
          title_template: string
          desc_template: string
          tag_template: string
          created_at: string
        }
        Insert: {
          id?: string
          brand_id: string
          prompt_template: string
          title_template: string
          desc_template: string
          tag_template: string
          created_at?: string
        }
        Update: {
          id?: string
          brand_id?: string
          prompt_template?: string
          title_template?: string
          desc_template?: string
          tag_template?: string
          created_at?: string
        }
      }
      brand_vectors: {
        Row: {
          id: string
          brand_id: string
          type: string
          source_key: string
          content: string
          metadata: Json | null
          embedding: number[] | null
          created_at: string
        }
        Insert: {
          id?: string
          brand_id: string
          type: string
          source_key: string
          content: string
          metadata?: Json | null
          embedding: number[] | null
          created_at?: string
        }
        Update: {
          id?: string
          brand_id?: string
          type?: string
          source_key?: string
          content?: string
          metadata?: Json | null
          embedding?: number[] | null
          created_at?: string
        }
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
  }
}
