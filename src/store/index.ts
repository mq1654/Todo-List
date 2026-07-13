import { useMemo } from 'react'
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'
import { isOverdue } from '../utils/todoHelpers'
import type { Todo, TodoPayload, Column } from './types'

const DEFAULT_COLUMNS: Column[] = [
  { id: 'col-todo', name: 'Todo', isDoneColumn: false, createdAt: new Date().toISOString() },
  { id: 'col-in-progress', name: 'In Progress', isDoneColumn: false, createdAt: new Date().toISOString() },
  { id: 'col-done', name: 'Done', isDoneColumn: true, createdAt: new Date().toISOString() },
]

interface TodoSlice {
  entities: Record<string, Todo>
  allIds: string[]
  add: (payload: TodoPayload, columnId?: string) => void
  remove: (id: string) => void
  deleteMultiple: (ids: string[]) => void
  update: (payload: TodoPayload & { id: string }) => void
  toggleCompleted: (id: string) => void
  moveTodoToColumn: (todoId: string, columnId: string) => void
  migrateCategory: (payload: { from: string; to: string }) => void
  reorderTodo: (payload: { sourceId: string; destinationId: string; isMovingDown: boolean }) => void
}

interface BoardSlice {
  columnIds: string[]
  columnEntities: Record<string, Column>
  addColumn: (name: string) => void
  removeColumn: (id: string) => void
  renameColumn: (id: string, name: string) => void
  reorderColumn: (sourceId: string, destinationId: string) => void
  setDoneColumn: (id: string) => void
}

interface SettingsSlice {
  theme: string
  categories: string[]
  toggleTheme: () => void
  addCategory: (cat: string) => void
  removeCategory: (cat: string) => void
  renameCategory: (payload: { oldName: string; newName: string }) => void
}

export type AppStore = {
  todos: TodoSlice
  board: BoardSlice
  settings: SettingsSlice
}



export const useStore = create<AppStore>()(
  persist(
    immer((set) => ({
      todos: {
        entities: {},
        allIds: [],

        add: (payload, columnId) => set((s) => {
          const id = crypto.randomUUID()
          const targetCol = columnId || s.board.columnIds[0]
          const isDone = s.board.columnEntities[targetCol]?.isDoneColumn ?? false
          s.todos.entities[id] = {
            id,
            title: payload.title.trim(),
            description: payload.description?.trim() ?? '',
            category: payload.category,
            priority: payload.priority,
            dueDate: payload.dueDate ?? '',
            completed: isDone,
            columnId: targetCol,
            createdAt: new Date().toISOString(),
          }
          s.todos.allIds.unshift(id)
        }),

        remove: (id) => set((s) => {
          delete s.todos.entities[id]
          s.todos.allIds = s.todos.allIds.filter((i) => i !== id)
        }),

        deleteMultiple: (ids) => set((s) => {
          const idSet = new Set(ids)
          ids.forEach((id) => delete s.todos.entities[id])
          s.todos.allIds = s.todos.allIds.filter((i) => !idSet.has(i))
        }),

        update: (payload) => set((s) => {
          const item = s.todos.entities[payload.id]
          if (!item) return
          item.title = payload.title.trim()
          item.description = payload.description?.trim() ?? ''
          item.category = payload.category
          item.priority = payload.priority
          item.dueDate = payload.dueDate ?? ''
          item.updatedAt = new Date().toISOString()
        }),

        toggleCompleted: (id) => set((s) => {
          const item = s.todos.entities[id]
          if (item) {
            item.completed = !item.completed
            item.statusChangedAt = new Date().toISOString()
          }
        }),

        moveTodoToColumn: (todoId, columnId) => set((s) => {
          const item = s.todos.entities[todoId]
          const col = s.board.columnEntities[columnId]
          if (!item || !col) return
          item.columnId = columnId
          item.completed = col.isDoneColumn
          item.statusChangedAt = new Date().toISOString()
        }),

        migrateCategory: ({ from, to }) => set((s) => {
          s.todos.allIds.forEach((id) => {
            if (s.todos.entities[id]?.category === from) {
              s.todos.entities[id].category = to
            }
          })
        }),

        reorderTodo: ({ sourceId, destinationId, isMovingDown }) => set((s) => {
          const sourceIdx = s.todos.allIds.indexOf(sourceId)
          if (sourceIdx === -1) return
          const [removed] = s.todos.allIds.splice(sourceIdx, 1)
          const destIdx = s.todos.allIds.indexOf(destinationId)
          if (destIdx !== -1) s.todos.allIds.splice(isMovingDown ? destIdx + 1 : destIdx, 0, removed)
          else s.todos.allIds.unshift(removed)
        }),
      },

      board: {
        columnIds: DEFAULT_COLUMNS.map((c) => c.id),
        columnEntities: Object.fromEntries(DEFAULT_COLUMNS.map((c) => [c.id, c])),

        addColumn: (name) => set((s) => {
          const id = crypto.randomUUID()
          s.board.columnEntities[id] = {
            id,
            name: name.trim(),
            isDoneColumn: false,
            createdAt: new Date().toISOString(),
          }
          s.board.columnIds.push(id)
        }),

        removeColumn: (id) => set((s) => {
          const fallback = s.board.columnIds.find((cid) => cid !== id)
          if (!fallback) return
          s.todos.allIds.forEach((tid) => {
            const todo = s.todos.entities[tid]
            if (todo?.columnId === id) {
              todo.columnId = fallback
              todo.completed = s.board.columnEntities[fallback]?.isDoneColumn ?? false
              todo.statusChangedAt = new Date().toISOString()
            }
          })
          delete s.board.columnEntities[id]
          s.board.columnIds = s.board.columnIds.filter((cid) => cid !== id)
        }),

        renameColumn: (id, name) => set((s) => {
          if (s.board.columnEntities[id]) {
            s.board.columnEntities[id].name = name.trim()
          }
        }),

        reorderColumn: (sourceId, destinationId) => set((s) => {
          const srcIdx = s.board.columnIds.indexOf(sourceId)
          const dstIdx = s.board.columnIds.indexOf(destinationId)
          if (srcIdx === -1 || dstIdx === -1) return
          const [removed] = s.board.columnIds.splice(srcIdx, 1)
          s.board.columnIds.splice(dstIdx, 0, removed)
        }),

        setDoneColumn: (id) => set((s) => {
          Object.values(s.board.columnEntities).forEach((col) => {
            col.isDoneColumn = col.id === id
          })
          s.todos.allIds.forEach((tid) => {
            const todo = s.todos.entities[tid]
            if (!todo) return
            const col = s.board.columnEntities[todo.columnId]
            const wasDone = todo.completed
            const nowDone = col?.isDoneColumn ?? false
            if (wasDone !== nowDone) {
              todo.completed = nowDone
              todo.statusChangedAt = new Date().toISOString()
            }
          })
        }),
      },

      settings: {
        theme: 'light',
        categories: ['Work', 'Personal', 'Learning'],

        toggleTheme: () => set((s) => {
          s.settings.theme = s.settings.theme === 'light' ? 'dark' : 'light'
        }),

        addCategory: (cat) => set((s) => {
          const trimmed = cat.trim()
          if (trimmed && !s.settings.categories.includes(trimmed)) {
            s.settings.categories.push(trimmed)
          }
        }),

        removeCategory: (cat) => set((s) => {
          s.settings.categories = s.settings.categories.filter((c) => c !== cat)
          s.todos.allIds.forEach((id) => {
            const todo = s.todos.entities[id]
            if (todo && todo.category) {
              const cats = Array.isArray(todo.category)
                ? todo.category
                : todo.category.toString().split(',').map((c) => c.trim())
              if (cats.includes(cat)) {
                const newCats = cats.filter((c) => c !== cat)
                todo.category = newCats.length === 0 ? 'None' : newCats.join(', ')
              }
            }
          })
        }),

        renameCategory: ({ oldName, newName }) => set((s) => {
          const trimmed = newName.trim()
          if (!trimmed || s.settings.categories.includes(trimmed)) return
          const idx = s.settings.categories.indexOf(oldName)
          if (idx !== -1) s.settings.categories[idx] = trimmed
        }),
      },
    })),
    {
      name: 'todo-store',
      version: 2,
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({
        todos: { entities: s.todos.entities, allIds: s.todos.allIds },
        board: { columnIds: s.board.columnIds, columnEntities: s.board.columnEntities },
        settings: { theme: s.settings.theme, categories: s.settings.categories },
      }),
      migrate: (persisted: unknown, version: number) => {
        const p = persisted as { board?: unknown; todos?: { entities?: Record<string, Record<string, unknown>> } }
        if (version < 2) {
          const defaultCols = DEFAULT_COLUMNS
          const doneColId = defaultCols.find((c) => c.isDoneColumn)!.id
          const todoColId = defaultCols[0].id

          if (!p.board) {
            p.board = {
              columnIds: defaultCols.map((c) => c.id),
              columnEntities: Object.fromEntries(defaultCols.map((c) => [c.id, c])),
            }
          }

          if (p.todos?.entities) {
            Object.values(p.todos.entities).forEach((todo) => {
              if (!todo['columnId']) {
                todo['columnId'] = todo['completed'] ? doneColId : todoColId
              }
              if (todo['completedAt']) {
                todo['statusChangedAt'] = todo['completedAt']
                delete todo['completedAt']
              }
            })
          }
        }
        return p as unknown
      },
      merge: (persistedState: unknown, currentState: AppStore) => {
        const p = persistedState as Partial<AppStore>
        return {
          ...currentState,
          todos: { ...currentState.todos, ...p.todos },
          board: { ...currentState.board, ...p.board },
          settings: { ...currentState.settings, ...p.settings },
        }
      },
    }
  )
)

export const useTodos = () => useStore((s) => s.todos)
export const useBoard = () => useStore((s) => s.board)
export const useSettings = () => useStore((s) => s.settings)

export const useTodoItems = () => {
  const allIds = useStore((s) => s.todos.allIds)
  const entities = useStore((s) => s.todos.entities)
  return useMemo(
    () => allIds.map((id) => entities[id]).filter(Boolean),
    [allIds, entities]
  )
}

export const useColumnTodos = (columnId: string) => {
  const allIds = useStore((s) => s.todos.allIds)
  const entities = useStore((s) => s.todos.entities)
  return useMemo(
    () => allIds.filter((id) => entities[id]?.columnId === columnId),
    [allIds, entities, columnId]
  )
}

export const useBoardColumns = () => {
  const columnIds = useStore((s) => s.board.columnIds)
  const columnEntities = useStore((s) => s.board.columnEntities)
  return useMemo(
    () => columnIds.map((id) => columnEntities[id]).filter(Boolean),
    [columnIds, columnEntities]
  )
}

export const useTodoStats = () => {
  const items = useTodoItems()
  return useMemo(() => ({
    totalCount: items.length,
    activeCount: items.filter((i) => !i.completed).length,
    completedCount: items.filter((i) => i.completed).length,
    overdueCount: items.filter((i) => isOverdue(i.dueDate, i.completed)).length,
  }), [items])
}

export const useRecentTasks = () => {
  const items = useTodoItems()
  return useMemo(() =>
    [...items]
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, 3),
    [items]
  )
}

export const useDueSoonTasks = () => {
  const items = useTodoItems()
  return useMemo(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayMs = today.getTime()
    const todayStr = today.toISOString().split('T')[0]

    return items
      .filter((i) => !i.completed && i.dueDate && i.dueDate >= todayStr)
      .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
      .slice(0, 3)
      .map((i) => ({
        ...i,
        daysLeft: Math.ceil((new Date(i.dueDate).getTime() - todayMs) / 86400000),
      }))
  }, [items])
}
