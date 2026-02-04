// Export all hooks
export {
  useOutcomes,
  useOutcome,
  useOutcomeMutations,
  type UseOutcomesFilters,
  type UseOutcomesResult,
  type UseOutcomeResult,
  type UseOutcomeMutationsResult,
} from './useOutcomes'

export {
  useExperiments,
  useExperiment,
  useExperimentMutations,
  type UseExperimentsFilters,
  type UseExperimentsResult,
  type UseExperimentResult,
  type UseExperimentMutationsResult,
} from './useExperiments'

export {
  useAnalysis,
  useAnalysisMutations,
  useAnalysisStatus,
  type UseAnalysisResult,
  type UseAnalysisMutationsResult,
  type UseAnalysisStatusResult,
  type CurrentStateData,
  type ProcessBreakdownData,
  type SolutionsData,
  type SolutionItem,
  type AnalysisDataTyped,
  type AnalysisSection,
  type AIAnalysisResult,
  type AIAnalysisOptions,
  isCurrentStateData,
  isProcessBreakdownData,
  isSolutionsData,
} from './useAnalysis'

export {
  useTasks,
  useTask,
  useTaskMutations,
  useTasksWithOptimisticUpdates,
  groupTasksByStatus,
  type TasksByStatus,
  type UseTasksFilters,
  type UseTasksResult,
  type UseTaskResult,
  type UseTaskMutationsResult,
} from './useTasks'

export {
  useMetricsRollup,
  useExperimentMetrics,
  useAutoExperimentProgress,
  type UseMetricsRollupOptions,
  type UseMetricsRollupResult,
} from './useMetricsRollup'

export {
  useOnlineStatus,
  useIsOnline,
  type OnlineStatus,
} from './useOnlineStatus'

// Real-time subscription hooks
export {
  useRealtimeSubscription,
  useRealtimeAvailable,
  type TableName,
  type RealtimeEventType,
  type RealtimeFilter,
  type RealtimeChangePayload,
  type UseRealtimeSubscriptionResult,
} from './useRealtimeSubscription'

export {
  useRealtimeOutcomes,
  useRealtimeOutcome,
  type OutcomeChangeCallback,
  type UseRealtimeOutcomesOptions,
  type UseRealtimeOutcomesResult,
} from './useRealtimeOutcomes'

export {
  useRealtimeExperiments,
  useRealtimeExperiment,
  type ExperimentChangeCallback,
  type UseRealtimeExperimentsOptions,
  type UseRealtimeExperimentsResult,
} from './useRealtimeExperiments'

export {
  useRealtimeTasks,
  useRealtimeTask,
  type TaskChangeCallback,
  type UseRealtimeTasksOptions,
  type UseRealtimeTasksResult,
} from './useRealtimeTasks'
