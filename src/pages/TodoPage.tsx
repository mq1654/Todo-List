import { useNavigate, useLocation } from 'react-router-dom'
import { Settings } from 'lucide-react'
import { Button } from 'antd'
import { useTodoStats } from '../store'
import { keepParams, TABLE_KEYS } from '../utils/urlHelpers'
import TodoBoard from '../components/TodoBoard'

interface StatBadgeProps {
  count: number
  label: string
}

function StatBadge({ count, label }: StatBadgeProps) {
  return (
    <div className="text-center">
      <p className="text-2xl font-bold text-slate-900 dark:text-white tabular-nums">{count}</p>
      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{label}</p>
    </div>
  )
}

function TodoPage() {
  const { totalCount, activeCount, completedCount } = useTodoStats()
  const navigate = useNavigate()
  const location = useLocation()

  return (
    <div className="h-screen bg-slate-50 transition-colors duration-300 dark:bg-slate-900 flex flex-col">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10 dark:bg-slate-800 dark:border-slate-700">
        <div className="max-w-full mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2.5">
              <div className="w-6 h-6 bg-slate-900 rounded-md dark:bg-slate-100" />
              <span className="text-sm font-bold text-slate-900 tracking-tight dark:text-white">Todo List</span>
            </div>

            <div className="hidden sm:flex items-center gap-6">
              <Button
                type="text"
                onClick={() => navigate('/table' + keepParams(location.search, TABLE_KEYS))}
                className="text-xs font-semibold text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white uppercase tracking-wider"
              >
                Table View
              </Button>
              <Button
                type="text"
                onClick={() => navigate('/dashboard' + keepParams(location.search, []))}
                className="text-xs font-semibold text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white uppercase tracking-wider"
              >
                Dashboard
              </Button>
            </div>
          </div>

          <div className="flex items-center gap-6">
            {totalCount > 0 && (
              <div className="hidden md:flex items-center gap-6">
                <StatBadge count={totalCount} label="Total" />
                <StatBadge count={activeCount} label="Active" />
                <StatBadge count={completedCount} label="Done" />
              </div>
            )}
            <Button
              type="text"
              onClick={() => navigate('/setting')}
              className="flex items-center justify-center text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-full transition-colors dark:hover:bg-slate-700 dark:hover:text-white"
              aria-label="Settings"
              icon={<Settings size={20} />}
            />
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-hidden flex flex-col py-4 px-2 sm:px-4">
        <TodoBoard />
      </main>
    </div>
  )
}

export default TodoPage
