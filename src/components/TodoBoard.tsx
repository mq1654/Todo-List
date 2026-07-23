import { useCallback, useState } from 'react'
import { useStore, useBoardColumns } from '../store'
import { useTodosFilter } from '../hooks/useTodosFilter'
import { useAuth } from '../hooks/useAuth'
import type { Todo } from '../store/types'
import { DragDropContext, Droppable, DropResult } from '@hello-pangea/dnd'
import { Plus, X } from 'lucide-react'
import { Input, Button } from 'antd'
import TodoColumn from './TodoColumn'
import TodoFilter from './TodoFilter'

function TodoBoard() {
  const { role } = useAuth()
  const columns = useBoardColumns()
  const reorderTodo = useStore((s) => s.todos.reorderTodo)
  const moveTodoToColumn = useStore((s) => s.todos.moveTodoToColumn)
  const reorderColumn = useStore((s) => s.board.reorderColumn)
  const addColumn = useStore((s) => s.board.addColumn)

  const [isAddingColumn, setIsAddingColumn] = useState(false)
  const [newColumnName, setNewColumnName] = useState('')

  const { filterTodos } = useTodosFilter()

  const onDragEnd = useCallback((result: DropResult) => {
    if (role === 'member') return
    const { allIds, entities } = useStore.getState().todos
    const { source, destination, draggableId, type } = result
    if (!destination) return

    if (type === 'COLUMN') {
      if (source.index !== destination.index) {
        const destCol = columns[destination.index]
        if (destCol) reorderColumn(draggableId, destCol.id)
      }
      return
    }

    const srcColId = source.droppableId
    const dstColId = destination.droppableId

    if (srcColId !== dstColId) {
      moveTodoToColumn(draggableId, dstColId)

      const dstFilteredIds = filterTodos(
        allIds.filter((id) => entities[id]?.columnId === dstColId).map(id => entities[id]) as Todo[]
      )
      const destTodoId = dstFilteredIds[destination.index]
      if (destTodoId) {
        reorderTodo({
          sourceId: draggableId,
          destinationId: destTodoId,
          isMovingDown: false,
        })
      }
      return
    }

    if (source.index !== destination.index) {
      const colFilteredIds = filterTodos(
        allIds.filter((id) => entities[id]?.columnId === srcColId).map(id => entities[id]) as Todo[]
      )
      const destTodoId = colFilteredIds[destination.index]
      if (destTodoId) {
        reorderTodo({
          sourceId: draggableId,
          destinationId: destTodoId,
          isMovingDown: destination.index > source.index,
        })
      }
    }
  }, [columns, reorderColumn, moveTodoToColumn, reorderTodo, filterTodos])

  const handleAddColumn = () => {
    const trimmed = newColumnName.trim()
    if (trimmed) {
      addColumn(trimmed)
      setNewColumnName('')
      setIsAddingColumn(false)
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="px-2 mb-4">
        <TodoFilter />
      </div>

      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="board" direction="horizontal" type="COLUMN">
          {(provided) => (
            <div
              ref={provided.innerRef}
              {...provided.droppableProps}
              className="flex gap-4 items-start flex-1 overflow-x-auto px-2 pb-4"
            >
              {columns.map((col, index) => (
                <TodoColumn key={col.id} column={col} index={index} />
              ))}
              {provided.placeholder}

              {role === 'admin' && (
                <div className="flex-shrink-0 w-[280px]">
                  {isAddingColumn ? (
                    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 space-y-2">
                      <Input
                        autoFocus
                        placeholder="Column name..."
                        value={newColumnName}
                        onChange={(e) => setNewColumnName(e.target.value)}
                        onPressEnter={handleAddColumn}
                        onKeyDown={(e) => { if (e.key === 'Escape') setIsAddingColumn(false) }}
                        size="small"
                      />
                      <div className="flex items-center gap-2 mt-2">
                        <Button
                          type="primary"
                          onClick={handleAddColumn}
                          size="small"
                          className="bg-slate-900 dark:bg-slate-100 dark:text-slate-900 font-semibold"
                        >
                          Add column
                        </Button>
                        <Button
                          type="text"
                          onClick={() => setIsAddingColumn(false)}
                          className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 flex items-center justify-center p-0 w-6 h-6"
                          icon={<X size={16} />}
                        />
                      </div>
                    </div>
                  ) : (
                    <Button
                      type="text"
                      onClick={() => setIsAddingColumn(true)}
                      className="flex items-center justify-start gap-2 w-full h-auto px-4 py-3 text-sm font-medium text-slate-500 hover:text-slate-700 bg-slate-100/50 hover:bg-slate-100 dark:bg-slate-800/50 dark:hover:bg-slate-800 dark:hover:text-slate-300 rounded-xl transition-colors"
                      icon={<Plus size={16} />}
                    >
                      Add another list
                    </Button>
                  )}
                </div>
              )}
            </div>
          )}
        </Droppable>
      </DragDropContext>
    </div>
  )
}

export default TodoBoard
