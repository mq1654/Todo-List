import { useStoreState } from 'easy-peasy'
import { ClipboardList } from 'lucide-react'
import TodoItem from './TodoItem'

function EmptyState({ filter, searchTerm }) {
  const isFiltered = filter !== 'all' || searchTerm.trim().length > 0

  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center mb-4">
        <ClipboardList size={22} className="text-slate-400" />
      </div>
      <p className="text-sm font-semibold text-slate-700">
        {isFiltered ? 'No tasks match your criteria' : 'No tasks yet'}
      </p>
      <p className="mt-1 text-xs text-slate-400">
        {isFiltered
          ? 'Try adjusting your search or filter.'
          : 'Add your first task using the form above.'}
      </p>
    </div>
  )
}

function TodoList() {
  const filteredItems = useStoreState((state) => state.todos.filteredItems)
  const filter = useStoreState((state) => state.todos.filter)
  const searchTerm = useStoreState((state) => state.todos.searchTerm)

  if (filteredItems.length === 0) {
    return <EmptyState filter={filter} searchTerm={searchTerm} />
  }

  return (
    <ul className="space-y-2.5">
      {filteredItems.map((item) => (
        <li key={item.id}>
          <TodoItem item={item} />
        </li>
      ))}
    </ul>
  )
}

export default TodoList
