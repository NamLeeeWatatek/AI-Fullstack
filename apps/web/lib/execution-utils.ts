/**
 * Execution Utilities
 * Helper functions for execution display and formatting
 */

/**
 * Generate execution reference ID
 * Format: FLOW_ID-EXEC_ID (e.g., "WF-123-EX-456")
 */
export function getExecutionReference(flowId: number, executionId: number): string {
  return `WF-${flowId}-EX-${executionId}`
}

/**
 * Get short execution reference
 * Format: EX-456
 */
export function getShortExecutionReference(executionId: number): string {
  return `EX-${executionId}`
}

/**
 * Format execution duration
 */
export function formatExecutionDuration(durationMs?: number | null): string {
  if (!durationMs) return 'N/A'
  
  if (durationMs < 1000) {
    return `${durationMs}ms`
  }
  
  const seconds = Math.floor(durationMs / 1000)
  if (seconds < 60) {
    return `${seconds}s`
  }
  
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  return `${minutes}m ${remainingSeconds}s`
}

/**
 * Get execution status color
 */
export function getExecutionStatusColor(status: string): string {
  switch (status.toLowerCase()) {
    case 'completed':
    case 'success':
      return 'text-green-500 bg-green-500/10 border-green-500/20'
    case 'running':
    case 'pending':
      return 'text-blue-500 bg-blue-500/10 border-blue-500/20'
    case 'failed':
    case 'error':
      return 'text-red-500 bg-red-500/10 border-red-500/20'
    case 'cancelled':
      return 'text-gray-500 bg-gray-500/10 border-gray-500/20'
    default:
      return 'text-muted-foreground bg-muted/10 border-border/20'
  }
}

/**
 * Get execution status icon
 */
export function getExecutionStatusIcon(status: string): string {
  switch (status.toLowerCase()) {
    case 'completed':
    case 'success':
      return '✓'
    case 'running':
    case 'pending':
      return '⟳'
    case 'failed':
    case 'error':
      return '✕'
    case 'cancelled':
      return '⊘'
    default:
      return '•'
  }
}

/**
 * Calculate execution success rate
 */
export function calculateSuccessRate(completedNodes: number, totalNodes: number): number {
  if (totalNodes === 0) return 0
  return Math.round((completedNodes / totalNodes) * 100)
}

/**
 * Format execution date
 */
export function formatExecutionDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  
  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  
  const diffHours = Math.floor(diffMins / 60)
  if (diffHours < 24) return `${diffHours}h ago`
  
  const diffDays = Math.floor(diffHours / 24)
  if (diffDays < 7) return `${diffDays}d ago`
  
  return d.toLocaleDateString()
}

/**
 * Get execution progress percentage
 */
export function getExecutionProgress(completedNodes: number, totalNodes: number): number {
  if (totalNodes === 0) return 0
  return Math.round((completedNodes / totalNodes) * 100)
}
