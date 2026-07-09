import { Input, Select, Button } from 'antd'
import { Search, ArrowDownAZ, AlertCircle } from 'lucide-react'
import { Droppable } from '@hello-pangea/dnd'
import { useStore } from '../store'
import { useTodosFilter } from '../hooks/useTodosFilter'

const FILTER_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'completed', label: 'Completed' },
] as const

function TodoFilter() {
  const categories = useStore((s) => s.settings.categories)
  const { filter, searchTerm, categoryFilter, sortByPriority, showOverdueOnly, setFilterParam, toggleFilterParam } =
    useTodosFilter()

  const categoryOptions = [
    { value: 'all', label: 'All Categories' },
    ...categories.map((cat: string) => ({ value: cat, label: cat })),
  ]

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-4 dark:bg-slate-800 dark:border-slate-700">
      <Input
        prefix={<Search size={15} className="text-slate-400" />}
        type="search"
        value={searchTerm}
        onChange={(e) => setFilterParam('searchTerm', e.target.value)}
        placeholder="Search tasks..."
        allowClear
      />

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1.5">
          {FILTER_OPTIONS.map((option) => {
            if (option.value === 'completed') {
              return (
                <Droppable droppableId="filter-completed" key={option.value}>
                  {(provided, snapshot) => (
                    <button
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      onClick={() => setFilterParam('filter', option.value)}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                        filter === option.value
                          ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600'
                      } ${snapshot.isDraggingOver ? '!bg-green-100 !text-green-800 ring-2 ring-green-500 dark:!bg-green-900 dark:!text-green-300' : ''}`}
                    >
                      {option.label}
                      <span className="hidden">{provided.placeholder}</span>
                    </button>
                  )}
                </Droppable>
              )
            }
            return (
              <button
                key={option.value}
                onClick={() => setFilterParam('filter', option.value)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                  filter === option.value
                    ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600'
                }`}
              >
                {option.label}
              </button>
            )
          })}
        </div>

        <div className="h-6 w-px bg-slate-200 hidden sm:block dark:bg-slate-700" />

        <div className="flex flex-wrap items-center gap-2">
          <Select
            value={categoryFilter}
            onChange={(val) => setFilterParam('categoryFilter', val)}
            options={categoryOptions}
            size="small"
            style={{ minWidth: 130 }}
          />

          <Button
            size="small"
            icon={<ArrowDownAZ size={14} />}
            type={sortByPriority ? 'primary' : 'default'}
            onClick={() => toggleFilterParam('sortByPriority')}
          >
            Priority
          </Button>

          <Button
            size="small"
            icon={<AlertCircle size={14} />}
            danger={showOverdueOnly}
            type={showOverdueOnly ? 'primary' : 'default'}
            onClick={() => toggleFilterParam('showOverdueOnly')}
          >
            Overdue
          </Button>
        </div>
      </div>
    </div>
  )
}

export default TodoFilter
