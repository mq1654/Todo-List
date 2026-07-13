import { useState, useCallback, useMemo, memo } from 'react'
import { useStore, useColumnTodos } from '../store'
import { useTodosFilter } from '../hooks/useTodosFilter'
import { Droppable, Draggable } from '@hello-pangea/dnd'
import { MoreHorizontal, Plus, Trash2, Pencil, Check, X } from 'lucide-react'
import { Dropdown, Input, Button } from 'antd'
import TodoItem from './TodoItem'
import type { Column } from '../store/types'

interface TodoColumnProps {
  column: Column
  index: number
}

const TodoColumn = memo(({ column, index }: TodoColumnProps) => {
  const columnTodoIds = useColumnTodos(column.id)
  const { getFilteredIds } = useTodosFilter()
  const add = useStore((s) => s.todos.add)
  const removeColumn = useStore((s) => s.board.removeColumn)
  const renameColumn = useStore((s) => s.board.renameColumn)

  const columnCount = useStore((s) => s.board.columnIds.length)

  const [isAdding, setIsAdding] = useState(false)
  const [newCardTitle, setNewCardTitle] = useState('')
  const [isRenaming, setIsRenaming] = useState(false)
  const [renameValue, setRenameValue] = useState('')

  const filteredIds = useMemo(
    () => getFilteredIds(columnTodoIds),
    [getFilteredIds, columnTodoIds]
  )

  const handleAdd = useCallback(() => {
    const title = newCardTitle.trim()
    if (!title) return
    add({ title, description: '', category: '', priority: 'Low', dueDate: null }, column.id)
    setNewCardTitle('')
    setIsAdding(false)
  }, [add, column.id, newCardTitle])

  const handleRename = useCallback(() => {
    const trimmed = renameValue.trim()
    if (trimmed && trimmed !== column.name) {
      renameColumn(column.id, trimmed)
    }
    setIsRenaming(false)
  }, [renameValue, column.id, column.name, renameColumn])

  const menuItems = useMemo(() => [
    {
      key: 'rename',
      label: 'Rename',
      icon: <Pencil size={14} />,
      onClick: () => { setRenameValue(column.name); setIsRenaming(true) },
    },
    ...(columnCount > 1
      ? [{
        key: 'delete',
        label: 'Delete column',
        icon: <Trash2 size={14} />,
        danger: true,
        onClick: () => removeColumn(column.id),
      }]
      : []),
  ], [column, columnCount, removeColumn])

  return (
    <Draggable draggableId={column.id} index={index}>
      {(provided) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          className="flex-shrink-0 w-[320px] flex flex-col max-h-[calc(100vh-180px)] bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl"
        >
          <div
            {...provided.dragHandleProps}
            className="flex items-center justify-between px-3 py-2.5 mb-2"
          >
            {isRenaming ? (
              <div className="flex items-center gap-1.5 flex-1">
                <Input
                  autoFocus
                  size="small"
                  value={renameValue}
                  onChange={(e) => setRenameValue(e.target.value)}
                  onPressEnter={handleRename}
                  onKeyDown={(e) => { if (e.key === 'Escape') setIsRenaming(false) }}
                  className="flex-1"
                />
                <Button
                  type="text"
                  onClick={handleRename}
                  className="flex items-center justify-center p-0 w-6 h-6 text-emerald-500 hover:text-emerald-600 hover:bg-emerald-50"
                  icon={<Check size={14} />}
                />
                <Button
                  type="text"
                  onClick={() => setIsRenaming(false)}
                  className="flex items-center justify-center p-0 w-6 h-6 text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                  icon={<X size={14} />}
                />
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-slate-800 dark:text-white">{column.name}</h3>
                  <span className="text-xs font-medium text-slate-400 dark:text-slate-500 tabular-nums">
                    {filteredIds.length}
                  </span>
                </div>
                <Dropdown menu={{ items: menuItems }} trigger={['click']}>
                  <Button
                    type="text"
                    className="flex items-center justify-center p-0 w-6 h-6 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded transition-colors"
                    icon={<MoreHorizontal size={16} />}
                  />
                </Dropdown>
              </>
            )}
          </div>

          <Droppable droppableId={column.id} type="CARD">
            {(provided, snapshot) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className={`flex-1 overflow-y-auto no-scrollbar space-y-2 px-1.5 pb-2 rounded-lg transition-colors min-h-[60px] ${snapshot.isDraggingOver ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''
                  }`}
              >
                {filteredIds.map((id, idx) => (
                  <Draggable key={id} draggableId={id} index={idx}>
                    {(provided) => (
                      <div ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps}>
                        <TodoItem id={id} columnId={column.id} />
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>

          {isAdding ? (
            <div className="px-2 pb-2 flex flex-col gap-3">
              <Input
                autoFocus
                placeholder="Enter a title for this card..."
                value={newCardTitle}
                onChange={(e) => setNewCardTitle(e.target.value)}
                onPressEnter={handleAdd}
                onKeyDown={(e) => { if (e.key === 'Escape') setIsAdding(false) }}
              />
              <div className="flex items-center gap-2">
                <Button type="primary" onClick={handleAdd}>
                  Add card
                </Button>
                <Button type="text" onClick={() => setIsAdding(false)} icon={<X size={16} />} className="flex items-center justify-center p-0 w-8 h-8 text-slate-500" />
              </div>
            </div>
          ) : (
            <div className="px-2 pb-2">
              <Button
                type="text"
                onClick={() => setIsAdding(true)}
                className="flex items-center justify-start gap-1.5 w-full h-auto px-3 py-2 text-xs font-medium text-slate-500 hover:text-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 dark:hover:text-slate-300 rounded-lg transition-colors"
                icon={<Plus size={14} />}
              >
                Add a card
              </Button>
            </div>
          )}
        </div>
      )}
    </Draggable>
  )
})

export default TodoColumn
