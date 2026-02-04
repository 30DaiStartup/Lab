import * as React from "react"
import { cn } from "@/lib/utils"

interface ProgressBarProps extends React.ComponentProps<"div"> {
  value: number
  max?: number
  showLabel?: boolean
  size?: "sm" | "md" | "lg"
  color?: "default" | "success" | "warning" | "info"
}

const sizeStyles = {
  sm: "h-1.5",
  md: "h-2.5",
  lg: "h-4",
}

const colorStyles = {
  default: "bg-slate-600",
  success: "bg-green-600",
  warning: "bg-yellow-500",
  info: "bg-blue-600",
}

function ProgressBar({
  value,
  max = 100,
  showLabel = false,
  size = "md",
  color = "default",
  className,
  ...props
}: ProgressBarProps) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100)

  return (
    <div
      data-slot="progress-bar"
      className={cn("w-full", className)}
      {...props}
    >
      {showLabel && (
        <div className="flex justify-between mb-1.5 text-sm text-muted-foreground">
          <span>Progress</span>
          <span>{Math.round(percentage)}%</span>
        </div>
      )}
      <div
        className={cn(
          "w-full bg-slate-200 rounded-full overflow-hidden",
          sizeStyles[size]
        )}
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
      >
        <div
          className={cn(
            "h-full rounded-full transition-all duration-300 ease-out",
            colorStyles[color]
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}

export { ProgressBar }
