import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useStoreState, useStoreActions } from '../store';

export function useUrlSync() {
  const [searchParams, setSearchParams] = useSearchParams();

  const filter = useStoreState((state) => state.todos.filter);
  const searchTerm = useStoreState((state) => state.todos.searchTerm);
  const categoryFilter = useStoreState((state) => state.todos.categoryFilter);
  const sortByPriority = useStoreState((state) => state.todos.sortByPriority);
  const showOverdueOnly = useStoreState((state) => state.todos.showOverdueOnly);

  const setFilter = useStoreActions((actions) => actions.todos.setFilter);
  const setSearchTerm = useStoreActions((actions) => actions.todos.setSearchTerm);
  const setCategoryFilter = useStoreActions((actions) => actions.todos.setCategoryFilter);
  const setSortByPriority = useStoreActions((actions) => actions.todos.setSortByPriority);
  const setShowOverdueOnly = useStoreActions((actions) => actions.todos.setShowOverdueOnly);

  useEffect(() => {
    const urlFilter = searchParams.get('filter');
    const urlSearchTerm = searchParams.get('searchTerm');
    const urlCategory = searchParams.get('categoryFilter');
    const urlSort = searchParams.get('sortByPriority');
    const urlOverdue = searchParams.get('showOverdueOnly');

    if (urlFilter && ['all', 'active', 'completed'].includes(urlFilter)) {
      setFilter(urlFilter as 'all' | 'active' | 'completed');
    }
    if (urlSearchTerm !== null) {
      setSearchTerm(urlSearchTerm);
    }
    if (urlCategory !== null) {
      setCategoryFilter(urlCategory);
    }
    
    if (urlSort !== null) {
      setSortByPriority(urlSort === 'true');
    }
    
    if (urlOverdue !== null) {
      setShowOverdueOnly(urlOverdue === 'true');
    }
  }, []);

  useEffect(() => {
    const params = new URLSearchParams();

    if (filter !== 'all') params.set('filter', filter);
    if (searchTerm) params.set('searchTerm', searchTerm);
    if (categoryFilter !== 'all') params.set('categoryFilter', categoryFilter);
    if (sortByPriority) params.set('sortByPriority', 'true');
    if (showOverdueOnly) params.set('showOverdueOnly', 'true');

    setSearchParams(params, { replace: true });
  }, [filter, searchTerm, categoryFilter, sortByPriority, showOverdueOnly, setSearchParams]);
}
