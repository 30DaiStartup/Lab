import * as React from "react"
import { cn } from "@/lib/utils"

type Status =
  | "Active"
  | "Stalled"
  | "Completed"
  | "Paused"
  | "Cancelled"
  | "Draft"
  | "InProgress"
  | "Done"
  | "Backlog"

interface StatusBadgeProps extends React.ComponentProps<"span"> {
  status: Status
}

const statusStyles: Record<Status, string> = {
  Active: "bg-blue-100 text-blue-800 border-blue-200",
  InProgress: "bg-blue-100 text-blue-800 border-blue-200",
  Stalled: "bg-yellow-100 text-yellow-800 border-yellow-200",
  Paused: "bg-yellow-100 text-yellow-800 border-yellow-200",
  Completed: "bg-green-100 text-green-800 border-green-200",
  Done: "bg-green-100 text-green-800 border-green-200",
  Cancelled: "bg-gray-100 text-gray-600 border-gray-200",
  Draft: "bg-gray-100 text-gray-600 border-gray-200",
  Backlog: "bg-slate-100 text-slate-700 border-slate-200",
}

function StatusBadge({ status, className, ...props }: StatusBadgeProps) {
  return (
    <span
      data-slot="status-badge"
      data-status={status}
      className={cn(
        "inline-flex items-center justify-center rounded-full border px-2.5 py-0.5 text-xs font-medium whitespace-nowrap",
        statusStyles[status],
        className
      )}
      {...props}
    >
      {status}
    </span>
  )
}

export { StatusBadge, type Status }
