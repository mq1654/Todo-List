import { useCallback, useDeferredValue } from 'react'
import { useSearchParams } from 'react-router-dom'
import type { Todo } from '../store/types'

const priorityValue: Record<string, number> = { High: 3, Medium: 2, Low: 1 }

function applyFilters(
  items: Todo[],
  searchTerm: string,
  categoryFilter: string,
  sortByPriority: boolean,
  showOverdueOnly: boolean
): Todo[] {
  const term = searchTerm.toLowerCase().trim()
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

  if (term) {
    result = result.filter(
      (item) =>
        item.title.toLowerCase().includes(term) ||
        (item.description && item.description.toLowerCase().includes(term))
    )
  }

  if (sortByPriority) {
    result = [...result].sort((a, b) => priorityValue[b.priority] - priorityValue[a.priority])
  }

  return result
}

export function useTodosFilter() {
  const [searchParams, setSearchParams] = useSearchParams()
  
  const searchTerm = searchParams.get('searchTerm') || ''
  const deferredSearchTerm = useDeferredValue(searchTerm)
  
  const categoryFilter = searchParams.get('categoryFilter') || 'all'
  const sortByPriority = searchParams.get('sortByPriority') === 'true'
  const showOverdueOnly = searchParams.get('showOverdueOnly') === 'true'

  const filterTodos = useCallback((items: Todo[]): string[] => {
    return applyFilters(items, deferredSearchTerm, categoryFilter, sortByPriority, showOverdueOnly).map((t) => t.id)
  }, [deferredSearchTerm, categoryFilter, sortByPriority, showOverdueOnly])

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
    searchTerm,
    deferredSearchTerm,
    categoryFilter,
    sortByPriority,
    showOverdueOnly,
    setFilterParam,
    toggleFilterParam,
    filterTodos
  }
}
