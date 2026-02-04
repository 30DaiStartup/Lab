import { supabase } from './supabase'
import { ApiError } from './errors'
import type { Database, TaskStatus } from '../types/database'

type Task = Database['public']['Tables']['tasks']['Row']
type TaskInsert = Database['public']['Tables']['tasks']['Insert']
type TaskUpdate = Database['public']['Tables']['tasks']['Update']

/** Filters for querying tasks */
export interface TaskFilters {
  status?: TaskStatus
  assignee?: number | null
}

/**
 * Get tasks for an experiment with optional filters
 * @param experimentId - The experiment ID to get tasks for
 * @param filters - Optional additional filters
 * @returns Array of tasks or empty array if supabase is not configured
 */
export async function getTasks(experimentId: number, filters?: TaskFilters): Promise<Task[]> {
  if (!supabase) {
    console.warn('Supabase not configured - returning empty tasks list')
    return []
  }

  let query = supabase
    .from('tasks')
    .select('*')
    .eq('experiment_id', experimentId)

  if (filters?.status) {
    query = query.eq('status', filters.status)
  }

  if (filters?.assignee !== undefined) {
    if (filters.assignee === null) {
      query = query.is('assignee', null)
    } else {
      query = query.eq('assignee', filters.assignee)
    }
  }

  const { data, error } = await query.order('due_date', { ascending: true, nullsFirst: false })

  if (error) {
    throw new ApiError('Failed to fetch tasks', 'FETCH_TASKS_ERROR', error)
  }

  return data ?? []
}

/**
 * Get a single task by ID
 * @param id - The task ID
 * @returns The task or null if not found
 */
export async function getTask(id: number): Promise<Task | null> {
  if (!supabase) {
    console.warn('Supabase not configured - returning null for task')
    return null
  }

  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      return null
    }
    throw new ApiError(`Failed to fetch task ${id}`, 'FETCH_TASK_ERROR', error)
  }

  return data
}

/**
 * Create a new task
 * @param data - The task data to insert
 * @returns The created task
 */
export async function createTask(data: TaskInsert): Promise<Task> {
  if (!supabase) {
    throw new ApiError('Supabase not configured - cannot create task', 'SUPABASE_NOT_CONFIGURED')
  }

  const { data: created, error } = await supabase
    .from('tasks')
    .insert(data)
    .select()
    .single()

  if (error) {
    throw new ApiError('Failed to create task', 'CREATE_TASK_ERROR', error)
  }

  return created
}

/**
 * Update an existing task
 * @param id - The task ID to update
 * @param data - The fields to update
 * @returns The updated task
 */
export async function updateTask(id: number, data: TaskUpdate): Promise<Task> {
  if (!supabase) {
    throw new ApiError('Supabase not configured - cannot update task', 'SUPABASE_NOT_CONFIGURED')
  }

  const { data: updated, error } = await supabase
    .from('tasks')
    .update(data)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    throw new ApiError(`Failed to update task ${id}`, 'UPDATE_TASK_ERROR', error)
  }

  return updated
}

/**
 * Update the status of a task (convenience method for Kanban board)
 * @param id - The task ID to update
 * @param status - The new status
 * @returns The updated task
 */
export async function updateTaskStatus(id: number, status: TaskStatus): Promise<Task> {
  return updateTask(id, { status })
}

/**
 * Delete a task
 * @param id - The task ID to delete
 * @returns True if deleted successfully
 */
export async function deleteTask(id: number): Promise<boolean> {
  if (!supabase) {
    throw new ApiError('Supabase not configured - cannot delete task', 'SUPABASE_NOT_CONFIGURED')
  }

  const { error } = await supabase.from('tasks').delete().eq('id', id)

  if (error) {
    throw new ApiError(`Failed to delete task ${id}`, 'DELETE_TASK_ERROR', error)
  }

  return true
}

/**
 * Bulk update task positions/statuses (for Kanban drag-and-drop)
 * @param updates - Array of task updates with id and new data
 * @returns Array of updated tasks
 */
export async function bulkUpdateTasks(
  updates: Array<{ id: number; data: TaskUpdate }>
): Promise<Task[]> {
  if (!supabase) {
    throw new ApiError('Supabase not configured - cannot bulk update tasks', 'SUPABASE_NOT_CONFIGURED')
  }

  const results = await Promise.all(
    updates.map(({ id, data }) => updateTask(id, data))
  )

  return results
}
