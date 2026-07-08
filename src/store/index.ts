import { useMemo } from 'react'
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'
import { isOverdue } from '../utils/todoHelpers'
import type { Todo, TodoPayload } from './types'

interface SettingsSlice {
  theme: string
  categories: string[]
  toggleTheme: () => void
  addCategory: (cat: string) => void
  removeCategory: (cat: string) => void
  renameCategory: (payload: { oldName: string; newName: string }) => void
}

interface TodoSlice {
  entities: Record<string, Todo>
  allIds: string[]
  add: (payload: TodoPayload) => void
  remove: (id: string) => void
  deleteMultiple: (ids: string[]) => void
  update: (payload: TodoPayload & { id: string }) => void
  toggleStatus: (id: string) => void
  migrateCategory: (payload: { from: string; to: string }) => void
  reorderTodo: (payload: { sourceId: string; destinationId: string; isMovingDown: boolean }) => void
}

export type AppStore = {
  todos: TodoSlice
  settings: SettingsSlice
}


export const useStore = create<AppStore>()(
  persist(
    immer((set) => ({
      todos: {
        entities: {},
        allIds: [],

        add: (payload) => set((s) => {
          const id = crypto.randomUUID()
          s.todos.entities[id] = {
            id,
            title: payload.title.trim(),
            description: payload.description?.trim() ?? '',
            category: payload.category,
            priority: payload.priority,
            dueDate: payload.dueDate ?? '',
            completed: false,
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

        toggleStatus: (id) => set((s) => {
          const item = s.todos.entities[id]
          if (!item) return
          item.completed = !item.completed
          if (item.completed) item.completedAt = new Date().toISOString()
          else delete item.completedAt
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
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({
        todos: { entities: s.todos.entities, allIds: s.todos.allIds },
        settings: { theme: s.settings.theme, categories: s.settings.categories },
      }),
      merge: (persistedState: any, currentState: AppStore) => ({
        ...currentState,
        todos: {
          ...currentState.todos,
          ...persistedState.todos,
        },
        settings: {
          ...currentState.settings,
          ...persistedState.settings,
        },
      }),
    }
  )
)

export const useTodos = () => useStore((s) => s.todos)
export const useSettings = () => useStore((s) => s.settings)

export const useTodoItems = () => {
  const allIds = useStore((s) => s.todos.allIds)
  const entities = useStore((s) => s.todos.entities)
  return useMemo(
    () => allIds.map((id) => entities[id]).filter(Boolean),
    [allIds, entities]
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
