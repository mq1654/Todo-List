import { useSearchParams } from 'react-router-dom';
import { useStoreState } from '../store';
import type { Todo } from '../store/types';
import { useMemo } from 'react';

const priorityValue: Record<string, number> = { High: 3, Medium: 2, Low: 1 };

export function getFilteredItems(items: Todo[], searchParams: URLSearchParams) {
  const filter = searchParams.get('filter') || 'all';
  const searchTerm = (searchParams.get('searchTerm') || '').toLowerCase().trim();
  const categoryFilter = searchParams.get('categoryFilter') || 'all';
  const sortByPriority = searchParams.get('sortByPriority') === 'true';
  const showOverdueOnly = searchParams.get('showOverdueOnly') === 'true';
  const todayStr = new Date().toISOString().split('T')[0];

  let result = items.filter((item) => {
    if (filter === 'active') return !item.completed;
    if (filter === 'completed') return item.completed;
    return true;
  });

  if (categoryFilter !== 'all') {
    result = result.filter((item) => item.category === categoryFilter);
  }

  if (showOverdueOnly) {
    result = result.filter((item) => {
      if (item.completed || !item.dueDate) return false;
      return item.dueDate < todayStr;
    });
  }

  if (searchTerm) {
    result = result.filter((item) => {
      return (
        item.title.toLowerCase().includes(searchTerm) ||
        (item.description && item.description.toLowerCase().includes(searchTerm))
      );
    });
  }

  if (sortByPriority) {
    result = [...result].sort((a, b) => priorityValue[b.priority] - priorityValue[a.priority]);
  }

  return result;
}

const arraysEqual = (a: string[], b: string[]) => a.length === b.length && a.every((v, i) => v === b[i]);

export function useTodosFilter() {
  const [searchParams, setSearchParams] = useSearchParams();

  const filteredIds = useStoreState((state) => {
    const items = state.todos.allIds.map(id => state.todos.entities[id]).filter(Boolean);
    return getFilteredItems(items, searchParams).map(t => t.id);
  }, arraysEqual);

  const setFilterParam = (key: string, value: string | boolean) => {
    const nextParams = new URLSearchParams(searchParams);
    if (value === '' || value === false || value === 'all') {
      if (key === 'filter' && value === 'all') nextParams.delete(key);
      else if (key === 'categoryFilter' && value === 'all') nextParams.delete(key);
      else nextParams.delete(key);
    } else {
      nextParams.set(key, String(value));
    }
    setSearchParams(nextParams, { replace: true });
  };

  const toggleFilterParam = (key: string) => {
    const currentValue = searchParams.get(key) === 'true';
    setFilterParam(key, !currentValue);
  };

  return {
    filteredIds,
    filter: searchParams.get('filter') || 'all',
    searchTerm: searchParams.get('searchTerm') || '',
    categoryFilter: searchParams.get('categoryFilter') || 'all',
    sortByPriority: searchParams.get('sortByPriority') === 'true',
    showOverdueOnly: searchParams.get('showOverdueOnly') === 'true',
    setFilterParam,
    toggleFilterParam
  };
}
