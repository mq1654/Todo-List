import type { Todo } from '../store/types';

export function getPriorityColor(priority: Todo['priority']) {
  if (priority === 'High') return 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800/50'
  if (priority === 'Medium') return 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800/50'
  return 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:border-slate-600'
}

export function isOverdue(dueDate: string | null, completed: boolean) {
  if (completed || !dueDate) return false
  const todayStr = new Date().toISOString().split('T')[0]
  return dueDate < todayStr
}
