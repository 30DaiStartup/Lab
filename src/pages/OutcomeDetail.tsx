import { useState, useCallback } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  ChevronDown,
  ChevronRight,
  Edit3,
  Trash2,
  Plus,
  Sparkles,
  Clock,
  Users,
  FlaskConical,
  FileText,
  Lightbulb,
  Check,
  X,
  AlertCircle,
  RefreshCw,
} from 'lucide-react'
import { useOutcome, useOutcomeMutations } from '@/hooks/useOutcomes'
import { useRaci } from '@/hooks/useRaci'
import { useAnalysis, type CurrentStateData, type SolutionsData } from '@/hooks/useAnalysis'
import type { OutcomeStatus, OutcomeLevel, CascadeAlignment, RaciRole } from '@/types/database'
import { StatusBadge, type Status } from '@/components/StatusBadge'
import { ProgressBar } from '@/components/ProgressBar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'

// ============================================================================
// Constants and Mock Data
// ============================================================================

const cascadeLabels: Record<CascadeAlignment, string> = {
  WinningAspiration: 'Winning Aspiration',
  WhereToPlay: 'Where to Play',
  HowToWin: 'How to Win',
  Capabilities: 'Capabilities',
  ManagementSystems: 'Management Systems',
}

const cascadeColors: Record<CascadeAlignment, string> = {
  WinningAspiration: 'bg-amber-50 text-amber-700 border-amber-200',
  WhereToPlay: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  HowToWin: 'bg-blue-50 text-blue-700 border-blue-200',
  Capabilities: 'bg-violet-50 text-violet-700 border-violet-200',
  ManagementSystems: 'bg-slate-100 text-slate-700 border-slate-200',
}

const levelStyles: Record<OutcomeLevel, { bg: string; text: string; border: string }> = {
  Org: { bg: 'bg-slate-800', text: 'text-white', border: 'border-slate-800' },
  Departmental: { bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-200' },
}

const statusOptions: OutcomeStatus[] = ['Active', 'Stalled', 'Completed']

const raciRoleLabels: Record<RaciRole, { label: string; short: string; color: string }> = {
  Responsible: { label: 'Responsible', short: 'R', color: 'bg-blue-500 text-white' },
  Accountable: { label: 'Accountable', short: 'A', color: 'bg-amber-500 text-white' },
  Support: { label: 'Support', short: 'S', color: 'bg-emerald-500 text-white' },
  Consulted: { label: 'Consulted', short: 'C', color: 'bg-violet-500 text-white' },
  Informed: { label: 'Informed', short: 'I', color: 'bg-slate-400 text-white' },
}

// Mock data for demonstration
const mockOutcome = {
  id: 1,
  title: 'Increase Customer Retention Rate',
  description: 'Improve customer retention from 75% to 90% within Q2 by implementing personalized engagement strategies and reducing churn triggers. This outcome aligns with our core business objective of sustainable growth through customer loyalty.',
  status: 'Active' as OutcomeStatus,
  progress: 65,
  metrics: null,
  cascade_alignment: ['WinningAspiration', 'HowToWin'] as CascadeAlignment[],
  level: 'Org' as OutcomeLevel,
  parent_outcome_id: null,
  created_at: '2024-01-15T10:00:00Z',
  updated_at: '2024-02-20T14:30:00Z',
  experiments: [
    {
      id: 1,
      outcome_id: 1,
      title: 'Personalized Email Campaign A/B Test',
      status: 'InProgress' as const,
      progress: 72,
      inputs: null,
      scope: null,
      spec: null,
      created_at: '2024-01-20T09:00:00Z',
      updated_at: null,
      taskCount: 8,
    },
    {
      id: 2,
      outcome_id: 1,
      title: 'Churn Prediction Model Integration',
      status: 'Backlog' as const,
      progress: 15,
      inputs: null,
      scope: null,
      spec: null,
      created_at: '2024-02-01T11:00:00Z',
      updated_at: null,
      taskCount: 12,
    },
    {
      id: 3,
      outcome_id: 1,
      title: 'Customer Success Touchpoint Optimization',
      status: 'Done' as const,
      progress: 100,
      inputs: null,
      scope: null,
      spec: null,
      created_at: '2024-01-18T15:00:00Z',
      updated_at: '2024-02-15T16:00:00Z',
      taskCount: 5,
    },
  ],
}

const mockRaciAssignments = [
  { id: 1, role: 'Responsible' as RaciRole, userId: 101, userName: 'Sarah Chen' },
  { id: 2, role: 'Accountable' as RaciRole, userId: 102, userName: 'Michael Torres' },
  { id: 3, role: 'Consulted' as RaciRole, userId: 103, userName: 'Emily Johnson' },
  { id: 4, role: 'Consulted' as RaciRole, userId: 104, userName: 'David Kim' },
  { id: 5, role: 'Informed' as RaciRole, userId: 105, userName: 'Lisa Wang' },
]

const mockAnalysis: { currentState: CurrentStateData; solutions: SolutionsData } = {
  currentState: {
    summary: 'Customer retention currently sits at 75%, below industry benchmark of 85%. Key churn indicators show 40% of departures occur within the first 90 days.',
    problems: [
      { id: '1', description: 'Onboarding experience lacks personalization', severity: 'high', impact: 'Early churn spike in first 30 days' },
      { id: '2', description: 'Limited proactive engagement touchpoints', severity: 'medium', impact: 'Customers feel neglected between purchases' },
      { id: '3', description: 'No early warning system for at-risk customers', severity: 'high', impact: 'Reactive rather than preventive approach' },
    ],
    metrics: [
      { name: 'Current Retention Rate', currentValue: '75%', targetValue: '90%' },
      { name: 'Avg Customer Lifetime', currentValue: '14 months', targetValue: '24 months' },
      { name: 'NPS Score', currentValue: 32, targetValue: 50 },
    ],
    analyzedAt: '2024-02-10T09:00:00Z',
  },
  solutions: {
    quickWins: [
      { id: 'qw1', title: 'Implement 30-day check-in emails', description: 'Automated personalized check-ins at day 7, 14, and 30', effort: 'low', impact: 'medium', status: 'in_progress' },
      { id: 'qw2', title: 'Add in-app feedback prompts', description: 'Contextual feedback collection to identify issues early', effort: 'low', impact: 'medium', status: 'proposed' },
    ],
    systemicFixes: [
      { id: 'sf1', title: 'Build churn prediction model', description: 'ML-based early warning system using behavioral signals', effort: 'high', impact: 'high', status: 'approved' },
      { id: 'sf2', title: 'Redesign onboarding flow', description: 'Personalized onboarding paths based on user segment', effort: 'high', impact: 'high', status: 'proposed' },
    ],
    strategySummary: 'Combine quick engagement wins with foundational infrastructure improvements for sustainable retention growth.',
    analyzedAt: '2024-02-12T14:00:00Z',
  },
}

// ============================================================================
// Utility Functions
// ============================================================================

function formatDate(dateString: string | null): string {
  if (!dateString) return 'N/A'
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function formatDateTime(dateString: string | null): string {
  if (!dateString) return 'N/A'
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

// ============================================================================
// Skeleton Components
// ============================================================================

function HeaderSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="flex items-center gap-2 mb-6">
        <div className="h-4 bg-slate-200 rounded w-20" />
        <div className="h-4 bg-slate-200 rounded w-4" />
        <div className="h-4 bg-slate-200 rounded w-32" />
      </div>
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
        <div className="space-y-3">
          <div className="h-8 bg-slate-200 rounded w-80" />
          <div className="flex gap-2">
            <div className="h-6 bg-slate-200 rounded-full w-20" />
            <div className="h-6 bg-slate-200 rounded-full w-24" />
          </div>
        </div>
        <div className="flex gap-2">
          <div className="h-9 bg-slate-200 rounded w-20" />
          <div className="h-9 bg-slate-200 rounded w-20" />
        </div>
      </div>
    </div>
  )
}

function OverviewSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="h-20 bg-slate-100 rounded-xl" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 bg-slate-100 rounded-xl" />
        ))}
      </div>
    </div>
  )
}

function SectionSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="h-6 bg-slate-200 rounded w-32 mb-4" />
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-16 bg-slate-100 rounded-xl" />
        ))}
      </div>
    </div>
  )
}

// ============================================================================
// Sub-Components
// ============================================================================

interface EditableTitleProps {
  title: string
  onSave: (newTitle: string) => void
  isUpdating: boolean
}

function EditableTitle({ title, onSave, isUpdating }: EditableTitleProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState(title)

  const handleSave = () => {
    if (editValue.trim() && editValue !== title) {
      onSave(editValue.trim())
    }
    setIsEditing(false)
  }

  const handleCancel = () => {
    setEditValue(title)
    setIsEditing(false)
  }

  if (isEditing) {
    return (
      <div className="flex items-center gap-2">
        <Input
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          className="text-2xl font-bold h-auto py-1 px-2"
          autoFocus
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSave()
            if (e.key === 'Escape') handleCancel()
          }}
        />
        <Button
          size="icon-sm"
          variant="ghost"
          onClick={handleSave}
          disabled={isUpdating}
          className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
        >
          <Check className="size-4" />
        </Button>
        <Button
          size="icon-sm"
          variant="ghost"
          onClick={handleCancel}
          className="text-slate-400 hover:text-slate-600"
        >
          <X className="size-4" />
        </Button>
      </div>
    )
  }

  return (
    <button
      onClick={() => setIsEditing(true)}
      className="group flex items-center gap-2 text-left"
    >
      <h1 className="text-2xl lg:text-3xl font-bold text-slate-900 tracking-tight">
        {title}
      </h1>
      <Edit3 className="size-4 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />
    </button>
  )
}

interface StatusDropdownProps {
  currentStatus: OutcomeStatus
  onStatusChange: (status: OutcomeStatus) => void
  isUpdating: boolean
}

function StatusDropdown({ currentStatus, onStatusChange, isUpdating }: StatusDropdownProps) {
  return (
    <Select
      value={currentStatus}
      onValueChange={(value) => onStatusChange(value as OutcomeStatus)}
      disabled={isUpdating}
    >
      <SelectTrigger className="w-auto h-auto p-0 border-0 shadow-none bg-transparent focus:ring-0">
        <StatusBadge
          status={currentStatus as Status}
          className="cursor-pointer hover:opacity-80 transition-opacity"
        />
      </SelectTrigger>
      <SelectContent>
        {statusOptions.map((status) => (
          <SelectItem key={status} value={status}>
            <StatusBadge status={status as Status} />
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

interface ExperimentWithTaskCount {
  id: number
  outcome_id: number
  title: string
  status: 'Backlog' | 'InProgress' | 'Done'
  progress: number
  inputs: Record<string, unknown> | null
  scope: Record<string, unknown> | null
  spec: string | null
  created_at: string
  updated_at: string | null
  taskCount?: number
}

interface ExperimentCardProps {
  experiment: ExperimentWithTaskCount
  index: number
}

function ExperimentCard({ experiment, index }: ExperimentCardProps) {
  const progressColor = experiment.progress >= 75 ? 'success' : experiment.progress >= 40 ? 'info' : 'default'

  return (
    <Link
      to={`/experiments/${experiment.id}`}
      className={cn(
        "group block bg-white rounded-xl border border-slate-200 p-5",
        "transition-all duration-200 ease-out",
        "hover:border-slate-300 hover:shadow-lg hover:shadow-slate-100/80",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2",
        "animate-in fade-in slide-in-from-bottom-2"
      )}
      style={{ animationDelay: `${index * 50}ms`, animationFillMode: 'backwards' }}
    >
      <div className="flex items-start justify-between mb-3">
        <h4 className="font-semibold text-slate-800 group-hover:text-slate-900 line-clamp-2 pr-2">
          {experiment.title}
        </h4>
        <ChevronRight className="size-4 text-slate-300 group-hover:text-slate-500 shrink-0 transition-colors" />
      </div>

      <div className="flex items-center gap-2 mb-4">
        <StatusBadge status={experiment.status as Status} />
        {experiment.taskCount !== undefined && (
          <span className="text-xs text-slate-500">
            {experiment.taskCount} task{experiment.taskCount !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      <div>
        <div className="flex justify-between items-center mb-1.5">
          <span className="text-xs text-slate-500">Progress</span>
          <span className="text-sm font-medium text-slate-700">{experiment.progress}%</span>
        </div>
        <ProgressBar value={experiment.progress} size="sm" color={progressColor} />
      </div>
    </Link>
  )
}

interface RaciTableProps {
  assignments: typeof mockRaciAssignments
}

function RaciTable({ assignments }: RaciTableProps) {
  const groupedByRole = assignments.reduce((acc, assignment) => {
    if (!acc[assignment.role]) acc[assignment.role] = []
    acc[assignment.role].push(assignment)
    return acc
  }, {} as Record<RaciRole, typeof assignments>)

  const roleOrder: RaciRole[] = ['Responsible', 'Accountable', 'Support', 'Consulted', 'Informed']

  return (
    <div className="space-y-3">
      {roleOrder.map((role) => {
        const roleAssignments = groupedByRole[role] || []
        if (roleAssignments.length === 0) return null

        const { label, short, color } = raciRoleLabels[role]

        return (
          <div
            key={role}
            className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg"
          >
            <div
              className={cn(
                "w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold shrink-0",
                color
              )}
            >
              {short}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium text-slate-700">{label}</div>
              <div className="text-sm text-slate-500 truncate">
                {roleAssignments.map((a) => a.userName).join(', ')}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

interface AnalysisSectionProps {
  currentState: CurrentStateData | null
  solutions: SolutionsData | null
  isLoading: boolean
}

function AnalysisSection({ currentState, solutions, isLoading }: AnalysisSectionProps) {
  const [isExpanded, setIsExpanded] = useState(true)

  if (isLoading) {
    return <SectionSkeleton />
  }

  const hasAnalysis = currentState || solutions

  return (
    <div className="space-y-4">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-2 w-full text-left"
      >
        <ChevronDown
          className={cn(
            "size-5 text-slate-400 transition-transform duration-200",
            !isExpanded && "-rotate-90"
          )}
        />
        <h3 className="text-lg font-semibold text-slate-800">Analysis</h3>
        {!hasAnalysis && (
          <Badge variant="secondary" className="ml-2 text-xs">Not generated</Badge>
        )}
      </button>

      {isExpanded && (
        <div className="animate-in fade-in slide-in-from-top-2 duration-200">
          {!hasAnalysis ? (
            <Card className="border-dashed border-slate-300 bg-slate-50/50">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
                  <Sparkles className="size-7 text-slate-400" />
                </div>
                <h4 className="font-semibold text-slate-700 mb-1">No analysis yet</h4>
                <p className="text-sm text-slate-500 text-center max-w-sm mb-4">
                  Generate AI-powered analysis to understand the current state and discover solutions.
                </p>
                <Button variant="outline" className="gap-2">
                  <Sparkles className="size-4" />
                  Generate Analysis
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Tabs defaultValue="current-state" className="w-full">
              <TabsList variant="line" className="mb-4">
                <TabsTrigger value="current-state" className="gap-2">
                  <FileText className="size-4" />
                  Current State
                </TabsTrigger>
                <TabsTrigger value="solutions" className="gap-2">
                  <Lightbulb className="size-4" />
                  Solutions
                </TabsTrigger>
              </TabsList>

              <TabsContent value="current-state" className="space-y-4">
                {currentState?.summary && (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">Summary</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-slate-600 leading-relaxed">{currentState.summary}</p>
                    </CardContent>
                  </Card>
                )}

                {currentState?.problems && currentState.problems.length > 0 && (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">Identified Problems</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {currentState.problems.map((problem) => (
                        <div
                          key={problem.id}
                          className="flex gap-3 p-3 bg-slate-50 rounded-lg"
                        >
                          <AlertCircle
                            className={cn(
                              "size-5 shrink-0 mt-0.5",
                              problem.severity === 'critical' && 'text-red-500',
                              problem.severity === 'high' && 'text-amber-500',
                              problem.severity === 'medium' && 'text-yellow-500',
                              problem.severity === 'low' && 'text-slate-400'
                            )}
                          />
                          <div>
                            <p className="text-sm font-medium text-slate-800">{problem.description}</p>
                            {problem.impact && (
                              <p className="text-sm text-slate-500 mt-1">{problem.impact}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}

                {currentState?.metrics && currentState.metrics.length > 0 && (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">Key Metrics</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {currentState.metrics.map((metric, i) => (
                          <div key={i} className="text-center p-4 bg-slate-50 rounded-lg">
                            <div className="text-2xl font-bold text-slate-800">
                              {metric.currentValue}
                            </div>
                            <div className="text-sm text-slate-500 mt-1">{metric.name}</div>
                            {metric.targetValue && (
                              <div className="text-xs text-emerald-600 mt-1">
                                Target: {metric.targetValue}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="solutions" className="space-y-4">
                {solutions?.strategySummary && (
                  <Card className="bg-blue-50 border-blue-100">
                    <CardContent className="py-4">
                      <p className="text-blue-800 text-sm">{solutions.strategySummary}</p>
                    </CardContent>
                  </Card>
                )}

                {solutions?.quickWins && solutions.quickWins.length > 0 && (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500" />
                        Quick Wins
                      </CardTitle>
                      <CardDescription>Low effort, fast implementation</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {solutions.quickWins.map((solution) => (
                        <div
                          key={solution.id}
                          className="flex items-start gap-3 p-3 bg-emerald-50/50 border border-emerald-100 rounded-lg"
                        >
                          <div className="flex-1">
                            <p className="text-sm font-medium text-slate-800">{solution.title}</p>
                            <p className="text-sm text-slate-500 mt-0.5">{solution.description}</p>
                          </div>
                          {solution.status && (
                            <Badge variant="secondary" className="text-xs shrink-0">
                              {solution.status.replace('_', ' ')}
                            </Badge>
                          )}
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}

                {solutions?.systemicFixes && solutions.systemicFixes.length > 0 && (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-blue-500" />
                        Systemic Fixes
                      </CardTitle>
                      <CardDescription>Address root causes, longer implementation</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {solutions.systemicFixes.map((solution) => (
                        <div
                          key={solution.id}
                          className="flex items-start gap-3 p-3 bg-blue-50/50 border border-blue-100 rounded-lg"
                        >
                          <div className="flex-1">
                            <p className="text-sm font-medium text-slate-800">{solution.title}</p>
                            <p className="text-sm text-slate-500 mt-0.5">{solution.description}</p>
                          </div>
                          {solution.status && (
                            <Badge variant="secondary" className="text-xs shrink-0">
                              {solution.status.replace('_', ' ')}
                            </Badge>
                          )}
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            </Tabs>
          )}
        </div>
      )}
    </div>
  )
}

// ============================================================================
// Error State Component
// ============================================================================

interface ErrorStateProps {
  message: string
  onRetry: () => void
}

function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-red-100 flex items-center justify-center">
          <AlertCircle className="size-8 text-red-500" />
        </div>
        <h2 className="text-xl font-semibold text-slate-900 mb-2">Failed to load outcome</h2>
        <p className="text-slate-500 mb-6">{message}</p>
        <Button onClick={onRetry} className="gap-2">
          <RefreshCw className="size-4" />
          Try Again
        </Button>
      </div>
    </div>
  )
}

// ============================================================================
// Main Component
// ============================================================================

export default function OutcomeDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const outcomeId = id ? parseInt(id, 10) : null

  // Data hooks
  const { outcome: fetchedOutcome, isLoading, error, refetch } = useOutcome(outcomeId)
  const { updateOutcome, deleteOutcome, isUpdating, isDeleting } = useOutcomeMutations(refetch)
  const { assignmentsByRole, isLoading: isLoadingRaci } = useRaci(outcomeId ?? 0, 'Outcome')
  const { analysisData, isLoading: isLoadingAnalysis } = useAnalysis(outcomeId, 'Outcome')

  // Use mock data if no outcome fetched
  const outcome = fetchedOutcome || mockOutcome
  // Add taskCount to fetched experiments if not present, or use mock data
  const experiments: ExperimentWithTaskCount[] = outcome.experiments
    ? outcome.experiments.map((exp) => ({
        ...exp,
        taskCount: 'taskCount' in exp ? (exp as ExperimentWithTaskCount).taskCount : undefined,
      }))
    : mockOutcome.experiments
  const raciAssignments = assignmentsByRole?.Responsible?.length ? [] : mockRaciAssignments

  // Dialog states
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [experimentSort, setExperimentSort] = useState<'status' | 'progress'>('status')

  // Handlers
  const handleTitleUpdate = useCallback(async (newTitle: string) => {
    if (outcomeId) {
      await updateOutcome(outcomeId, { title: newTitle })
    }
  }, [outcomeId, updateOutcome])

  const handleStatusChange = useCallback(async (newStatus: OutcomeStatus) => {
    if (outcomeId) {
      await updateOutcome(outcomeId, { status: newStatus })
    }
  }, [outcomeId, updateOutcome])

  const handleDelete = useCallback(async () => {
    if (outcomeId) {
      await deleteOutcome(outcomeId)
      navigate('/')
    }
  }, [outcomeId, deleteOutcome, navigate])

  // Sorted experiments
  const sortedExperiments = [...experiments].sort((a, b) => {
    if (experimentSort === 'status') {
      const statusOrder = { InProgress: 0, Backlog: 1, Done: 2 }
      return (statusOrder[a.status] ?? 3) - (statusOrder[b.status] ?? 3)
    }
    return b.progress - a.progress
  })

  // Error state
  if (error) {
    return <ErrorState message={error.message} onRetry={refetch} />
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto space-y-8">
        <HeaderSkeleton />
        <OverviewSkeleton />
        <SectionSkeleton />
      </div>
    )
  }

  const progressColor = outcome.progress >= 75 ? 'success' : outcome.progress >= 40 ? 'info' : 'default'

  return (
    <div className="max-w-5xl mx-auto">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm mb-6">
        <Link to="/" className="text-slate-500 hover:text-slate-700 transition-colors">
          Dashboard
        </Link>
        <ChevronRight className="size-4 text-slate-300" />
        <span className="text-slate-900 font-medium truncate max-w-[200px]">
          {outcome.title}
        </span>
      </nav>

      {/* Page Header */}
      <header className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => navigate(-1)}
            className="text-slate-400 hover:text-slate-600"
          >
            <ArrowLeft className="size-4" />
          </Button>
          <EditableTitle
            title={outcome.title}
            onSave={handleTitleUpdate}
            isUpdating={isUpdating}
          />
        </div>

        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <StatusDropdown
              currentStatus={outcome.status}
              onStatusChange={handleStatusChange}
              isUpdating={isUpdating}
            />
            <span className={cn(
              "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium border",
              levelStyles[outcome.level].bg,
              levelStyles[outcome.level].text,
              levelStyles[outcome.level].border
            )}>
              {outcome.level === 'Org' ? 'Organization' : 'Departmental'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="gap-2">
              <Edit3 className="size-3.5" />
              Edit
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-2 text-red-600 hover:text-red-700 hover:bg-red-50 hover:border-red-200"
              onClick={() => setShowDeleteDialog(true)}
            >
              <Trash2 className="size-3.5" />
              Delete
            </Button>
          </div>
        </div>
      </header>

      {/* Overview Section */}
      <section className="mb-10">
        <Card className="overflow-hidden">
          <CardContent className="p-6 lg:p-8">
            {/* Description */}
            {outcome.description && (
              <p className="text-slate-600 leading-relaxed mb-6">
                {outcome.description}
              </p>
            )}

            {/* Progress */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-slate-700">Overall Progress</span>
                <span className="text-lg font-bold text-slate-900">{outcome.progress}%</span>
              </div>
              <ProgressBar value={outcome.progress} size="lg" color={progressColor} />
            </div>

            {/* Cascade Alignment Tags */}
            {outcome.cascade_alignment.length > 0 && (
              <div className="mb-6">
                <div className="text-sm font-medium text-slate-700 mb-2">Cascade Alignment</div>
                <div className="flex flex-wrap gap-2">
                  {outcome.cascade_alignment.map((alignment) => (
                    <span
                      key={alignment}
                      className={cn(
                        "inline-flex items-center rounded-full px-3 py-1 text-sm font-medium border",
                        cascadeColors[alignment]
                      )}
                    >
                      {cascadeLabels[alignment]}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Timestamps */}
            <div className="flex flex-wrap gap-x-6 gap-y-2 pt-4 border-t border-slate-100 text-sm text-slate-500">
              <div className="flex items-center gap-1.5">
                <Clock className="size-4" />
                <span>Created {formatDate(outcome.created_at)}</span>
              </div>
              {outcome.updated_at && (
                <div className="flex items-center gap-1.5">
                  <Clock className="size-4" />
                  <span>Updated {formatDateTime(outcome.updated_at)}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </section>

      {/* RACI Section */}
      <section className="mb-10">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Users className="size-5 text-slate-400" />
            <h3 className="text-lg font-semibold text-slate-800">RACI Assignments</h3>
          </div>
          <Button variant="outline" size="sm" className="gap-2">
            <Plus className="size-3.5" />
            Add Assignment
          </Button>
        </div>

        <Card>
          <CardContent className="p-5">
            {isLoadingRaci ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-14 bg-slate-100 rounded-lg animate-pulse" />
                ))}
              </div>
            ) : raciAssignments.length > 0 ? (
              <RaciTable assignments={raciAssignments} />
            ) : (
              <div className="text-center py-8">
                <Users className="size-10 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500 mb-3">No assignments yet</p>
                <Button variant="outline" size="sm" className="gap-2">
                  <Plus className="size-3.5" />
                  Add First Assignment
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      {/* Experiments Section */}
      <section className="mb-10">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <FlaskConical className="size-5 text-slate-400" />
            <h3 className="text-lg font-semibold text-slate-800">
              Experiments
              <span className="text-slate-400 font-normal ml-2">({experiments.length})</span>
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <Select value={experimentSort} onValueChange={(v) => setExperimentSort(v as 'status' | 'progress')}>
              <SelectTrigger className="w-32 h-8 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="status">By Status</SelectItem>
                <SelectItem value="progress">By Progress</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" className="gap-2">
              <Plus className="size-3.5" />
              Add Experiment
            </Button>
          </div>
        </div>

        {experiments.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sortedExperiments.map((experiment, index) => (
              <ExperimentCard key={experiment.id} experiment={experiment} index={index} />
            ))}
          </div>
        ) : (
          <Card className="border-dashed border-slate-300 bg-slate-50/50">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
                <FlaskConical className="size-7 text-slate-400" />
              </div>
              <h4 className="font-semibold text-slate-700 mb-1">No experiments yet</h4>
              <p className="text-sm text-slate-500 text-center max-w-sm mb-4">
                Create experiments to test hypotheses and validate solutions for this outcome.
              </p>
              <Button variant="outline" className="gap-2">
                <Plus className="size-4" />
                Create First Experiment
              </Button>
            </CardContent>
          </Card>
        )}
      </section>

      {/* Analysis Section */}
      <section className="mb-10">
        <AnalysisSection
          currentState={analysisData?.currentState || mockAnalysis.currentState}
          solutions={analysisData?.solutions || mockAnalysis.solutions}
          isLoading={isLoadingAnalysis}
        />
      </section>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Outcome</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{outcome.title}"? This action cannot be undone and will also remove all associated experiments.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
              className="gap-2"
            >
              {isDeleting ? (
                <>
                  <RefreshCw className="size-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="size-4" />
                  Delete Outcome
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
