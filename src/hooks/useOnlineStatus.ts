import { useState, useEffect, useCallback } from 'react';

export interface OnlineStatus {
  /** Whether the browser is currently online */
  isOnline: boolean;
  /** Whether the user went offline at any point during the session */
  wasOffline: boolean;
  /** Timestamp of when the user last went offline (null if never) */
  lastOfflineAt: number | null;
  /** Timestamp of when the user last came back online (null if never or still offline) */
  lastOnlineAt: number | null;
}

/**
 * Hook to track online/offline status
 *
 * @returns OnlineStatus object with current status and history
 *
 * @example
 * ```tsx
 * const { isOnline, wasOffline } = useOnlineStatus();
 *
 * if (!isOnline) {
 *   return <OfflineBanner />;
 * }
 * ```
 */
export function useOnlineStatus(): OnlineStatus {
  const [isOnline, setIsOnline] = useState<boolean>(() => {
    // Initialize with current online status
    // Use navigator.onLine if available, default to true
    return typeof navigator !== 'undefined' ? navigator.onLine : true;
  });

  const [wasOffline, setWasOffline] = useState<boolean>(false);
  const [lastOfflineAt, setLastOfflineAt] = useState<number | null>(null);
  const [lastOnlineAt, setLastOnlineAt] = useState<number | null>(null);

  const handleOnline = useCallback(() => {
    console.log('[useOnlineStatus] Browser came online');
    setIsOnline(true);
    setLastOnlineAt(Date.now());
  }, []);

  const handleOffline = useCallback(() => {
    console.log('[useOnlineStatus] Browser went offline');
    setIsOnline(false);
    setWasOffline(true);
    setLastOfflineAt(Date.now());
  }, []);

  useEffect(() => {
    // Add event listeners for online/offline events
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Check initial state - navigator.onLine might not be accurate
    // Some browsers report online even when there's no actual connectivity
    if (!navigator.onLine) {
      setIsOnline(false);
      setWasOffline(true);
      setLastOfflineAt(Date.now());
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [handleOnline, handleOffline]);

  return {
    isOnline,
    wasOffline,
    lastOfflineAt,
    lastOnlineAt,
  };
}

/**
 * Simplified hook that just returns whether we're online
 */
export function useIsOnline(): boolean {
  const { isOnline } = useOnlineStatus();
  return isOnline;
}
