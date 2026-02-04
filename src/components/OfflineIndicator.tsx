import * as React from 'react';
import { WifiOffIcon, XIcon } from 'lucide-react';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { cn } from '@/lib/utils';

interface OfflineIndicatorProps {
  /** Additional CSS classes */
  className?: string;
  /** Whether the banner can be dismissed */
  dismissible?: boolean;
}

/**
 * Banner component that displays when the user is offline
 *
 * Features:
 * - Shows a subtle banner at the top of the page when offline
 * - Optionally dismissible
 * - Animates in/out smoothly
 */
export function OfflineIndicator({
  className,
  dismissible = true,
}: OfflineIndicatorProps) {
  const { isOnline, wasOffline, lastOnlineAt } = useOnlineStatus();
  const [isDismissed, setIsDismissed] = React.useState(false);
  const [showReconnected, setShowReconnected] = React.useState(false);

  // Reset dismissed state when going offline again
  React.useEffect(() => {
    if (!isOnline) {
      setIsDismissed(false);
    }
  }, [isOnline]);

  // Show "back online" message briefly when reconnecting
  React.useEffect(() => {
    if (isOnline && wasOffline && lastOnlineAt) {
      setShowReconnected(true);
      const timer = setTimeout(() => {
        setShowReconnected(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isOnline, wasOffline, lastOnlineAt]);

  const handleDismiss = () => {
    setIsDismissed(true);
  };

  // Don't show anything if online and no recent reconnection
  if (isOnline && !showReconnected) {
    return null;
  }

  // Don't show if dismissed (only for offline state)
  if (!isOnline && isDismissed) {
    return null;
  }

  // Show reconnected message
  if (isOnline && showReconnected) {
    return (
      <div
        className={cn(
          'flex items-center justify-center gap-2 px-4 py-2',
          'bg-green-50 border-b border-green-200',
          'text-green-700 text-sm font-medium',
          'animate-in slide-in-from-top duration-300',
          className
        )}
        role="status"
        aria-live="polite"
      >
        <span>Back online - your data is syncing</span>
      </div>
    );
  }

  // Show offline banner
  return (
    <div
      className={cn(
        'flex items-center justify-between gap-4 px-4 py-2',
        'bg-amber-50 border-b border-amber-200',
        'text-amber-800 text-sm',
        'animate-in slide-in-from-top duration-300',
        className
      )}
      role="alert"
      aria-live="assertive"
    >
      <div className="flex items-center gap-2">
        <WifiOffIcon className="size-4 flex-shrink-0" aria-hidden="true" />
        <span>
          You're offline - changes will sync when back online
        </span>
      </div>

      {dismissible && (
        <button
          onClick={handleDismiss}
          className={cn(
            'flex items-center justify-center size-6 rounded',
            'text-amber-600 hover:text-amber-800',
            'hover:bg-amber-100',
            'transition-colors duration-150',
            'focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-1'
          )}
          aria-label="Dismiss offline notification"
        >
          <XIcon className="size-4" />
        </button>
      )}
    </div>
  );
}

/**
 * Compact offline indicator for use in headers or sidebars
 */
export function OfflineIndicatorCompact({ className }: { className?: string }) {
  const { isOnline } = useOnlineStatus();

  if (isOnline) {
    return null;
  }

  return (
    <div
      className={cn(
        'flex items-center gap-1.5 px-2 py-1 rounded-full',
        'bg-amber-100 text-amber-700 text-xs font-medium',
        className
      )}
      role="status"
      aria-label="Currently offline"
    >
      <WifiOffIcon className="size-3" aria-hidden="true" />
      <span>Offline</span>
    </div>
  );
}
