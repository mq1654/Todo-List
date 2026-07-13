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

function escapeCSVField(value: string | boolean | undefined | null): string {
  const str = value == null ? '' : String(value)
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

function formatDateTime(isoString: string): string {
  if (!isoString) return ''
  const d = new Date(isoString)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

export function exportTodosToCSV(
  todos: Todo[],
  columnNames: Record<string, string>,
  filename = 'todos.csv'
) {
  const headers = ['Title', 'Description', 'Category', 'Priority', 'Status', 'Column', 'Due Date', 'Created At']

  const rows = todos.map((t) => [
    escapeCSVField(t.title),
    escapeCSVField(t.description),
    escapeCSVField(t.category),
    escapeCSVField(t.priority),
    escapeCSVField(t.completed ? 'Completed' : isOverdue(t.dueDate, t.completed) ? 'Overdue' : 'Active'),
    escapeCSVField(columnNames[t.columnId] ?? ''),
    escapeCSVField(t.dueDate),
    escapeCSVField(formatDateTime(t.createdAt)),
  ])

  const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n')
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}
