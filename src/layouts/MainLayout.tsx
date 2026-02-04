import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'

export default function MainLayout() {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <header className="flex items-center justify-between px-6 py-4 bg-card border-b border-border">
          <h1 className="text-xl font-semibold text-foreground">Outcome Tracking</h1>
          <div className="flex gap-2">
            <button
              className="flex items-center gap-2 px-4 py-2 text-sm bg-secondary text-secondary-foreground rounded-md border border-border hover:bg-muted transition-colors"
              title="Search"
            >
              <span className="font-mono text-xs">[S]</span>
              <span>Search</span>
            </button>
            <button
              className="flex items-center gap-2 px-4 py-2 text-sm bg-secondary text-secondary-foreground rounded-md border border-border hover:bg-muted transition-colors"
              title="Notifications"
            >
              <span className="font-mono text-xs">[N]</span>
              <span>Notifications</span>
            </button>
          </div>
        </header>
        <main className="flex-1 p-6 overflow-y-auto bg-background">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
