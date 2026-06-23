import { action, computed } from 'easy-peasy'

const priorityValue = { High: 3, Medium: 2, Low: 1 }

const todoModel = {
  items: [],
  filter: 'all',
  searchTerm: '',
  categoryFilter: 'all',
  sortByPriority: false,
  showOverdueOnly: false,

  totalCount: computed((state) => state.items.length),
  activeCount: computed((state) => state.items.filter((i) => !i.completed).length),
  completedCount: computed((state) => state.items.filter((i) => i.completed).length),

  filteredItems: computed((state) => {
    const term = state.searchTerm.toLowerCase().trim()
    const todayStr = new Date().toISOString().split('T')[0]

    let result = state.items.filter((item) => {
      if (state.filter === 'active') return !item.completed
      if (state.filter === 'completed') return item.completed
      return true
    })

    if (state.categoryFilter !== 'all') {
      result = result.filter((item) => item.category === state.categoryFilter)
    }

    if (state.showOverdueOnly) {
      result = result.filter((item) => {
        if (item.completed || !item.dueDate) return false
        return item.dueDate < todayStr
      })
    }

    if (term) {
      result = result.filter((item) => {
        return (
          item.title.toLowerCase().includes(term) ||
          (item.description && item.description.toLowerCase().includes(term))
        )
      })
    }

    if (state.sortByPriority) {
      result = [...result].sort((a, b) => priorityValue[b.priority] - priorityValue[a.priority])
    } else {
      result = [...result].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    }

    return result
  }),

  add: action((state, payload) => {
    state.items.push({
      id: crypto.randomUUID(),
      title: payload.title.trim(),
      description: payload.description ? payload.description.trim() : '',
      category: payload.category,
      priority: payload.priority,
      dueDate: payload.dueDate || '',
      completed: false,
      createdAt: new Date().toISOString(),
    })
  }),

  remove: action((state, id) => {
    state.items = state.items.filter((item) => item.id !== id)
  }),

  update: action((state, payload) => {
    const index = state.items.findIndex((item) => item.id === payload.id)
    if (index !== -1) {
      state.items[index] = {
        ...state.items[index],
        title: payload.title.trim(),
        description: payload.description ? payload.description.trim() : '',
        category: payload.category,
        priority: payload.priority,
        dueDate: payload.dueDate || '',
        updatedAt: new Date().toISOString(),
      }
    }
  }),

  toggleStatus: action((state, id) => {
    const item = state.items.find((item) => item.id === id)
    if (item) {
      item.completed = !item.completed
    }
  }),

  setFilter: action((state, filter) => {
    state.filter = filter
  }),

  setSearchTerm: action((state, term) => {
    state.searchTerm = term
  }),

  setCategoryFilter: action((state, category) => {
    state.categoryFilter = category
  }),

  toggleSortByPriority: action((state) => {
    state.sortByPriority = !state.sortByPriority
  }),

  toggleShowOverdueOnly: action((state) => {
    state.showOverdueOnly = !state.showOverdueOnly
  }),

  migrateCategory: action((state, payload) => {
    const { from, to } = payload
    state.items.forEach(item => {
      if (item.category === from) {
        item.category = to
      }
    })
    if (state.categoryFilter === from) {
      state.categoryFilter = 'all'
    }
  }),
}

export default todoModel
