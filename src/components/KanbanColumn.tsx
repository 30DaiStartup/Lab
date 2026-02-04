import * as React from "react"
import { cn } from "@/lib/utils"

type KanbanColumnType = "Backlog" | "InProgress" | "Done"

interface KanbanColumnProps extends React.ComponentProps<"div"> {
  title: KanbanColumnType
  count?: number
  children: React.ReactNode
}

const columnStyles: Record<KanbanColumnType, { bg: string; border: string; dot: string }> = {
  Backlog: {
    bg: "bg-slate-50",
    border: "border-slate-200",
    dot: "bg-slate-400",
  },
  InProgress: {
    bg: "bg-blue-50",
    border: "border-blue-200",
    dot: "bg-blue-500",
  },
  Done: {
    bg: "bg-green-50",
    border: "border-green-200",
    dot: "bg-green-500",
  },
}

function KanbanColumn({
  title,
  count,
  children,
  className,
  ...props
}: KanbanColumnProps) {
  const styles = columnStyles[title]

  return (
    <div
      data-slot="kanban-column"
      data-column={title}
      className={cn(
        "flex flex-col min-h-[400px] w-full sm:w-80 rounded-lg border",
        styles.bg,
        styles.border,
        className
      )}
      {...props}
    >
      <div className="flex items-center gap-2 px-4 py-3 border-b border-inherit">
        <span className={cn("w-2 h-2 rounded-full", styles.dot)} />
        <h3 className="font-medium text-sm text-foreground">{title}</h3>
        {typeof count === "number" && (
          <span className="ml-auto text-xs text-muted-foreground bg-white px-2 py-0.5 rounded-full border border-border">
            {count}
          </span>
        )}
      </div>
      <div className="flex-1 p-3 space-y-3 overflow-y-auto">{children}</div>
    </div>
  )
}

export { KanbanColumn, type KanbanColumnType }
