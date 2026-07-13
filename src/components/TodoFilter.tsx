import { Input, Select, Button } from 'antd'
import { Search, ArrowDownAZ, AlertCircle } from 'lucide-react'
import { useStore } from '../store'
import { useTodosFilter } from '../hooks/useTodosFilter'

function TodoFilter() {
  const categories = useStore((s) => s.settings.categories)
  const { searchTerm, categoryFilter, sortByPriority, showOverdueOnly, setFilterParam, toggleFilterParam } =
    useTodosFilter()

  const categoryOptions = [
    { value: 'all', label: 'All Categories' },
    ...categories.map((cat: string) => ({ value: cat, label: cat })),
  ]

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm dark:bg-slate-800 dark:border-slate-700">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-[180px]">
          <Input
            prefix={<Search size={15} className="text-slate-400" />}
            type="search"
            value={searchTerm}
            onChange={(e) => setFilterParam('searchTerm', e.target.value)}
            placeholder="Search tasks..."
            allowClear
            size="small"
          />
        </div>

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
  )
}

export default TodoFilter
