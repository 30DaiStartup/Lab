// Database types - will be generated from Supabase schema in Task #2
// For now, placeholder types based on PRD Section 7

export type OutcomeStatus = 'Active' | 'Stalled' | 'Completed'
export type OutcomeLevel = 'Org' | 'Departmental'
export type CascadeAlignment =
  | 'WinningAspiration'
  | 'WhereToPlay'
  | 'HowToWin'
  | 'Capabilities'
  | 'ManagementSystems'

export type ExperimentStatus = 'Backlog' | 'InProgress' | 'Done'
export type TaskStatus = 'Backlog' | 'InProgress' | 'Done'
export type RaciRole = 'Responsible' | 'Accountable' | 'Support' | 'Consulted' | 'Informed'
export type EntityType = 'Outcome' | 'Experiment'

export interface Database {
  public: {
    Tables: {
      outcomes: {
        Row: {
          id: number
          title: string
          description: string | null
          status: OutcomeStatus
          progress: number
          metrics: Record<string, unknown> | null
          cascade_alignment: CascadeAlignment[]
          level: OutcomeLevel
          parent_outcome_id: number | null
          created_at: string
          updated_at: string | null
        }
        Insert: {
          id?: number
          title: string
          description?: string | null
          status: OutcomeStatus
          progress: number
          metrics?: Record<string, unknown> | null
          cascade_alignment: CascadeAlignment[]
          level: OutcomeLevel
          parent_outcome_id?: number | null
          created_at?: string
          updated_at?: string | null
        }
        Update: {
          id?: number
          title?: string
          description?: string | null
          status?: OutcomeStatus
          progress?: number
          metrics?: Record<string, unknown> | null
          cascade_alignment?: CascadeAlignment[]
          level?: OutcomeLevel
          parent_outcome_id?: number | null
          created_at?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'outcomes_parent_outcome_id_fkey'
            columns: ['parent_outcome_id']
            referencedRelation: 'outcomes'
            referencedColumns: ['id']
          }
        ]
      }
      experiments: {
        Row: {
          id: number
          outcome_id: number
          title: string
          status: ExperimentStatus
          progress: number
          inputs: Record<string, unknown> | null
          scope: Record<string, unknown> | null
          spec: string | null
          created_at: string
          updated_at: string | null
        }
        Insert: {
          id?: number
          outcome_id: number
          title: string
          status: ExperimentStatus
          progress: number
          inputs?: Record<string, unknown> | null
          scope?: Record<string, unknown> | null
          spec?: string | null
          created_at?: string
          updated_at?: string | null
        }
        Update: {
          id?: number
          outcome_id?: number
          title?: string
          status?: ExperimentStatus
          progress?: number
          inputs?: Record<string, unknown> | null
          scope?: Record<string, unknown> | null
          spec?: string | null
          created_at?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'experiments_outcome_id_fkey'
            columns: ['outcome_id']
            referencedRelation: 'outcomes'
            referencedColumns: ['id']
          }
        ]
      }
      raci: {
        Row: {
          id: number
          entity_id: number
          entity_type: EntityType
          role: RaciRole
          user_id: number
        }
        Insert: {
          id?: number
          entity_id: number
          entity_type: EntityType
          role: RaciRole
          user_id: number
        }
        Update: {
          id?: number
          entity_id?: number
          entity_type?: EntityType
          role?: RaciRole
          user_id?: number
        }
        Relationships: []
      }
      tasks: {
        Row: {
          id: number
          experiment_id: number
          title: string
          description: string | null
          assignee: number | null
          due_date: string | null
          status: TaskStatus
        }
        Insert: {
          id?: number
          experiment_id: number
          title: string
          description?: string | null
          assignee?: number | null
          due_date?: string | null
          status: TaskStatus
        }
        Update: {
          id?: number
          experiment_id?: number
          title?: string
          description?: string | null
          assignee?: number | null
          due_date?: string | null
          status?: TaskStatus
        }
        Relationships: [
          {
            foreignKeyName: 'tasks_experiment_id_fkey'
            columns: ['experiment_id']
            referencedRelation: 'experiments'
            referencedColumns: ['id']
          }
        ]
      }
      analysis: {
        Row: {
          id: number
          entity_id: number
          entity_type: EntityType
          current_state: Record<string, unknown> | null
          process_breakdown: Record<string, unknown> | null
          solutions: Record<string, unknown> | null
        }
        Insert: {
          id?: number
          entity_id: number
          entity_type: EntityType
          current_state?: Record<string, unknown> | null
          process_breakdown?: Record<string, unknown> | null
          solutions?: Record<string, unknown> | null
        }
        Update: {
          id?: number
          entity_id?: number
          entity_type?: EntityType
          current_state?: Record<string, unknown> | null
          process_breakdown?: Record<string, unknown> | null
          solutions?: Record<string, unknown> | null
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          id: number
          action: string
          user_id: number | null
          entity_id: number | null
          timestamp: string
        }
        Insert: {
          id?: number
          action: string
          user_id?: number | null
          entity_id?: number | null
          timestamp?: string
        }
        Update: {
          id?: number
          action?: string
          user_id?: number | null
          entity_id?: number | null
          timestamp?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      outcome_status: OutcomeStatus
      outcome_level: OutcomeLevel
      cascade_alignment: CascadeAlignment
      experiment_status: ExperimentStatus
      task_status: TaskStatus
      raci_role: RaciRole
      entity_type: EntityType
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
