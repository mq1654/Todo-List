import { useState, useRef, useCallback, useMemo, memo } from 'react'
import { useStore } from '../store'
import TodoEditModal from './TodoEditModal'

import { Trash2, Pencil, Calendar, Tag, AlignLeft, Plus, X, Check, Circle, ChevronDown, ChevronsLeft, ChevronLeft, ChevronRight, ChevronsRight } from 'lucide-react'
import { Button, Checkbox, Popover, Input, Select, DatePicker, Calendar as AntCalendar, AutoComplete, Avatar, Tooltip } from 'antd'
import { CheckCircleFilled } from '@ant-design/icons'
import type { TodoPayload } from '../store/types'
import { getPriorityColor, isOverdue } from '../utils/todoHelpers'
import { useMembers } from '../hooks/useMembers'
import { useAuth } from '../hooks/useAuth'
import dayjs from 'dayjs'

interface TodoItemProps {
  id: string
  columnId?: string
  isSelected?: boolean
  isSelectionMode?: boolean
  onToggleSelect?: (id: string) => void
  onLongPress?: (id: string) => void
}

const TodoItem = memo(({
  id,
  isSelected = false,
  isSelectionMode = false,
  onToggleSelect,
  onLongPress,
}: TodoItemProps) => {
  const item = useStore((s) => s.todos.entities[id])
  const remove = useStore((s) => s.todos.remove)
  const update = useStore((s) => s.todos.update)
  const toggleCompleted = useStore((s) => s.todos.toggleCompleted)
  const { user, role } = useAuth()
  const { activeMembers } = useMembers()

  const assignee = useMemo(() => {
    const found = activeMembers.find((m) => m.uid === item?.assigneeId)
    if (found) return found
    if (item?.assigneeId && user && item.assigneeId === user.uid) {
      return {
        uid: user.uid,
        name: user.displayName || user.email?.split('@')[0] || 'Me',
        email: user.email || '',
        role: 'member' as const,
        status: 'active' as const,
        createdAt: '',
      }
    }
    return null
  }, [activeMembers, item?.assigneeId, user])

  const [isEditing, setIsEditing] = useState(false)

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const longPressActivated = useRef(false)



  const startLongPress = (e: React.PointerEvent) => {
    if (e.button !== 0 || (e.target as HTMLElement).closest('button, input')) return
    longPressActivated.current = false
    timerRef.current = setTimeout(() => {
      longPressActivated.current = true
      onLongPress?.(id)
    }, 700)
  }

  const cancelLongPress = () => {
    if (timerRef.current === null) return
    clearTimeout(timerRef.current)
    timerRef.current = null
  }

  const itemCategories = useMemo(() => {
    if (!item?.category) return []
    return [...new Set(item.category.split(',').map(c => c.trim()).filter(Boolean))]
  }, [item?.category])

  const getPayload = (overrides: Partial<TodoPayload> = {}): TodoPayload & { id: string } => ({
    id,
    title: item?.title || '',
    description: item?.description || '',
    category: item?.category || '',
    priority: item?.priority || 'Low',
    dueDate: item?.dueDate || null,
    ...overrides
  })

  const handleToggleCompleted = () => {
    toggleCompleted(id)
  }

  const isModalOpen = isEditing

  const closeModal = () => {
    setIsEditing(false)
  }

  if (!item) return null

  const overdue = isOverdue(item.dueDate, item.completed)

  const quickEditContent = (
    <div className="flex flex-col gap-2 w-48">
      <div>
        <label className="text-xs font-semibold text-slate-500 mb-1 block">Priority</label>
        <Select
          size="small"
          value={item.priority}
          onChange={(val) => update(getPayload({ priority: val }))}
          options={['High', 'Medium', 'Low'].map(p => ({ label: p, value: p }))}
          className="w-full"
        />
      </div>
      <div>
        <label className="text-xs font-semibold text-slate-500 mb-1 block">Due Date</label>
        <DatePicker
          size="small"
          format="DD-MM-YYYY"
          value={item.dueDate ? dayjs(item.dueDate) : null}
          onChange={(d) => update(getPayload({ dueDate: d ? d.format('YYYY-MM-DD') : null }))}
          className="w-full"
        />
      </div>
      <Button danger type="text" size="small" icon={<Trash2 size={14} />} onClick={() => remove(id)} className="text-left mt-1">
        Delete Card
      </Button>
    </div>
  )

  return (
    <div
      onPointerDown={startLongPress}
      onPointerUp={cancelLongPress}
      onPointerLeave={cancelLongPress}
      onPointerCancel={cancelLongPress}

      className={`group relative bg-white border rounded-xl px-3 py-3 shadow-sm transition-colors dark:bg-slate-800 ${item.completed ? 'border-slate-100 dark:border-slate-800/50' : 'border-slate-200 hover:border-slate-300 dark:border-slate-700 dark:hover:border-slate-600'
        } ${isSelected ? 'ring-2 ring-blue-500 bg-blue-50/50 dark:bg-blue-900/20 border-transparent' : ''}`}
    >
      <div className="cursor-pointer" onClick={() => setIsEditing(true)}>
        <div className="flex items-center gap-2 mb-1.5 flex-wrap pr-12">
          <span className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-md border ${getPriorityColor(item.priority)}`}>
            {item.priority}
          </span>
          {itemCategories.map(cat => (
            <span key={cat} className="flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold text-slate-600 bg-slate-100 border border-slate-200 rounded-md dark:bg-slate-700 dark:text-slate-300 dark:border-slate-600">
              <Tag size={10} />
              {cat}
            </span>
          ))}
          {item.dueDate && (
            <span className={`flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold rounded-md border ${item.completed
                ? 'bg-emerald-600 text-white border-emerald-600 dark:bg-emerald-700 dark:border-emerald-700'
                : overdue
                  ? 'bg-red-50 text-red-600 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800/50'
                  : 'bg-slate-50 text-slate-500 border-slate-200 dark:bg-slate-700/50 dark:text-slate-400 dark:border-slate-600'
              }`}>
              <Calendar size={10} />
              {new Date(item.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </span>
          )}
          {item.completed && (
            <span className="flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold rounded-md border bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800/50">
              Completed
            </span>
          )}
        </div>
      </div>

      <div className="flex items-start mt-0.5 group/title">
        <div className={`overflow-hidden transition-all duration-200 flex items-center pt-0.5 ${item.completed ? 'w-5 opacity-100' : 'w-0 opacity-0 group-hover/title:w-5 group-hover/title:opacity-100'
          }`}>
          <Button
            type="text"
            disabled={role === 'member'}
            className={`flex-shrink-0 flex items-center justify-center ${role === 'admin' ? 'cursor-pointer' : 'cursor-default'} ${item.completed
                ? '!text-emerald-500 hover:!text-emerald-600'
                : '!text-slate-300 hover:!text-emerald-500 dark:!text-slate-600'
              }`}
            style={{ width: 16, height: 16, minWidth: 16, padding: 0 }}
            icon={item.completed ? (
              <CheckCircleFilled style={{ fontSize: 16 }} className="flex-shrink-0" />
            ) : (
              <Circle size={16} strokeWidth={2.5} className="flex-shrink-0" />
            )}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (role === 'admin') handleToggleCompleted();
            }}
            onPointerDown={(e) => e.stopPropagation()}
          />
        </div>

        <p
          className="flex-1 text-sm font-semibold leading-snug break-words pr-6 cursor-pointer transition-colors text-slate-900 dark:text-white"
          onClick={() => setIsEditing(true)}
        >
          {item.title}
        </p>
      </div>

      <div className="mt-2.5 flex items-center justify-between">
        {item.description ? (
          <div className="text-slate-400 dark:text-slate-500 flex items-center cursor-pointer" onClick={() => setIsEditing(true)}>
            <AlignLeft size={14} />
          </div>
        ) : <div />}

        {assignee && (
          <Tooltip title={`Assigned to: ${assignee.name}`}>
            <Avatar size={22} className="bg-blue-600 text-white dark:bg-blue-500 font-bold text-[10px] shadow-xs cursor-pointer border border-white dark:border-slate-800" onClick={() => setIsEditing(true)}>
              {assignee.name[0]?.toUpperCase()}
            </Avatar>
          </Tooltip>
        )}
      </div>

      {role === 'admin' && (
        <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Popover content={quickEditContent} trigger="click" placement="bottomRight">
            <Button
              type="text"
              className="flex items-center justify-center p-0 w-7 h-7 text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors dark:hover:text-slate-200 dark:hover:bg-slate-600 rounded-md bg-slate-100 dark:bg-slate-700 shadow-sm"
              icon={<Pencil size={13} />}
            />
          </Popover>
        </div>
      )}

      {isSelectionMode && (
        <div className="flex items-center self-center pl-2 shrink-0">
          <Checkbox
            checked={isSelected}
            onChange={() => onToggleSelect?.(id)}
            className="dark:accent-slate-400"
          />
        </div>
      )}

      {isModalOpen && (
        <TodoEditModal id={id} onClose={closeModal} />
      )}
    </div>
  )
})

export default TodoItem
