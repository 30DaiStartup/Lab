import { Link } from 'react-router-dom'

export default function Analytics() {
  return (
    <div>
      <nav className="flex items-center gap-2 text-sm mb-4">
        <Link to="/" className="text-primary hover:underline">Dashboard</Link>
        <span className="text-muted-foreground">/</span>
        <span className="text-muted-foreground">Analytics</span>
      </nav>

      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-foreground mb-1">Analytics & Reports</h1>
        <p className="text-muted-foreground">View insights and export data</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <section className="bg-card border border-border rounded-lg p-6">
          <h2 className="text-lg font-semibold text-card-foreground mb-2">Reports Overview</h2>
          <p className="text-muted-foreground text-sm">Charts and exports will be displayed here.</p>
        </section>

        <section className="bg-card border border-border rounded-lg p-6">
          <h2 className="text-lg font-semibold text-card-foreground mb-2">Export Options</h2>
          <p className="text-muted-foreground text-sm">Data export functionality will be available here.</p>
        </section>
      </div>
    </div>
  )
}
