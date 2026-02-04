import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import type { Database, TaskStatus } from '@/types/database'
import {
  getTasks,
  getTask as getTaskService,
  createTask as createTaskService,
  updateTask as updateTaskService,
  updateTaskStatus as updateTaskStatusService,
  deleteTask as deleteTaskService,
  bulkUpdateTasks as bulkUpdateTasksService,
  type TaskFilters,
} from '@/services/tasks'

type Task = Database['public']['Tables']['tasks']['Row']
type TaskInsert = Database['public']['Tables']['tasks']['Insert']
type TaskUpdate = Database['public']['Tables']['tasks']['Update']

/** Tasks grouped by status for Kanban board */
export interface TasksByStatus {
  Backlog: Task[]
  InProgress: Task[]
  Done: Task[]
}

/** Filter options for useTasks hook */
export interface UseTasksFilters {
  status?: TaskStatus
  assignee?: number | null
}

/** Return type for useTasks hook */
export interface UseTasksResult {
  tasks: Task[]
  tasksByStatus: TasksByStatus
  isLoading: boolean
  error: Error | null
  refetch: () => Promise<void>
}

/** Return type for useTask hook */
export interface UseTaskResult {
  task: Task | null
  isLoading: boolean
  error: Error | null
  refetch: () => Promise<void>
}

/** Return type for useTaskMutations hook */
export interface UseTaskMutationsResult {
  createTask: (data: TaskInsert) => Promise<Task>
  updateTask: (id: number, data: TaskUpdate) => Promise<Task>
  updateTaskStatus: (id: number, status: TaskStatus) => Promise<Task>
  deleteTask: (id: number) => Promise<boolean>
  bulkUpdateTasks: (updates: Array<{ id: number; data: TaskUpdate }>) => Promise<Task[]>
  isCreating: boolean
  isUpdating: boolean
  isDeleting: boolean
  isBulkUpdating: boolean
  error: Error | null
}

/**
 * Helper function to group tasks by status for Kanban board
 * @param tasks - Array of tasks to group
 * @returns Object with tasks grouped by Backlog, InProgress, and Done
 */
export function groupTasksByStatus(tasks: Task[]): TasksByStatus {
  return {
    Backlog: tasks.filter((task) => task.status === 'Backlog'),
    InProgress: tasks.filter((task) => task.status === 'InProgress'),
    Done: tasks.filter((task) => task.status === 'Done'),
  }
}

/**
 * Hook to fetch and manage list of tasks for an experiment
 * Supports filtering by status and assignee
 * Provides tasks grouped by status for Kanban board display
 *
 * @param experimentId - The experiment ID to fetch tasks for (required)
 * @param filters - Optional filters to apply
 * @returns Object with tasks array, tasksByStatus, loading state, error, and refetch function
 */
export function useTasks(
  experimentId: number | null | undefined,
  filters?: UseTasksFilters
): UseTasksResult {
  const [tasks, setTasks] = useState<Task[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  // Memoize filters to prevent unnecessary refetches
  const memoizedFilters = useMemo<TaskFilters | undefined>(() => {
    if (!filters) return undefined
    return {
      status: filters.status,
      assignee: filters.assignee,
    }
  }, [filters?.status, filters?.assignee])

  // Track mounted state to prevent state updates after unmount
  const isMountedRef = useRef(true)

  const fetchTasks = useCallback(async () => {
    if (experimentId === null || experimentId === undefined) {
      setTasks([])
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const data = await getTasks(experimentId, memoizedFilters)
      if (isMountedRef.current) {
        setTasks(data)
      }
    } catch (err) {
      if (isMountedRef.current) {
        setError(err instanceof Error ? err : new Error('Failed to fetch tasks'))
      }
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false)
      }
    }
  }, [experimentId, memoizedFilters])

  useEffect(() => {
    isMountedRef.current = true
    fetchTasks()

    return () => {
      isMountedRef.current = false
    }
  }, [fetchTasks])

  const refetch = useCallback(async () => {
    await fetchTasks()
  }, [fetchTasks])

  // Memoize tasksByStatus to prevent unnecessary recalculations
  const tasksByStatus = useMemo(() => groupTasksByStatus(tasks), [tasks])

  return { tasks, tasksByStatus, isLoading, error, refetch }
}

/**
 * Hook to fetch a single task by ID
 *
 * @param id - The task ID to fetch
 * @returns Object with task, loading state, error, and refetch function
 */
export function useTask(id: number | null | undefined): UseTaskResult {
  const [task, setTask] = useState<Task | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  // Track mounted state to prevent state updates after unmount
  const isMountedRef = useRef(true)

  const fetchTask = useCallback(async () => {
    if (id === null || id === undefined) {
      setTask(null)
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const data = await getTaskService(id)
      if (isMountedRef.current) {
        setTask(data)
      }
    } catch (err) {
      if (isMountedRef.current) {
        setError(err instanceof Error ? err : new Error(`Failed to fetch task ${id}`))
      }
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false)
      }
    }
  }, [id])

  useEffect(() => {
    isMountedRef.current = true
    fetchTask()

    return () => {
      isMountedRef.current = false
    }
  }, [fetchTask])

  const refetch = useCallback(async () => {
    await fetchTask()
  }, [fetchTask])

  return { task, isLoading, error, refetch }
}

/**
 * Hook for task mutations (create, update, updateStatus, delete, bulkUpdate)
 * Provides functions that return promises and track loading states
 * Supports optimistic updates for smooth Kanban drag-drop UX
 *
 * @param onMutationSuccess - Optional callback to trigger after successful mutation (e.g., refetch list)
 * @returns Object with mutation functions and loading states
 */
export function useTaskMutations(
  onMutationSuccess?: () => void | Promise<void>
): UseTaskMutationsResult {
  const [isCreating, setIsCreating] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isBulkUpdating, setIsBulkUpdating] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const createTask = useCallback(
    async (data: TaskInsert): Promise<Task> => {
      setIsCreating(true)
      setError(null)

      try {
        const created = await createTaskService(data)
        await onMutationSuccess?.()
        return created
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to create task')
        setError(error)
        throw error
      } finally {
        setIsCreating(false)
      }
    },
    [onMutationSuccess]
  )

  const updateTask = useCallback(
    async (id: number, data: TaskUpdate): Promise<Task> => {
      setIsUpdating(true)
      setError(null)

      try {
        const updated = await updateTaskService(id, data)
        await onMutationSuccess?.()
        return updated
      } catch (err) {
        const error = err instanceof Error ? err : new Error(`Failed to update task ${id}`)
        setError(error)
        throw error
      } finally {
        setIsUpdating(false)
      }
    },
    [onMutationSuccess]
  )

  const updateTaskStatus = useCallback(
    async (id: number, status: TaskStatus): Promise<Task> => {
      setIsUpdating(true)
      setError(null)

      try {
        const updated = await updateTaskStatusService(id, status)
        await onMutationSuccess?.()
        return updated
      } catch (err) {
        const error =
          err instanceof Error ? err : new Error(`Failed to update task ${id} status`)
        setError(error)
        throw error
      } finally {
        setIsUpdating(false)
      }
    },
    [onMutationSuccess]
  )

  const deleteTask = useCallback(
    async (id: number): Promise<boolean> => {
      setIsDeleting(true)
      setError(null)

      try {
        const result = await deleteTaskService(id)
        await onMutationSuccess?.()
        return result
      } catch (err) {
        const error = err instanceof Error ? err : new Error(`Failed to delete task ${id}`)
        setError(error)
        throw error
      } finally {
        setIsDeleting(false)
      }
    },
    [onMutationSuccess]
  )

  const bulkUpdateTasks = useCallback(
    async (updates: Array<{ id: number; data: TaskUpdate }>): Promise<Task[]> => {
      setIsBulkUpdating(true)
      setError(null)

      try {
        const results = await bulkUpdateTasksService(updates)
        await onMutationSuccess?.()
        return results
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to bulk update tasks')
        setError(error)
        throw error
      } finally {
        setIsBulkUpdating(false)
      }
    },
    [onMutationSuccess]
  )

  return {
    createTask,
    updateTask,
    updateTaskStatus,
    deleteTask,
    bulkUpdateTasks,
    isCreating,
    isUpdating,
    isDeleting,
    isBulkUpdating,
    error,
  }
}

/**
 * Hook for managing tasks with optimistic updates for Kanban drag-drop UX
 * Combines useTasks and useTaskMutations with local state management
 *
 * @param experimentId - The experiment ID to fetch tasks for
 * @param filters - Optional filters to apply
 * @returns Object with tasks, tasksByStatus, mutations, and optimistic update helpers
 */
export function useTasksWithOptimisticUpdates(
  experimentId: number | null | undefined,
  filters?: UseTasksFilters
) {
  const { tasks, tasksByStatus, isLoading, error, refetch } = useTasks(experimentId, filters)

  // Local state for optimistic updates
  const [optimisticTasks, setOptimisticTasks] = useState<Task[]>([])
  const [hasOptimisticUpdate, setHasOptimisticUpdate] = useState(false)

  // Sync optimistic tasks with server tasks when not in optimistic mode
  useEffect(() => {
    if (!hasOptimisticUpdate) {
      setOptimisticTasks(tasks)
    }
  }, [tasks, hasOptimisticUpdate])

  const mutations = useTaskMutations(async () => {
    // After successful mutation, clear optimistic state and refetch
    setHasOptimisticUpdate(false)
    await refetch()
  })

  /**
   * Optimistically update a task's status locally, then sync with server
   * If server update fails, the optimistic update will be reverted on next refetch
   */
  const optimisticUpdateStatus = useCallback(
    async (taskId: number, newStatus: TaskStatus) => {
      // Apply optimistic update immediately
      setOptimisticTasks((prev) =>
        prev.map((task) => (task.id === taskId ? { ...task, status: newStatus } : task))
      )
      setHasOptimisticUpdate(true)

      try {
        // Sync with server
        await mutations.updateTaskStatus(taskId, newStatus)
      } catch {
        // On error, revert optimistic update by triggering refetch
        setHasOptimisticUpdate(false)
        await refetch()
        throw new Error(`Failed to update task ${taskId} status`)
      }
    },
    [mutations, refetch]
  )

  /**
   * Optimistically move a task to a new status (alias for optimisticUpdateStatus)
   * Convenience method for Kanban drag-drop
   */
  const moveTask = optimisticUpdateStatus

  // Compute tasksByStatus from optimistic tasks
  const optimisticTasksByStatus = useMemo(
    () => groupTasksByStatus(optimisticTasks),
    [optimisticTasks]
  )

  return {
    tasks: hasOptimisticUpdate ? optimisticTasks : tasks,
    tasksByStatus: hasOptimisticUpdate ? optimisticTasksByStatus : tasksByStatus,
    isLoading,
    error,
    refetch,
    mutations,
    optimisticUpdateStatus,
    moveTask,
    hasOptimisticUpdate,
  }
}
