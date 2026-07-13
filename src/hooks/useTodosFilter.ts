import { useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useStore } from '../store'
import type { Todo } from '../store/types'

const priorityValue: Record<string, number> = { High: 3, Medium: 2, Low: 1 }

function applyFilters(items: Todo[], searchParams: URLSearchParams): Todo[] {
  const searchTerm = (searchParams.get('searchTerm') || '').toLowerCase().trim()
  const categoryFilter = searchParams.get('categoryFilter') || 'all'
  const sortByPriority = searchParams.get('sortByPriority') === 'true'
  const showOverdueOnly = searchParams.get('showOverdueOnly') === 'true'
  const todayStr = new Date().toISOString().split('T')[0]

  let result = items

  if (categoryFilter !== 'all') {
    result = result.filter((item) => {
      const itemCats = Array.isArray(item.category)
        ? item.category
        : (item.category || '').toString().split(',').map((c) => c.trim())
      return itemCats.includes(categoryFilter)
    })
  }

  if (showOverdueOnly) {
    result = result.filter((item) => !item.completed && !!item.dueDate && item.dueDate < todayStr)
  }

  if (searchTerm) {
    result = result.filter(
      (item) =>
        item.title.toLowerCase().includes(searchTerm) ||
        (item.description && item.description.toLowerCase().includes(searchTerm))
    )
  }

  if (sortByPriority) {
    result = [...result].sort((a, b) => priorityValue[b.priority] - priorityValue[a.priority])
  }

  return result
}

export function useTodosFilter() {
  const [searchParams, setSearchParams] = useSearchParams()
  const entities = useStore((s) => s.todos.entities)

  const getFilteredIds = useCallback((todoIds: string[]): string[] => {
    const items = todoIds.map((id) => entities[id]).filter(Boolean) as Todo[]
    return applyFilters(items, searchParams).map((t) => t.id)
  }, [entities, searchParams])

  const setFilterParam = (key: string, value: string | boolean) => {
    const nextParams = new URLSearchParams(searchParams)
    if (!value || value === 'all') nextParams.delete(key)
    else nextParams.set(key, String(value))
    setSearchParams(nextParams, { replace: true })
  }

  const toggleFilterParam = (key: string) => {
    setFilterParam(key, searchParams.get(key) !== 'true')
  }

  return {
    getFilteredIds,
    searchTerm: searchParams.get('searchTerm') || '',
    categoryFilter: searchParams.get('categoryFilter') || 'all',
    sortByPriority: searchParams.get('sortByPriority') === 'true',
    showOverdueOnly: searchParams.get('showOverdueOnly') === 'true',
    setFilterParam,
    toggleFilterParam,
  }
}
