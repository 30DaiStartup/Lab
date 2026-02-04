import * as React from "react"
import { cn } from "@/lib/utils"

type Priority = "low" | "medium" | "high"

interface KanbanCardProps extends React.ComponentProps<"div"> {
  title: string
  description?: string
  priority?: Priority
  assignee?: string
  dueDate?: string
  onClick?: () => void
}

const priorityStyles: Record<Priority, string> = {
  low: "bg-slate-100 text-slate-600",
  medium: "bg-yellow-100 text-yellow-700",
  high: "bg-red-100 text-red-700",
}

function KanbanCard({
  title,
  description,
  priority,
  assignee,
  dueDate,
  onClick,
  className,
  ...props
}: KanbanCardProps) {
  return (
    <div
      data-slot="kanban-card"
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={(e) => {
        if (onClick && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault()
          onClick()
        }
      }}
      className={cn(
        "bg-white rounded-lg border border-border p-3 shadow-sm transition-all",
        onClick && "cursor-pointer hover:shadow-md hover:border-slate-300",
        className
      )}
      {...props}
    >
      <div className="space-y-2">
        <h4 className="font-medium text-sm text-foreground leading-tight">
          {title}
        </h4>

        {description && (
          <p className="text-xs text-muted-foreground line-clamp-2">
            {description}
          </p>
        )}

        <div className="flex items-center justify-between gap-2 pt-1">
          <div className="flex items-center gap-2">
            {priority && (
              <span
                className={cn(
                  "text-xs px-1.5 py-0.5 rounded font-medium capitalize",
                  priorityStyles[priority]
                )}
              >
                {priority}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {dueDate && (
              <span className="flex items-center gap-1">
                <svg
                  className="w-3 h-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                {dueDate}
              </span>
            )}
            {assignee && (
              <span
                className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-xs font-medium text-slate-600"
                title={assignee}
              >
                {assignee.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export { KanbanCard, type Priority }
