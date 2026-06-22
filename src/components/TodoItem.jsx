import { useState, memo } from 'react'
import { useStoreActions } from 'easy-peasy'
import { Trash2, Pencil, Check, Circle, Calendar, Tag } from 'lucide-react'
import TodoInput from './TodoInput'

function getPriorityColor(priority) {
  if (priority === 'High') return 'bg-red-100 text-red-700 border-red-200'
  if (priority === 'Medium') return 'bg-amber-100 text-amber-700 border-amber-200'
  return 'bg-slate-100 text-slate-600 border-slate-200'
}

function isOverdue(dueDate, completed) {
  if (completed || !dueDate) return false
  const todayStr = new Date().toISOString().split('T')[0]
  return dueDate < todayStr
}

const TodoItem = memo(function TodoItem({ item }) {
  const [isEditing, setIsEditing] = useState(false)

  const remove = useStoreActions((actions) => actions.todos.remove)
  const update = useStoreActions((actions) => actions.todos.update)
  const toggleStatus = useStoreActions((actions) => actions.todos.toggleStatus)

  function handleUpdate(values) {
    update({ id: item.id, ...values })
    setIsEditing(false)
  }

  if (isEditing) {
    return (
      <div className="rounded-xl border border-slate-200 overflow-hidden">
        <TodoInput
          initialValues={{
            title: item.title,
            description: item.description,
            category: item.category,
            priority: item.priority,
            dueDate: item.dueDate,
          }}
          onSubmit={handleUpdate}
          onCancel={() => setIsEditing(false)}
        />
      </div>
    )
  }

  const overdue = isOverdue(item.dueDate, item.completed)

  return (
    <div
      className={`group flex items-start gap-4 bg-white border rounded-xl px-4 py-3.5 shadow-sm transition-colors ${
        item.completed ? 'border-slate-100 opacity-60' : 'border-slate-200 hover:border-slate-300'
      }`}
    >
      <button
        onClick={() => toggleStatus(item.id)}
        aria-label={item.completed ? 'Mark as active' : 'Mark as completed'}
        className="mt-0.5 shrink-0 text-slate-400 hover:text-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-700 rounded-full"
      >
        {item.completed ? (
          <Check size={18} className="text-slate-800" />
        ) : (
          <Circle size={18} />
        )}
      </button>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
          <span
            className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-md border ${getPriorityColor(
              item.priority
            )}`}
          >
            {item.priority}
          </span>
          <span className="flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold text-slate-600 bg-slate-100 border border-slate-200 rounded-md">
            <Tag size={10} />
            {item.category}
          </span>
          {item.dueDate && (
            <span
              className={`flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold rounded-md border ${
                overdue
                  ? 'bg-red-50 text-red-600 border-red-200'
                  : 'bg-slate-50 text-slate-500 border-slate-200'
              }`}
            >
              <Calendar size={10} />
              {new Date(item.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </span>
          )}
        </div>

        <p
          className={`text-sm font-semibold text-slate-900 leading-snug break-words ${
            item.completed ? 'line-through text-slate-400' : ''
          }`}
        >
          {item.title}
        </p>
        {item.description && (
          <p className="mt-0.5 text-xs text-slate-500 leading-relaxed break-words">
            {item.description}
          </p>
        )}
      </div>

      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
        <button
          onClick={() => setIsEditing(true)}
          aria-label="Edit task"
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-700"
        >
          <Pencil size={14} />
        </button>
        <button
          onClick={() => remove(item.id)}
          aria-label="Delete task"
          className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  )
})

export default TodoItem
