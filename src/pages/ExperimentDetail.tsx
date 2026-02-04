import { useParams, Link, useNavigate } from 'react-router-dom'

// Mock tasks for the Kanban board - will be replaced with real data later
const mockTasks = [
  { id: 't1', title: 'Define hypothesis', status: 'done' },
  { id: 't2', title: 'Set up tracking', status: 'in-progress' },
  { id: 't3', title: 'Launch experiment', status: 'todo' },
  { id: 't4', title: 'Analyze results', status: 'todo' },
]

export default function ExperimentDetail() {
  const { id } = useParams()
  const navigate = useNavigate()

  const todoTasks = mockTasks.filter((t) => t.status === 'todo')
  const inProgressTasks = mockTasks.filter((t) => t.status === 'in-progress')
  const doneTasks = mockTasks.filter((t) => t.status === 'done')

  return (
    <div>
      <nav className="flex items-center gap-2 text-sm mb-4">
        <Link to="/" className="text-primary hover:underline">Dashboard</Link>
        <span className="text-muted-foreground">/</span>
        <span className="text-muted-foreground">Experiment {id}</span>
      </nav>

      <div className="mb-6">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1 px-3 py-2 mb-3 text-sm text-muted-foreground bg-secondary border border-border rounded-md hover:bg-muted hover:text-foreground transition-colors"
        >
          &larr; Back
        </button>
        <h1 className="text-2xl font-semibold text-foreground mb-1">Experiment Detail</h1>
        <p className="text-muted-foreground">Viewing experiment {id}</p>
      </div>

      <section className="mb-8">
        <h2 className="text-lg font-semibold text-foreground mb-2">Overview</h2>
        <p className="text-muted-foreground">Experiment details and configuration will be displayed here.</p>
      </section>

      <section className="mb-8">
        <h2 className="text-lg font-semibold text-foreground mb-4">Tasks</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-muted rounded-lg p-4 min-h-52">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">To Do</h3>
            {todoTasks.map((task) => (
              <div key={task.id} className="bg-card border border-border rounded-md p-3 mb-2 text-sm">
                {task.title}
              </div>
            ))}
          </div>
          <div className="bg-muted rounded-lg p-4 min-h-52">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">In Progress</h3>
            {inProgressTasks.map((task) => (
              <div key={task.id} className="bg-card border border-border rounded-md p-3 mb-2 text-sm">
                {task.title}
              </div>
            ))}
          </div>
          <div className="bg-muted rounded-lg p-4 min-h-52">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Done</h3>
            {doneTasks.map((task) => (
              <div key={task.id} className="bg-card border border-border rounded-md p-3 mb-2 text-sm">
                {task.title}
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
