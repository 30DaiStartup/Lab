import { useState, useRef, useCallback, useMemo, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import {
  ChevronLeft,
  ChevronRight,
  Edit3,
  Trash2,
  Plus,
  Calendar,
  AlertCircle,
  ChevronDown,
  Users,
  LinkIcon,
  GripVertical
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useExperiment, useExperimentMutations } from '@/hooks/useExperiments'
import { useTasksWithOptimisticUpdates, useTaskMutations } from '@/hooks/useTasks'
import { useRaci } from '@/hooks/useRaci'
import { useOutcome } from '@/hooks/useOutcomes'
import { KanbanColumn, type KanbanColumnType } from '@/components/KanbanColumn'
import { KanbanCard } from '@/components/KanbanCard'
import { StatusBadge } from '@/components/StatusBadge'
import { ProgressBar } from '@/components/ProgressBar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { Database, TaskStatus, ExperimentStatus, RaciRole } from '@/types/database'

type Task = Database['public']['Tables']['tasks']['Row']
type TaskInsert = Database['public']['Tables']['tasks']['Insert']
type Raci = Database['public']['Tables']['raci']['Row']

// Skeleton loading component for Kanban
function KanbanSkeleton() {
  return (
    <div className="flex gap-5 animate-pulse">
      {[1, 2, 3].map((col) => (
        <div key={col} className="flex-1 min-w-[280px] max-w-[340px]">
          <div className="h-10 bg-slate-100 rounded-t-xl mb-px" />
          <div className="bg-slate-50/50 rounded-b-xl p-4 space-y-3 min-h-[400px]">
            {[1, 2, 3].slice(0, col === 1 ? 3 : col === 2 ? 2 : 1).map((card) => (
              <div key={card} className="bg-white rounded-lg border border-slate-100 p-4 space-y-3">
                <div className="h-4 bg-slate-100 rounded w-3/4" />
                <div className="h-3 bg-slate-100 rounded w-1/2" />
                <div className="flex justify-between">
                  <div className="h-5 bg-slate-100 rounded w-16" />
                  <div className="h-6 w-6 bg-slate-100 rounded-full" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

// Collapsible section component
function CollapsibleSection({
  title,
  defaultOpen = true,
  children,
  icon: Icon
}: {
  title: string
  defaultOpen?: boolean
  children: React.ReactNode
  icon?: React.ComponentType<{ className?: string }>
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  return (
    <div className="border-b border-slate-100 last:border-b-0">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center gap-2 py-3 text-left group"
      >
        {Icon && <Icon className="w-4 h-4 text-slate-400" />}
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 group-hover:text-slate-700 transition-colors">
          {title}
        </span>
        <ChevronDown
          className={cn(
            "w-4 h-4 text-slate-400 ml-auto transition-transform duration-200",
            isOpen && "rotate-180"
          )}
        />
      </button>
      <div
        className={cn(
          "overflow-hidden transition-all duration-300 ease-out",
          isOpen ? "max-h-[500px] opacity-100 pb-4" : "max-h-0 opacity-0"
        )}
      >
        {children}
      </div>
    </div>
  )
}

// Key-value display for JSONB data
function KeyValueDisplay({ data }: { data: Record<string, unknown> | null }) {
  if (!data || Object.keys(data).length === 0) {
    return <span className="text-slate-400 text-sm italic">No data</span>
  }

  return (
    <div className="space-y-2">
      {Object.entries(data).map(([key, value]) => (
        <div key={key} className="flex items-start gap-2 text-sm">
          <span className="text-slate-500 font-medium min-w-[80px] shrink-0">{key}:</span>
          <span className="text-slate-700 break-words">
            {typeof value === 'object' ? JSON.stringify(value) : String(value)}
          </span>
        </div>
      ))}
    </div>
  )
}

// Task modal component
function TaskModal({
  isOpen,
  onClose,
  task,
  experimentId,
  onSave,
  onDelete,
  isLoading
}: {
  isOpen: boolean
  onClose: () => void
  task: Task | null
  experimentId: number
  onSave: (data: Partial<TaskInsert>) => Promise<void>
  onDelete?: (id: number) => Promise<void>
  isLoading: boolean
}) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [status, setStatus] = useState<TaskStatus>('Backlog')
  const [dueDate, setDueDate] = useState('')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  useEffect(() => {
    if (task) {
      setTitle(task.title)
      setDescription(task.description || '')
      setStatus(task.status)
      setDueDate(task.due_date || '')
    } else {
      setTitle('')
      setDescription('')
      setStatus('Backlog')
      setDueDate('')
    }
    setShowDeleteConfirm(false)
  }, [task, isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await onSave({
      title,
      description: description || null,
      status,
      due_date: dueDate || null,
      experiment_id: experimentId
    })
    onClose()
  }

  const handleDelete = async () => {
    if (task && onDelete) {
      await onDelete(task.id)
      onClose()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{task ? 'Edit Task' : 'Create Task'}</DialogTitle>
          <DialogDescription>
            {task ? 'Update the task details below.' : 'Fill in the details for your new task.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Title</label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter task title..."
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add a description..."
              className="w-full min-h-[80px] px-3 py-2 text-sm border border-input rounded-md bg-transparent shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Status</label>
              <Select value={status} onValueChange={(v) => setStatus(v as TaskStatus)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Backlog">Backlog</SelectItem>
                  <SelectItem value="InProgress">In Progress</SelectItem>
                  <SelectItem value="Done">Done</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Due Date</label>
              <Input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter className="flex gap-2 pt-4">
            {task && onDelete && (
              <div className="mr-auto">
                {showDeleteConfirm ? (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-slate-500">Delete?</span>
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={handleDelete}
                      disabled={isLoading}
                    >
                      Yes
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setShowDeleteConfirm(false)}
                    >
                      No
                    </Button>
                  </div>
                ) : (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowDeleteConfirm(true)}
                    className="text-slate-400 hover:text-red-500"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            )}
            <DialogClose asChild>
              <Button type="button" variant="outline">Cancel</Button>
            </DialogClose>
            <Button type="submit" disabled={isLoading || !title.trim()}>
              {isLoading ? 'Saving...' : task ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// Draggable task card
function DraggableTaskCard({
  task,
  onClick,
  onDragStart,
  onDragEnd,
  isDragging
}: {
  task: Task
  onClick: () => void
  onDragStart: (e: React.DragEvent, task: Task) => void
  onDragEnd: () => void
  isDragging: boolean
}) {
  const isOverdue = task.due_date && new Date(task.due_date) < new Date() && task.status !== 'Done'

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, task)}
      onDragEnd={onDragEnd}
      className={cn(
        "group transition-all duration-200",
        isDragging && "opacity-40 scale-95"
      )}
    >
      <div className="relative">
        <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-2 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing">
          <GripVertical className="w-4 h-4 text-slate-300" />
        </div>
        <KanbanCard
          title={task.title}
          description={task.description || undefined}
          assignee={task.assignee ? `User ${task.assignee}` : undefined}
          dueDate={task.due_date ? new Date(task.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : undefined}
          onClick={onClick}
          className={cn(
            "transition-all duration-200 hover:translate-x-1",
            isOverdue && "border-red-200 bg-red-50/30"
          )}
        />
        {isOverdue && (
          <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center animate-pulse">
            <AlertCircle className="w-3 h-3 text-white" />
          </div>
        )}
      </div>
    </div>
  )
}

// Enhanced Kanban column with drop zone
function DroppableKanbanColumn({
  title,
  count,
  children,
  onDrop,
  onAddTask,
  isDragOver
}: {
  title: KanbanColumnType
  count: number
  children: React.ReactNode
  onDrop: (e: React.DragEvent) => void
  onAddTask: () => void
  isDragOver: boolean
}) {
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  return (
    <div
      onDragOver={handleDragOver}
      onDrop={onDrop}
      className={cn(
        "transition-all duration-200",
        isDragOver && "scale-[1.02]"
      )}
    >
      <KanbanColumn
        title={title}
        count={count}
        className={cn(
          "relative transition-all duration-200",
          isDragOver && "ring-2 ring-blue-400 ring-offset-2 bg-blue-50/50"
        )}
      >
        <div className="absolute top-3 right-3">
          <button
            onClick={onAddTask}
            className="p-1 rounded-md text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
            title={`Add task to ${title}`}
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
        {children}
        {isDragOver && (
          <div className="absolute inset-x-3 bottom-3 h-16 border-2 border-dashed border-blue-300 rounded-lg bg-blue-50/50 flex items-center justify-center">
            <span className="text-sm text-blue-500 font-medium">Drop here</span>
          </div>
        )}
      </KanbanColumn>
    </div>
  )
}

export default function ExperimentDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const experimentId = id ? parseInt(id, 10) : null

  // State
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [editingTitle, setEditingTitle] = useState(false)
  const [titleValue, setTitleValue] = useState('')
  const [taskModalOpen, setTaskModalOpen] = useState(false)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [newTaskStatus, setNewTaskStatus] = useState<TaskStatus>('Backlog')
  const [draggedTask, setDraggedTask] = useState<Task | null>(null)
  const [dragOverColumn, setDragOverColumn] = useState<KanbanColumnType | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  // Data fetching
  const { experiment, isLoading: experimentLoading, error: experimentError, refetch: refetchExperiment } = useExperiment(experimentId)
  const { tasksByStatus, isLoading: tasksLoading, error: tasksError, moveTask } = useTasksWithOptimisticUpdates(experimentId)
  const { assignmentsByRole, isLoading: raciLoading } = useRaci(experimentId || 0, 'Experiment')
  const { outcome } = useOutcome(experiment?.outcome_id)

  // Mutations
  const { updateExperiment, deleteExperiment, isUpdating, isDeleting } = useExperimentMutations(refetchExperiment)
  const taskMutations = useTaskMutations()

  // Refs
  const titleInputRef = useRef<HTMLInputElement>(null)

  // Computed values
  const totalRaciAssignments = useMemo(() => {
    return Object.values(assignmentsByRole).flat().length
  }, [assignmentsByRole])

  // Handlers
  const handleTitleEdit = useCallback(() => {
    if (experiment) {
      setTitleValue(experiment.title)
      setEditingTitle(true)
      setTimeout(() => titleInputRef.current?.focus(), 0)
    }
  }, [experiment])

  const handleTitleSave = useCallback(async () => {
    if (experiment && titleValue.trim() && titleValue !== experiment.title) {
      await updateExperiment(experiment.id, { title: titleValue.trim() })
    }
    setEditingTitle(false)
  }, [experiment, titleValue, updateExperiment])

  const handleStatusChange = useCallback(async (newStatus: ExperimentStatus) => {
    if (experiment) {
      await updateExperiment(experiment.id, { status: newStatus })
    }
  }, [experiment, updateExperiment])

  const handleDelete = useCallback(async () => {
    if (experiment) {
      await deleteExperiment(experiment.id)
      navigate(outcome ? `/outcomes/${outcome.id}` : '/')
    }
  }, [experiment, deleteExperiment, navigate, outcome])

  const handleDragStart = useCallback((e: React.DragEvent, task: Task) => {
    setDraggedTask(task)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', task.id.toString())
  }, [])

  const handleDragEnd = useCallback(() => {
    setDraggedTask(null)
    setDragOverColumn(null)
  }, [])

  const handleDrop = useCallback(async (column: KanbanColumnType) => {
    if (draggedTask && draggedTask.status !== column) {
      await moveTask(draggedTask.id, column)
    }
    setDraggedTask(null)
    setDragOverColumn(null)
  }, [draggedTask, moveTask])

  const handleDragEnter = useCallback((column: KanbanColumnType) => {
    setDragOverColumn(column)
  }, [])

  const handleAddTask = useCallback((status: TaskStatus) => {
    setSelectedTask(null)
    setNewTaskStatus(status)
    setTaskModalOpen(true)
  }, [])

  const handleTaskClick = useCallback((task: Task) => {
    setSelectedTask(task)
    setTaskModalOpen(true)
  }, [])

  const handleTaskSave = useCallback(async (data: Partial<TaskInsert>) => {
    if (selectedTask) {
      await taskMutations.updateTask(selectedTask.id, data)
    } else if (experimentId) {
      await taskMutations.createTask({
        ...data,
        title: data.title || '',
        status: data.status || newTaskStatus,
        experiment_id: experimentId
      } as TaskInsert)
    }
  }, [selectedTask, experimentId, newTaskStatus, taskMutations])

  const handleTaskDelete = useCallback(async (taskId: number) => {
    await taskMutations.deleteTask(taskId)
  }, [taskMutations])

  // Loading state
  if (experimentLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100/50">
        <div className="animate-pulse p-8">
          <div className="h-4 bg-slate-200 rounded w-48 mb-6" />
          <div className="h-10 bg-slate-200 rounded w-96 mb-2" />
          <div className="h-4 bg-slate-200 rounded w-64 mb-8" />
          <KanbanSkeleton />
        </div>
      </div>
    )
  }

  // Error state
  if (experimentError || !experiment) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100/50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-xl font-semibold text-slate-800 mb-2">Experiment Not Found</h2>
          <p className="text-slate-500 mb-6">
            {experimentError?.message || 'The experiment you are looking for does not exist.'}
          </p>
          <Button onClick={() => navigate('/')}>
            Return to Dashboard
          </Button>
        </div>
      </div>
    )
  }

  const columns: KanbanColumnType[] = ['Backlog', 'InProgress', 'Done']

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50/80">
      {/* Subtle background pattern */}
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.015]"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, rgb(100 116 139) 1px, transparent 0)`,
          backgroundSize: '24px 24px'
        }}
      />

      <div className="relative">
        {/* Page Header */}
        <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-slate-200/50">
          <div className="px-6 py-4">
            {/* Breadcrumb */}
            <nav className="flex items-center gap-2 text-sm mb-3">
              <Link
                to="/"
                className="text-slate-500 hover:text-blue-600 transition-colors"
              >
                Dashboard
              </Link>
              <span className="text-slate-300">/</span>
              {outcome ? (
                <>
                  <Link
                    to={`/outcomes/${outcome.id}`}
                    className="text-slate-500 hover:text-blue-600 transition-colors truncate max-w-[200px]"
                    title={outcome.title}
                  >
                    {outcome.title}
                  </Link>
                  <span className="text-slate-300">/</span>
                </>
              ) : null}
              <span className="text-slate-700 font-medium truncate max-w-[200px]">
                {experiment.title}
              </span>
            </nav>

            {/* Title row */}
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-4 min-w-0 flex-1">
                <button
                  onClick={() => navigate(outcome ? `/outcomes/${outcome.id}` : '/')}
                  className="p-2 -ml-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors shrink-0"
                  title="Go back"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>

                <div className="min-w-0 flex-1">
                  {editingTitle ? (
                    <div className="flex items-center gap-2">
                      <Input
                        ref={titleInputRef}
                        value={titleValue}
                        onChange={(e) => setTitleValue(e.target.value)}
                        onBlur={handleTitleSave}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleTitleSave()
                          if (e.key === 'Escape') setEditingTitle(false)
                        }}
                        className="text-2xl font-bold h-auto py-1 px-2 -ml-2"
                      />
                    </div>
                  ) : (
                    <h1
                      className="text-2xl font-bold text-slate-900 truncate group cursor-pointer"
                      onClick={handleTitleEdit}
                      title="Click to edit"
                    >
                      {experiment.title}
                      <Edit3 className="w-4 h-4 inline-block ml-2 opacity-0 group-hover:opacity-50 transition-opacity" />
                    </h1>
                  )}
                </div>

                {/* Status badge with dropdown */}
                <Select
                  value={experiment.status}
                  onValueChange={(v) => handleStatusChange(v as ExperimentStatus)}
                  disabled={isUpdating}
                >
                  <SelectTrigger className="w-auto border-0 bg-transparent shadow-none p-0 h-auto focus:ring-0">
                    <StatusBadge status={experiment.status} className="cursor-pointer" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Backlog">Backlog</SelectItem>
                    <SelectItem value="InProgress">In Progress</SelectItem>
                    <SelectItem value="Done">Done</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 shrink-0">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  className="text-slate-500"
                >
                  {sidebarOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                  <span className="hidden sm:inline">{sidebarOpen ? 'Hide' : 'Show'} Details</span>
                </Button>

                {showDeleteConfirm ? (
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-red-50 rounded-lg border border-red-200">
                    <span className="text-sm text-red-700">Delete experiment?</span>
                    <Button
                      variant="destructive"
                      size="xs"
                      onClick={handleDelete}
                      disabled={isDeleting}
                    >
                      {isDeleting ? '...' : 'Yes'}
                    </Button>
                    <Button
                      variant="outline"
                      size="xs"
                      onClick={() => setShowDeleteConfirm(false)}
                    >
                      No
                    </Button>
                  </div>
                ) : (
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => setShowDeleteConfirm(true)}
                    className="text-slate-400 hover:text-red-500"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Main content */}
        <div className="flex">
          {/* Sidebar */}
          <aside
            className={cn(
              "shrink-0 bg-white border-r border-slate-200/50 transition-all duration-300 ease-out overflow-hidden",
              sidebarOpen ? "w-80" : "w-0"
            )}
          >
            <div className="w-80 p-5 space-y-1">
              {/* Progress */}
              <CollapsibleSection title="Progress" defaultOpen={true}>
                <div className="space-y-3">
                  <ProgressBar
                    value={experiment.progress}
                    showLabel
                    size="lg"
                    color={experiment.progress >= 100 ? 'success' : experiment.progress >= 50 ? 'info' : 'default'}
                  />
                  <p className="text-xs text-slate-500">
                    {tasksByStatus.Done.length} of {Object.values(tasksByStatus).flat().length} tasks completed
                  </p>
                </div>
              </CollapsibleSection>

              {/* Description/Spec */}
              {experiment.spec && (
                <CollapsibleSection title="Specification" defaultOpen={true}>
                  <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">
                    {experiment.spec}
                  </p>
                </CollapsibleSection>
              )}

              {/* Inputs */}
              <CollapsibleSection title="Inputs" defaultOpen={false}>
                <KeyValueDisplay data={experiment.inputs} />
              </CollapsibleSection>

              {/* Scope */}
              <CollapsibleSection title="Scope" defaultOpen={false}>
                <KeyValueDisplay data={experiment.scope} />
              </CollapsibleSection>

              {/* Parent Outcome Link */}
              {outcome && (
                <CollapsibleSection title="Parent Outcome" icon={LinkIcon} defaultOpen={true}>
                  <Link
                    to={`/outcomes/${outcome.id}`}
                    className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors group"
                  >
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center shrink-0">
                      <span className="text-blue-600 font-bold text-sm">
                        {outcome.title.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-slate-700 truncate group-hover:text-blue-600 transition-colors">
                        {outcome.title}
                      </p>
                      <p className="text-xs text-slate-500">
                        {outcome.progress}% complete
                      </p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-500 transition-colors" />
                  </Link>
                </CollapsibleSection>
              )}

              {/* RACI */}
              <CollapsibleSection title="RACI Assignments" icon={Users} defaultOpen={false}>
                {raciLoading ? (
                  <div className="animate-pulse space-y-2">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="h-6 bg-slate-100 rounded" />
                    ))}
                  </div>
                ) : totalRaciAssignments === 0 ? (
                  <p className="text-sm text-slate-400 italic">No assignments yet</p>
                ) : (
                  <div className="space-y-3">
                    {(Object.entries(assignmentsByRole) as [RaciRole, Raci[]][]).map(([role, assignments]) =>
                      assignments.length > 0 && (
                        <div key={role}>
                          <p className="text-xs font-medium text-slate-500 mb-1">{role}</p>
                          <div className="flex flex-wrap gap-1">
                            {assignments.map((assignment) => (
                              <span
                                key={assignment.id}
                                className="inline-flex items-center px-2 py-1 bg-slate-100 rounded text-xs text-slate-600"
                              >
                                User {assignment.user_id}
                              </span>
                            ))}
                          </div>
                        </div>
                      )
                    )}
                  </div>
                )}
              </CollapsibleSection>

              {/* Timestamps */}
              <CollapsibleSection title="Timeline" icon={Calendar} defaultOpen={false}>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Created</span>
                    <span className="text-slate-700">
                      {new Date(experiment.created_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </span>
                  </div>
                  {experiment.updated_at && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">Updated</span>
                      <span className="text-slate-700">
                        {new Date(experiment.updated_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </span>
                    </div>
                  )}
                </div>
              </CollapsibleSection>
            </div>
          </aside>

          {/* Kanban Board */}
          <main className="flex-1 p-6 overflow-x-auto">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-800">Task Board</h2>
                <p className="text-sm text-slate-500">
                  Drag tasks between columns to update their status
                </p>
              </div>
              <Button onClick={() => handleAddTask('Backlog')} size="sm">
                <Plus className="w-4 h-4" />
                Add Task
              </Button>
            </div>

            {tasksLoading ? (
              <KanbanSkeleton />
            ) : tasksError ? (
              <div className="flex items-center justify-center h-64 text-slate-500">
                <AlertCircle className="w-5 h-5 mr-2" />
                Failed to load tasks
              </div>
            ) : (
              <div className="flex gap-5 min-w-fit pb-4">
                {columns.map((column) => (
                  <div
                    key={column}
                    className="flex-1 min-w-[280px] max-w-[340px]"
                    onDragEnter={() => handleDragEnter(column)}
                    onDragLeave={() => setDragOverColumn(null)}
                  >
                    <DroppableKanbanColumn
                      title={column}
                      count={tasksByStatus[column].length}
                      onDrop={() => handleDrop(column)}
                      onAddTask={() => handleAddTask(column)}
                      isDragOver={dragOverColumn === column && draggedTask?.status !== column}
                    >
                      {tasksByStatus[column].length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-8 text-slate-400">
                          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-3">
                            <Plus className="w-5 h-5" />
                          </div>
                          <p className="text-sm">No tasks yet</p>
                          <button
                            onClick={() => handleAddTask(column)}
                            className="text-xs text-blue-500 hover:text-blue-600 mt-1"
                          >
                            Add one
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {tasksByStatus[column].map((task) => (
                            <DraggableTaskCard
                              key={task.id}
                              task={task}
                              onClick={() => handleTaskClick(task)}
                              onDragStart={handleDragStart}
                              onDragEnd={handleDragEnd}
                              isDragging={draggedTask?.id === task.id}
                            />
                          ))}
                        </div>
                      )}
                    </DroppableKanbanColumn>
                  </div>
                ))}
              </div>
            )}
          </main>
        </div>
      </div>

      {/* Task Modal */}
      <TaskModal
        isOpen={taskModalOpen}
        onClose={() => {
          setTaskModalOpen(false)
          setSelectedTask(null)
        }}
        task={selectedTask}
        experimentId={experimentId || 0}
        onSave={handleTaskSave}
        onDelete={handleTaskDelete}
        isLoading={taskMutations.isCreating || taskMutations.isUpdating || taskMutations.isDeleting}
      />
    </div>
  )
}
