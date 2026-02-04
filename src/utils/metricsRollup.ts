/**
 * Metrics Roll-up Utility Functions
 *
 * Provides automatic progress calculation that rolls up from tasks to experiments to outcomes.
 * - Task completion drives experiment progress
 * - Experiment progress drives outcome progress (weighted by task count)
 */

import type { Database } from '@/types/database'

type Task = Database['public']['Tables']['tasks']['Row']
type Experiment = Database['public']['Tables']['experiments']['Row']

/**
 * Interface for experiment with task count for weighted calculations
 */
export interface ExperimentWithTaskCount extends Experiment {
  taskCount: number
}

/**
 * Calculate experiment progress based on task completion.
 *
 * Formula: (completed tasks / total tasks) * 100
 *
 * @param tasks - Array of tasks belonging to the experiment
 * @returns Progress percentage (0-100), returns 0 if no tasks
 *
 * @example
 * ```ts
 * const tasks = [
 *   { status: 'Done', ... },
 *   { status: 'InProgress', ... },
 *   { status: 'Backlog', ... }
 * ]
 * calculateExperimentProgress(tasks) // Returns 33 (1 done out of 3)
 * ```
 */
export function calculateExperimentProgress(tasks: Task[]): number {
  // Edge case: no tasks = 0% progress
  if (!tasks || tasks.length === 0) {
    return 0
  }

  const completedTasks = tasks.filter((task) => task.status === 'Done').length
  const totalTasks = tasks.length

  // Calculate percentage and round to nearest integer
  const progress = Math.round((completedTasks / totalTasks) * 100)

  // Ensure we return a valid percentage (0-100)
  return Math.max(0, Math.min(100, progress))
}

/**
 * Calculate outcome progress based on experiment progress.
 *
 * Uses weighted average based on task count per experiment.
 * Formula: sum(experiment.progress * experiment.taskCount) / sum(taskCounts)
 *
 * This gives more weight to experiments with more tasks, providing a more
 * accurate representation of overall work completed.
 *
 * @param experiments - Array of experiments with their progress and task counts
 * @returns Progress percentage (0-100), returns 0 if no experiments or all have 0 tasks
 *
 * @example
 * ```ts
 * const experiments = [
 *   { progress: 75, taskCount: 8 },  // Weight: 8
 *   { progress: 50, taskCount: 4 },  // Weight: 4
 *   { progress: 100, taskCount: 2 }, // Weight: 2
 * ]
 * // Weighted: (75*8 + 50*4 + 100*2) / (8+4+2) = (600 + 200 + 200) / 14 = 71.4
 * calculateOutcomeProgress(experiments) // Returns 71
 * ```
 */
export function calculateOutcomeProgress(experiments: ExperimentWithTaskCount[]): number {
  // Edge case: no experiments = 0% progress
  if (!experiments || experiments.length === 0) {
    return 0
  }

  // Calculate total task count across all experiments
  const totalTaskCount = experiments.reduce((sum, exp) => sum + (exp.taskCount || 0), 0)

  // Edge case: all experiments have 0 tasks - use simple average instead
  if (totalTaskCount === 0) {
    // Fall back to simple average if no tasks anywhere
    const simpleAvg = experiments.reduce((sum, exp) => sum + exp.progress, 0) / experiments.length
    return Math.round(simpleAvg)
  }

  // Weighted average calculation
  const weightedSum = experiments.reduce(
    (sum, exp) => sum + exp.progress * (exp.taskCount || 0),
    0
  )

  const progress = Math.round(weightedSum / totalTaskCount)

  // Ensure we return a valid percentage (0-100)
  return Math.max(0, Math.min(100, progress))
}

/**
 * Calculate outcome progress using simple average (unweighted).
 *
 * Alternative to weighted calculation when task counts are not available
 * or when equal weight is preferred.
 *
 * Formula: sum(experiment.progress) / number of experiments
 *
 * @param experiments - Array of experiments with their progress values
 * @returns Progress percentage (0-100), returns 0 if no experiments
 */
export function calculateOutcomeProgressSimple(experiments: Array<{ progress: number }>): number {
  if (!experiments || experiments.length === 0) {
    return 0
  }

  const totalProgress = experiments.reduce((sum, exp) => sum + exp.progress, 0)
  const progress = Math.round(totalProgress / experiments.length)

  return Math.max(0, Math.min(100, progress))
}

/**
 * Determine if experiment status should be auto-updated based on task completion.
 *
 * Rules:
 * - If all tasks are Done -> experiment should be 'Done'
 * - If any task is InProgress -> experiment should be 'InProgress'
 * - If all tasks are Backlog (or no tasks) -> experiment stays as is or 'Backlog'
 *
 * @param tasks - Array of tasks belonging to the experiment
 * @returns Suggested experiment status, or null if no change recommended
 */
export function suggestExperimentStatus(tasks: Task[]): 'Backlog' | 'InProgress' | 'Done' | null {
  if (!tasks || tasks.length === 0) {
    return null // No suggestion without tasks
  }

  const allDone = tasks.every((task) => task.status === 'Done')
  const anyInProgress = tasks.some((task) => task.status === 'InProgress')
  const anyDone = tasks.some((task) => task.status === 'Done')

  if (allDone) {
    return 'Done'
  }

  if (anyInProgress || anyDone) {
    return 'InProgress'
  }

  // All backlog
  return 'Backlog'
}

/**
 * Count tasks by status for an experiment
 */
export function countTasksByStatus(tasks: Task[]): {
  total: number
  backlog: number
  inProgress: number
  done: number
} {
  if (!tasks || tasks.length === 0) {
    return { total: 0, backlog: 0, inProgress: 0, done: 0 }
  }

  return {
    total: tasks.length,
    backlog: tasks.filter((t) => t.status === 'Backlog').length,
    inProgress: tasks.filter((t) => t.status === 'InProgress').length,
    done: tasks.filter((t) => t.status === 'Done').length,
  }
}
