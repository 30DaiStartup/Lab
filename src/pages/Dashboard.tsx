import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Search, Target, FlaskConical, SlidersHorizontal, X } from 'lucide-react'
import { useOutcomes } from '@/hooks/useOutcomes'
import type { OutcomeStatus, OutcomeLevel, CascadeAlignment } from '@/types/database'
import { StatusBadge, type Status } from '@/components/StatusBadge'
import { ProgressBar } from '@/components/ProgressBar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'

// Cascade alignment display names
const cascadeLabels: Record<CascadeAlignment, string> = {
  WinningAspiration: 'Winning Aspiration',
  WhereToPlay: 'Where to Play',
  HowToWin: 'How to Win',
  Capabilities: 'Capabilities',
  ManagementSystems: 'Management Systems',
}

// Level badge styles
const levelStyles: Record<OutcomeLevel, string> = {
  Org: 'bg-slate-700 text-white',
  Departmental: 'bg-slate-100 text-slate-700 border border-slate-200',
}

// Mock data for demonstration when Supabase is not configured
const mockOutcomes = [
  {
    id: 1,
    title: 'Increase Customer Retention Rate',
    description: 'Improve customer retention from 75% to 90% within Q2',
    status: 'Active' as OutcomeStatus,
    progress: 65,
    metrics: null,
    cascade_alignment: ['WinningAspiration', 'HowToWin'] as CascadeAlignment[],
    level: 'Org' as OutcomeLevel,
    parent_outcome_id: null,
    created_at: '2024-01-15T10:00:00Z',
    updated_at: null,
    experimentCount: 3,
  },
  {
    id: 2,
    title: 'Reduce Onboarding Time by 40%',
    description: 'Streamline the user onboarding process',
    status: 'Active' as OutcomeStatus,
    progress: 42,
    metrics: null,
    cascade_alignment: ['Capabilities', 'ManagementSystems'] as CascadeAlignment[],
    level: 'Departmental' as OutcomeLevel,
    parent_outcome_id: 1,
    created_at: '2024-01-20T14:30:00Z',
    updated_at: null,
    experimentCount: 5,
  },
  {
    id: 3,
    title: 'Launch Premium Tier',
    description: 'Develop and launch a premium subscription offering',
    status: 'Stalled' as OutcomeStatus,
    progress: 28,
    metrics: null,
    cascade_alignment: ['WhereToPlay', 'HowToWin'] as CascadeAlignment[],
    level: 'Org' as OutcomeLevel,
    parent_outcome_id: null,
    created_at: '2024-02-01T09:00:00Z',
    updated_at: null,
    experimentCount: 2,
  },
  {
    id: 4,
    title: 'Expand to European Market',
    description: 'Establish presence in key European markets',
    status: 'Active' as OutcomeStatus,
    progress: 15,
    metrics: null,
    cascade_alignment: ['WhereToPlay'] as CascadeAlignment[],
    level: 'Org' as OutcomeLevel,
    parent_outcome_id: null,
    created_at: '2024-02-10T11:00:00Z',
    updated_at: null,
    experimentCount: 4,
  },
  {
    id: 5,
    title: 'Implement Self-Service Analytics',
    description: 'Enable customers to build their own dashboards',
    status: 'Completed' as OutcomeStatus,
    progress: 100,
    metrics: null,
    cascade_alignment: ['Capabilities', 'HowToWin'] as CascadeAlignment[],
    level: 'Departmental' as OutcomeLevel,
    parent_outcome_id: null,
    created_at: '2024-01-05T08:00:00Z',
    updated_at: '2024-02-28T16:00:00Z',
    experimentCount: 6,
  },
]

// Skeleton card component for loading state
function OutcomeCardSkeleton({ index }: { index: number }) {
  return (
    <div
      className="relative bg-white rounded-xl border border-slate-200 p-6 animate-pulse"
      style={{ animationDelay: `${index * 75}ms` }}
    >
      {/* Title skeleton */}
      <div className="h-5 bg-slate-200 rounded w-3/4 mb-4" />

      {/* Badges skeleton */}
      <div className="flex gap-2 mb-4">
        <div className="h-5 bg-slate-200 rounded-full w-16" />
        <div className="h-5 bg-slate-200 rounded-full w-20" />
      </div>

      {/* Progress skeleton */}
      <div className="mb-4">
        <div className="flex justify-between mb-2">
          <div className="h-3 bg-slate-200 rounded w-16" />
          <div className="h-3 bg-slate-200 rounded w-8" />
        </div>
        <div className="h-2 bg-slate-200 rounded-full" />
      </div>

      {/* Tags skeleton */}
      <div className="flex gap-1.5 mb-4">
        <div className="h-5 bg-slate-100 rounded w-24" />
        <div className="h-5 bg-slate-100 rounded w-20" />
      </div>

      {/* Footer skeleton */}
      <div className="h-4 bg-slate-100 rounded w-24" />
    </div>
  )
}

// Outcome type for the card
interface OutcomeCardData {
  id: number
  title: string
  description: string | null
  status: OutcomeStatus
  progress: number
  cascade_alignment: CascadeAlignment[]
  level: OutcomeLevel
  experimentCount: number
}

// Outcome card component
interface OutcomeCardProps {
  outcome: OutcomeCardData
  index: number
}

function OutcomeCard({ outcome, index }: OutcomeCardProps) {
  const progressColor = outcome.progress >= 75 ? 'success' : outcome.progress >= 40 ? 'info' : 'default'

  return (
    <Link
      to={`/outcomes/${outcome.id}`}
      className={cn(
        "group relative bg-white rounded-xl border border-slate-200 p-6",
        "transition-all duration-200 ease-out",
        "hover:border-slate-300 hover:shadow-lg hover:shadow-slate-200/50",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2",
        "animate-in fade-in slide-in-from-bottom-2"
      )}
      style={{ animationDelay: `${index * 50}ms`, animationFillMode: 'backwards' }}
    >
      {/* Subtle hover indicator */}
      <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-slate-400 to-slate-600 rounded-t-xl opacity-0 group-hover:opacity-100 transition-opacity" />

      {/* Title */}
      <h3 className="text-base font-semibold text-slate-900 mb-3 group-hover:text-slate-700 transition-colors line-clamp-2">
        {outcome.title}
      </h3>

      {/* Status and Level badges */}
      <div className="flex flex-wrap gap-2 mb-4">
        <StatusBadge status={outcome.status as Status} />
        <span className={cn(
          "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
          levelStyles[outcome.level]
        )}>
          {outcome.level}
        </span>
      </div>

      {/* Progress */}
      <div className="mb-4">
        <div className="flex justify-between items-center mb-1.5">
          <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">Progress</span>
          <span className="text-sm font-semibold text-slate-700">{outcome.progress}%</span>
        </div>
        <ProgressBar value={outcome.progress} size="sm" color={progressColor} />
      </div>

      {/* Cascade alignment tags */}
      {outcome.cascade_alignment.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-4">
          {outcome.cascade_alignment.slice(0, 2).map((alignment) => (
            <span
              key={alignment}
              className="inline-flex items-center rounded-md bg-slate-50 px-2 py-0.5 text-xs text-slate-600 border border-slate-100"
            >
              {cascadeLabels[alignment]}
            </span>
          ))}
          {outcome.cascade_alignment.length > 2 && (
            <span className="inline-flex items-center rounded-md bg-slate-50 px-2 py-0.5 text-xs text-slate-500 border border-slate-100">
              +{outcome.cascade_alignment.length - 2} more
            </span>
          )}
        </div>
      )}

      {/* Experiment count */}
      <div className="flex items-center gap-1.5 text-slate-500">
        <FlaskConical className="size-3.5" />
        <span className="text-sm">
          {outcome.experimentCount} experiment{outcome.experimentCount !== 1 ? 's' : ''}
        </span>
      </div>
    </Link>
  )
}

// Empty state component
function EmptyState({ hasFilters, onClearFilters }: { hasFilters: boolean; onClearFilters: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6">
      <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-6">
        <Target className="size-8 text-slate-400" />
      </div>

      {hasFilters ? (
        <>
          <h3 className="text-lg font-semibold text-slate-900 mb-2">No outcomes found</h3>
          <p className="text-slate-500 text-center max-w-sm mb-6">
            No outcomes match your current filters. Try adjusting your search or filter criteria.
          </p>
          <Button variant="outline" onClick={onClearFilters}>
            <X className="size-4" />
            Clear all filters
          </Button>
        </>
      ) : (
        <>
          <h3 className="text-lg font-semibold text-slate-900 mb-2">Get started with your first outcome</h3>
          <p className="text-slate-500 text-center max-w-sm mb-6">
            Outcomes define what you want to achieve. Create your first one to start tracking progress.
          </p>
          <Dialog>
            <DialogTrigger asChild>
              <Button>
                <Plus className="size-4" />
                Create Outcome
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Outcome</DialogTitle>
                <DialogDescription>
                  Define a measurable outcome to track. This will be the foundation for your experiments.
                </DialogDescription>
              </DialogHeader>
              <div className="py-8 text-center text-slate-500">
                Outcome creation form coming soon...
              </div>
            </DialogContent>
          </Dialog>
        </>
      )}
    </div>
  )
}

export default function Dashboard() {
  // Filter state
  const [statusFilter, setStatusFilter] = useState<OutcomeStatus | 'all'>('all')
  const [levelFilter, setLevelFilter] = useState<OutcomeLevel | 'all'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [showFilters, setShowFilters] = useState(false)

  // Fetch outcomes from the hook
  const { outcomes: fetchedOutcomes, isLoading, error } = useOutcomes({
    status: statusFilter !== 'all' ? statusFilter : undefined,
    level: levelFilter !== 'all' ? levelFilter : undefined,
  })

  // Use mock data if no outcomes fetched (Supabase not configured)
  const baseOutcomes = fetchedOutcomes.length > 0
    ? fetchedOutcomes.map(o => ({ ...o, experimentCount: Math.floor(Math.random() * 8) + 1 }))
    : mockOutcomes

  // Apply local search filter
  const filteredOutcomes = useMemo(() => {
    let results = baseOutcomes

    // Apply status filter (for mock data)
    if (statusFilter !== 'all' && fetchedOutcomes.length === 0) {
      results = results.filter(o => o.status === statusFilter)
    }

    // Apply level filter (for mock data)
    if (levelFilter !== 'all' && fetchedOutcomes.length === 0) {
      results = results.filter(o => o.level === levelFilter)
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      results = results.filter(o =>
        o.title.toLowerCase().includes(query) ||
        (o.description && o.description.toLowerCase().includes(query))
      )
    }

    return results
  }, [baseOutcomes, statusFilter, levelFilter, searchQuery, fetchedOutcomes.length])

  // Calculate stats
  const stats = useMemo(() => {
    const total = baseOutcomes.length
    const active = baseOutcomes.filter(o => o.status === 'Active').length
    const stalled = baseOutcomes.filter(o => o.status === 'Stalled').length
    const completed = baseOutcomes.filter(o => o.status === 'Completed').length
    return { total, active, stalled, completed }
  }, [baseOutcomes])

  // Check if any filters are active
  const hasActiveFilters = statusFilter !== 'all' || levelFilter !== 'all' || searchQuery.trim() !== ''

  // Clear all filters
  const clearFilters = () => {
    setStatusFilter('all')
    setLevelFilter('all')
    setSearchQuery('')
  }

  return (
    <div className="min-h-screen">
      {/* Page Header */}
      <header className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Outcomes Dashboard
            </h1>
            <p className="mt-1 text-slate-500">
              {stats.total} outcome{stats.total !== 1 ? 's' : ''}
              {stats.active > 0 && <span className="text-slate-400"> &middot; </span>}
              {stats.active > 0 && <span className="text-blue-600">{stats.active} active</span>}
              {stats.stalled > 0 && <span className="text-slate-400"> &middot; </span>}
              {stats.stalled > 0 && <span className="text-amber-600">{stats.stalled} stalled</span>}
              {stats.completed > 0 && <span className="text-slate-400"> &middot; </span>}
              {stats.completed > 0 && <span className="text-green-600">{stats.completed} completed</span>}
            </p>
          </div>

          <Dialog>
            <DialogTrigger asChild>
              <Button className="shrink-0">
                <Plus className="size-4" />
                New Outcome
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Outcome</DialogTitle>
                <DialogDescription>
                  Define a measurable outcome to track. This will be the foundation for your experiments.
                </DialogDescription>
              </DialogHeader>
              <div className="py-8 text-center text-slate-500">
                Outcome creation form coming soon...
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      {/* Filter Bar */}
      <div className="mb-6 space-y-4">
        {/* Search and filter toggle */}
        <div className="flex gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
            <Input
              type="text"
              placeholder="Search outcomes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="size-4" />
              </button>
            )}
          </div>

          <Button
            variant={showFilters ? 'secondary' : 'outline'}
            onClick={() => setShowFilters(!showFilters)}
            className={cn(hasActiveFilters && !showFilters && "border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100")}
          >
            <SlidersHorizontal className="size-4" />
            <span className="hidden sm:inline">Filters</span>
            {hasActiveFilters && (
              <span className="ml-1.5 flex size-5 items-center justify-center rounded-full bg-blue-600 text-xs text-white">
                {(statusFilter !== 'all' ? 1 : 0) + (levelFilter !== 'all' ? 1 : 0)}
              </span>
            )}
          </Button>
        </div>

        {/* Filter dropdowns */}
        {showFilters && (
          <div className="flex flex-wrap items-center gap-3 p-4 bg-slate-50 rounded-lg border border-slate-100 animate-in fade-in slide-in-from-top-1 duration-200">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-slate-600">Status</label>
              <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as OutcomeStatus | 'all')}>
                <SelectTrigger className="w-32 bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Stalled">Stalled</SelectItem>
                  <SelectItem value="Completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-slate-600">Level</label>
              <Select value={levelFilter} onValueChange={(v) => setLevelFilter(v as OutcomeLevel | 'all')}>
                <SelectTrigger className="w-36 bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="Org">Organization</SelectItem>
                  <SelectItem value="Departmental">Departmental</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters} className="text-slate-500 hover:text-slate-700">
                <X className="size-3.5" />
                Clear filters
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Content */}
      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
          <p className="text-red-700">Failed to load outcomes. Please try again.</p>
          <p className="text-sm text-red-500 mt-1">{error.message}</p>
        </div>
      ) : isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <OutcomeCardSkeleton key={i} index={i} />
          ))}
        </div>
      ) : filteredOutcomes.length === 0 ? (
        <EmptyState hasFilters={hasActiveFilters} onClearFilters={clearFilters} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredOutcomes.map((outcome, index) => (
            <OutcomeCard key={outcome.id} outcome={outcome} index={index} />
          ))}
        </div>
      )}
    </div>
  )
}
