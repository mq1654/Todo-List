import { useMemo, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { ArrowLeft, ClipboardList, Activity, CheckCircle2, AlertTriangle, type LucideIcon } from 'lucide-react'
import { Pie, Column } from '@ant-design/charts'
import { useTodoStats, useTodoItems, useRecentTasks, useDueSoonTasks } from '../store'
import { isOverdue } from '../utils/todoHelpers'
import { keepParams, TABLE_KEYS, TODO_KEYS } from '../utils/urlHelpers'

interface StatCard { key: string; label: string; icon: LucideIcon; color: string; bg: string }

const STAT_CARDS: StatCard[] = [
  { key: 'total', label: 'Total Tasks', icon: ClipboardList, color: 'text-violet-500', bg: 'bg-violet-50 dark:bg-violet-900/20' },
  { key: 'active', label: 'Active', icon: Activity, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/20' },
  { key: 'completed', label: 'Completed', icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
  { key: 'overdue', label: 'Overdue', icon: AlertTriangle, color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-900/20' },
]

const PRIORITY_BARS = [
  { key: 'High', color: 'bg-red-500' },
  { key: 'Medium', color: 'bg-amber-400' },
  { key: 'Low', color: 'bg-emerald-500' },
] as const

const STATUS_COLORS: Record<string, string> = {
  Active: '#3b82f6',
  Completed: '#10b981',
  Overdue: '#ef4444',
}

const TASK_STATUS_CLS: Record<string, string> = {
  Completed: 'bg-emerald-500 text-white',
  Overdue: 'bg-red-500 text-white',
  Active: 'bg-blue-500 text-white',
}

const CARD = 'bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm'
const CAT_BADGE = 'text-xs px-1.5 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 rounded flex-shrink-0'
const CIRCLE = 'w-4 h-4 rounded-full border-2 border-slate-300 dark:border-slate-600 flex-shrink-0'

const PIE_BASE = {
  angleField: 'value',
  colorField: 'type',
  innerRadius: 0.55,
  radius: 1.1,
  label: false as const,
  legend: false as const,
  tooltip: { items: [{ field: 'value', name: 'Tasks' }] },
  width: 330,
  height: 270,
}

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })

function DashboardStats() {
  const { totalCount, activeCount, completedCount, overdueCount } = useTodoStats()
  const counts: Record<string, number> = {
    total: totalCount, active: activeCount, completed: completedCount, overdue: overdueCount,
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {STAT_CARDS.map(({ key, label, icon: Icon, color, bg }) => (
        <div key={key} className={`${CARD} flex items-start justify-between`}>
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">{label}</p>
            <p className="text-3xl font-bold text-slate-900 dark:text-white tabular-nums">{counts[key]}</p>
          </div>
          <div className={`p-2.5 rounded-xl ${bg}`}>
            <Icon size={20} className={color} />
          </div>
        </div>
      ))}
    </div>
  )
}

function DashboardCharts() {
  const [chartType, setChartType] = useState<'pie' | 'bar'>('pie')
  const items = useTodoItems()
  const { totalCount, activeCount, completedCount, overdueCount } = useTodoStats()

  const counts: Record<string, number> = { active: activeCount, completed: completedCount, overdue: overdueCount }

  const donutData = useMemo(() => {
    return [
      { type: 'Active', value: activeCount },
      { type: 'Completed', value: completedCount },
      { type: 'Overdue', value: overdueCount },
    ].filter((d) => d.value > 0)
  }, [activeCount, completedCount, overdueCount])

  const pieConfig = {
    ...PIE_BASE,
    data: donutData,
    scale: { color: { range: Object.values(STATUS_COLORS) } },
  }

  const completionData = useMemo(() => {
    const data: { date: string; value: number }[] = []
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const day = today.getDay()
    const diffToMonday = today.getDate() - day + (day === 0 ? -6 : 1)
    const monday = new Date(today)
    monday.setDate(diffToMonday)

    for (let i = 0; i <= 6; i++) {
      const d = new Date(monday)
      d.setDate(d.getDate() + i)
      data.push({ date: d.toLocaleDateString('en-US', { weekday: 'short' }), value: 0 })
    }

    items.forEach((item) => {
      if (item.completed) {
        const dateStr = item.completedAt || item.updatedAt || item.createdAt
        if (dateStr) {
          const itemDate = new Date(dateStr)
          itemDate.setHours(0, 0, 0, 0)
          const diffDays = Math.round((itemDate.getTime() - monday.getTime()) / (1000 * 3600 * 24))
          if (diffDays >= 0 && diffDays <= 6) data[diffDays].value += 1
        }
      }
    })

    return data
  }, [items])

  const barConfig = {
    data: completionData,
    xField: 'date',
    yField: 'value',
    color: '#10b981',
    tooltip: { items: [{ field: 'value', name: 'Completed Tasks' }] },
    width: 650,
    height: 270,
    paddingInner: 0.3,
    marginRatio: 0.3,
    scale: { y: { domainMax: 10, tickCount: 11, tickInterval: 1 } },
    axis: { y: { gridStroke: '#94a3b8', gridStrokeOpacity: 0.6, gridLineDash: [8, 12], gridLineWidth: 1 } },
  }

  return (
    <div className={CARD}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-sm font-semibold text-slate-900 dark:text-white">Task Status Overview</p>
          <p className="text-xs text-slate-400 dark:text-slate-500">Distribution of tasks by status</p>
        </div>
        <div className="flex bg-slate-100 dark:bg-slate-700 rounded-lg p-0.5">
          <button onClick={() => setChartType('pie')} className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${chartType === 'pie' ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'}`}>Status</button>
          <button onClick={() => setChartType('bar')} className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${chartType === 'bar' ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'}`}>Completion</button>
        </div>
      </div>
      {chartType === 'pie' ? (
        <div className="flex items-center gap-22">
          <div className="relative flex-shrink-0">
            <Pie {...pieConfig} />
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-2xl font-bold text-slate-900 dark:text-white">{totalCount}</span>
              <span className="text-xs text-slate-400 dark:text-slate-500">Total</span>
            </div>
          </div>
          <div className="space-y-4">
            {Object.entries(STATUS_COLORS).map(([label, color]) => {
              const val = counts[label.toLowerCase()] ?? 0
              const pct = totalCount > 0 ? ((val / totalCount) * 100).toFixed(1) : '0.0'
              return (
                <div key={label} className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: color }} />
                  <span className="text-xs text-slate-600 dark:text-slate-300 w-16">{label}</span>
                  <span className="text-xs text-slate-500 dark:text-slate-400">{val} ({pct}%)</span>
                </div>
              )
            })}
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-center h-[270px] w-full mx-auto">
          <Column {...barConfig} />
        </div>
      )}
    </div>
  )
}

function RecentTasksCard({ navSearch }: { navSearch: string }) {
  const navigate = useNavigate()
  const recentTasks = useRecentTasks()

  return (
    <div className={CARD}>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm font-semibold text-slate-900 dark:text-white">Recent Tasks</p>
        <button onClick={() => navigate('/table' + keepParams(navSearch, TABLE_KEYS))} className="text-xs text-blue-500 hover:text-blue-600 font-medium transition-colors">
          View all
        </button>
      </div>
      {recentTasks.length === 0 ? (
        <p className="text-xs text-slate-400 dark:text-slate-500 text-center py-6">No tasks yet</p>
      ) : (
        <div className="divide-y divide-slate-100 dark:divide-slate-700">
          {recentTasks.map((task) => {
            const status = task.completed ? 'Completed' : isOverdue(task.dueDate, task.completed) ? 'Overdue' : 'Active'
            return (
              <div key={task.id} className="flex items-center gap-3 py-3">
                <div className={CIRCLE} />
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <p className={`text-sm font-medium truncate ${task.completed ? 'line-through text-slate-400' : 'text-slate-800 dark:text-white'}`}>{task.title}</p>
                  {task.category && <span className={CAT_BADGE}>{task.category}</span>}
                </div>
                <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium flex-shrink-0 ${TASK_STATUS_CLS[status]}`}>{status}</span>
                <span className="text-xs text-slate-400 dark:text-slate-500 flex-shrink-0 w-24 text-right">{fmtDate(task.createdAt)}</span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function PriorityCard() {
  const items = useTodoItems()
  const { totalCount } = useTodoStats()
  const priorityCounts = useMemo(
    () => Object.fromEntries(PRIORITY_BARS.map(({ key }) => [key, items.filter((i) => i.priority === key).length])),
    [items]
  )

  return (
    <div className={`${CARD} pb-12`}>
      <p className="text-sm font-semibold text-slate-900 dark:text-white">Tasks by Priority</p>
      <p className="text-xs text-slate-400 dark:text-slate-500 mb-8.5">Breakdown of tasks by priority level</p>
      <div className="space-y-8.5">
        {PRIORITY_BARS.map(({ key, color }) => {
          const count = priorityCounts[key] ?? 0
          const pct = totalCount > 0 ? (count / totalCount) * 100 : 0
          return (
            <div key={key}>
              <div className="flex justify-between mb-2">
                <span className="text-xs font-medium text-slate-600 dark:text-slate-300">{key}</span>
                <span className="text-xs font-bold text-slate-900 dark:text-white">{count}</span>
              </div>
              <div className="h-3 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                <div className={`h-full rounded-full ${color} transition-all duration-500`} style={{ width: `${pct}%` }} />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function DueSoonCard({ navSearch }: { navSearch: string }) {
  const navigate = useNavigate()
  const dueSoonTasks = useDueSoonTasks()

  return (
    <div className={CARD}>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm font-semibold text-slate-900 dark:text-white">Tasks Due Soon</p>
        <button onClick={() => navigate('/table' + keepParams(navSearch, TABLE_KEYS))} className="text-xs text-blue-500 hover:text-blue-600 font-medium transition-colors">
          View all
        </button>
      </div>
      {dueSoonTasks.length === 0 ? (
        <p className="text-xs text-slate-400 dark:text-slate-500 text-center py-4">No upcoming deadlines</p>
      ) : (
        <div className="divide-y divide-slate-100 dark:divide-slate-700">
          {dueSoonTasks.map(({ id, title, category, dueDate, daysLeft }) => {
            const urgent = daysLeft <= 3
            const cls = urgent ? 'text-red-500' : 'text-amber-500'
            const badgeCls = urgent ? 'bg-red-50 text-red-500 dark:bg-red-900/20' : 'bg-amber-50 text-amber-500 dark:bg-amber-900/20'
            const dayLabel = daysLeft === 0 ? 'Today' : `${daysLeft}d left`
            return (
              <div key={id} className="flex items-center gap-3 py-3">
                <div className={CIRCLE} />
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800 dark:text-white truncate">{title}</p>
                  {category && <span className={CAT_BADGE}>{category}</span>}
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${badgeCls}`}>{dayLabel}</span>
                  <span className={`text-xs font-medium ${cls}`}>{fmtDate(dueDate)}</span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default function DashboardPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const navSearch = location.search

  return (
    <div className="min-h-screen bg-slate-50 transition-colors duration-300 dark:bg-slate-900">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10 dark:bg-slate-800 dark:border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center gap-4">
          <button
            onClick={() => navigate('/' + keepParams(navSearch, TODO_KEYS))}
            className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900 transition-colors dark:text-slate-400 dark:hover:text-white"
          >
            <ArrowLeft size={16} />
            Back
          </button>
          <span className="text-slate-300 dark:text-slate-600 select-none">|</span>
          <h1 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight uppercase">Dashboard</h1>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        <DashboardStats />

        <div className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-4 items-start">
          <div className="flex flex-col gap-4">
            <DashboardCharts />
            <RecentTasksCard navSearch={navSearch} />
          </div>

          <div className="flex flex-col gap-4">
            <PriorityCard />
            <DueSoonCard navSearch={navSearch} />
          </div>
        </div>
      </main>
    </div>
  )
}
