export const TODO_KEYS = ['filter', 'searchTerm', 'categoryFilter', 'sortByPriority', 'showOverdueOnly'];
export const TABLE_KEYS = ['tQ', 'tTitle', 'tCat', 'tPri', 'tSta', 'tPage'];

export function keepParams(search: string, keysToKeep: string[]) {
  const params = new URLSearchParams(search);
  const newParams = new URLSearchParams();
  keysToKeep.forEach(k => {
    if (params.has(k)) {
      newParams.set(k, params.get(k)!);
    }
  });
  const str = newParams.toString();
  return str ? `?${str}` : '';
}
