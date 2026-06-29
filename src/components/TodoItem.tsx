import { useState, useRef, useCallback, memo } from 'react';
import { useStoreActions } from '../store';
import { useNavigate } from 'react-router-dom';
import { Trash2, Pencil, Check, Circle, Calendar, Tag } from 'lucide-react';
import TodoInput from './TodoInput';
import type { Todo, TodoPayload } from '../store/types';
import { getPriorityColor, isOverdue } from '../utils/todoHelpers';

interface TodoItemProps {
  item: Todo;
  isSelected?: boolean;
  isSelectionMode?: boolean;
  onToggleSelect?: (id: string) => void;
  onLongPress?: (id: string) => void;
}

const TodoItem = memo(({ 
  item, 
  isSelected = false, 
  isSelectionMode = false, 
  onToggleSelect,
  onLongPress,
}: TodoItemProps) => {
  const [isEditing, setIsEditing] = useState(false)
  const navigate = useNavigate()
  const timerRef = useRef<number | null>(null)
  const longPressActivated = useRef(false)

  const remove = useStoreActions((a) => a.todos.remove)
  const update = useStoreActions((a) => a.todos.update)
  const toggleStatus = useStoreActions((a) => a.todos.toggleStatus)

  const handleUpdate = useCallback((values: TodoPayload) => {
    update({ id: item.id, ...values })
    setIsEditing(false)
  }, [item.id, update])

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

  const startLongPress = useCallback((e: React.PointerEvent) => {
    if (e.button !== 0 || (e.target as HTMLElement).closest('button, input')) return
    longPressActivated.current = false
    timerRef.current = window.setTimeout(() => {
      longPressActivated.current = true
      onLongPress?.(item.id)
    }, 700)
  }, [item.id, onLongPress])

  const cancelLongPress = useCallback(() => {
    if (timerRef.current === null) return
    window.clearTimeout(timerRef.current)
    timerRef.current = null
  }, [])

  const handleContentClick = useCallback((e: React.MouseEvent) => {
    if (longPressActivated.current) return
    if (isSelectionMode) {
      onToggleSelect?.(item.id)
      return
    }
    navigate(`/todoDetail/${item.id}`)
  }, [isSelectionMode, item.id, navigate, onToggleSelect])

  return (
    <div
      onPointerDown={startLongPress}
      onPointerUp={cancelLongPress}
      onPointerLeave={cancelLongPress}
      onPointerCancel={cancelLongPress}
      className={`group flex items-start gap-3 sm:gap-4 bg-white border rounded-xl px-3 sm:px-4 py-3.5 shadow-sm transition-colors dark:bg-slate-800 ${
        item.completed ? 'border-slate-100 opacity-60 dark:border-slate-800/50' : 'border-slate-200 hover:border-slate-300 dark:border-slate-700 dark:hover:border-slate-600'
      } ${isSelected ? 'ring-2 ring-blue-500 bg-blue-50/50 dark:bg-blue-900/20 border-transparent' : ''}`}
    >
      <button
        onClick={() => toggleStatus(item.id)}
        disabled={isSelectionMode}
        aria-label={item.completed ? 'Mark as active' : 'Mark as completed'}
        className={`mt-0.5 shrink-0 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-700 rounded-full ${
          isSelectionMode 
            ? 'text-slate-300 dark:text-slate-600 cursor-not-allowed opacity-50'
            : 'text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
        }`}
      >
        {item.completed ? (
          <Check size={18} className="text-slate-800 dark:text-slate-200" />
        ) : (
          <Circle size={18} />
        )}
      </button>

      <div 
        className="flex-1 min-w-0 cursor-pointer hover:opacity-80 transition-opacity"
        onClick={handleContentClick}
      >
        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
          <span
            className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-md border ${getPriorityColor(
              item.priority
            )}`}
          >
            {item.priority}
          </span>
          <span className="flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold text-slate-600 bg-slate-100 border border-slate-200 rounded-md dark:bg-slate-700 dark:text-slate-300 dark:border-slate-600">
            <Tag size={10} />
            {item.category}
          </span>
          {item.dueDate && (
            <span
              className={`flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold rounded-md border ${
                overdue
                  ? 'bg-red-50 text-red-600 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800/50'
                  : 'bg-slate-50 text-slate-500 border-slate-200 dark:bg-slate-700/50 dark:text-slate-400 dark:border-slate-600'
              }`}
            >
              <Calendar size={10} />
              {new Date(item.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </span>
          )}
        </div>

        <p
          className={`text-sm font-semibold leading-snug break-words ${
            item.completed ? 'line-through text-slate-400 dark:text-slate-500' : 'text-slate-900 dark:text-white'
          }`}
        >
          {item.title}
        </p>
        {item.description && (
          <p className="mt-0.5 text-xs text-slate-500 leading-relaxed break-words dark:text-slate-400">
            {item.description}
          </p>
        )}
      </div>

      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
        <button
          onClick={() => setIsEditing(true)}
          aria-label="Edit task"
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-700 dark:hover:text-slate-300 dark:hover:bg-slate-700"
        >
          <Pencil size={14} />
        </button>
        <button
          onClick={() => remove(item.id)}
          aria-label="Delete task"
          className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 dark:hover:text-red-400 dark:hover:bg-red-900/30"
        >
          <Trash2 size={14} />
        </button>
      </div>

      {isSelectionMode && (
        <div className="flex items-center self-center pl-2 shrink-0">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => onToggleSelect?.(item.id)}
            className="w-5 h-5 text-blue-500 bg-slate-100 border-slate-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-slate-800 focus:ring-2 dark:bg-slate-700 dark:border-slate-600 cursor-pointer"
          />
        </div>
      )}
    </div>
  )
})

export default TodoItem;
