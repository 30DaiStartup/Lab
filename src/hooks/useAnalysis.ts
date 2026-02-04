/**
 * React hooks for Analysis data management
 *
 * Provides hooks for fetching, mutating, and checking status of analysis data.
 * These hooks wrap the analysis service layer and provide React-friendly state management.
 */

import { useState, useEffect, useCallback, useMemo } from 'react'
import type { Database, EntityType } from '../types/database'
import * as analysisService from '../services/analysis'

// ============================================================================
// Type Definitions for JSONB Structures
// ============================================================================

/**
 * Structure for Current State analysis data
 * Captures the current situation, problems, and context
 */
export interface CurrentStateData {
  /** Brief summary of the current state */
  summary?: string
  /** List of identified problems or pain points */
  problems?: Array<{
    id: string
    description: string
    severity?: 'low' | 'medium' | 'high' | 'critical'
    impact?: string
  }>
  /** Key metrics or measurements of current state */
  metrics?: Array<{
    name: string
    currentValue: string | number
    targetValue?: string | number
    unit?: string
  }>
  /** Stakeholders affected by the current state */
  stakeholders?: Array<{
    name: string
    role?: string
    concerns?: string[]
  }>
  /** Additional notes or context */
  notes?: string
  /** Timestamp of last analysis */
  analyzedAt?: string
}

/**
 * Structure for Process Breakdown analysis data
 * Maps out the process steps and identifies bottlenecks
 */
export interface ProcessBreakdownData {
  /** Name of the process being analyzed */
  processName?: string
  /** Overall process description */
  description?: string
  /** Sequential steps in the process */
  steps?: Array<{
    id: string
    order: number
    name: string
    description?: string
    owner?: string
    duration?: string
    /** Indicates if this step is a bottleneck */
    isBottleneck?: boolean
    /** Issues identified in this step */
    issues?: string[]
  }>
  /** Identified bottlenecks in the process */
  bottlenecks?: Array<{
    stepId: string
    description: string
    impact: string
    rootCause?: string
  }>
  /** Dependencies between steps */
  dependencies?: Array<{
    fromStepId: string
    toStepId: string
    type?: 'blocking' | 'informational'
  }>
  /** Additional notes */
  notes?: string
  /** Timestamp of last analysis */
  analyzedAt?: string
}

/**
 * Structure for a single solution item
 */
export interface SolutionItem {
  id: string
  title: string
  description: string
  /** Effort required to implement */
  effort?: 'low' | 'medium' | 'high'
  /** Expected impact of the solution */
  impact?: 'low' | 'medium' | 'high'
  /** Implementation status */
  status?: 'proposed' | 'approved' | 'in_progress' | 'completed' | 'rejected'
  /** Who is responsible for implementation */
  owner?: string
  /** Target completion date */
  targetDate?: string
  /** Related step IDs from process breakdown */
  relatedStepIds?: string[]
  /** Notes or additional context */
  notes?: string
}

/**
 * Structure for Solutions analysis data
 * Contains two-prong approach: quick wins and systemic fixes
 */
export interface SolutionsData {
  /** Quick wins - low effort, fast implementation */
  quickWins?: SolutionItem[]
  /** Systemic fixes - address root causes, longer implementation */
  systemicFixes?: SolutionItem[]
  /** Priority ranking of all solutions */
  priorityOrder?: string[]
  /** Summary of the solution strategy */
  strategySummary?: string
  /** Additional notes */
  notes?: string
  /** Timestamp of last analysis */
  analyzedAt?: string
}

/**
 * Combined analysis data structure
 */
export interface AnalysisDataTyped {
  currentState: CurrentStateData | null
  processBreakdown: ProcessBreakdownData | null
  solutions: SolutionsData | null
}

// ============================================================================
// Type Aliases
// ============================================================================

type Analysis = Database['public']['Tables']['analysis']['Row']

// ============================================================================
// useAnalysis Hook
// ============================================================================

export interface UseAnalysisResult {
  /** The analysis data (null if not found or loading) */
  analysis: Analysis | null
  /** Typed access to the JSONB fields */
  analysisData: AnalysisDataTyped
  /** Whether the hook is currently fetching data */
  isLoading: boolean
  /** Error if the fetch failed */
  error: Error | null
  /** Function to manually refetch the data */
  refetch: () => Promise<void>
}

/**
 * Hook to fetch analysis for an entity
 *
 * @param entityId - The ID of the entity (outcome or experiment)
 * @param entityType - The type of entity ('Outcome' | 'Experiment')
 * @returns Analysis data, loading state, error, and refetch function
 *
 * @example
 * ```tsx
 * const { analysis, isLoading, error, refetch } = useAnalysis(outcomeId, 'Outcome')
 *
 * if (isLoading) return <Spinner />
 * if (error) return <Error message={error.message} />
 * if (!analysis) return <EmptyState />
 *
 * return <AnalysisView data={analysis} />
 * ```
 */
export function useAnalysis(
  entityId: number | null | undefined,
  entityType: EntityType
): UseAnalysisResult {
  const [analysis, setAnalysis] = useState<Analysis | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [error, setError] = useState<Error | null>(null)

  const fetchAnalysis = useCallback(async () => {
    if (entityId == null) {
      setAnalysis(null)
      setIsLoading(false)
      setError(null)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const data = await analysisService.getAnalysis(entityId, entityType)
      setAnalysis(data)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch analysis'))
      setAnalysis(null)
    } finally {
      setIsLoading(false)
    }
  }, [entityId, entityType])

  useEffect(() => {
    fetchAnalysis()
  }, [fetchAnalysis])

  // Provide typed access to JSONB fields
  const analysisData = useMemo<AnalysisDataTyped>(() => ({
    currentState: (analysis?.current_state as CurrentStateData | null) ?? null,
    processBreakdown: (analysis?.process_breakdown as ProcessBreakdownData | null) ?? null,
    solutions: (analysis?.solutions as SolutionsData | null) ?? null,
  }), [analysis])

  return {
    analysis,
    analysisData,
    isLoading,
    error,
    refetch: fetchAnalysis,
  }
}

// ============================================================================
// useAnalysisMutations Hook
// ============================================================================

export interface UseAnalysisMutationsResult {
  /** Create or update full analysis */
  saveAnalysis: (data: analysisService.AnalysisData) => Promise<Analysis>
  /** Partial update for current state section */
  updateCurrentState: (
    entityId: number,
    entityType: EntityType,
    data: CurrentStateData
  ) => Promise<Analysis>
  /** Partial update for process breakdown section */
  updateProcessBreakdown: (
    entityId: number,
    entityType: EntityType,
    data: ProcessBreakdownData
  ) => Promise<Analysis>
  /** Partial update for solutions section */
  updateSolutions: (
    entityId: number,
    entityType: EntityType,
    data: SolutionsData
  ) => Promise<Analysis>
  /** Remove analysis for an entity */
  deleteAnalysis: (entityId: number, entityType: EntityType) => Promise<boolean>
  /** Whether any mutation is currently in progress */
  isLoading: boolean
  /** Error from the most recent mutation */
  error: Error | null
  /** Clear the current error state */
  clearError: () => void
}

/**
 * Hook for analysis mutations (create, update, delete)
 *
 * Provides functions for all analysis mutation operations with
 * loading state and error handling.
 *
 * @returns Mutation functions and state
 *
 * @example
 * ```tsx
 * const { saveAnalysis, updateCurrentState, isLoading, error } = useAnalysisMutations()
 *
 * const handleSave = async () => {
 *   try {
 *     await saveAnalysis({
 *       entityId: outcomeId,
 *       entityType: 'Outcome',
 *       currentState: { summary: 'Current state...' }
 *     })
 *   } catch (err) {
 *     // Error is also available via the error state
 *   }
 * }
 * ```
 */
export function useAnalysisMutations(): UseAnalysisMutationsResult {
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [error, setError] = useState<Error | null>(null)

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  const wrapMutation = useCallback(
    <T>(fn: () => Promise<T>): Promise<T> => {
      setIsLoading(true)
      setError(null)

      return fn()
        .then((result) => {
          setIsLoading(false)
          return result
        })
        .catch((err) => {
          const error = err instanceof Error ? err : new Error('Mutation failed')
          setError(error)
          setIsLoading(false)
          throw error
        })
    },
    []
  )

  const saveAnalysis = useCallback(
    (data: analysisService.AnalysisData): Promise<Analysis> => {
      return wrapMutation(() => analysisService.saveAnalysis(data))
    },
    [wrapMutation]
  )

  const updateCurrentState = useCallback(
    (
      entityId: number,
      entityType: EntityType,
      data: CurrentStateData
    ): Promise<Analysis> => {
      return wrapMutation(() =>
        analysisService.updateCurrentState(entityId, entityType, data as Record<string, unknown>)
      )
    },
    [wrapMutation]
  )

  const updateProcessBreakdown = useCallback(
    (
      entityId: number,
      entityType: EntityType,
      data: ProcessBreakdownData
    ): Promise<Analysis> => {
      return wrapMutation(() =>
        analysisService.updateProcessBreakdown(
          entityId,
          entityType,
          data as Record<string, unknown>
        )
      )
    },
    [wrapMutation]
  )

  const updateSolutions = useCallback(
    (
      entityId: number,
      entityType: EntityType,
      data: SolutionsData
    ): Promise<Analysis> => {
      return wrapMutation(() =>
        analysisService.updateSolutions(entityId, entityType, data as Record<string, unknown>)
      )
    },
    [wrapMutation]
  )

  const deleteAnalysis = useCallback(
    (entityId: number, entityType: EntityType): Promise<boolean> => {
      return wrapMutation(() => analysisService.deleteAnalysis(entityId, entityType))
    },
    [wrapMutation]
  )

  return {
    saveAnalysis,
    updateCurrentState,
    updateProcessBreakdown,
    updateSolutions,
    deleteAnalysis,
    isLoading,
    error,
    clearError,
  }
}

// ============================================================================
// useAnalysisStatus Hook
// ============================================================================

export type AnalysisSection = 'currentState' | 'processBreakdown' | 'solutions'

export interface UseAnalysisStatusResult {
  /** Whether analysis exists for this entity */
  hasAnalysis: boolean
  /** Whether all sections are filled (analysis is complete) */
  isComplete: boolean
  /** List of completed section names */
  completedSections: AnalysisSection[]
  /** List of incomplete section names */
  incompleteSections: AnalysisSection[]
  /** Completion percentage (0-100) */
  completionPercentage: number
  /** Whether the status is still loading */
  isLoading: boolean
}

/**
 * Hook to check analysis completion status for an entity
 *
 * Provides a simple interface to check whether analysis exists and
 * which sections are complete.
 *
 * @param entityId - The ID of the entity
 * @param entityType - The type of entity ('Outcome' | 'Experiment')
 * @returns Analysis status information
 *
 * @example
 * ```tsx
 * const { hasAnalysis, isComplete, completedSections } = useAnalysisStatus(
 *   outcomeId,
 *   'Outcome'
 * )
 *
 * if (!hasAnalysis) {
 *   return <Button>Start Analysis</Button>
 * }
 *
 * return (
 *   <ProgressBar value={completedSections.length} max={3} />
 * )
 * ```
 */
export function useAnalysisStatus(
  entityId: number | null | undefined,
  entityType: EntityType
): UseAnalysisStatusResult {
  const { analysis, isLoading } = useAnalysis(entityId, entityType)

  return useMemo(() => {
    const allSections: AnalysisSection[] = ['currentState', 'processBreakdown', 'solutions']

    if (!analysis) {
      return {
        hasAnalysis: false,
        isComplete: false,
        completedSections: [],
        incompleteSections: allSections,
        completionPercentage: 0,
        isLoading,
      }
    }

    const completedSections: AnalysisSection[] = []
    const incompleteSections: AnalysisSection[] = []

    // Check current_state
    if (analysis.current_state && Object.keys(analysis.current_state).length > 0) {
      completedSections.push('currentState')
    } else {
      incompleteSections.push('currentState')
    }

    // Check process_breakdown
    if (analysis.process_breakdown && Object.keys(analysis.process_breakdown).length > 0) {
      completedSections.push('processBreakdown')
    } else {
      incompleteSections.push('processBreakdown')
    }

    // Check solutions
    if (analysis.solutions && Object.keys(analysis.solutions).length > 0) {
      completedSections.push('solutions')
    } else {
      incompleteSections.push('solutions')
    }

    const isComplete = completedSections.length === allSections.length
    const completionPercentage = Math.round(
      (completedSections.length / allSections.length) * 100
    )

    return {
      hasAnalysis: true,
      isComplete,
      completedSections,
      incompleteSections,
      completionPercentage,
      isLoading,
    }
  }, [analysis, isLoading])
}

// ============================================================================
// Future AI Integration Helpers
// ============================================================================

/**
 * Interface for AI-generated analysis results
 * Prepared for future integration with AI analysis generation
 */
export interface AIAnalysisResult {
  currentState?: CurrentStateData
  processBreakdown?: ProcessBreakdownData
  solutions?: SolutionsData
  confidence?: number
  generatedAt: string
}

/**
 * Placeholder type for AI analysis generation options
 * Will be expanded when AI integration is implemented
 */
export interface AIAnalysisOptions {
  /** Which sections to generate */
  sections?: AnalysisSection[]
  /** Context from related entities */
  context?: {
    outcomeTitle?: string
    outcomeDescription?: string
    experimentTitle?: string
    experimentSpec?: string
  }
  /** Generation preferences */
  preferences?: {
    detailLevel?: 'brief' | 'standard' | 'detailed'
    focusAreas?: string[]
  }
}

/**
 * Type guard to check if data is valid CurrentStateData
 */
export function isCurrentStateData(data: unknown): data is CurrentStateData {
  if (!data || typeof data !== 'object') return false
  const obj = data as Record<string, unknown>
  // At minimum, should have some recognizable fields
  return (
    'summary' in obj ||
    'problems' in obj ||
    'metrics' in obj ||
    'stakeholders' in obj ||
    'notes' in obj
  )
}

/**
 * Type guard to check if data is valid ProcessBreakdownData
 */
export function isProcessBreakdownData(data: unknown): data is ProcessBreakdownData {
  if (!data || typeof data !== 'object') return false
  const obj = data as Record<string, unknown>
  return (
    'processName' in obj ||
    'steps' in obj ||
    'bottlenecks' in obj ||
    'description' in obj
  )
}

/**
 * Type guard to check if data is valid SolutionsData
 */
export function isSolutionsData(data: unknown): data is SolutionsData {
  if (!data || typeof data !== 'object') return false
  const obj = data as Record<string, unknown>
  return (
    'quickWins' in obj ||
    'systemicFixes' in obj ||
    'priorityOrder' in obj ||
    'strategySummary' in obj
  )
}
