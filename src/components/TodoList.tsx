import { useState, useCallback, useMemo, useEffect } from 'react';
import { useStoreState, useStoreActions } from '../store';
import { useTodosFilter } from '../hooks/useTodosFilter';
import type { TodoModel } from '../store/types';
import { ClipboardList, Trash2, X, ChevronDown } from 'lucide-react';
import { Droppable, Draggable } from '@hello-pangea/dnd';
import TodoItem from './TodoItem';

const PAGE_STEP = 5

interface EmptyStateProps {
  filter: string;
  searchTerm: string;
}
function EmptyState({ filter, searchTerm }: EmptyStateProps) {
  const isFiltered = filter !== 'all' || searchTerm.trim().length > 0;

  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center mb-4">
        <ClipboardList size={22} className="text-slate-400" />
      </div>
      <p className="text-sm font-semibold text-slate-700">
        {isFiltered ? 'No tasks match your criteria' : 'No tasks yet'}
      </p>
      <p className="mt-1 text-xs text-slate-400">
        {isFiltered
          ? 'Try adjusting your search or filter.'
          : 'Add your first task using the form above.'}
      </p>
    </div>
  )
}

function TodoList() {
  const { filteredIds, filter, searchTerm } = useTodosFilter()
  const deleteMultiple = useStoreActions((actions) => actions.todos.deleteMultiple)

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [visibleCount, setVisibleCount] = useState(PAGE_STEP);

  useEffect(() => {
    setVisibleCount(PAGE_STEP)
  }, [filter, searchTerm])

  const visibleIds = useMemo(() => filteredIds.slice(0, visibleCount), [filteredIds, visibleCount])
  const remaining = Math.max(0, filteredIds.length - visibleCount)

  const handleToggleSelect = useCallback((id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  const isAllSelected = useMemo(() => {
    if (filteredIds.length === 0) return false;
    return filteredIds.every(id => selectedIds.has(id));
  }, [filteredIds, selectedIds]);

  const handleSelectClick = useCallback(() => {
    setIsSelectionMode(true);
  }, []);

  const handleSelectAll = useCallback(() => {
    setSelectedIds(new Set(filteredIds));
  }, [filteredIds]);

  const handleCancelSelection = useCallback(() => {
    setSelectedIds(new Set());
    setIsSelectionMode(false);
  }, []);

  const handleLongPress = useCallback((id: string) => {
    setIsSelectionMode(true);
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  }, []);

  const handleDeleteSelected = useCallback(() => {
    if (selectedIds.size === 0) return;
    if (window.confirm(`Are you sure you want to delete ${selectedIds.size} selected item(s)?`)) {
      deleteMultiple(Array.from(selectedIds));
      setSelectedIds(new Set());
      setIsSelectionMode(false);
    }
  }, [selectedIds, deleteMultiple]);

  const handleDeleteAll = useCallback(() => {
    if (filteredIds.length === 0) return;
    if (window.confirm(`Are you sure you want to delete ALL ${filteredIds.length} item(s) in this view?`)) {
      deleteMultiple(filteredIds);
      setSelectedIds(new Set());
      setIsSelectionMode(false);
    }
  }, [filteredIds, deleteMultiple]);

  if (filteredIds.length === 0) {
    return <EmptyState filter={filter} searchTerm={searchTerm} />
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-end gap-3 px-1 mb-1">
        {isSelectionMode && (
          <button
            onClick={handleCancelSelection}
            className="p-1 bg-slate-200 text-slate-600 hover:bg-slate-300 rounded-full dark:bg-slate-700 dark:text-slate-300 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-500"
          >
            <X size={14} />
          </button>
        )}

        {isSelectionMode && selectedIds.size > 0 && !isAllSelected && (
          <button
            onClick={handleDeleteSelected}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-red-600 bg-red-50 border border-red-200 hover:bg-red-100 rounded-lg transition-colors dark:text-red-400 dark:bg-red-900/30 dark:border-red-900/50 dark:hover:bg-red-900/50 focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            <Trash2 size={14} />
            Delete Selected ({selectedIds.size})
          </button>
        )}

        {isSelectionMode && isAllSelected && (
          <button
            onClick={handleDeleteAll}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-500 bg-slate-100 border border-transparent hover:bg-slate-200 hover:text-red-600 rounded-lg transition-colors dark:text-slate-400 dark:bg-slate-800/80 dark:border-slate-700/50 dark:hover:bg-slate-800 dark:hover:text-red-400 focus:outline-none focus:ring-2 focus:ring-slate-500"
          >
            <Trash2 size={14} />
            Delete All
          </button>
        )}

        {!isSelectionMode ? (
          <button
            onClick={handleSelectClick}
            className="text-sm font-bold text-slate-700 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white transition-colors select-none focus:outline-none"
          >
            Select
          </button>
        ) : (
          <button
            onClick={isAllSelected ? handleCancelSelection : handleSelectAll}
            className="text-sm font-bold text-slate-700 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white transition-colors select-none focus:outline-none"
          >
            Select All
          </button>
        )}
      </div>

      <Droppable droppableId="todo-list">
        {(provided) => (
          <ul
            className="space-y-2.5"
            {...provided.droppableProps}
            ref={provided.innerRef}
          >
            {visibleIds.map((id, index) => (
              <Draggable key={id} draggableId={id} index={index}>
                {(provided) => (
                  <li
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                  >
                    <TodoItem
                      id={id}
                      isSelected={selectedIds.has(id)}
                      isSelectionMode={isSelectionMode}
                      onToggleSelect={handleToggleSelect}
                      onLongPress={handleLongPress}
                    />
                  </li>
                )}
              </Draggable>
            ))}
            {provided.placeholder}
          </ul>
        )}
      </Droppable>

      {remaining > 0 && (
        <button
          onClick={() => setVisibleCount(v => v + PAGE_STEP)}
          className="w-full flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-all group focus:outline-none cursor-pointer"
        >
          View more
        </button>
      )}
    </div>
  )
}

export default TodoList
