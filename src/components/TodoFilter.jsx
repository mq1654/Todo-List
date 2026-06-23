import { useStoreState, useStoreActions } from 'easy-peasy'
import { Search, SlidersHorizontal, ArrowDownAZ, AlertCircle } from 'lucide-react'

const FILTER_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'completed', label: 'Completed' },
]

function TodoFilter() {
  const filter = useStoreState((state) => state.todos.filter)
  const searchTerm = useStoreState((state) => state.todos.searchTerm)
  const categoryFilter = useStoreState((state) => state.todos.categoryFilter)
  const sortByPriority = useStoreState((state) => state.todos.sortByPriority)
  const showOverdueOnly = useStoreState((state) => state.todos.showOverdueOnly)
  const categories = useStoreState((state) => state.settings?.categories || ['Work', 'Personal', 'Learning'])

  const setFilter = useStoreActions((actions) => actions.todos.setFilter)
  const setSearchTerm = useStoreActions((actions) => actions.todos.setSearchTerm)
  const setCategoryFilter = useStoreActions((actions) => actions.todos.setCategoryFilter)
  const toggleSortByPriority = useStoreActions((actions) => actions.todos.toggleSortByPriority)
  const toggleShowOverdueOnly = useStoreActions((actions) => actions.todos.toggleShowOverdueOnly)

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-4 dark:bg-slate-800 dark:border-slate-700">
      <div className="relative">
        <Search
          size={15}
          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
        />
        <input
          type="search"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search tasks..."
          className="w-full pl-9 pr-4 py-2.5 text-sm rounded-lg border border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-400 outline-none focus:bg-white focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-colors dark:bg-slate-900 dark:border-slate-600 dark:text-white dark:focus:ring-slate-500 dark:focus:bg-slate-800 dark:placeholder-slate-500"
        />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <SlidersHorizontal size={14} className="text-slate-400 shrink-0" />
          <div className="flex gap-1.5">
            {FILTER_OPTIONS.map((option) => (
              <button
                key={option.value}
                onClick={() => setFilter(option.value)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-slate-700 ${
                  filter === option.value
                    ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <div className="h-6 w-px bg-slate-200 hidden sm:block dark:bg-slate-700"></div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 bg-slate-50 text-slate-700 outline-none focus:bg-white focus:ring-2 focus:ring-slate-900 transition-colors cursor-pointer dark:bg-slate-900 dark:border-slate-600 dark:text-white dark:focus:ring-slate-500 dark:focus:bg-slate-800"
          >
            <option value="all">All Categories</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>

          <button
            onClick={toggleSortByPriority}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-slate-700 ${
              sortByPriority
                ? 'bg-amber-100 text-amber-800 border border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800/50'
                : 'bg-slate-100 text-slate-600 border border-transparent hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600'
            }`}
          >
            <ArrowDownAZ size={14} />
            Priority
          </button>

          <button
            onClick={toggleShowOverdueOnly}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-slate-700 ${
              showOverdueOnly
                ? 'bg-red-100 text-red-800 border border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800/50'
                : 'bg-slate-100 text-slate-600 border border-transparent hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600'
            }`}
          >
            <AlertCircle size={14} />
            Overdue
          </button>
        </div>
      </div>
    </div>
  )
}

export default TodoFilter
