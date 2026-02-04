/**
 * Metrics Roll-up Hook
 *
 * Provides automatic progress recalculation when tasks change.
 * - Listens for task status changes
 * - Recalculates experiment progress based on task completion
 * - Recalculates outcome progress based on experiment progress
 * - Persists updates to the database
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import type { Database } from '@/types/database'
import {
  calculateExperimentProgress,
  calculateOutcomeProgress,
  type ExperimentWithTaskCount,
} from '@/utils/metricsRollup'
import { useExperimentMutations } from './useExperiments'
import { useOutcomeMutations } from './useOutcomes'

type Task = Database['public']['Tables']['tasks']['Row']

/**
 * Options for useMetricsRollup hook
 */
export interface UseMetricsRollupOptions {
  /** Whether to automatically update experiment progress when tasks change */
  autoUpdateExperiment?: boolean
  /** Whether to automatically update outcome progress when experiment progress changes */
  autoUpdateOutcome?: boolean
  /** Callback after experiment progress is updated */
  onExperimentProgressUpdated?: (experimentId: number, newProgress: number) => void
  /** Callback after outcome progress is updated */
  onOutcomeProgressUpdated?: (outcomeId: number, newProgress: number) => void
  /** Debounce delay in milliseconds for updates (default: 300ms) */
  debounceMs?: number
}

/**
 * Return type for useMetricsRollup hook
 */
export interface UseMetricsRollupResult {
  /** Manually trigger experiment progress recalculation */
  recalculateExperimentProgress: (tasks: Task[]) => number
  /** Manually trigger outcome progress recalculation */
  recalculateOutcomeProgress: (experiments: ExperimentWithTaskCount[]) => number
  /** Update experiment progress in database */
  updateExperimentProgress: (experimentId: number, tasks: Task[]) => Promise<void>
  /** Update outcome progress in database */
  updateOutcomeProgress: (outcomeId: number, experiments: ExperimentWithTaskCount[]) => Promise<void>
  /** Whether an experiment update is in progress */
  isUpdatingExperiment: boolean
  /** Whether an outcome update is in progress */
  isUpdatingOutcome: boolean
  /** Last calculated experiment progress */
  lastExperimentProgress: number | null
  /** Last calculated outcome progress */
  lastOutcomeProgress: number | null
  /** Any error that occurred during updates */
  error: Error | null
}

/**
 * Hook for automatic metrics roll-up from tasks to experiments to outcomes.
 *
 * Handles the automatic recalculation and persistence of progress metrics
 * when tasks are moved in the Kanban board or otherwise updated.
 *
 * @param experimentId - The experiment ID to track (optional, for experiment-level tracking)
 * @param outcomeId - The outcome ID to track (optional, for outcome-level tracking)
 * @param options - Configuration options
 * @returns Object with roll-up functions, loading states, and calculated values
 *
 * @example
 * ```tsx
 * // In ExperimentDetail page
 * const { updateExperimentProgress, isUpdatingExperiment } = useMetricsRollup(
 *   experimentId,
 *   outcome?.id,
 *   { autoUpdateExperiment: true }
 * )
 *
 * // When a task is moved in Kanban
 * const handleTaskMove = async (taskId, newStatus) => {
 *   await moveTask(taskId, newStatus)
 *   await updateExperimentProgress(experimentId, updatedTasks)
 * }
 * ```
 */
export function useMetricsRollup(
  _experimentId?: number | null,
  _outcomeId?: number | null,
  options: UseMetricsRollupOptions = {}
): UseMetricsRollupResult {
  const {
    // These options are available for future use but currently the hook relies on explicit calls
    autoUpdateExperiment: _autoUpdateExperiment = true,
    autoUpdateOutcome: _autoUpdateOutcome = true,
    onExperimentProgressUpdated,
    onOutcomeProgressUpdated,
    debounceMs = 300,
  } = options

  // State
  const [isUpdatingExperiment, setIsUpdatingExperiment] = useState(false)
  const [isUpdatingOutcome, setIsUpdatingOutcome] = useState(false)
  const [lastExperimentProgress, setLastExperimentProgress] = useState<number | null>(null)
  const [lastOutcomeProgress, setLastOutcomeProgress] = useState<number | null>(null)
  const [error, setError] = useState<Error | null>(null)

  // Refs for debouncing
  const experimentUpdateTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const outcomeUpdateTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Mutations
  const { updateExperiment } = useExperimentMutations()
  const { updateOutcome } = useOutcomeMutations()

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (experimentUpdateTimeoutRef.current) {
        clearTimeout(experimentUpdateTimeoutRef.current)
      }
      if (outcomeUpdateTimeoutRef.current) {
        clearTimeout(outcomeUpdateTimeoutRef.current)
      }
    }
  }, [])

  /**
   * Calculate experiment progress from tasks (pure function wrapper)
   */
  const recalculateExperimentProgress = useCallback((tasks: Task[]): number => {
    const progress = calculateExperimentProgress(tasks)
    setLastExperimentProgress(progress)
    return progress
  }, [])

  /**
   * Calculate outcome progress from experiments (pure function wrapper)
   */
  const recalculateOutcomeProgress = useCallback(
    (experiments: ExperimentWithTaskCount[]): number => {
      const progress = calculateOutcomeProgress(experiments)
      setLastOutcomeProgress(progress)
      return progress
    },
    []
  )

  /**
   * Update experiment progress in the database
   */
  const updateExperimentProgress = useCallback(
    async (expId: number, tasks: Task[]): Promise<void> => {
      // Clear any pending debounced update
      if (experimentUpdateTimeoutRef.current) {
        clearTimeout(experimentUpdateTimeoutRef.current)
      }

      // Debounce the update
      return new Promise((resolve, reject) => {
        experimentUpdateTimeoutRef.current = setTimeout(async () => {
          setIsUpdatingExperiment(true)
          setError(null)

          try {
            const newProgress = calculateExperimentProgress(tasks)
            setLastExperimentProgress(newProgress)

            await updateExperiment(expId, { progress: newProgress })

            onExperimentProgressUpdated?.(expId, newProgress)
            resolve()
          } catch (err) {
            const error =
              err instanceof Error ? err : new Error('Failed to update experiment progress')
            setError(error)
            reject(error)
          } finally {
            setIsUpdatingExperiment(false)
          }
        }, debounceMs)
      })
    },
    [updateExperiment, onExperimentProgressUpdated, debounceMs]
  )

  /**
   * Update outcome progress in the database
   */
  const updateOutcomeProgress = useCallback(
    async (outId: number, experiments: ExperimentWithTaskCount[]): Promise<void> => {
      // Clear any pending debounced update
      if (outcomeUpdateTimeoutRef.current) {
        clearTimeout(outcomeUpdateTimeoutRef.current)
      }

      // Debounce the update
      return new Promise((resolve, reject) => {
        outcomeUpdateTimeoutRef.current = setTimeout(async () => {
          setIsUpdatingOutcome(true)
          setError(null)

          try {
            const newProgress = calculateOutcomeProgress(experiments)
            setLastOutcomeProgress(newProgress)

            await updateOutcome(outId, { progress: newProgress })

            onOutcomeProgressUpdated?.(outId, newProgress)
            resolve()
          } catch (err) {
            const error =
              err instanceof Error ? err : new Error('Failed to update outcome progress')
            setError(error)
            reject(error)
          } finally {
            setIsUpdatingOutcome(false)
          }
        }, debounceMs)
      })
    },
    [updateOutcome, onOutcomeProgressUpdated, debounceMs]
  )

  return {
    recalculateExperimentProgress,
    recalculateOutcomeProgress,
    updateExperimentProgress,
    updateOutcomeProgress,
    isUpdatingExperiment,
    isUpdatingOutcome,
    lastExperimentProgress,
    lastOutcomeProgress,
    error,
  }
}

/**
 * Simplified hook for experiment-level metrics roll-up.
 *
 * Use this when you only need to update experiment progress based on tasks.
 *
 * @param experimentId - The experiment ID
 * @param tasks - Current tasks for the experiment
 * @param onProgressChange - Optional callback when progress changes
 * @returns Object with current progress and update function
 */
export function useExperimentMetrics(
  experimentId: number | null | undefined,
  tasks: Task[],
  onProgressChange?: (newProgress: number) => void
) {
  const [progress, setProgress] = useState<number>(0)
  const [isUpdating, setIsUpdating] = useState(false)
  const prevTasksRef = useRef<string>('')

  const { updateExperiment } = useExperimentMutations()

  // Calculate progress when tasks change
  useEffect(() => {
    const tasksKey = JSON.stringify(tasks.map((t) => ({ id: t.id, status: t.status })))

    // Only recalculate if tasks actually changed
    if (tasksKey !== prevTasksRef.current) {
      prevTasksRef.current = tasksKey
      const newProgress = calculateExperimentProgress(tasks)
      setProgress(newProgress)
      onProgressChange?.(newProgress)
    }
  }, [tasks, onProgressChange])

  // Update database
  const updateProgress = useCallback(async () => {
    if (!experimentId) return

    setIsUpdating(true)
    try {
      const newProgress = calculateExperimentProgress(tasks)
      await updateExperiment(experimentId, { progress: newProgress })
      setProgress(newProgress)
    } catch (err) {
      console.error('Failed to update experiment progress:', err)
      throw err
    } finally {
      setIsUpdating(false)
    }
  }, [experimentId, tasks, updateExperiment])

  return {
    progress,
    isUpdating,
    updateProgress,
  }
}

/**
 * Hook that tracks task changes and automatically updates experiment progress.
 *
 * This is a convenience hook that combines task tracking with automatic
 * progress updates. Use it when you want fully automatic behavior.
 *
 * @param experimentId - The experiment ID
 * @param tasks - Current tasks array
 * @param enabled - Whether auto-update is enabled (default: true)
 */
export function useAutoExperimentProgress(
  experimentId: number | null | undefined,
  tasks: Task[],
  enabled: boolean = true
) {
  const { updateExperimentProgress, isUpdatingExperiment, lastExperimentProgress, error } =
    useMetricsRollup(experimentId, null, {
      autoUpdateExperiment: enabled,
      debounceMs: 500, // Slightly longer debounce for auto-updates
    })

  const prevTaskStatusRef = useRef<string>('')

  // Auto-update when task statuses change
  useEffect(() => {
    if (!enabled || !experimentId || !tasks.length) return

    // Create a hash of task statuses to detect changes
    const statusHash = tasks.map((t) => `${t.id}:${t.status}`).join(',')

    if (statusHash !== prevTaskStatusRef.current) {
      prevTaskStatusRef.current = statusHash
      updateExperimentProgress(experimentId, tasks).catch(console.error)
    }
  }, [tasks, experimentId, enabled, updateExperimentProgress])

  return {
    progress: lastExperimentProgress,
    isUpdating: isUpdatingExperiment,
    error,
  }
}
