import * as React from 'react'
import { useNavigate } from 'react-router-dom'
import { Dialog as DialogPrimitive } from 'radix-ui'
import {
  BellIcon,
  CheckCircle2Icon,
  AlertCircleIcon,
  ClockIcon,
  FlaskConicalIcon,
  TargetIcon,
  XIcon,
  CheckIcon,
  Trash2Icon,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useOutcomesContext } from '@/contexts/OutcomesContext'
import { useExperimentsContext } from '@/contexts/ExperimentsContext'

/** Notification types */
type NotificationType = 'status_change' | 'new_item' | 'overdue' | 'completion'

interface Notification {
  id: string
  type: NotificationType
  title: string
  message: string
  timestamp: Date
  read: boolean
  entityType: 'outcome' | 'experiment' | 'task'
  entityId: number
  path: string
}

interface NotificationsPanelProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const READ_NOTIFICATIONS_KEY = 'aurora-lab-read-notifications'

function getReadNotifications(): Set<string> {
  try {
    const stored = localStorage.getItem(READ_NOTIFICATIONS_KEY)
    return stored ? new Set(JSON.parse(stored)) : new Set()
  } catch {
    return new Set()
  }
}

function saveReadNotifications(ids: Set<string>): void {
  try {
    localStorage.setItem(READ_NOTIFICATIONS_KEY, JSON.stringify([...ids]))
  } catch {
    // Ignore localStorage errors
  }
}

function getNotificationIcon(type: NotificationType) {
  switch (type) {
    case 'status_change':
      return <AlertCircleIcon className="size-4" />
    case 'new_item':
      return <FlaskConicalIcon className="size-4" />
    case 'overdue':
      return <ClockIcon className="size-4" />
    case 'completion':
      return <CheckCircle2Icon className="size-4" />
  }
}

function getNotificationColor(type: NotificationType) {
  switch (type) {
    case 'status_change':
      return 'bg-amber-50 text-amber-600 border-amber-100'
    case 'new_item':
      return 'bg-violet-50 text-violet-600 border-violet-100'
    case 'overdue':
      return 'bg-rose-50 text-rose-600 border-rose-100'
    case 'completion':
      return 'bg-emerald-50 text-emerald-600 border-emerald-100'
  }
}

function formatTimeAgo(date: Date): string {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return date.toLocaleDateString()
}

export function NotificationsPanel({ open, onOpenChange }: NotificationsPanelProps) {
  const navigate = useNavigate()
  const [readIds, setReadIds] = React.useState<Set<string>>(new Set())

  // Get data from contexts
  const { outcomes } = useOutcomesContext()
  const { experiments } = useExperimentsContext()

  // Load read notifications on mount
  React.useEffect(() => {
    if (open) {
      setReadIds(getReadNotifications())
    }
  }, [open])

  // Generate mock notifications based on real data
  const notifications = React.useMemo<Notification[]>(() => {
    const notifs: Notification[] = []
    const now = new Date()

    // Generate notifications from outcomes
    outcomes.forEach((outcome, index) => {
      // Status change notifications
      if (outcome.status === 'Completed') {
        notifs.push({
          id: `outcome-complete-${outcome.id}`,
          type: 'completion',
          title: 'Outcome Completed',
          message: `"${outcome.title}" has been marked as completed`,
          timestamp: new Date(now.getTime() - (index * 2 + 1) * 3600000),
          read: readIds.has(`outcome-complete-${outcome.id}`),
          entityType: 'outcome',
          entityId: outcome.id,
          path: `/outcomes/${outcome.id}`,
        })
      } else if (outcome.status === 'Stalled') {
        notifs.push({
          id: `outcome-stalled-${outcome.id}`,
          type: 'status_change',
          title: 'Outcome Stalled',
          message: `"${outcome.title}" status changed to Stalled`,
          timestamp: new Date(now.getTime() - (index * 3 + 2) * 3600000),
          read: readIds.has(`outcome-stalled-${outcome.id}`),
          entityType: 'outcome',
          entityId: outcome.id,
          path: `/outcomes/${outcome.id}`,
        })
      }

      // Progress notifications
      if (outcome.progress >= 80 && outcome.status === 'Active') {
        notifs.push({
          id: `outcome-progress-${outcome.id}`,
          type: 'status_change',
          title: 'Outcome Near Completion',
          message: `"${outcome.title}" is ${outcome.progress}% complete`,
          timestamp: new Date(now.getTime() - (index + 1) * 7200000),
          read: readIds.has(`outcome-progress-${outcome.id}`),
          entityType: 'outcome',
          entityId: outcome.id,
          path: `/outcomes/${outcome.id}`,
        })
      }
    })

    // Generate notifications from experiments
    experiments.forEach((experiment, index) => {
      // New experiment notifications
      notifs.push({
        id: `experiment-new-${experiment.id}`,
        type: 'new_item',
        title: 'New Experiment Added',
        message: `"${experiment.title}" was created`,
        timestamp: new Date(now.getTime() - (index * 4 + 3) * 3600000),
        read: readIds.has(`experiment-new-${experiment.id}`),
        entityType: 'experiment',
        entityId: experiment.id,
        path: `/experiments/${experiment.id}`,
      })

      // Completion notifications
      if (experiment.status === 'Done') {
        notifs.push({
          id: `experiment-done-${experiment.id}`,
          type: 'completion',
          title: 'Experiment Completed',
          message: `"${experiment.title}" has been marked as done`,
          timestamp: new Date(now.getTime() - (index * 2) * 3600000),
          read: readIds.has(`experiment-done-${experiment.id}`),
          entityType: 'experiment',
          entityId: experiment.id,
          path: `/experiments/${experiment.id}`,
        })
      }
    })

    // Add some mock overdue task notifications
    if (experiments.length > 0) {
      const exp = experiments[0]
      notifs.push({
        id: `task-overdue-${exp.id}-1`,
        type: 'overdue',
        title: 'Task Overdue',
        message: `"Review requirements" for "${exp.title}" is overdue`,
        timestamp: new Date(now.getTime() - 1800000),
        read: readIds.has(`task-overdue-${exp.id}-1`),
        entityType: 'task',
        entityId: exp.id,
        path: `/experiments/${exp.id}`,
      })
    }

    // Sort by timestamp (newest first)
    return notifs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
  }, [outcomes, experiments, readIds])

  const unreadCount = notifications.filter(n => !n.read).length

  const handleMarkAsRead = (id: string) => {
    const newReadIds = new Set(readIds)
    newReadIds.add(id)
    setReadIds(newReadIds)
    saveReadNotifications(newReadIds)
  }

  const handleMarkAllAsRead = () => {
    const newReadIds = new Set(notifications.map(n => n.id))
    setReadIds(newReadIds)
    saveReadNotifications(newReadIds)
  }

  const handleClearAll = () => {
    // Mark all as read (which effectively "clears" them visually)
    handleMarkAllAsRead()
  }

  const handleNotificationClick = (notification: Notification) => {
    handleMarkAsRead(notification.id)
    navigate(notification.path)
    onOpenChange(false)
  }

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay
          className={cn(
            "fixed inset-0 z-50",
            "bg-slate-950/40 backdrop-blur-sm",
            "data-[state=open]:animate-in data-[state=closed]:animate-out",
            "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
            "duration-200"
          )}
        />
        <DialogPrimitive.Content
          className={cn(
            "fixed right-4 top-4 z-50",
            "w-full max-w-md",
            "data-[state=open]:animate-in data-[state=closed]:animate-out",
            "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
            "data-[state=closed]:slide-out-to-right-4 data-[state=open]:slide-in-from-right-4",
            "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
            "duration-200"
          )}
        >
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl shadow-slate-900/10">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
              <div className="flex items-center gap-3">
                <div className="flex size-8 items-center justify-center rounded-lg bg-slate-100">
                  <BellIcon className="size-4 text-slate-600" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-slate-800">Notifications</h2>
                  {unreadCount > 0 && (
                    <p className="text-xs text-slate-500">
                      {unreadCount} unread
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1">
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllAsRead}
                    className={cn(
                      "rounded-lg px-2.5 py-1.5 text-xs font-medium",
                      "text-slate-600 hover:bg-slate-100",
                      "transition-colors"
                    )}
                  >
                    Mark all read
                  </button>
                )}
                <button
                  onClick={() => onOpenChange(false)}
                  className={cn(
                    "rounded-lg p-1.5",
                    "text-slate-400 hover:bg-slate-100 hover:text-slate-600",
                    "transition-colors"
                  )}
                >
                  <XIcon className="size-4" />
                </button>
              </div>
            </div>

            {/* Notifications List */}
            <div className="max-h-[70vh] overflow-y-auto">
              {notifications.length > 0 ? (
                <div className="divide-y divide-slate-50">
                  {notifications.map((notification, index) => (
                    <NotificationItem
                      key={notification.id}
                      notification={notification}
                      index={index}
                      onClick={() => handleNotificationClick(notification)}
                      onMarkAsRead={() => handleMarkAsRead(notification.id)}
                    />
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="mb-4 rounded-full bg-slate-100 p-4">
                    <BellIcon className="size-8 text-slate-300" />
                  </div>
                  <p className="text-sm font-medium text-slate-600">
                    No new notifications
                  </p>
                  <p className="mt-1 text-sm text-slate-400">
                    We'll notify you when something happens
                  </p>
                </div>
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/50 px-4 py-2.5">
                <span className="text-xs text-slate-500">
                  {notifications.length} notifications
                </span>
                <button
                  onClick={handleClearAll}
                  className={cn(
                    "flex items-center gap-1.5 rounded-lg px-2.5 py-1.5",
                    "text-xs font-medium text-slate-500",
                    "hover:bg-slate-100 hover:text-slate-700",
                    "transition-colors"
                  )}
                >
                  <Trash2Icon className="size-3.5" />
                  <span>Clear all</span>
                </button>
              </div>
            )}
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}

interface NotificationItemProps {
  notification: Notification
  index: number
  onClick: () => void
  onMarkAsRead: () => void
}

function NotificationItem({ notification, index, onClick, onMarkAsRead }: NotificationItemProps) {
  const handleMarkAsReadClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    onMarkAsRead()
  }

  return (
    <button
      onClick={onClick}
      className={cn(
        "group flex w-full items-start gap-3 px-4 py-3 text-left",
        "transition-colors hover:bg-slate-50",
        !notification.read && "bg-blue-50/40"
      )}
      style={{
        animationDelay: `${index * 30}ms`,
        animation: 'fadeInUp 0.3s ease-out forwards',
      }}
    >
      {/* Icon */}
      <div className={cn(
        "mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg border",
        getNotificationColor(notification.type)
      )}>
        {getNotificationIcon(notification.type)}
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className={cn(
              "truncate text-sm",
              notification.read ? "text-slate-600" : "font-medium text-slate-800"
            )}>
              {notification.title}
            </p>
            <p className="mt-0.5 line-clamp-2 text-xs text-slate-500">
              {notification.message}
            </p>
          </div>

          {/* Unread indicator / Mark as read button */}
          {!notification.read && (
            <button
              onClick={handleMarkAsReadClick}
              className={cn(
                "mt-1 shrink-0 rounded p-1",
                "text-slate-400 hover:bg-slate-200 hover:text-slate-600",
                "opacity-0 transition-all group-hover:opacity-100"
              )}
              title="Mark as read"
            >
              <CheckIcon className="size-3.5" />
            </button>
          )}
        </div>

        {/* Timestamp and Entity Badge */}
        <div className="mt-2 flex items-center gap-2">
          <span className="text-xs text-slate-400">
            {formatTimeAgo(notification.timestamp)}
          </span>
          <span className="text-slate-300">|</span>
          <span className={cn(
            "inline-flex items-center gap-1 text-xs",
            notification.entityType === 'outcome' && "text-indigo-600",
            notification.entityType === 'experiment' && "text-violet-600",
            notification.entityType === 'task' && "text-sky-600"
          )}>
            {notification.entityType === 'outcome' && <TargetIcon className="size-3" />}
            {notification.entityType === 'experiment' && <FlaskConicalIcon className="size-3" />}
            {notification.entityType === 'task' && <ClockIcon className="size-3" />}
            <span className="capitalize">{notification.entityType}</span>
          </span>
        </div>
      </div>

      {/* Unread dot */}
      {!notification.read && (
        <div className="mt-2 size-2 shrink-0 rounded-full bg-blue-500" />
      )}
    </button>
  )
}

export default NotificationsPanel
