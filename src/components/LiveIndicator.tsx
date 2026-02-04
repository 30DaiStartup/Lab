import { cn } from '@/lib/utils'

/** Props for LiveIndicator component */
export interface LiveIndicatorProps {
  /** Whether the connection is active */
  isConnected: boolean
  /** Optional label to display (defaults to "Live") */
  label?: string
  /** Whether to show the label */
  showLabel?: boolean
  /** Size variant */
  size?: 'sm' | 'md'
  /** Additional className */
  className?: string
}

/**
 * Visual indicator for real-time connection status
 * Shows a pulsing dot when connected, static when disconnected
 *
 * @example
 * ```tsx
 * <LiveIndicator isConnected={true} />
 * <LiveIndicator isConnected={false} label="Syncing" showLabel />
 * ```
 */
export function LiveIndicator({
  isConnected,
  label = 'Live',
  showLabel = true,
  size = 'sm',
  className,
}: LiveIndicatorProps) {
  const dotSize = size === 'sm' ? 'w-2 h-2' : 'w-2.5 h-2.5'
  const textSize = size === 'sm' ? 'text-xs' : 'text-sm'
  const padding = size === 'sm' ? 'px-2 py-0.5' : 'px-2.5 py-1'

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full',
        isConnected
          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
          : 'bg-slate-100 text-slate-500 border border-slate-200',
        padding,
        className
      )}
      title={isConnected ? 'Real-time updates active' : 'Real-time updates disconnected'}
    >
      {/* Pulsing dot */}
      <span className="relative flex items-center justify-center">
        <span
          className={cn(
            'rounded-full',
            dotSize,
            isConnected ? 'bg-emerald-500' : 'bg-slate-400'
          )}
        />
        {isConnected && (
          <span
            className={cn(
              'absolute rounded-full bg-emerald-400 animate-ping',
              dotSize
            )}
            style={{ animationDuration: '1.5s' }}
          />
        )}
      </span>

      {/* Label */}
      {showLabel && (
        <span className={cn('font-medium', textSize)}>
          {isConnected ? label : 'Offline'}
        </span>
      )}
    </div>
  )
}

/** Props for RealtimeFlash component */
export interface RealtimeFlashProps {
  /** Whether to show the flash animation */
  isFlashing: boolean
  /** Flash color variant */
  variant?: 'success' | 'warning' | 'info'
  /** Additional className for the wrapper */
  className?: string
  /** Children to wrap */
  children: React.ReactNode
}

/**
 * Wrapper component that adds a flash effect when content updates in real-time
 * Use to highlight items that have just been updated by other users
 *
 * @example
 * ```tsx
 * <RealtimeFlash isFlashing={wasJustUpdated}>
 *   <TaskCard task={task} />
 * </RealtimeFlash>
 * ```
 */
export function RealtimeFlash({
  isFlashing,
  variant = 'info',
  className,
  children,
}: RealtimeFlashProps) {
  const flashColors = {
    success: 'ring-emerald-400 bg-emerald-50',
    warning: 'ring-amber-400 bg-amber-50',
    info: 'ring-blue-400 bg-blue-50',
  }

  return (
    <div
      className={cn(
        'relative transition-all duration-300',
        isFlashing && [
          'ring-2 ring-offset-2 rounded-lg',
          flashColors[variant],
          'animate-pulse',
        ],
        className
      )}
      style={isFlashing ? { animationDuration: '0.5s', animationIterationCount: '2' } : undefined}
    >
      {children}
    </div>
  )
}

/** Props for ConnectionStatus component */
export interface ConnectionStatusProps {
  /** Whether connected to real-time */
  isConnected: boolean
  /** Error if connection failed */
  error?: Error | null
  /** Callback to retry connection */
  onRetry?: () => void
  /** Additional className */
  className?: string
}

/**
 * Detailed connection status banner for showing real-time sync state
 * Shows error message and retry button when disconnected
 *
 * @example
 * ```tsx
 * <ConnectionStatus
 *   isConnected={isConnected}
 *   error={error}
 *   onRetry={reconnect}
 * />
 * ```
 */
export function ConnectionStatus({
  isConnected,
  error,
  onRetry,
  className,
}: ConnectionStatusProps) {
  if (isConnected) {
    return null // Don't show anything when connected
  }

  return (
    <div
      className={cn(
        'flex items-center justify-between gap-3 px-4 py-2 rounded-lg',
        error ? 'bg-red-50 border border-red-200' : 'bg-amber-50 border border-amber-200',
        className
      )}
    >
      <div className="flex items-center gap-2">
        <span
          className={cn(
            'w-2 h-2 rounded-full',
            error ? 'bg-red-500' : 'bg-amber-500'
          )}
        />
        <span className={cn('text-sm', error ? 'text-red-700' : 'text-amber-700')}>
          {error ? error.message : 'Reconnecting to real-time updates...'}
        </span>
      </div>

      {onRetry && (
        <button
          onClick={onRetry}
          className={cn(
            'text-sm font-medium hover:underline',
            error ? 'text-red-600' : 'text-amber-600'
          )}
        >
          Retry
        </button>
      )}
    </div>
  )
}
