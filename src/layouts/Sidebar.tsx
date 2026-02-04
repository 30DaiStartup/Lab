import { NavLink } from 'react-router-dom'

export default function Sidebar() {
  const baseLinkClasses = 'flex items-center gap-3 px-4 py-3 rounded-md text-sm font-medium transition-colors'
  const activeLinkClasses = 'bg-primary text-primary-foreground'
  const inactiveLinkClasses = 'text-muted-foreground hover:bg-muted hover:text-foreground'

  return (
    <aside className="w-56 bg-sidebar border-r border-sidebar-border p-4 flex flex-col">
      <div className="mb-6 px-2">
        <h2 className="text-lg font-semibold text-sidebar-foreground">Aurora Lab</h2>
      </div>
      <nav className="flex flex-col gap-1">
        <NavLink
          to="/"
          className={({ isActive }) =>
            `${baseLinkClasses} ${isActive ? activeLinkClasses : inactiveLinkClasses}`
          }
          end
        >
          <span className="font-mono text-xs">[D]</span>
          <span>Dashboard</span>
        </NavLink>
        <NavLink
          to="/analytics"
          className={({ isActive }) =>
            `${baseLinkClasses} ${isActive ? activeLinkClasses : inactiveLinkClasses}`
          }
        >
          <span className="font-mono text-xs">[A]</span>
          <span>Analytics</span>
        </NavLink>
      </nav>
    </aside>
  )
}
