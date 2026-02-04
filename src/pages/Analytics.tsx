import { useState, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Download,
  FileText,
  Calendar,
  TrendingUp,
  TrendingDown,
  Minus,
  Target,
  FlaskConical,
  CheckCircle2,
  Clock,
  AlertCircle,
  ChevronRight,
  Activity,
} from 'lucide-react'
import { useOutcomes } from '@/hooks/useOutcomes'
import { useExperiments } from '@/hooks/useExperiments'
import type { OutcomeStatus, ExperimentStatus } from '@/types/database'
import { StatusBadge, type Status } from '@/components/StatusBadge'
import { ProgressBar } from '@/components/ProgressBar'
import { DataTable, type Column } from '@/components/DataTable'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'

// Date range options
type DateRange = 'week' | 'month' | 'quarter' | 'year' | 'all'

const dateRangeLabels: Record<DateRange, string> = {
  week: 'This Week',
  month: 'This Month',
  quarter: 'This Quarter',
  year: 'This Year',
  all: 'All Time',
}

// Mock data for demonstration
const mockOutcomes = [
  {
    id: 1,
    title: 'Increase Customer Retention Rate',
    description: 'Improve customer retention from 75% to 90% within Q2',
    status: 'Active' as OutcomeStatus,
    progress: 65,
    metrics: null,
    cascade_alignment: ['WinningAspiration', 'HowToWin'],
    level: 'Org',
    parent_outcome_id: null,
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-02-20T14:30:00Z',
  },
  {
    id: 2,
    title: 'Reduce Onboarding Time by 40%',
    description: 'Streamline the user onboarding process',
    status: 'Active' as OutcomeStatus,
    progress: 42,
    metrics: null,
    cascade_alignment: ['Capabilities', 'ManagementSystems'],
    level: 'Departmental',
    parent_outcome_id: 1,
    created_at: '2024-01-20T14:30:00Z',
    updated_at: '2024-02-18T09:15:00Z',
  },
  {
    id: 3,
    title: 'Launch Premium Tier',
    description: 'Develop and launch a premium subscription offering',
    status: 'Stalled' as OutcomeStatus,
    progress: 28,
    metrics: null,
    cascade_alignment: ['WhereToPlay', 'HowToWin'],
    level: 'Org',
    parent_outcome_id: null,
    created_at: '2024-02-01T09:00:00Z',
    updated_at: '2024-02-10T11:00:00Z',
  },
  {
    id: 4,
    title: 'Expand to European Market',
    description: 'Establish presence in key European markets',
    status: 'Active' as OutcomeStatus,
    progress: 15,
    metrics: null,
    cascade_alignment: ['WhereToPlay'],
    level: 'Org',
    parent_outcome_id: null,
    created_at: '2024-02-10T11:00:00Z',
    updated_at: '2024-02-22T16:45:00Z',
  },
  {
    id: 5,
    title: 'Implement Self-Service Analytics',
    description: 'Enable customers to build their own dashboards',
    status: 'Completed' as OutcomeStatus,
    progress: 100,
    metrics: null,
    cascade_alignment: ['Capabilities', 'HowToWin'],
    level: 'Departmental',
    parent_outcome_id: null,
    created_at: '2024-01-05T08:00:00Z',
    updated_at: '2024-02-28T16:00:00Z',
  },
]

const mockExperiments = [
  { id: 1, outcome_id: 1, title: 'A/B Test: Onboarding Flow', status: 'InProgress' as ExperimentStatus, progress: 75, created_at: '2024-02-01T10:00:00Z', updated_at: '2024-02-22T14:00:00Z' },
  { id: 2, outcome_id: 1, title: 'Customer Success Outreach', status: 'Done' as ExperimentStatus, progress: 100, created_at: '2024-01-20T09:00:00Z', updated_at: '2024-02-15T11:00:00Z' },
  { id: 3, outcome_id: 1, title: 'Loyalty Program Pilot', status: 'Backlog' as ExperimentStatus, progress: 0, created_at: '2024-02-10T14:00:00Z', updated_at: '2024-02-10T14:00:00Z' },
  { id: 4, outcome_id: 2, title: 'Interactive Tutorials', status: 'InProgress' as ExperimentStatus, progress: 60, created_at: '2024-01-25T11:00:00Z', updated_at: '2024-02-21T09:30:00Z' },
  { id: 5, outcome_id: 2, title: 'Guided Setup Wizard', status: 'InProgress' as ExperimentStatus, progress: 45, created_at: '2024-02-05T13:00:00Z', updated_at: '2024-02-20T16:00:00Z' },
  { id: 6, outcome_id: 3, title: 'Premium Feature Analysis', status: 'Backlog' as ExperimentStatus, progress: 10, created_at: '2024-02-08T10:00:00Z', updated_at: '2024-02-08T10:00:00Z' },
  { id: 7, outcome_id: 4, title: 'GDPR Compliance Audit', status: 'InProgress' as ExperimentStatus, progress: 30, created_at: '2024-02-12T09:00:00Z', updated_at: '2024-02-19T14:00:00Z' },
  { id: 8, outcome_id: 4, title: 'Localization Sprint', status: 'Backlog' as ExperimentStatus, progress: 5, created_at: '2024-02-15T11:00:00Z', updated_at: '2024-02-15T11:00:00Z' },
  { id: 9, outcome_id: 5, title: 'Dashboard Builder MVP', status: 'Done' as ExperimentStatus, progress: 100, created_at: '2024-01-10T10:00:00Z', updated_at: '2024-02-25T15:00:00Z' },
  { id: 10, outcome_id: 5, title: 'Chart Widget Library', status: 'Done' as ExperimentStatus, progress: 100, created_at: '2024-01-15T14:00:00Z', updated_at: '2024-02-28T10:00:00Z' },
]

// Activity log mock data
const mockActivityLog = [
  { id: 1, action: 'Outcome "Self-Service Analytics" marked as Completed', timestamp: '2024-02-28T16:00:00Z', type: 'outcome' },
  { id: 2, action: 'Experiment "Chart Widget Library" completed', timestamp: '2024-02-28T10:00:00Z', type: 'experiment' },
  { id: 3, action: 'Dashboard Builder MVP reached 100% progress', timestamp: '2024-02-25T15:00:00Z', type: 'experiment' },
  { id: 4, action: 'Customer Retention Rate updated to 65%', timestamp: '2024-02-22T14:00:00Z', type: 'outcome' },
  { id: 5, action: 'New experiment "Localization Sprint" created', timestamp: '2024-02-15T11:00:00Z', type: 'experiment' },
  { id: 6, action: 'Outcome "Launch Premium Tier" status changed to Stalled', timestamp: '2024-02-10T11:00:00Z', type: 'outcome' },
  { id: 7, action: 'GDPR Compliance Audit started', timestamp: '2024-02-12T09:00:00Z', type: 'experiment' },
  { id: 8, action: 'Interactive Tutorials experiment updated', timestamp: '2024-02-21T09:30:00Z', type: 'experiment' },
]

// Trend indicator component
function TrendIndicator({ value, suffix = '%' }: { value: number; suffix?: string }) {
  if (value === 0) {
    return (
      <span className="inline-flex items-center gap-1 text-slate-500 text-xs font-medium">
        <Minus className="size-3" />
        <span>0{suffix}</span>
      </span>
    )
  }

  const isPositive = value > 0
  return (
    <span className={cn(
      "inline-flex items-center gap-0.5 text-xs font-semibold",
      isPositive ? "text-emerald-600" : "text-rose-600"
    )}>
      {isPositive ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}
      <span>{isPositive ? '+' : ''}{value}{suffix}</span>
    </span>
  )
}

// Stat card component with refined design
interface StatCardProps {
  title: string
  value: string | number
  subtitle?: string
  trend?: number
  trendSuffix?: string
  icon: React.ElementType
  accentColor: 'slate' | 'blue' | 'emerald' | 'amber' | 'violet'
  delay?: number
}

function StatCard({ title, value, subtitle, trend, trendSuffix = '%', icon: Icon, accentColor, delay = 0 }: StatCardProps) {
  const accentStyles = {
    slate: 'from-slate-50 to-slate-100/50 border-slate-200',
    blue: 'from-blue-50 to-blue-100/30 border-blue-200/60',
    emerald: 'from-emerald-50 to-emerald-100/30 border-emerald-200/60',
    amber: 'from-amber-50 to-amber-100/30 border-amber-200/60',
    violet: 'from-violet-50 to-violet-100/30 border-violet-200/60',
  }

  const iconStyles = {
    slate: 'bg-slate-100 text-slate-600',
    blue: 'bg-blue-100 text-blue-600',
    emerald: 'bg-emerald-100 text-emerald-600',
    amber: 'bg-amber-100 text-amber-600',
    violet: 'bg-violet-100 text-violet-600',
  }

  return (
    <div
      className={cn(
        "relative bg-gradient-to-br rounded-xl border p-5",
        "transition-all duration-300 hover:shadow-md hover:shadow-slate-200/50",
        "animate-in fade-in slide-in-from-bottom-2",
        accentStyles[accentColor]
      )}
      style={{ animationDelay: `${delay}ms`, animationFillMode: 'backwards' }}
    >
      <div className="flex items-start justify-between mb-3">
        <div className={cn("p-2 rounded-lg", iconStyles[accentColor])}>
          <Icon className="size-4" strokeWidth={2} />
        </div>
        {trend !== undefined && <TrendIndicator value={trend} suffix={trendSuffix} />}
      </div>

      <div className="space-y-0.5">
        <div className="text-2xl font-bold text-slate-900 tracking-tight tabular-nums">
          {value}
        </div>
        <div className="text-sm font-medium text-slate-600">{title}</div>
        {subtitle && (
          <div className="text-xs text-slate-500">{subtitle}</div>
        )}
      </div>
    </div>
  )
}

// Horizontal bar chart segment
interface BarSegmentProps {
  label: string
  value: number
  total: number
  color: string
  delay?: number
}

function BarSegment({ label, value, total, color, delay = 0 }: BarSegmentProps) {
  const percentage = total > 0 ? (value / total) * 100 : 0

  return (
    <div
      className="animate-in fade-in slide-in-from-left-2"
      style={{ animationDelay: `${delay}ms`, animationFillMode: 'backwards' }}
    >
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-sm font-medium text-slate-700">{label}</span>
        <span className="text-sm font-semibold text-slate-900 tabular-nums">{value}</span>
      </div>
      <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all duration-700 ease-out", color)}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <div className="text-xs text-slate-500 mt-1 tabular-nums">{percentage.toFixed(1)}%</div>
    </div>
  )
}

// Donut chart component using CSS
interface DonutChartProps {
  segments: { label: string; value: number; color: string }[]
  total: number
  centerLabel: string
  centerValue: string | number
}

function DonutChart({ segments, total, centerLabel, centerValue }: DonutChartProps) {
  let cumulativePercentage = 0

  const gradientStops = segments.map((segment) => {
    const percentage = total > 0 ? (segment.value / total) * 100 : 0
    const start = cumulativePercentage
    cumulativePercentage += percentage
    return { ...segment, start, end: cumulativePercentage, percentage }
  })

  const conicGradient = gradientStops
    .map((seg) => `${seg.color} ${seg.start}% ${seg.end}%`)
    .join(', ')

  return (
    <div className="relative flex items-center justify-center">
      <div
        className="w-40 h-40 rounded-full animate-in zoom-in-50 duration-500"
        style={{
          background: total > 0
            ? `conic-gradient(${conicGradient})`
            : 'conic-gradient(#e2e8f0 0% 100%)',
        }}
      >
        <div className="absolute inset-4 bg-white rounded-full flex flex-col items-center justify-center shadow-inner">
          <span className="text-3xl font-bold text-slate-900 tabular-nums">{centerValue}</span>
          <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">{centerLabel}</span>
        </div>
      </div>
    </div>
  )
}

// Format relative time
function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays} days ago`
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`
  return `${Math.floor(diffDays / 30)} months ago`
}

// Export to CSV function
function exportToCSV(data: Record<string, unknown>[], filename: string) {
  if (data.length === 0) return

  const headers = Object.keys(data[0])
  const csvContent = [
    headers.join(','),
    ...data.map(row => headers.map(header => {
      const value = row[header]
      if (typeof value === 'string' && value.includes(',')) {
        return `"${value}"`
      }
      return value
    }).join(','))
  ].join('\n')

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`
  link.click()
}

export default function Analytics() {
  const navigate = useNavigate()
  const [dateRange, setDateRange] = useState<DateRange>('month')

  // Fetch data from hooks
  const { outcomes: fetchedOutcomes, isLoading: outcomesLoading } = useOutcomes()
  const { experiments: fetchedExperiments, isLoading: experimentsLoading } = useExperiments()

  // Use mock data if no data fetched
  const outcomes = fetchedOutcomes.length > 0 ? fetchedOutcomes : mockOutcomes
  const experiments = fetchedExperiments.length > 0 ? fetchedExperiments : mockExperiments

  const isLoading = outcomesLoading || experimentsLoading

  // Calculate statistics
  const stats = useMemo(() => {
    const totalOutcomes = outcomes.length
    const activeOutcomes = outcomes.filter(o => o.status === 'Active').length
    const stalledOutcomes = outcomes.filter(o => o.status === 'Stalled').length
    const completedOutcomes = outcomes.filter(o => o.status === 'Completed').length

    const totalExperiments = experiments.length
    const inProgressExperiments = experiments.filter(e => e.status === 'InProgress').length
    const doneExperiments = experiments.filter(e => e.status === 'Done').length
    const backlogExperiments = experiments.filter(e => e.status === 'Backlog').length

    const completionRate = totalOutcomes > 0
      ? Math.round((completedOutcomes / totalOutcomes) * 100)
      : 0

    const avgProgress = outcomes.length > 0
      ? Math.round(outcomes.reduce((sum, o) => sum + o.progress, 0) / outcomes.length)
      : 0

    return {
      totalOutcomes,
      activeOutcomes,
      stalledOutcomes,
      completedOutcomes,
      totalExperiments,
      inProgressExperiments,
      doneExperiments,
      backlogExperiments,
      completionRate,
      avgProgress,
    }
  }, [outcomes, experiments])

  // Prepare table data for outcomes
  const outcomesTableData = useMemo(() =>
    outcomes.map(o => {
      const experimentCount = experiments.filter(e => e.outcome_id === o.id).length
      return {
        id: o.id,
        title: o.title,
        status: o.status,
        progress: o.progress,
        experimentCount,
        updatedAt: o.updated_at || o.created_at,
      }
    }),
    [outcomes, experiments]
  )

  // Prepare table data for experiments
  const experimentsTableData = useMemo(() =>
    experiments.map(e => {
      const parentOutcome = outcomes.find(o => o.id === e.outcome_id)
      return {
        id: e.id,
        title: e.title,
        status: e.status,
        progress: e.progress,
        outcomeName: parentOutcome?.title || 'Unknown',
        outcomeId: e.outcome_id,
        updatedAt: e.updated_at || e.created_at,
      }
    }),
    [experiments, outcomes]
  )

  // Outcomes table columns
  const outcomeColumns: Column<typeof outcomesTableData[0]>[] = [
    {
      key: 'title',
      header: 'Outcome',
      sortable: true,
      render: (row) => (
        <Link
          to={`/outcomes/${row.id}`}
          className="font-medium text-slate-900 hover:text-blue-600 hover:underline transition-colors"
        >
          {row.title}
        </Link>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (row) => <StatusBadge status={row.status as Status} />,
    },
    {
      key: 'progress',
      header: 'Progress',
      sortable: true,
      render: (row) => (
        <div className="flex items-center gap-3 min-w-[140px]">
          <ProgressBar
            value={row.progress}
            size="sm"
            color={row.progress >= 75 ? 'success' : row.progress >= 40 ? 'info' : 'default'}
            className="flex-1"
          />
          <span className="text-sm font-medium text-slate-700 tabular-nums w-10">
            {row.progress}%
          </span>
        </div>
      ),
    },
    {
      key: 'experimentCount',
      header: 'Experiments',
      sortable: true,
      className: 'text-center',
      render: (row) => (
        <span className="inline-flex items-center gap-1 text-slate-600">
          <FlaskConical className="size-3.5" />
          <span className="tabular-nums">{row.experimentCount}</span>
        </span>
      ),
    },
    {
      key: 'updatedAt',
      header: 'Last Updated',
      sortable: true,
      render: (row) => (
        <span className="text-sm text-slate-500">{formatRelativeTime(row.updatedAt)}</span>
      ),
    },
  ]

  // Experiments table columns
  const experimentColumns: Column<typeof experimentsTableData[0]>[] = [
    {
      key: 'title',
      header: 'Experiment',
      sortable: true,
      render: (row) => (
        <Link
          to={`/experiments/${row.id}`}
          className="font-medium text-slate-900 hover:text-blue-600 hover:underline transition-colors"
        >
          {row.title}
        </Link>
      ),
    },
    {
      key: 'outcomeName',
      header: 'Parent Outcome',
      sortable: true,
      render: (row) => (
        <Link
          to={`/outcomes/${row.outcomeId}`}
          className="text-slate-600 hover:text-blue-600 hover:underline transition-colors text-sm"
        >
          {row.outcomeName}
        </Link>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (row) => <StatusBadge status={row.status as Status} />,
    },
    {
      key: 'progress',
      header: 'Progress',
      sortable: true,
      render: (row) => (
        <div className="flex items-center gap-3 min-w-[140px]">
          <ProgressBar
            value={row.progress}
            size="sm"
            color={row.progress >= 75 ? 'success' : row.progress >= 40 ? 'info' : 'default'}
            className="flex-1"
          />
          <span className="text-sm font-medium text-slate-700 tabular-nums w-10">
            {row.progress}%
          </span>
        </div>
      ),
    },
    {
      key: 'updatedAt',
      header: 'Last Updated',
      sortable: true,
      render: (row) => (
        <span className="text-sm text-slate-500">{formatRelativeTime(row.updatedAt)}</span>
      ),
    },
  ]

  // Handle CSV export
  const handleExportOutcomes = () => {
    const exportData = outcomes.map(o => ({
      ID: o.id,
      Title: o.title,
      Status: o.status,
      Progress: `${o.progress}%`,
      Level: o.level,
      Created: o.created_at,
      Updated: o.updated_at || '',
    }))
    exportToCSV(exportData, 'outcomes_report')
  }

  const handleExportExperiments = () => {
    const exportData = experiments.map(e => {
      const outcome = outcomes.find(o => o.id === e.outcome_id)
      return {
        ID: e.id,
        Title: e.title,
        'Parent Outcome': outcome?.title || '',
        Status: e.status,
        Progress: `${e.progress}%`,
        Created: e.created_at,
        Updated: e.updated_at || '',
      }
    })
    exportToCSV(exportData, 'experiments_report')
  }

  const handleExportAll = () => {
    handleExportOutcomes()
    setTimeout(handleExportExperiments, 100)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <div className="animate-pulse space-y-8">
          <div className="h-8 bg-slate-200 rounded w-64" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-32 bg-slate-100 rounded-xl" />
            ))}
          </div>
          <div className="h-64 bg-slate-100 rounded-xl" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm mb-6">
        <Link to="/" className="text-slate-500 hover:text-slate-700 transition-colors">
          Dashboard
        </Link>
        <ChevronRight className="size-3.5 text-slate-400" />
        <span className="text-slate-900 font-medium">Analytics</span>
      </nav>

      {/* Page Header */}
      <header className="mb-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Analytics & Reports
            </h1>
            <p className="mt-1 text-slate-500">
              Track progress, analyze trends, and export data
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Date Range Selector */}
            <div className="flex items-center gap-2">
              <Calendar className="size-4 text-slate-400" />
              <Select value={dateRange} onValueChange={(v) => setDateRange(v as DateRange)}>
                <SelectTrigger className="w-36 bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(dateRangeLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Export Buttons */}
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={handleExportAll}>
                <Download className="size-4" />
                <span className="hidden sm:inline">Export CSV</span>
              </Button>
              <Button variant="outline" disabled title="Coming soon">
                <FileText className="size-4" />
                <span className="hidden sm:inline">Export PDF</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Summary Stats Row */}
      <section className="mb-8">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          <StatCard
            title="Total Outcomes"
            value={stats.totalOutcomes}
            subtitle={`${stats.avgProgress}% avg progress`}
            trend={8}
            icon={Target}
            accentColor="slate"
            delay={0}
          />
          <StatCard
            title="Active"
            value={stats.activeOutcomes}
            icon={Activity}
            accentColor="blue"
            delay={50}
          />
          <StatCard
            title="Completed"
            value={stats.completedOutcomes}
            trend={12}
            icon={CheckCircle2}
            accentColor="emerald"
            delay={100}
          />
          <StatCard
            title="Total Experiments"
            value={stats.totalExperiments}
            subtitle={`${stats.inProgressExperiments} in progress`}
            icon={FlaskConical}
            accentColor="violet"
            delay={150}
          />
          <StatCard
            title="Completion Rate"
            value={`${stats.completionRate}%`}
            trend={5}
            icon={TrendingUp}
            accentColor="emerald"
            delay={200}
          />
        </div>
      </section>

      {/* Charts Row */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Outcomes by Status */}
        <div
          className="bg-white rounded-xl border border-slate-200 p-6 animate-in fade-in slide-in-from-bottom-2"
          style={{ animationDelay: '250ms', animationFillMode: 'backwards' }}
        >
          <h2 className="text-lg font-semibold text-slate-900 mb-6">Outcomes by Status</h2>

          <div className="flex flex-col md:flex-row items-center gap-8">
            <DonutChart
              segments={[
                { label: 'Active', value: stats.activeOutcomes, color: '#3b82f6' },
                { label: 'Stalled', value: stats.stalledOutcomes, color: '#f59e0b' },
                { label: 'Completed', value: stats.completedOutcomes, color: '#10b981' },
              ]}
              total={stats.totalOutcomes}
              centerLabel="Total"
              centerValue={stats.totalOutcomes}
            />

            <div className="flex-1 space-y-4 w-full">
              <BarSegment
                label="Active"
                value={stats.activeOutcomes}
                total={stats.totalOutcomes}
                color="bg-blue-500"
                delay={300}
              />
              <BarSegment
                label="Stalled"
                value={stats.stalledOutcomes}
                total={stats.totalOutcomes}
                color="bg-amber-500"
                delay={350}
              />
              <BarSegment
                label="Completed"
                value={stats.completedOutcomes}
                total={stats.totalOutcomes}
                color="bg-emerald-500"
                delay={400}
              />
            </div>
          </div>
        </div>

        {/* Experiments by Status */}
        <div
          className="bg-white rounded-xl border border-slate-200 p-6 animate-in fade-in slide-in-from-bottom-2"
          style={{ animationDelay: '300ms', animationFillMode: 'backwards' }}
        >
          <h2 className="text-lg font-semibold text-slate-900 mb-6">Experiments by Status</h2>

          <div className="flex flex-col md:flex-row items-center gap-8">
            <DonutChart
              segments={[
                { label: 'In Progress', value: stats.inProgressExperiments, color: '#3b82f6' },
                { label: 'Backlog', value: stats.backlogExperiments, color: '#64748b' },
                { label: 'Done', value: stats.doneExperiments, color: '#10b981' },
              ]}
              total={stats.totalExperiments}
              centerLabel="Total"
              centerValue={stats.totalExperiments}
            />

            <div className="flex-1 space-y-4 w-full">
              <BarSegment
                label="In Progress"
                value={stats.inProgressExperiments}
                total={stats.totalExperiments}
                color="bg-blue-500"
                delay={350}
              />
              <BarSegment
                label="Backlog"
                value={stats.backlogExperiments}
                total={stats.totalExperiments}
                color="bg-slate-400"
                delay={400}
              />
              <BarSegment
                label="Done"
                value={stats.doneExperiments}
                total={stats.totalExperiments}
                color="bg-emerald-500"
                delay={450}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Progress Overview Table */}
      <section
        className="mb-8 animate-in fade-in slide-in-from-bottom-2"
        style={{ animationDelay: '400ms', animationFillMode: 'backwards' }}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-900">Outcomes Progress Overview</h2>
          <Button variant="ghost" size="sm" onClick={handleExportOutcomes}>
            <Download className="size-3.5" />
            Export
          </Button>
        </div>

        <DataTable
          data={outcomesTableData}
          columns={outcomeColumns}
          searchable
          searchPlaceholder="Search outcomes..."
          emptyMessage="No outcomes found"
          onRowClick={(row) => navigate(`/outcomes/${row.id}`)}
        />
      </section>

      {/* Experiments Status Table */}
      <section
        className="mb-8 animate-in fade-in slide-in-from-bottom-2"
        style={{ animationDelay: '450ms', animationFillMode: 'backwards' }}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-900">Experiments Status</h2>
          <Button variant="ghost" size="sm" onClick={handleExportExperiments}>
            <Download className="size-3.5" />
            Export
          </Button>
        </div>

        <DataTable
          data={experimentsTableData}
          columns={experimentColumns}
          searchable
          searchPlaceholder="Search experiments..."
          emptyMessage="No experiments found"
          onRowClick={(row) => navigate(`/experiments/${row.id}`)}
        />
      </section>

      {/* Activity Timeline */}
      <section
        className="animate-in fade-in slide-in-from-bottom-2"
        style={{ animationDelay: '500ms', animationFillMode: 'backwards' }}
      >
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Recent Activity</h2>

        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="divide-y divide-slate-100">
            {mockActivityLog.slice(0, 10).map((activity, index) => (
              <div
                key={activity.id}
                className="flex items-start gap-4 p-4 hover:bg-slate-50 transition-colors animate-in fade-in slide-in-from-left-2"
                style={{ animationDelay: `${550 + index * 30}ms`, animationFillMode: 'backwards' }}
              >
                <div className={cn(
                  "p-2 rounded-lg shrink-0",
                  activity.type === 'outcome' ? "bg-blue-100 text-blue-600" : "bg-violet-100 text-violet-600"
                )}>
                  {activity.type === 'outcome' ? (
                    <Target className="size-4" />
                  ) : (
                    <FlaskConical className="size-4" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-700">{activity.action}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Clock className="size-3 text-slate-400" />
                    <span className="text-xs text-slate-500">
                      {formatRelativeTime(activity.timestamp)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {mockActivityLog.length === 0 && (
            <div className="p-8 text-center">
              <AlertCircle className="size-8 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500">No recent activity</p>
            </div>
          )}
        </div>
      </section>

      {/* Export Section */}
      <section
        className="mt-8 p-6 bg-gradient-to-br from-slate-50 to-slate-100/50 rounded-xl border border-slate-200 animate-in fade-in slide-in-from-bottom-2"
        style={{ animationDelay: '600ms', animationFillMode: 'backwards' }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h3 className="text-base font-semibold text-slate-900">Export Your Data</h3>
            <p className="text-sm text-slate-500 mt-1">
              Download comprehensive reports for offline analysis or sharing
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={handleExportAll}>
              <Download className="size-4" />
              Download CSV
            </Button>
            <Button variant="outline" disabled title="Coming soon">
              <FileText className="size-4" />
              Download PDF
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}
