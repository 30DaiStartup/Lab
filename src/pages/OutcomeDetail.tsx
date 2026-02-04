import { useParams, Link, useNavigate } from 'react-router-dom'

// Mock data for demonstration - will be replaced with real data later
const mockExperiments = [
  { id: 'exp-1', title: 'A/B Test Homepage CTA', status: 'running' },
  { id: 'exp-2', title: 'Feature Flag: New Dashboard', status: 'paused' },
  { id: 'exp-3', title: 'Pricing Page Variant', status: 'completed' },
]

const statusStyles: Record<string, string> = {
  running: 'bg-green-100 text-green-700',
  completed: 'bg-blue-100 text-blue-700',
  paused: 'bg-yellow-100 text-yellow-700',
}

export default function OutcomeDetail() {
  const { id } = useParams()
  const navigate = useNavigate()

  return (
    <div>
      <nav className="flex items-center gap-2 text-sm mb-4">
        <Link to="/" className="text-primary hover:underline">Dashboard</Link>
        <span className="text-muted-foreground">/</span>
        <span className="text-muted-foreground">Outcome {id}</span>
      </nav>

      <div className="mb-6">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1 px-3 py-2 mb-3 text-sm text-muted-foreground bg-secondary border border-border rounded-md hover:bg-muted hover:text-foreground transition-colors"
        >
          &larr; Back
        </button>
        <h1 className="text-2xl font-semibold text-foreground mb-1">Outcome Detail</h1>
        <p className="text-muted-foreground">Viewing outcome {id}</p>
      </div>

      <section className="mb-8">
        <h2 className="text-lg font-semibold text-foreground mb-2">Overview</h2>
        <p className="text-muted-foreground">Outcome details and metrics will be displayed here.</p>
      </section>

      <section className="mb-8">
        <h2 className="text-lg font-semibold text-foreground mb-4">Experiments</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {mockExperiments.map((experiment) => (
            <Link
              key={experiment.id}
              to={`/experiments/${experiment.id}`}
              className="block p-5 bg-card border border-border rounded-lg hover:border-primary hover:shadow-md transition-all"
            >
              <h3 className="text-base font-semibold text-card-foreground mb-2">{experiment.title}</h3>
              <span className={`inline-block px-2 py-1 text-xs font-medium rounded capitalize ${statusStyles[experiment.status] || 'bg-gray-100 text-gray-700'}`}>
                {experiment.status}
              </span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  )
}
