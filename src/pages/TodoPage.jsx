import { useStoreActions, useStoreState } from 'easy-peasy'
import { useNavigate } from 'react-router-dom'
import { Settings } from 'lucide-react'
import TodoInput from '../components/TodoInput'
import TodoFilter from '../components/TodoFilter'
import TodoList from '../components/TodoList'

function StatBadge({ count, label }) {
  return (
    <div className="text-center">
      <p className="text-2xl font-bold text-slate-900 dark:text-white tabular-nums">{count}</p>
      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{label}</p>
    </div>
  )
}

function TodoPage() {
  const add = useStoreActions((actions) => actions.todos.add)
  const totalCount = useStoreState((state) => state.todos.totalCount)
  const activeCount = useStoreState((state) => state.todos.activeCount)
  const completedCount = useStoreState((state) => state.todos.completedCount)

  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-slate-50 transition-colors duration-300 dark:bg-slate-900">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10 dark:bg-slate-800 dark:border-slate-700">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 bg-slate-900 rounded-md dark:bg-slate-100" />
            <span className="text-sm font-bold text-slate-900 tracking-tight dark:text-white">Todo List</span>
          </div>
          <div className="flex items-center gap-6">
            {totalCount > 0 && (
              <div className="hidden sm:flex items-center gap-6">
                <StatBadge count={totalCount} label="Total" />
                <StatBadge count={activeCount} label="Active" />
                <StatBadge count={completedCount} label="Done" />
              </div>
            )}
            <button 
              onClick={() => navigate('/settings')}
              className="p-1.5 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-full transition-colors dark:hover:bg-slate-700 dark:hover:text-white focus:outline-none focus:ring-2 focus:ring-slate-400"
              aria-label="Settings"
            >
              <Settings size={20} />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          <div className="lg:col-span-2 space-y-4">
            <TodoFilter />
            <TodoList />
          </div>
          <div className="lg:col-span-1 lg:sticky lg:top-20">
            <TodoInput onSubmit={add} />
          </div>
        </div>
      </main>
    </div>
  )
}

export default TodoPage
