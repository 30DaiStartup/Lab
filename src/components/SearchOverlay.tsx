import * as React from 'react'
import { useNavigate } from 'react-router-dom'
import { Dialog as DialogPrimitive } from 'radix-ui'
import {
  SearchIcon,
  TargetIcon,
  FlaskConicalIcon,
  ListTodoIcon,
  ClockIcon,
  XIcon,
  CornerDownLeftIcon
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useOutcomesContext } from '@/contexts/OutcomesContext'
import { useExperimentsContext } from '@/contexts/ExperimentsContext'
import type { Database } from '@/types/database'

type Outcome = Database['public']['Tables']['outcomes']['Row']
type Experiment = Database['public']['Tables']['experiments']['Row']

/** Search result types */
type SearchResultType = 'outcome' | 'experiment' | 'task'

interface SearchResult {
  id: number
  title: string
  description?: string | null
  type: SearchResultType
  status: string
  path: string
}

interface SearchOverlayProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const RECENT_SEARCHES_KEY = 'aurora-lab-recent-searches'
const MAX_RECENT_SEARCHES = 5

function getRecentSearches(): string[] {
  try {
    const stored = localStorage.getItem(RECENT_SEARCHES_KEY)
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

function addRecentSearch(query: string): void {
  if (!query.trim()) return
  try {
    const recent = getRecentSearches()
    const filtered = recent.filter(s => s.toLowerCase() !== query.toLowerCase())
    const updated = [query, ...filtered].slice(0, MAX_RECENT_SEARCHES)
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated))
  } catch {
    // Ignore localStorage errors
  }
}

function getTypeIcon(type: SearchResultType) {
  switch (type) {
    case 'outcome':
      return <TargetIcon className="size-4" />
    case 'experiment':
      return <FlaskConicalIcon className="size-4" />
    case 'task':
      return <ListTodoIcon className="size-4" />
  }
}

function getTypeLabel(type: SearchResultType) {
  switch (type) {
    case 'outcome':
      return 'Outcome'
    case 'experiment':
      return 'Experiment'
    case 'task':
      return 'Task'
  }
}

function getStatusColor(status: string) {
  switch (status) {
    case 'Active':
    case 'InProgress':
      return 'bg-blue-100 text-blue-700 border-blue-200'
    case 'Completed':
    case 'Done':
      return 'bg-emerald-100 text-emerald-700 border-emerald-200'
    case 'Stalled':
    case 'Backlog':
      return 'bg-amber-100 text-amber-700 border-amber-200'
    default:
      return 'bg-slate-100 text-slate-600 border-slate-200'
  }
}

export function SearchOverlay({ open, onOpenChange }: SearchOverlayProps) {
  const navigate = useNavigate()
  const [query, setQuery] = React.useState('')
  const [selectedIndex, setSelectedIndex] = React.useState(0)
  const [recentSearches, setRecentSearches] = React.useState<string[]>([])
  const inputRef = React.useRef<HTMLInputElement>(null)
  const listRef = React.useRef<HTMLDivElement>(null)

  // Get data from contexts
  const { outcomes } = useOutcomesContext()
  const { experiments } = useExperimentsContext()

  // Generate mock tasks based on experiments for search
  const mockTasks = React.useMemo(() => {
    return experiments.flatMap((exp) => [
      {
        id: exp.id * 100 + 1,
        experiment_id: exp.id,
        title: `Review ${exp.title} requirements`,
        status: 'InProgress' as const,
      },
      {
        id: exp.id * 100 + 2,
        experiment_id: exp.id,
        title: `Complete ${exp.title} analysis`,
        status: 'Backlog' as const,
      },
    ])
  }, [experiments])

  // Load recent searches on mount
  React.useEffect(() => {
    if (open) {
      setRecentSearches(getRecentSearches())
      setQuery('')
      setSelectedIndex(0)
    }
  }, [open])

  // Focus input when dialog opens
  React.useEffect(() => {
    if (open && inputRef.current) {
      // Small delay to ensure the dialog is rendered
      const timer = setTimeout(() => {
        inputRef.current?.focus()
      }, 50)
      return () => clearTimeout(timer)
    }
  }, [open])

  // Search logic
  const results = React.useMemo<SearchResult[]>(() => {
    if (!query.trim()) return []

    const searchTerm = query.toLowerCase()
    const matchedResults: SearchResult[] = []

    // Search outcomes
    outcomes.forEach((outcome: Outcome) => {
      if (
        outcome.title.toLowerCase().includes(searchTerm) ||
        outcome.description?.toLowerCase().includes(searchTerm)
      ) {
        matchedResults.push({
          id: outcome.id,
          title: outcome.title,
          description: outcome.description,
          type: 'outcome',
          status: outcome.status,
          path: `/outcomes/${outcome.id}`,
        })
      }
    })

    // Search experiments
    experiments.forEach((experiment: Experiment) => {
      if (experiment.title.toLowerCase().includes(searchTerm)) {
        matchedResults.push({
          id: experiment.id,
          title: experiment.title,
          description: null,
          type: 'experiment',
          status: experiment.status,
          path: `/experiments/${experiment.id}`,
        })
      }
    })

    // Search tasks
    mockTasks.forEach((task) => {
      if (task.title.toLowerCase().includes(searchTerm)) {
        matchedResults.push({
          id: task.id,
          title: task.title,
          description: null,
          type: 'task',
          status: task.status,
          path: `/experiments/${task.experiment_id}`,
        })
      }
    })

    return matchedResults
  }, [query, outcomes, experiments, mockTasks])

  // Group results by type
  const groupedResults = React.useMemo(() => {
    const groups: Record<SearchResultType, SearchResult[]> = {
      outcome: [],
      experiment: [],
      task: [],
    }
    results.forEach((result) => {
      groups[result.type].push(result)
    })
    return groups
  }, [results])

  // Flat list for keyboard navigation
  const flatResults = React.useMemo(() => {
    return [
      ...groupedResults.outcome,
      ...groupedResults.experiment,
      ...groupedResults.task,
    ]
  }, [groupedResults])

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex((prev) =>
          Math.min(prev + 1, flatResults.length - 1)
        )
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex((prev) => Math.max(prev - 1, 0))
        break
      case 'Enter':
        e.preventDefault()
        if (flatResults[selectedIndex]) {
          handleSelectResult(flatResults[selectedIndex])
        }
        break
      case 'Escape':
        e.preventDefault()
        onOpenChange(false)
        break
    }
  }

  // Scroll selected item into view
  React.useEffect(() => {
    if (listRef.current && flatResults.length > 0) {
      const selectedElement = listRef.current.querySelector(
        `[data-index="${selectedIndex}"]`
      )
      selectedElement?.scrollIntoView({ block: 'nearest' })
    }
  }, [selectedIndex, flatResults.length])

  // Reset selected index when results change
  React.useEffect(() => {
    setSelectedIndex(0)
  }, [query])

  const handleSelectResult = (result: SearchResult) => {
    addRecentSearch(query)
    navigate(result.path)
    onOpenChange(false)
  }

  const handleRecentSearchClick = (search: string) => {
    setQuery(search)
    inputRef.current?.focus()
  }

  const hasResults = flatResults.length > 0
  const showRecent = !query.trim() && recentSearches.length > 0
  const showNoResults = query.trim() && !hasResults

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay
          className={cn(
            "fixed inset-0 z-50",
            "bg-slate-950/60 backdrop-blur-sm",
            "data-[state=open]:animate-in data-[state=closed]:animate-out",
            "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
            "duration-200"
          )}
        />
        <DialogPrimitive.Content
          className={cn(
            "fixed left-1/2 top-[15%] z-50 -translate-x-1/2",
            "w-full max-w-2xl",
            "data-[state=open]:animate-in data-[state=closed]:animate-out",
            "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
            "data-[state=closed]:zoom-out-98 data-[state=open]:zoom-in-98",
            "data-[state=closed]:slide-out-to-top-2 data-[state=open]:slide-in-from-top-2",
            "duration-200"
          )}
          onKeyDown={handleKeyDown}
        >
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl shadow-slate-900/10">
            {/* Search Input */}
            <div className="flex items-center gap-3 border-b border-slate-100 px-4">
              <SearchIcon className="size-5 text-slate-400" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search outcomes, experiments, tasks..."
                className={cn(
                  "flex-1 py-4 text-base",
                  "bg-transparent outline-none",
                  "placeholder:text-slate-400"
                )}
              />
              {query && (
                <button
                  onClick={() => setQuery('')}
                  className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
                >
                  <XIcon className="size-4" />
                </button>
              )}
              <div className="flex items-center gap-1.5 rounded border border-slate-200 bg-slate-50 px-2 py-1">
                <span className="text-xs font-medium text-slate-500">esc</span>
              </div>
            </div>

            {/* Results or Recent Searches */}
            <div ref={listRef} className="max-h-[60vh] overflow-y-auto">
              {/* Recent Searches */}
              {showRecent && (
                <div className="p-2">
                  <div className="px-3 py-2 text-xs font-medium uppercase tracking-wider text-slate-400">
                    Recent Searches
                  </div>
                  <div className="space-y-0.5">
                    {recentSearches.map((search, index) => (
                      <button
                        key={index}
                        onClick={() => handleRecentSearchClick(search)}
                        className={cn(
                          "flex w-full items-center gap-3 rounded-lg px-3 py-2.5",
                          "text-left text-sm text-slate-600",
                          "hover:bg-slate-50 transition-colors"
                        )}
                      >
                        <ClockIcon className="size-4 text-slate-400" />
                        <span>{search}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Search Results */}
              {hasResults && (
                <div className="p-2">
                  {/* Outcomes */}
                  {groupedResults.outcome.length > 0 && (
                    <div className="mb-2">
                      <div className="px-3 py-2 text-xs font-medium uppercase tracking-wider text-slate-400">
                        Outcomes
                      </div>
                      <div className="space-y-0.5">
                        {groupedResults.outcome.map((result) => {
                          const globalIndex = flatResults.indexOf(result)
                          return (
                            <SearchResultItem
                              key={`${result.type}-${result.id}`}
                              result={result}
                              isSelected={selectedIndex === globalIndex}
                              dataIndex={globalIndex}
                              onClick={() => handleSelectResult(result)}
                            />
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {/* Experiments */}
                  {groupedResults.experiment.length > 0 && (
                    <div className="mb-2">
                      <div className="px-3 py-2 text-xs font-medium uppercase tracking-wider text-slate-400">
                        Experiments
                      </div>
                      <div className="space-y-0.5">
                        {groupedResults.experiment.map((result) => {
                          const globalIndex = flatResults.indexOf(result)
                          return (
                            <SearchResultItem
                              key={`${result.type}-${result.id}`}
                              result={result}
                              isSelected={selectedIndex === globalIndex}
                              dataIndex={globalIndex}
                              onClick={() => handleSelectResult(result)}
                            />
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {/* Tasks */}
                  {groupedResults.task.length > 0 && (
                    <div className="mb-2">
                      <div className="px-3 py-2 text-xs font-medium uppercase tracking-wider text-slate-400">
                        Tasks
                      </div>
                      <div className="space-y-0.5">
                        {groupedResults.task.map((result) => {
                          const globalIndex = flatResults.indexOf(result)
                          return (
                            <SearchResultItem
                              key={`${result.type}-${result.id}`}
                              result={result}
                              isSelected={selectedIndex === globalIndex}
                              dataIndex={globalIndex}
                              onClick={() => handleSelectResult(result)}
                            />
                          )
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* No Results */}
              {showNoResults && (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="mb-3 rounded-full bg-slate-100 p-3">
                    <SearchIcon className="size-6 text-slate-400" />
                  </div>
                  <p className="text-sm font-medium text-slate-600">No results found</p>
                  <p className="mt-1 text-sm text-slate-400">
                    Try searching with different keywords
                  </p>
                </div>
              )}

              {/* Empty State (no query, no recent) */}
              {!query.trim() && recentSearches.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="mb-3 rounded-full bg-slate-100 p-3">
                    <SearchIcon className="size-6 text-slate-400" />
                  </div>
                  <p className="text-sm font-medium text-slate-600">
                    Search across your workspace
                  </p>
                  <p className="mt-1 text-sm text-slate-400">
                    Find outcomes, experiments, and tasks
                  </p>
                </div>
              )}
            </div>

            {/* Footer with keyboard hints */}
            {hasResults && (
              <div className="flex items-center gap-4 border-t border-slate-100 bg-slate-50/50 px-4 py-2.5">
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <kbd className="inline-flex h-5 min-w-5 items-center justify-center rounded border border-slate-200 bg-white px-1.5 font-sans text-[10px] font-medium text-slate-500">
                    <span className="inline-block -translate-y-px">&#8593;</span>
                  </kbd>
                  <kbd className="inline-flex h-5 min-w-5 items-center justify-center rounded border border-slate-200 bg-white px-1.5 font-sans text-[10px] font-medium text-slate-500">
                    <span className="inline-block -translate-y-px">&#8595;</span>
                  </kbd>
                  <span>Navigate</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <kbd className="inline-flex h-5 items-center justify-center rounded border border-slate-200 bg-white px-1.5 font-sans text-[10px] font-medium text-slate-500">
                    <CornerDownLeftIcon className="size-3" />
                  </kbd>
                  <span>Select</span>
                </div>
              </div>
            )}
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}

interface SearchResultItemProps {
  result: SearchResult
  isSelected: boolean
  dataIndex: number
  onClick: () => void
}

function SearchResultItem({ result, isSelected, dataIndex, onClick }: SearchResultItemProps) {
  return (
    <button
      data-index={dataIndex}
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-3 rounded-lg px-3 py-2.5",
        "text-left transition-colors",
        isSelected
          ? "bg-slate-100"
          : "hover:bg-slate-50"
      )}
    >
      <div className={cn(
        "flex size-8 items-center justify-center rounded-lg",
        result.type === 'outcome' && "bg-indigo-50 text-indigo-600",
        result.type === 'experiment' && "bg-violet-50 text-violet-600",
        result.type === 'task' && "bg-sky-50 text-sky-600"
      )}>
        {getTypeIcon(result.type)}
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-medium text-slate-800">
          {result.title}
        </div>
        {result.description && (
          <div className="truncate text-xs text-slate-500">
            {result.description}
          </div>
        )}
      </div>
      <div className="flex items-center gap-2">
        <span className={cn(
          "rounded-full border px-2 py-0.5 text-xs font-medium",
          getStatusColor(result.status)
        )}>
          {result.status}
        </span>
        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">
          {getTypeLabel(result.type)}
        </span>
      </div>
      {isSelected && (
        <CornerDownLeftIcon className="size-4 text-slate-400" />
      )}
    </button>
  )
}

export default SearchOverlay
