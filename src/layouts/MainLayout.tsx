import * as React from 'react'
import { Outlet } from 'react-router-dom'
import { SearchIcon, BellIcon } from 'lucide-react'
import Sidebar from './Sidebar'
import { SearchOverlay } from '@/components/SearchOverlay'
import { NotificationsPanel } from '@/components/NotificationsPanel'
import { OfflineIndicator } from '@/components/OfflineIndicator'
import { OutcomesProvider } from '@/contexts/OutcomesContext'
import { ExperimentsProvider } from '@/contexts/ExperimentsContext'
import { cn } from '@/lib/utils'

function MainLayoutContent() {
  const [searchOpen, setSearchOpen] = React.useState(false)
  const [notificationsOpen, setNotificationsOpen] = React.useState(false)

  // Keyboard shortcut handler
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl+K to open search
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setSearchOpen(true)
        setNotificationsOpen(false)
      }

      // Escape to close overlays (handled by individual components too)
      if (e.key === 'Escape') {
        setSearchOpen(false)
        setNotificationsOpen(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const handleSearchClick = () => {
    setSearchOpen(true)
    setNotificationsOpen(false)
  }

  const handleNotificationsClick = () => {
    setNotificationsOpen(true)
    setSearchOpen(false)
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <OfflineIndicator />
        <header className="flex items-center justify-between px-6 py-4 bg-card border-b border-border">
          <h1 className="text-xl font-semibold text-foreground">Outcome Tracking</h1>
          <div className="flex gap-2">
            {/* Search Button */}
            <button
              onClick={handleSearchClick}
              className={cn(
                "flex items-center gap-2 px-3 py-2 text-sm rounded-lg",
                "bg-slate-100 text-slate-600 border border-slate-200",
                "hover:bg-slate-200 hover:text-slate-800 hover:border-slate-300",
                "transition-all duration-150",
                "focus:outline-none focus:ring-2 focus:ring-slate-300 focus:ring-offset-1"
              )}
              title="Search (Cmd+K)"
            >
              <SearchIcon className="size-4" />
              <span className="hidden sm:inline">Search</span>
              <kbd className={cn(
                "hidden sm:inline-flex h-5 items-center gap-1 rounded border",
                "bg-white border-slate-200 px-1.5",
                "font-sans text-[10px] font-medium text-slate-400"
              )}>
                <span className="text-xs">&#8984;</span>K
              </kbd>
            </button>

            {/* Notifications Button */}
            <button
              onClick={handleNotificationsClick}
              className={cn(
                "relative flex items-center gap-2 px-3 py-2 text-sm rounded-lg",
                "bg-slate-100 text-slate-600 border border-slate-200",
                "hover:bg-slate-200 hover:text-slate-800 hover:border-slate-300",
                "transition-all duration-150",
                "focus:outline-none focus:ring-2 focus:ring-slate-300 focus:ring-offset-1"
              )}
              title="Notifications"
            >
              <BellIcon className="size-4" />
              <span className="hidden sm:inline">Notifications</span>
              {/* Unread indicator dot */}
              <span className={cn(
                "absolute -top-1 -right-1 flex size-3",
                "rounded-full bg-blue-500 border-2 border-white"
              )}>
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
              </span>
            </button>
          </div>
        </header>
        <main className="flex-1 p-6 overflow-y-auto bg-background">
          <Outlet />
        </main>
      </div>

      {/* Overlays */}
      <SearchOverlay open={searchOpen} onOpenChange={setSearchOpen} />
      <NotificationsPanel open={notificationsOpen} onOpenChange={setNotificationsOpen} />
    </div>
  )
}

export default function MainLayout() {
  return (
    <OutcomesProvider>
      <ExperimentsProvider>
        <MainLayoutContent />
      </ExperimentsProvider>
    </OutcomesProvider>
  )
}
