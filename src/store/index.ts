import { useMemo } from 'react'
import { create } from 'zustand'
import { useShallow } from 'zustand/react/shallow'
import { persist, createJSONStorage } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'
import { collection, onSnapshot, query, orderBy, getDocs, where, getDoc, doc } from 'firebase/firestore'
import { db, auth } from '../firebase/firebaseConfig'
import * as taskService from '../firebase/taskService'
import * as columnService from '../firebase/columnService'
import { isOverdue } from '../utils/todoHelpers'
import type { Todo, TodoPayload, Column } from './types'

interface TodoSlice {
  entities: Record<string, Todo>
  allIds: string[]
  add: (payload: TodoPayload, columnId?: string) => Promise<void>
  remove: (id: string) => Promise<void>
  deleteMultiple: (ids: string[]) => Promise<void>
  update: (payload: TodoPayload & { id: string }) => Promise<void>
  toggleCompleted: (id: string) => Promise<void>
  moveTodoToColumn: (todoId: string, columnId: string) => Promise<void>
  migrateCategory: (payload: { from: string; to: string }) => Promise<void>
  reorderTodo: (payload: { sourceId: string; destinationId: string; isMovingDown: boolean }) => Promise<void>
}

interface BoardSlice {
  columnIds: string[]
  columnEntities: Record<string, Column>
  addColumn: (name: string) => Promise<void>
  removeColumn: (id: string) => Promise<void>
  renameColumn: (id: string, name: string) => Promise<void>
  reorderColumn: (sourceId: string, destinationId: string) => Promise<void>
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
    immer((set, get) => ({
      todos: {
        entities: {},
        allIds: [],

        add: async (payload, columnId) => {
          const s = get()
          const targetCol = columnId || s.board.columnIds[0]
          const uid = auth.currentUser?.uid ?? ''
          await taskService.createTask({
            title: payload.title.trim(),
            description: payload.description?.trim() ?? '',
            category: payload.category,
            priority: payload.priority,
            dueDate: payload.dueDate ?? '',
            completed: false,
            columnId: targetCol,
            order: s.todos.allIds.length,
            assigneeId: payload.assigneeId ?? null,
            createdBy: uid,
          })
        },

        remove: async (id) => {
          await taskService.deleteTask(id)
        },

        deleteMultiple: async (ids) => {
          await taskService.deleteTasks(ids)
        },

        update: async (payload) => {
          const updateData: Record<string, unknown> = {
            title: payload.title.trim(),
            description: payload.description?.trim() ?? '',
            category: payload.category,
            priority: payload.priority,
            dueDate: payload.dueDate ?? '',
            updatedAt: new Date().toISOString(),
          }
          if (payload.assigneeId !== undefined) {
            updateData.assigneeId = payload.assigneeId
          }
          await taskService.updateTask(payload.id, updateData)
        },

        toggleCompleted: async (id) => {
          const item = get().todos.entities[id]
          if (!item) return
          await taskService.updateTask(id, {
            completed: !item.completed,
            statusChangedAt: new Date().toISOString(),
          })
        },

        moveTodoToColumn: async (todoId, columnId) => {
          const col = get().board.columnEntities[columnId]
          if (!col) return
          await taskService.updateTask(todoId, {
            columnId,
            statusChangedAt: new Date().toISOString(),
          })
        },

        migrateCategory: async ({ from, to }) => {
          const s = get()
          const affected = s.todos.allIds.filter((id) => s.todos.entities[id]?.category === from)
          await Promise.all(affected.map((id) => taskService.updateTask(id, { category: to })))
        },

        reorderTodo: async ({ sourceId, destinationId, isMovingDown }) => {
          const s = get()
          const ids = [...s.todos.allIds]
          const sourceIdx = ids.indexOf(sourceId)
          if (sourceIdx === -1) return
          ids.splice(sourceIdx, 1)
          const destIdx = ids.indexOf(destinationId)
          if (destIdx !== -1) ids.splice(isMovingDown ? destIdx + 1 : destIdx, 0, sourceId)
          else ids.unshift(sourceId)
          await Promise.all(ids.map((id, index) => taskService.updateTask(id, { order: index })))
        },
      },

      board: {
        columnIds: [],
        columnEntities: {},

        addColumn: async (name) => {
          const order = get().board.columnIds.length
          const uid = auth.currentUser?.uid
          if (!uid) return
          await columnService.createColumn(name.trim(), order, uid)
        },

        removeColumn: async (id) => {
          const s = get()
          const affected = s.todos.allIds.filter((tid) => s.todos.entities[tid]?.columnId === id)
          await Promise.all(affected.map((tid) => taskService.deleteTask(tid)))
          await columnService.deleteColumn(id)
        },

        renameColumn: async (id, name) => {
          await columnService.updateColumn(id, { name: name.trim() })
        },

        reorderColumn: async (sourceId, destinationId) => {
          const s = get()
          const ids = [...s.board.columnIds]
          const srcIdx = ids.indexOf(sourceId)
          const dstIdx = ids.indexOf(destinationId)
          if (srcIdx === -1 || dstIdx === -1) return
          const [removed] = ids.splice(srcIdx, 1)
          ids.splice(dstIdx, 0, removed)
          await Promise.all(ids.map((id, index) => columnService.updateColumn(id, { order: index })))
        },
      },

      settings: {
        theme: 'light',
        categories: ['Work', 'Personal', 'Learning'],

        toggleTheme: () =>
          set((s) => {
            s.settings.theme = s.settings.theme === 'light' ? 'dark' : 'light'
          }),

        addCategory: (cat) =>
          set((s) => {
            const trimmed = cat.trim()
            if (trimmed && !s.settings.categories.includes(trimmed)) {
              s.settings.categories.push(trimmed)
            }
          }),

        removeCategory: (cat) =>
          set((s) => {
            s.settings.categories = s.settings.categories.filter((c) => c !== cat)
          }),

        renameCategory: ({ oldName, newName }) =>
          set((s) => {
            const trimmed = newName.trim()
            if (!trimmed || s.settings.categories.includes(trimmed)) return
            const idx = s.settings.categories.indexOf(oldName)
            if (idx !== -1) s.settings.categories[idx] = trimmed
          }),
      },
    })),
    {
      name: 'todo-settings',
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({
        settings: { theme: s.settings.theme, categories: s.settings.categories },
      }),
      merge: (persistedState, currentState) => {
        const p = persistedState as { settings?: { theme?: string; categories?: string[] } }
        return {
          ...currentState,
          settings: { ...currentState.settings, ...p.settings },
        }
      },
    }
  )
)

let unsubscribeTasks: (() => void) | null = null
let unsubscribeColumns: (() => void) | null = null
let activeUid: string | null = null

function areTodosEqual(a: Todo, b: Todo): boolean {
  return (
    a.id === b.id &&
    a.title === b.title &&
    a.description === b.description &&
    a.category === b.category &&
    a.priority === b.priority &&
    a.dueDate === b.dueDate &&
    a.completed === b.completed &&
    a.columnId === b.columnId &&
    a.order === b.order &&
    a.assigneeId === b.assigneeId &&
    a.createdBy === b.createdBy &&
    a.createdAt === b.createdAt &&
    a.updatedAt === b.updatedAt &&
    a.statusChangedAt === b.statusChangedAt
  )
}

function areColumnsEqual(a: Column, b: Column): boolean {
  return (
    a.id === b.id &&
    a.name === b.name &&
    a.order === b.order &&
    a.userId === b.userId &&
    a.createdAt === b.createdAt
  )
}

function reconcileTasks(newDocs: Todo[]) {
  const currentEntities = useStore.getState().todos.entities
  const newEntities: Record<string, Todo> = {}
  let hasEntitiesChanged = false

  for (const doc of newDocs) {
    const existing = currentEntities[doc.id]
    if (existing && areTodosEqual(existing, doc)) {
      newEntities[doc.id] = existing
    } else {
      newEntities[doc.id] = doc
      hasEntitiesChanged = true
    }
  }

  if (!hasEntitiesChanged && Object.keys(currentEntities).length !== newDocs.length) {
    hasEntitiesChanged = true
  }

  const newAllIds = newDocs.map((d) => d.id)
  const prevAllIds = useStore.getState().todos.allIds
  const isIdsEqual =
    prevAllIds.length === newAllIds.length &&
    prevAllIds.every((id, idx) => id === newAllIds[idx])

  if (hasEntitiesChanged || !isIdsEqual) {
    useStore.setState((s) => {
      s.todos.entities = newEntities
      s.todos.allIds = isIdsEqual ? prevAllIds : newAllIds
    })
  }
}

function reconcileColumns(newDocs: Column[]) {
  const currentEntities = useStore.getState().board.columnEntities
  const newEntities: Record<string, Column> = {}
  let hasEntitiesChanged = false

  for (const doc of newDocs) {
    const existing = currentEntities[doc.id]
    if (existing && areColumnsEqual(existing, doc)) {
      newEntities[doc.id] = existing
    } else {
      newEntities[doc.id] = doc
      hasEntitiesChanged = true
    }
  }

  if (!hasEntitiesChanged && Object.keys(currentEntities).length !== newDocs.length) {
    hasEntitiesChanged = true
  }

  const newColIds = newDocs.map((d) => d.id)
  const prevColIds = useStore.getState().board.columnIds
  const isIdsEqual =
    prevColIds.length === newColIds.length &&
    prevColIds.every((id, idx) => id === newColIds[idx])

  if (hasEntitiesChanged || !isIdsEqual) {
    useStore.setState((s) => {
      s.board.columnEntities = newEntities
      s.board.columnIds = isIdsEqual ? prevColIds : newColIds
    })
  }
}

function resetBoardState() {
  useStore.setState((s) => {
    s.board.columnIds = []
    s.board.columnEntities = {}
    s.todos.allIds = []
    s.todos.entities = {}
  })
}

function teardown() {
  unsubscribeTasks?.()
  unsubscribeColumns?.()
  unsubscribeTasks = null
  unsubscribeColumns = null
  activeUid = null
}

export function initFirestoreSync(role: 'admin' | 'member') {
  const uid = auth.currentUser?.uid
  if (!uid) return
  if (uid === activeUid) return

  teardown()
  activeUid = uid

  if (role === 'admin') {
    unsubscribeColumns = onSnapshot(
      query(collection(db, 'columns'), where('userId', '==', uid)),
      (snap) => {
        const docs = snap.docs
          .map((d) => ({ id: d.id, ...d.data() } as Column))
          .sort((a, b) => a.order - b.order)
        reconcileColumns(docs)
      },
      (err) => console.error('[Firestore columns sync error]:', err)
    )

    unsubscribeTasks = onSnapshot(
      query(collection(db, 'tasks'), where('createdBy', '==', uid)),
      (snap) => {
        const docs = snap.docs
          .map((d) => ({ id: d.id, ...d.data() } as Todo))
          .sort((a, b) => a.order - b.order)
        reconcileTasks(docs)
      },
      (err) => console.error('[Firestore tasks sync error]:', err)
    )
  } else {
    let latestTasks: Todo[] = []
    let latestCols: Column[] = []

    const flush = () => {
      const activeColIds = new Set(latestTasks.map((t) => t.columnId))
      const memberCols = latestCols.filter((c) => activeColIds.has(c.id))
      reconcileColumns(memberCols)
      reconcileTasks(latestTasks)
    }

    unsubscribeTasks = onSnapshot(
      query(collection(db, 'tasks'), where('assigneeId', '==', uid)),
      (snap) => {
        latestTasks = snap.docs
          .map((d) => ({ id: d.id, ...d.data() } as Todo))
          .sort((a, b) => a.order - b.order)
        flush()
      },
      (err) => console.warn('[Firestore member tasks sync warning]:', err.message)
    )

    unsubscribeColumns = onSnapshot(
      query(collection(db, 'columns')),
      (snap) => {
        latestCols = snap.docs
          .map((d) => ({ id: d.id, ...d.data() } as Column))
          .sort((a, b) => a.order - b.order)
        flush()
      },
      (err) => console.warn('[Firestore member columns sync warning]:', err.message)
    )
  }
}

export function stopFirestoreSync() {
  teardown()
  resetBoardState()
}

export const useTodos = () => useStore((s) => s.todos)
export const useBoard = () => useStore((s) => s.board)
export const useSettings = () => useStore((s) => s.settings)

export const useTodoItems = () => {
  const allIds = useStore((s) => s.todos.allIds)
  const entities = useStore((s) => s.todos.entities)
  return useMemo(() => allIds.map((id) => entities[id]).filter(Boolean), [allIds, entities])
}

export const useColumnTodos = (columnId: string): Todo[] => {
  return useStore(
    useShallow((s) =>
      s.todos.allIds.filter((id) => s.todos.entities[id]?.columnId === columnId).map((id) => s.todos.entities[id] as Todo)
    )
  )
}

export const useBoardColumns = () => {
  const columnIds = useStore((s) => s.board.columnIds)
  const columnEntities = useStore((s) => s.board.columnEntities)
  return useMemo(() => columnIds.map((id) => columnEntities[id]).filter(Boolean), [columnIds, columnEntities])
}

export const useTodoStats = () => {
  const items = useTodoItems()
  return useMemo(
    () => ({
      totalCount: items.length,
      activeCount: items.filter((i) => !i.completed).length,
      completedCount: items.filter((i) => i.completed).length,
      overdueCount: items.filter((i) => isOverdue(i.dueDate, i.completed)).length,
    }),
    [items]
  )
}

export const useRecentTasks = () => {
  const items = useTodoItems()
  return useMemo(() => [...items].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 3), [items])
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
      .map((i) => ({ ...i, daysLeft: Math.ceil((new Date(i.dueDate).getTime() - todayMs) / 86400000) }))
  }, [items])
}
