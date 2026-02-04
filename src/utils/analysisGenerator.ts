/**
 * Mock Analysis Generator
 *
 * Generates realistic mock analysis data for outcomes and experiments.
 * This simulates AI-powered analysis for demonstration purposes.
 *
 * Includes:
 * - Current State analysis generation
 * - Two-Prong Solutions (Quick Wins + Systemic Fixes) generation
 */

import type { CurrentStateData, SolutionsData, SolutionItem } from '@/hooks/useAnalysis'

// ============================================================================
// Types
// ============================================================================

export interface OutcomeContext {
  id: number
  title: string
  description?: string | null
  status?: string
  progress?: number
}

export interface ExperimentContext {
  id: number
  title: string
  status?: string
  progress?: number
}

// ============================================================================
// Problem Templates
// ============================================================================

interface ProblemTemplate {
  keywords: string[]
  problems: Array<{
    description: string
    severity: 'critical' | 'high' | 'medium' | 'low'
    impact: string
  }>
}

const problemTemplates: ProblemTemplate[] = [
  // Retention-related outcomes
  {
    keywords: ['retention', 'churn', 'customer', 'loyalty', 'keep'],
    problems: [
      {
        description: 'High churn rate in first 30 days of customer lifecycle',
        severity: 'critical',
        impact: 'Significant revenue loss from early customer departures',
      },
      {
        description: 'Low engagement scores among at-risk customer segments',
        severity: 'high',
        impact: 'Customers disengage before value is demonstrated',
      },
      {
        description: 'Insufficient proactive outreach to struggling customers',
        severity: 'medium',
        impact: 'Reactive approach leads to late intervention',
      },
      {
        description: 'Lack of personalized retention strategies',
        severity: 'high',
        impact: 'One-size-fits-all approach fails to address individual needs',
      },
    ],
  },
  // Mobile app outcomes
  {
    keywords: ['mobile', 'app', 'ios', 'android', 'performance'],
    problems: [
      {
        description: 'Performance degradation on older devices',
        severity: 'high',
        impact: 'Poor user experience leading to app abandonment',
      },
      {
        description: 'Inconsistent UI/UX across platform versions',
        severity: 'medium',
        impact: 'User confusion and increased support tickets',
      },
      {
        description: 'Limited offline functionality',
        severity: 'medium',
        impact: 'Users unable to access features in low connectivity areas',
      },
      {
        description: 'User feedback gaps in crash reporting',
        severity: 'high',
        impact: 'Critical issues go undetected until widespread',
      },
    ],
  },
  // Growth and acquisition outcomes
  {
    keywords: ['growth', 'acquisition', 'user', 'signup', 'conversion'],
    problems: [
      {
        description: 'High friction in signup flow causing abandonment',
        severity: 'critical',
        impact: '40% of potential users drop off before completing registration',
      },
      {
        description: 'Unclear value proposition on landing pages',
        severity: 'high',
        impact: 'Low conversion rates from visitor to trial',
      },
      {
        description: 'Limited channel diversification for acquisition',
        severity: 'medium',
        impact: 'Over-reliance on single acquisition channel creates risk',
      },
      {
        description: 'Inconsistent tracking across acquisition funnels',
        severity: 'medium',
        impact: 'Attribution gaps make optimization difficult',
      },
    ],
  },
  // Efficiency and process outcomes
  {
    keywords: ['efficiency', 'process', 'workflow', 'automation', 'productivity'],
    problems: [
      {
        description: 'Manual processes consuming significant team time',
        severity: 'high',
        impact: 'Team capacity bottlenecked by repetitive tasks',
      },
      {
        description: 'Lack of standardized workflows across teams',
        severity: 'medium',
        impact: 'Inconsistent quality and longer training times',
      },
      {
        description: 'Insufficient tooling for common operations',
        severity: 'medium',
        impact: 'Teams using workarounds that introduce errors',
      },
      {
        description: 'Poor visibility into process bottlenecks',
        severity: 'high',
        impact: 'Unable to prioritize optimization efforts effectively',
      },
    ],
  },
  // Revenue and monetization outcomes
  {
    keywords: ['revenue', 'monetization', 'pricing', 'sales', 'upsell'],
    problems: [
      {
        description: 'Pricing model misaligned with customer value perception',
        severity: 'critical',
        impact: 'Lost revenue from underpriced premium features',
      },
      {
        description: 'Limited upsell opportunities identified and executed',
        severity: 'high',
        impact: 'Expansion revenue significantly below potential',
      },
      {
        description: 'Unclear upgrade paths for customers',
        severity: 'medium',
        impact: 'Customers unaware of available premium features',
      },
      {
        description: 'Inconsistent sales enablement materials',
        severity: 'medium',
        impact: 'Sales team struggles to communicate value',
      },
    ],
  },
]

// Generic problem templates (fallback)
const genericProblems = [
  {
    description: 'Insufficient data collection for informed decision-making',
    severity: 'high' as const,
    impact: 'Strategic decisions made without quantitative backing',
  },
  {
    description: 'Cross-team alignment challenges on priorities',
    severity: 'medium' as const,
    impact: 'Duplicated efforts and conflicting initiatives',
  },
  {
    description: 'Resource constraints limiting progress velocity',
    severity: 'high' as const,
    impact: 'Key initiatives delayed due to capacity limitations',
  },
  {
    description: 'Lack of clear success metrics and KPIs',
    severity: 'medium' as const,
    impact: 'Difficult to measure progress and demonstrate value',
  },
  {
    description: 'Communication gaps between stakeholder groups',
    severity: 'low' as const,
    impact: 'Misaligned expectations and delayed feedback loops',
  },
]

// ============================================================================
// Metric Templates
// ============================================================================

interface MetricTemplate {
  keywords: string[]
  metrics: Array<{
    name: string
    currentValue: string | number
    targetValue: string | number
    unit?: string
  }>
}

const metricTemplates: MetricTemplate[] = [
  {
    keywords: ['retention', 'churn', 'customer'],
    metrics: [
      { name: 'Retention Rate', currentValue: '72%', targetValue: '85%' },
      { name: 'Customer Lifetime Value', currentValue: '$840', targetValue: '$1,200' },
      { name: 'NPS Score', currentValue: 34, targetValue: 50 },
      { name: '30-Day Churn', currentValue: '18%', targetValue: '10%' },
    ],
  },
  {
    keywords: ['mobile', 'app', 'performance'],
    metrics: [
      { name: 'App Store Rating', currentValue: 3.8, targetValue: 4.5 },
      { name: 'Crash-Free Sessions', currentValue: '98.2%', targetValue: '99.5%' },
      { name: 'Average Load Time', currentValue: '2.4s', targetValue: '1.0s' },
      { name: 'Daily Active Users', currentValue: '45K', targetValue: '75K' },
    ],
  },
  {
    keywords: ['growth', 'acquisition', 'conversion'],
    metrics: [
      { name: 'Conversion Rate', currentValue: '2.8%', targetValue: '5%' },
      { name: 'Cost Per Acquisition', currentValue: '$48', targetValue: '$35' },
      { name: 'Monthly Signups', currentValue: '1,200', targetValue: '2,500' },
      { name: 'Activation Rate', currentValue: '45%', targetValue: '65%' },
    ],
  },
  {
    keywords: ['efficiency', 'process', 'productivity'],
    metrics: [
      { name: 'Process Cycle Time', currentValue: '5.2 days', targetValue: '2 days' },
      { name: 'Team Utilization', currentValue: '68%', targetValue: '85%' },
      { name: 'Error Rate', currentValue: '12%', targetValue: '3%' },
      { name: 'Automation Coverage', currentValue: '25%', targetValue: '70%' },
    ],
  },
  {
    keywords: ['revenue', 'sales', 'monetization'],
    metrics: [
      { name: 'MRR Growth', currentValue: '4%', targetValue: '10%' },
      { name: 'Average Deal Size', currentValue: '$2,400', targetValue: '$3,500' },
      { name: 'Upsell Rate', currentValue: '15%', targetValue: '30%' },
      { name: 'Revenue per User', currentValue: '$28', targetValue: '$45' },
    ],
  },
]

// Generic metrics (fallback)
const genericMetrics = [
  { name: 'Progress', currentValue: '42%', targetValue: '100%' },
  { name: 'Days Remaining', currentValue: 45, targetValue: 0, unit: 'days' },
  { name: 'Team Velocity', currentValue: 18, targetValue: 25, unit: 'points/sprint' },
  { name: 'Milestone Completion', currentValue: '3/8', targetValue: '8/8' },
]

// ============================================================================
// Stakeholder Templates
// ============================================================================

const stakeholderTemplates = [
  {
    keywords: ['customer', 'user', 'retention'],
    stakeholders: [
      { name: 'Customer Success', role: 'Team', concerns: ['Churn prevention', 'Onboarding quality'] },
      { name: 'Product Management', role: 'Team', concerns: ['Feature adoption', 'User feedback'] },
      { name: 'Executive Leadership', role: 'Sponsors', concerns: ['Revenue impact', 'Market position'] },
    ],
  },
  {
    keywords: ['mobile', 'app', 'engineering'],
    stakeholders: [
      { name: 'Mobile Engineering', role: 'Team', concerns: ['Technical debt', 'Release velocity'] },
      { name: 'QA Team', role: 'Team', concerns: ['Test coverage', 'Bug resolution'] },
      { name: 'Design', role: 'Team', concerns: ['UX consistency', 'Accessibility'] },
    ],
  },
  {
    keywords: ['sales', 'revenue', 'growth'],
    stakeholders: [
      { name: 'Sales Team', role: 'Team', concerns: ['Pipeline health', 'Win rates'] },
      { name: 'Marketing', role: 'Team', concerns: ['Lead quality', 'Brand positioning'] },
      { name: 'Finance', role: 'Sponsors', concerns: ['Revenue forecasting', 'Unit economics'] },
    ],
  },
]

// Generic stakeholders
const genericStakeholders = [
  { name: 'Project Team', role: 'Responsible', concerns: ['Execution quality', 'Timeline adherence'] },
  { name: 'Department Leadership', role: 'Accountable', concerns: ['Resource allocation', 'Strategic alignment'] },
  { name: 'Cross-functional Partners', role: 'Consulted', concerns: ['Dependencies', 'Integration needs'] },
]

// ============================================================================
// Summary Templates
// ============================================================================

const summaryTemplates = [
  'Current analysis reveals {progress}% progress toward the objective. Key challenges include {mainProblem}, with {metricName} at {currentValue} against a target of {targetValue}. Immediate focus areas have been identified to accelerate progress.',
  'The initiative is currently tracking at {progress}% completion. Analysis has identified {problemCount} key problems requiring attention, with {mainProblem} being the most critical. Targeted interventions are recommended.',
  'Assessment shows the outcome at {progress}% of target, with primary blockers around {mainProblem}. Current {metricName} stands at {currentValue}, needing improvement to reach the {targetValue} goal.',
]

// ============================================================================
// Helper Functions
// ============================================================================

function matchesKeywords(text: string, keywords: string[]): boolean {
  const lowerText = text.toLowerCase()
  return keywords.some((keyword) => lowerText.includes(keyword.toLowerCase()))
}

function selectRandomItems<T>(items: T[], count: number): T[] {
  const shuffled = [...items].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, Math.min(count, items.length))
}

function generateUniqueId(): string {
  return Math.random().toString(36).substring(2, 9)
}

function findMatchingTemplate<T extends { keywords: string[] }>(
  templates: T[],
  title: string,
  description: string | null | undefined
): T | null {
  const combinedText = `${title} ${description || ''}`
  return templates.find((template) => matchesKeywords(combinedText, template.keywords)) || null
}

// ============================================================================
// Main Generator Function
// ============================================================================

/**
 * Generate mock current state analysis for an outcome
 *
 * @param outcome - The outcome context (id, title, description, etc.)
 * @param _experiments - Optional experiments context (for future enhancement)
 * @returns CurrentStateData object with generated analysis
 */
export function generateCurrentStateAnalysis(
  outcome: OutcomeContext,
  _experiments?: ExperimentContext[]
): CurrentStateData {
  const progress = outcome.progress ?? Math.floor(Math.random() * 60) + 20

  // Find matching problem template or use generic
  const matchedProblemTemplate = findMatchingTemplate(problemTemplates, outcome.title, outcome.description)
  const problemSource = matchedProblemTemplate?.problems || genericProblems
  const problemCount = Math.floor(Math.random() * 2) + 3 // 3-4 problems
  const selectedProblems = selectRandomItems(problemSource, problemCount).map((p) => ({
    ...p,
    id: generateUniqueId(),
  }))

  // Find matching metric template or use generic
  const matchedMetricTemplate = findMatchingTemplate(metricTemplates, outcome.title, outcome.description)
  const metricSource = matchedMetricTemplate?.metrics || genericMetrics
  const metricCount = Math.floor(Math.random() * 2) + 3 // 3-4 metrics
  const selectedMetrics = selectRandomItems(metricSource, metricCount)

  // Find matching stakeholder template or use generic
  const matchedStakeholderTemplate = findMatchingTemplate(stakeholderTemplates, outcome.title, outcome.description)
  const stakeholderSource = matchedStakeholderTemplate?.stakeholders || genericStakeholders

  // Generate summary
  const summaryTemplate = summaryTemplates[Math.floor(Math.random() * summaryTemplates.length)]
  const mainProblem = selectedProblems[0]?.description.toLowerCase() || 'key operational challenges'
  const metric = selectedMetrics[0] || genericMetrics[0]

  const summary = summaryTemplate
    .replace('{progress}', String(progress))
    .replace('{mainProblem}', mainProblem)
    .replace('{problemCount}', String(selectedProblems.length))
    .replace('{metricName}', metric.name)
    .replace('{currentValue}', String(metric.currentValue))
    .replace('{targetValue}', String(metric.targetValue))

  return {
    summary,
    problems: selectedProblems,
    metrics: selectedMetrics,
    stakeholders: stakeholderSource,
    analyzedAt: new Date().toISOString(),
  }
}

/**
 * Simulate async analysis generation with artificial delay
 *
 * @param outcome - The outcome context
 * @param experiments - Optional experiments context
 * @param delayMs - Artificial delay in milliseconds (default: 2000)
 * @returns Promise resolving to CurrentStateData
 */
export async function generateCurrentStateAnalysisAsync(
  outcome: OutcomeContext,
  experiments?: ExperimentContext[],
  delayMs: number = 2000
): Promise<CurrentStateData> {
  // Simulate AI processing time
  await new Promise((resolve) => setTimeout(resolve, delayMs))

  return generateCurrentStateAnalysis(outcome, experiments)
}

// ============================================================================
// Two-Prong Solutions Generation
// ============================================================================

// Quick Wins Templates - Low effort, fast implementation
interface QuickWinTemplate {
  titleTemplate: string
  descriptionTemplate: string
  effort: 'low' | 'medium'
  impact: 'medium' | 'high'
  category: 'feedback' | 'automation' | 'visibility' | 'communication' | 'process'
  keywords: string[]
}

const quickWinTemplates: QuickWinTemplate[] = [
  // Retention-focused quick wins
  {
    titleTemplate: 'Implement 30-day check-in emails',
    descriptionTemplate: 'Automated personalized check-ins at day 7, 14, and 30 to identify at-risk customers early',
    effort: 'low',
    impact: 'medium',
    category: 'automation',
    keywords: ['retention', 'churn', 'customer'],
  },
  {
    titleTemplate: 'Add in-app feedback prompts',
    descriptionTemplate: 'Contextual feedback collection to identify issues and satisfaction levels in real-time',
    effort: 'low',
    impact: 'medium',
    category: 'feedback',
    keywords: ['retention', 'customer', 'user'],
  },
  {
    titleTemplate: 'Create customer health dashboard',
    descriptionTemplate: 'Real-time visibility into engagement metrics and churn risk indicators',
    effort: 'medium',
    impact: 'high',
    category: 'visibility',
    keywords: ['retention', 'customer', 'health'],
  },
  // Performance-focused quick wins
  {
    titleTemplate: 'Set up performance monitoring alerts',
    descriptionTemplate: 'Automated alerts when key performance metrics fall below thresholds',
    effort: 'low',
    impact: 'medium',
    category: 'automation',
    keywords: ['performance', 'mobile', 'app', 'speed'],
  },
  {
    titleTemplate: 'Implement crash reporting dashboard',
    descriptionTemplate: 'Centralized view of app crashes with impact analysis and prioritization',
    effort: 'medium',
    impact: 'high',
    category: 'visibility',
    keywords: ['mobile', 'app', 'crash', 'stability'],
  },
  // Growth-focused quick wins
  {
    titleTemplate: 'Simplify signup flow',
    descriptionTemplate: 'Remove unnecessary steps and fields from registration to reduce friction',
    effort: 'medium',
    impact: 'high',
    category: 'process',
    keywords: ['growth', 'signup', 'conversion', 'acquisition'],
  },
  {
    titleTemplate: 'Add social proof elements',
    descriptionTemplate: 'Display testimonials, user counts, and trust signals on landing pages',
    effort: 'low',
    impact: 'medium',
    category: 'communication',
    keywords: ['growth', 'conversion', 'landing'],
  },
  // Efficiency-focused quick wins
  {
    titleTemplate: 'Standardize status reporting templates',
    descriptionTemplate: 'Create consistent templates for progress updates to reduce reporting overhead',
    effort: 'low',
    impact: 'medium',
    category: 'process',
    keywords: ['efficiency', 'process', 'workflow'],
  },
  {
    titleTemplate: 'Enable self-service FAQ',
    descriptionTemplate: 'Build knowledge base to reduce repetitive queries and empower teams',
    effort: 'medium',
    impact: 'medium',
    category: 'automation',
    keywords: ['efficiency', 'support', 'self-service'],
  },
  // Generic quick wins (fallback)
  {
    titleTemplate: 'Implement quick feedback loop',
    descriptionTemplate: 'Set up rapid feedback collection mechanism to identify issues early and track sentiment',
    effort: 'low',
    impact: 'medium',
    category: 'feedback',
    keywords: [],
  },
  {
    titleTemplate: 'Add automated notifications',
    descriptionTemplate: 'Configure automated alerts for key milestones and status changes',
    effort: 'low',
    impact: 'medium',
    category: 'automation',
    keywords: [],
  },
  {
    titleTemplate: 'Create progress dashboard',
    descriptionTemplate: 'Build real-time dashboard showing key metrics and progress indicators',
    effort: 'medium',
    impact: 'high',
    category: 'visibility',
    keywords: [],
  },
  {
    titleTemplate: 'Establish daily standups',
    descriptionTemplate: 'Brief daily check-ins to surface blockers early and maintain alignment',
    effort: 'low',
    impact: 'medium',
    category: 'communication',
    keywords: [],
  },
]

// Systemic Fixes Templates - High effort, address root causes
interface SystemicFixTemplate {
  titleTemplate: string
  descriptionTemplate: string
  effort: 'high'
  impact: 'high'
  estimatedDuration: string
  category: 'process' | 'technology' | 'organization' | 'strategy' | 'infrastructure'
  keywords: string[]
}

const systemicFixTemplates: SystemicFixTemplate[] = [
  // Retention-focused systemic fixes
  {
    titleTemplate: 'Build churn prediction model',
    descriptionTemplate: 'ML-based early warning system using behavioral signals to identify at-risk customers before they churn',
    effort: 'high',
    impact: 'high',
    estimatedDuration: '2-3 months',
    category: 'technology',
    keywords: ['retention', 'churn', 'customer'],
  },
  {
    titleTemplate: 'Redesign onboarding experience',
    descriptionTemplate: 'Personalized onboarding paths based on user segment with guided activation milestones',
    effort: 'high',
    impact: 'high',
    estimatedDuration: '1-2 months',
    category: 'process',
    keywords: ['retention', 'onboarding', 'customer'],
  },
  // Performance-focused systemic fixes
  {
    titleTemplate: 'Platform performance overhaul',
    descriptionTemplate: 'Comprehensive optimization of app architecture including caching, lazy loading, and code splitting',
    effort: 'high',
    impact: 'high',
    estimatedDuration: '3-4 months',
    category: 'technology',
    keywords: ['performance', 'mobile', 'app', 'speed'],
  },
  {
    titleTemplate: 'CI/CD pipeline modernization',
    descriptionTemplate: 'Implement automated testing, staging environments, and progressive rollouts',
    effort: 'high',
    impact: 'high',
    estimatedDuration: '2-3 months',
    category: 'infrastructure',
    keywords: ['mobile', 'app', 'release', 'deployment'],
  },
  // Growth-focused systemic fixes
  {
    titleTemplate: 'Marketing automation platform',
    descriptionTemplate: 'Implement end-to-end marketing automation for personalized nurturing and attribution',
    effort: 'high',
    impact: 'high',
    estimatedDuration: '3-4 months',
    category: 'technology',
    keywords: ['growth', 'acquisition', 'marketing'],
  },
  {
    titleTemplate: 'Product-led growth transformation',
    descriptionTemplate: 'Restructure product experience to enable self-service trials and organic expansion',
    effort: 'high',
    impact: 'high',
    estimatedDuration: '4-6 months',
    category: 'strategy',
    keywords: ['growth', 'conversion', 'product'],
  },
  // Efficiency-focused systemic fixes
  {
    titleTemplate: 'Process automation initiative',
    descriptionTemplate: 'Systematically automate repetitive workflows to free team capacity for high-value work',
    effort: 'high',
    impact: 'high',
    estimatedDuration: '2-4 months',
    category: 'technology',
    keywords: ['efficiency', 'automation', 'workflow'],
  },
  {
    titleTemplate: 'Organization restructuring',
    descriptionTemplate: 'Realign team structure with clear ownership, accountability, and streamlined decision paths',
    effort: 'high',
    impact: 'high',
    estimatedDuration: '1-3 months',
    category: 'organization',
    keywords: ['efficiency', 'process', 'team'],
  },
  // Generic systemic fixes (fallback)
  {
    titleTemplate: 'Process redesign and optimization',
    descriptionTemplate: 'Fundamentally restructure core processes to eliminate bottlenecks and reduce cycle time',
    effort: 'high',
    impact: 'high',
    estimatedDuration: '2-3 months',
    category: 'process',
    keywords: [],
  },
  {
    titleTemplate: 'Technology platform upgrade',
    descriptionTemplate: 'Implement modern tooling and infrastructure to enable automation and scalability',
    effort: 'high',
    impact: 'high',
    estimatedDuration: '3-4 months',
    category: 'technology',
    keywords: [],
  },
  {
    titleTemplate: 'Data infrastructure overhaul',
    descriptionTemplate: 'Build robust data pipelines and analytics capabilities for evidence-based decisions',
    effort: 'high',
    impact: 'high',
    estimatedDuration: '3-6 months',
    category: 'infrastructure',
    keywords: [],
  },
]

// Strategy Summary Templates
const strategySummaryTemplates: string[] = [
  'Combine quick engagement wins with foundational infrastructure improvements for sustainable growth.',
  'Address immediate pain points while building long-term capabilities through parallel execution tracks.',
  'Implement rapid wins to build momentum while systematically addressing root causes.',
  'Balance short-term fixes with strategic investments to achieve both quick results and lasting change.',
  'Execute quick wins for immediate relief while laying groundwork for comprehensive transformation.',
]

// ============================================================================
// Solutions Generation Helpers
// ============================================================================

function findMatchingSolutions<T extends { keywords: string[] }>(
  templates: T[],
  outcomeTitle: string,
  description: string | null | undefined
): T[] {
  const combinedText = `${outcomeTitle} ${description || ''}`.toLowerCase()

  // Find templates with matching keywords
  const matching = templates.filter(
    (t) => t.keywords.length > 0 && t.keywords.some((k) => combinedText.includes(k.toLowerCase()))
  )

  // Include generic templates (empty keywords) as fallback
  const generic = templates.filter((t) => t.keywords.length === 0)

  // Return matching first, then generic
  return matching.length > 0 ? [...matching, ...generic] : generic
}

function selectSolutionTemplates<T>(templates: T[], count: number): T[] {
  const shuffled = [...templates].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, Math.min(count, templates.length))
}

function getSolutionStatus(index: number, isQuickWin: boolean): SolutionItem['status'] {
  // Quick wins progress faster, systemic fixes start as proposed
  if (isQuickWin) {
    const statuses: SolutionItem['status'][] = ['in_progress', 'proposed', 'approved', 'proposed']
    return statuses[index % statuses.length]
  }
  const statuses: SolutionItem['status'][] = ['proposed', 'approved', 'proposed']
  return statuses[index % statuses.length]
}

/**
 * Map solutions to the problems they address
 */
function mapSolutionToProblems(
  problems: CurrentStateData['problems'],
  solutionCategory: string
): string[] {
  if (!problems || problems.length === 0) return []

  // Map categories to problem keywords
  const categoryMappings: Record<string, string[]> = {
    feedback: ['feedback', 'communication', 'engagement', 'satisfaction'],
    automation: ['manual', 'time', 'repetitive', 'efficiency'],
    visibility: ['visibility', 'tracking', 'monitoring', 'data'],
    communication: ['communication', 'alignment', 'stakeholder'],
    process: ['process', 'workflow', 'bottleneck', 'cycle'],
    technology: ['technology', 'system', 'platform', 'tool'],
    organization: ['team', 'ownership', 'accountability', 'alignment'],
    strategy: ['strategy', 'direction', 'priority', 'goal'],
    infrastructure: ['infrastructure', 'data', 'pipeline', 'system'],
  }

  const relevantKeywords = categoryMappings[solutionCategory] || []

  // Find problems that might be addressed by this solution
  const matchingProblems = problems.filter((p) => {
    const problemText = `${p.description} ${p.impact || ''}`.toLowerCase()
    return relevantKeywords.some((k) => problemText.includes(k))
  })

  // Return IDs of matching problems (up to 2)
  return matchingProblems.slice(0, 2).map((p) => p.id)
}

// ============================================================================
// Main Solutions Generator
// ============================================================================

export interface GenerateSolutionsInput {
  outcome: OutcomeContext
  experiments?: ExperimentContext[]
  currentState: CurrentStateData
}

/**
 * Generate Two-Prong Solutions (Quick Wins + Systemic Fixes)
 *
 * @param input - Outcome info, experiments, and current state analysis
 * @returns SolutionsData with quick wins, systemic fixes, priority order, and strategy summary
 *
 * @example
 * ```ts
 * const solutions = generateSolutions({
 *   outcome: { id: 1, title: 'Improve Retention', status: 'Active', progress: 45 },
 *   experiments: [...],
 *   currentState: { problems: [...], metrics: [...] }
 * })
 * ```
 */
export function generateSolutions(input: GenerateSolutionsInput): SolutionsData {
  const { outcome, experiments = [], currentState } = input

  // Determine solution counts based on problem severity
  const criticalProblems = currentState.problems?.filter(
    (p) => p.severity === 'critical' || p.severity === 'high'
  ).length || 0
  const quickWinCount = Math.min(4, Math.max(3, criticalProblems + 2))
  const systemicFixCount = Math.min(3, Math.max(2, Math.ceil(criticalProblems / 2) + 1))

  // Find and select quick wins
  const matchingQuickWins = findMatchingSolutions(
    quickWinTemplates,
    outcome.title,
    outcome.description
  )
  const selectedQuickWins = selectSolutionTemplates(matchingQuickWins, quickWinCount)

  const quickWins: SolutionItem[] = selectedQuickWins.map((template, index) => ({
    id: `qw_${generateUniqueId()}`,
    title: template.titleTemplate,
    description: template.descriptionTemplate,
    effort: template.effort,
    impact: template.impact,
    status: getSolutionStatus(index, true),
    relatedStepIds: mapSolutionToProblems(currentState.problems, template.category),
  }))

  // Find and select systemic fixes
  const matchingSystemicFixes = findMatchingSolutions(
    systemicFixTemplates,
    outcome.title,
    outcome.description
  )
  const selectedSystemicFixes = selectSolutionTemplates(matchingSystemicFixes, systemicFixCount)

  const systemicFixes: SolutionItem[] = selectedSystemicFixes.map((template, index) => ({
    id: `sf_${generateUniqueId()}`,
    title: template.titleTemplate,
    description: template.descriptionTemplate,
    effort: template.effort,
    impact: template.impact,
    status: getSolutionStatus(index, false),
    targetDate: template.estimatedDuration,
    relatedStepIds: mapSolutionToProblems(currentState.problems, template.category),
    notes: `Estimated duration: ${template.estimatedDuration}`,
  }))

  // Build priority order (quick wins first for momentum, then systemic)
  const priorityOrder = [...quickWins.map((qw) => qw.id), ...systemicFixes.map((sf) => sf.id)]

  // Select strategy summary based on context
  let strategySummary = strategySummaryTemplates[Math.floor(Math.random() * strategySummaryTemplates.length)]

  // Customize based on outcome state
  if (outcome.progress !== undefined) {
    if (outcome.progress < 30) {
      strategySummary =
        'Focus on quick wins to build momentum and demonstrate progress while planning systemic improvements.'
    } else if (outcome.progress > 70) {
      strategySummary =
        'Prioritize systemic fixes to ensure sustainable results as the outcome nears completion.'
    }
  }

  // Customize if many experiments are in progress
  const inProgressExperiments = experiments.filter((e) => e.status === 'InProgress').length
  if (inProgressExperiments > 2) {
    strategySummary =
      'Coordinate quick wins with ongoing experiments while developing systemic solutions in parallel.'
  }

  return {
    quickWins,
    systemicFixes,
    priorityOrder,
    strategySummary,
    analyzedAt: new Date().toISOString(),
  }
}

/**
 * Generate solutions asynchronously with simulated delay
 *
 * @param input - Outcome info, experiments, and current state analysis
 * @param delayMs - Artificial delay in milliseconds (default: 1500)
 * @returns Promise resolving to SolutionsData
 */
export async function generateSolutionsAsync(
  input: GenerateSolutionsInput,
  delayMs: number = 1500
): Promise<SolutionsData> {
  // Simulate AI processing time
  await new Promise((resolve) => setTimeout(resolve, delayMs))

  return generateSolutions(input)
}

/**
 * Check if solutions can be generated
 * Solutions require current state analysis to exist with problems identified
 *
 * @param currentState - Current state analysis data
 * @returns boolean indicating if solutions can be generated
 */
export function canGenerateSolutions(currentState: CurrentStateData | null | undefined): boolean {
  if (!currentState) return false

  // At minimum, we need some problems or a summary to base solutions on
  const hasProblems = Boolean(currentState.problems && currentState.problems.length > 0)
  const hasSummary = Boolean(currentState.summary && currentState.summary.length > 0)

  return hasProblems || hasSummary
}
