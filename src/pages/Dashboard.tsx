import { Link } from 'react-router-dom'

// Mock data for demonstration - will be replaced with real data later
const mockOutcomes = [
  { id: '1', title: 'Improve User Retention', status: 'active' },
  { id: '2', title: 'Reduce Onboarding Time', status: 'active' },
  { id: '3', title: 'Increase Feature Adoption', status: 'completed' },
]

const statusStyles: Record<string, string> = {
  active: 'bg-green-100 text-green-700',
  completed: 'bg-blue-100 text-blue-700',
  paused: 'bg-yellow-100 text-yellow-700',
}

export default function Dashboard() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-foreground mb-1">Outcome Tracking Dashboard</h1>
        <p className="text-muted-foreground">Track and manage your outcomes and experiments</p>
      </div>

      <section className="mb-8">
        <h2 className="text-lg font-semibold text-foreground mb-4">Outcomes</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {mockOutcomes.map((outcome) => (
            <Link
              key={outcome.id}
              to={`/outcomes/${outcome.id}`}
              className="block p-5 bg-card border border-border rounded-lg hover:border-primary hover:shadow-md transition-all"
            >
              <h3 className="text-base font-semibold text-card-foreground mb-2">{outcome.title}</h3>
              <span className={`inline-block px-2 py-1 text-xs font-medium rounded capitalize ${statusStyles[outcome.status] || 'bg-gray-100 text-gray-700'}`}>
                {outcome.status}
              </span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  )
}
