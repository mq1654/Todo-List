import { useState, useMemo, useCallback, useEffect } from 'react'
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom'
import { useStoreState, useStoreActions } from '../store'
import { Pagination, Select, Tooltip, Modal } from 'antd'
import { ArrowLeft, Search, Trash2, CheckCircle2, Circle, X, Download, AlertCircle } from 'lucide-react'
import type { Todo, TodoPayload } from '../store/types'
import { getPriorityColor, isOverdue } from '../utils/todoHelpers'

const PAGE_SIZE = 10

const PRIORITY_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'High', label: 'High' },
  { value: 'Medium', label: 'Medium' },
  { value: 'Low', label: 'Low' },
]

const STATUS_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'completed', label: 'Completed' },
  { value: 'overdue', label: 'Overdue' },
]

const VALID_PRIORITIES = ['High', 'Medium', 'Low']
const VALID_STATUSES   = ['active', 'completed', 'overdue']

function PriorityBadge({ priority }: { priority: Todo['priority'] }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${getPriorityColor(priority)}`}>
      {priority}
    </span>
  )
}

function StatusBadge({ completed, overdue }: { completed: boolean; overdue?: boolean }) {
  if (completed) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300">
        <CheckCircle2 size={11} className="text-emerald-500" />
        Completed
      </span>
    )
  }
  
  if (overdue) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300">
        <AlertCircle size={11} className="text-red-500" />
        Overdue
      </span>
    )
  }

  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
      <Circle size={11} />
      Active
    </span>
  )
}

function EmptyDash() {
  return <span className="text-slate-400 dark:text-slate-600">—</span>
}

function formatDate(d: string): string {
  if (!d) return ''
  const [y, m, day] = d.split('-')
  return `${day}/${m}/${y}`
}

interface TableFilters {
  globalSearch:   string
  titleSearch:    string
  categoryFilter: string
  priorityFilter: string
  statusFilter:   string
  currentPage:    number
}

function useTableUrlSync(categories: string[]) {
  const [searchParams, setSearchParams] = useSearchParams()

  function readParams(): TableFilters {
    const page = parseInt(searchParams.get('tPage') ?? '1', 10)
    const cat  = searchParams.get('tCat') ?? 'all'
    const pri  = searchParams.get('tPri') ?? 'all'
    const sta  = searchParams.get('tSta') ?? 'all'

    return {
      globalSearch:   searchParams.get('tQ')    ?? '',
      titleSearch:    searchParams.get('tTitle') ?? '',
      categoryFilter: (categories.includes(cat) || cat === 'all') ? cat : 'all',
      priorityFilter: VALID_PRIORITIES.includes(pri) ? pri : 'all',
      statusFilter:   VALID_STATUSES.includes(sta)   ? sta : 'all',
      currentPage:    Number.isFinite(page) && page > 0 ? page : 1,
    }
  }

  const [filters, setFiltersState] = useState<TableFilters>(readParams)

  useEffect(() => {
    const params = new URLSearchParams(searchParams)

    const set = (key: string, val: string, defaultVal: string) =>
      val !== defaultVal ? params.set(key, val) : params.delete(key)

    set('tQ',     filters.globalSearch,   '')
    set('tTitle', filters.titleSearch,    '')
    set('tCat',   filters.categoryFilter, 'all')
    set('tPri',   filters.priorityFilter, 'all')
    set('tSta',   filters.statusFilter,   'all')
    if (filters.currentPage > 1) params.set('tPage', String(filters.currentPage))
    else params.delete('tPage')

    setSearchParams(params, { replace: true })
  }, [filters])

  function setFilters(patch: Partial<TableFilters>) {
    setFiltersState((prev) => ({ ...prev, ...patch }))
  }

  function resetPage() {
    setFilters({ currentPage: 1 })
  }

  function clearAllFilters() {
    setFilters({
      globalSearch:   '',
      titleSearch:    '',
      categoryFilter: 'all',
      priorityFilter: 'all',
      statusFilter:   'all',
      currentPage:    1,
    })
  }

  return { filters, setFilters, resetPage, clearAllFilters }
}

export default function TableViewPage() {
  const navigate = useNavigate()
  const location = useLocation()

  const items          = useStoreState((s) => s.todos.items)
  const categories     = useStoreState((s): string[] => s.settings?.categories ?? [])
  const remove         = useStoreActions((a) => a.todos.remove)
  const deleteMultiple = useStoreActions((a) => a.todos.deleteMultiple)
  const toggleStatus   = useStoreActions((a) => a.todos.toggleStatus)
  const update         = useStoreActions((a) => a.todos.update)

  const { filters, setFilters, resetPage, clearAllFilters } = useTableUrlSync(categories)
  const { globalSearch, titleSearch, categoryFilter, priorityFilter, statusFilter, currentPage } = filters

  const [selectedIds,    setSelectedIds]    = useState<Set<string>>(new Set())
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null)
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false)

  const categoryOptions = useMemo(() => [
    { value: 'all', label: 'All' },
    ...categories.map((c) => ({ value: c, label: c })),
  ], [categories])

  const filteredData = useMemo(() => {
    const term      = globalSearch.toLowerCase().trim()
    const titleTerm = titleSearch.toLowerCase().trim()

    return items.filter((item) => {
      if (term) {
        const hit =
          item.title.toLowerCase().includes(term)    ||
          item.category.toLowerCase().includes(term) ||
          item.priority.toLowerCase().includes(term) ||
          item.dueDate?.includes(term)               ||
          (item.completed ? 'completed' : 'active').includes(term)
        if (!hit) return false
      }
      if (titleTerm && !item.title.toLowerCase().includes(titleTerm)) return false
      if (categoryFilter !== 'all' && item.category !== categoryFilter) return false
      if (priorityFilter !== 'all' && item.priority !== priorityFilter) return false
      if (statusFilter === 'active'    &&  item.completed) return false
      if (statusFilter === 'completed' && !item.completed) return false
      if (statusFilter === 'overdue'   && !isOverdue(item.dueDate, item.completed)) return false
      return true
    })
  }, [items, globalSearch, titleSearch, categoryFilter, priorityFilter, statusFilter])

  const totalFiltered = filteredData.length

  const pagedData = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE
    return filteredData.slice(start, start + PAGE_SIZE)
  }, [filteredData, currentPage])

  const allPageSelected     = pagedData.length > 0 && pagedData.every((r) => selectedIds.has(r.id))
  const somePageSelected    = pagedData.some((r) => selectedIds.has(r.id)) && !allPageSelected
  const allFilteredSelected = selectedIds.size === totalFiltered && totalFiltered > 0
  const deleteBtnLabel      = allFilteredSelected ? 'Delete All' : `Delete (${selectedIds.size})`

  const toggleSelectAll = useCallback(() => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (allPageSelected) pagedData.forEach((r) => next.delete(r.id))
      else                 pagedData.forEach((r) => next.add(r.id))
      return next
    })
  }, [allPageSelected, pagedData])

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }, [])

  const clearSelection = useCallback(() => setSelectedIds(new Set()), [])

  const handleDelete = useCallback((id: string) => setDeleteTargetId(id), [])

  const confirmDelete = useCallback(() => {
    if (deleteTargetId) {
      remove(deleteTargetId)
      setSelectedIds((prev) => { const n = new Set(prev); n.delete(deleteTargetId); return n })
    }
    setDeleteTargetId(null)
  }, [deleteTargetId, remove])

  const confirmBulkDelete = useCallback(() => {
    deleteMultiple([...selectedIds])
    clearSelection()
    setBulkDeleteOpen(false)
  }, [selectedIds, deleteMultiple, clearSelection])

  const hasActiveFilters = !!(
    globalSearch || titleSearch ||
    categoryFilter !== 'all' || priorityFilter !== 'all' || statusFilter !== 'all'
  )

  const showingStart = (currentPage - 1) * PAGE_SIZE + 1
  const showingEnd   = Math.min(currentPage * PAGE_SIZE, totalFiltered)

  return (
    <div className="min-h-screen bg-slate-50 transition-colors duration-300 dark:bg-slate-900">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10 dark:bg-slate-800 dark:border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center gap-4">
          <button
            onClick={() => navigate('/' + location.search)}
            className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900 transition-colors dark:text-slate-400 dark:hover:text-white"
          >
            <ArrowLeft size={16} />
            Back
          </button>
          <span className="text-slate-300 dark:text-slate-600 select-none">|</span>
          <h1 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight uppercase">
            Table View
          </h1>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
          <div className="relative flex-1 min-w-[220px] max-w-xs">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search all columns..."
              value={globalSearch}
              onChange={(e) => { setFilters({ globalSearch: e.target.value }); resetPage() }}
              className="w-full pl-8 pr-8 py-2 text-sm rounded-lg border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-colors dark:bg-slate-800 dark:border-slate-700 dark:text-white dark:focus:ring-slate-500 dark:placeholder-slate-500"
            />
            {globalSearch && (
              <button
                onClick={() => { setFilters({ globalSearch: '' }); resetPage() }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              >
                <X size={13} />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {selectedIds.size > 0 && (
              <>
                <button
                  onClick={() => setBulkDeleteOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/30"
                >
                  <Trash2 size={13} />
                  {deleteBtnLabel}
                </button>

                <button
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600"
                >
                  <Download size={13} />
                  Export CSV
                </button>

                <button
                  onClick={clearSelection}
                  className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors dark:hover:bg-slate-700 dark:hover:text-slate-200"
                  title="Clear selection"
                >
                  <X size={14} />
                </button>
              </>
            )}

            {hasActiveFilters && selectedIds.size === 0 && (
              <button
                onClick={clearAllFilters}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-500 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-400 dark:hover:text-white"
              >
                <X size={13} />
                Clear all filters
              </button>
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden dark:bg-slate-800 dark:border-slate-700">
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700">
                  <th className="w-10 px-4 py-3">
                    <input
                      type="checkbox"
                      className="w-4 h-4 rounded border-slate-300 accent-slate-900 cursor-pointer dark:border-slate-600 dark:accent-slate-400"
                      checked={allPageSelected}
                      ref={(el) => { if (el) el.indeterminate = somePageSelected }}
                      onChange={toggleSelectAll}
                    />
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-200">Title</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-200">Category</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-200">Priority</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-200">Status</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700 dark:text-slate-200">Due Date</th>
                  <th className="px-4 py-3 text-right font-semibold text-slate-700 dark:text-slate-200">Actions</th>
                </tr>

                <tr className="border-b border-slate-100 bg-slate-50/60 dark:bg-slate-900/30 dark:border-slate-700/60">
                  <td className="px-4 py-2" />

                  <td className="px-4 py-2">
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Search title..."
                        value={titleSearch}
                        onChange={(e) => { setFilters({ titleSearch: e.target.value }); resetPage() }}
                        className="w-full pl-2 pr-6 py-1 text-xs rounded border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 outline-none focus:ring-1 focus:ring-slate-400 transition-colors dark:bg-slate-800 dark:border-slate-600 dark:text-white dark:placeholder-slate-500 dark:focus:ring-slate-500"
                      />
                      {titleSearch && (
                        <button
                          onClick={() => { setFilters({ titleSearch: '' }); resetPage() }}
                          className="absolute right-1.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                        >
                          <X size={11} />
                        </button>
                      )}
                    </div>
                  </td>

                  <td className="px-4 py-2">
                    <Select
                      size="small"
                      value={categoryFilter}
                      onChange={(v) => { setFilters({ categoryFilter: v }); resetPage() }}
                      options={categoryOptions}
                      className="w-full"
                      popupMatchSelectWidth={false}
                    />
                  </td>

                  <td className="px-4 py-2">
                    <Select
                      size="small"
                      value={priorityFilter}
                      onChange={(v) => { setFilters({ priorityFilter: v }); resetPage() }}
                      options={PRIORITY_OPTIONS}
                      className="w-full"
                      popupMatchSelectWidth={false}
                    />
                  </td>

                  <td className="px-4 py-2">
                    <Select
                      size="small"
                      value={statusFilter}
                      onChange={(v) => { setFilters({ statusFilter: v }); resetPage() }}
                      options={STATUS_OPTIONS}
                      className="w-full"
                      popupMatchSelectWidth={false}
                    />
                  </td>

                  <td className="px-4 py-2" />
                  <td className="px-4 py-2" />
                </tr>
              </thead>

              <tbody>
                {pagedData.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-16 text-center text-sm text-slate-400 dark:text-slate-500">
                      No tasks found
                    </td>
                  </tr>
                ) : (
                  pagedData.map((item, idx) => {
                    const isSelected    = selectedIds.has(item.id)
                    const formattedDate = formatDate(item.dueDate)

                    return (
                      <tr
                        key={item.id}
                        className={[
                          'border-b border-slate-100 dark:border-slate-700/60 transition-colors',
                          isSelected
                            ? 'bg-slate-100 dark:bg-slate-700/40'
                            : idx % 2 === 1
                              ? 'bg-slate-50/50 dark:bg-slate-900/20 hover:bg-slate-50 dark:hover:bg-slate-700/20'
                              : 'hover:bg-slate-50 dark:hover:bg-slate-700/20',
                        ].join(' ')}
                      >
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            className="w-4 h-4 rounded border-slate-300 accent-slate-900 cursor-pointer dark:border-slate-600 dark:accent-slate-400"
                            checked={isSelected}
                            onChange={() => toggleSelect(item.id)}
                          />
                        </td>

                        <td className="px-4 py-3">
                          <button
                            onClick={() => navigate(`/todoDetail/${item.id}`)}
                            className={[
                              'text-left text-sm font-medium hover:underline transition-colors',
                              item.completed
                                ? 'line-through text-slate-400 dark:text-slate-500'
                                : 'text-slate-900 dark:text-white',
                            ].join(' ')}
                          >
                            {item.title}
                          </button>
                        </td>

                        <td className="px-4 py-3 text-slate-600 dark:text-slate-400 text-sm">
                          {item.category || <EmptyDash />}
                        </td>

                        <td className="px-4 py-3">
                          <PriorityBadge priority={item.priority} />
                        </td>

                        <td className="px-4 py-3">
                          <button onClick={() => toggleStatus(item.id)} title="Click to toggle status">
                            <StatusBadge completed={item.completed} overdue={isOverdue(item.dueDate, item.completed)} />
                          </button>
                        </td>

                        <td className="px-4 py-3 text-slate-600 dark:text-slate-400 text-sm">
                          {formattedDate || <EmptyDash />}
                        </td>

                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1">
                            <Tooltip title="Delete">
                              <button
                                onClick={() => handleDelete(item.id)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors dark:hover:bg-red-900/20 dark:hover:text-red-400"
                              >
                                <Trash2 size={14} />
                              </button>
                            </Tooltip>
                          </div>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 dark:border-slate-700">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {totalFiltered === 0 ? (
                'No tasks'
              ) : totalFiltered <= PAGE_SIZE ? (
                <>Showing <span className="font-semibold text-slate-700 dark:text-slate-200">{totalFiltered}</span> task{totalFiltered !== 1 ? 's' : ''}</>
              ) : (
                <>Showing <span className="font-semibold text-slate-700 dark:text-slate-200">{showingStart}–{showingEnd}</span> of <span className="font-semibold text-slate-700 dark:text-slate-200">{totalFiltered}</span> tasks</>
              )}
            </p>

            {totalFiltered > PAGE_SIZE && (
              <Pagination
                current={currentPage}
                total={totalFiltered}
                pageSize={PAGE_SIZE}
                onChange={(page) => { setFilters({ currentPage: page }); clearSelection() }}
                showSizeChanger={false}
                size="small"
                itemRender={(page, type, originalElement) => {
                  if (type === 'prev') {
                    if (currentPage === 1) return <span className="hidden" />
                    return (
                      <button className="px-2 py-1 text-xs !text-slate-500 dark:!text-slate-400 hover:!text-slate-900 dark:hover:!text-white transition-colors cursor-pointer focus:outline-none">
                        ‹ Previous
                      </button>
                    )
                  }
                  if (type === 'next') {
                    return (
                      <button className="px-2 py-1 text-xs !text-slate-500 dark:!text-slate-400 hover:!text-slate-900 dark:hover:!text-white transition-colors cursor-pointer focus:outline-none">
                        Next ›
                      </button>
                    )
                  }
                  if (type === 'page') {
                    const isActive = page === currentPage
                    return (
                      <button
                        className={[
                          'w-7 h-7 flex items-center justify-center text-xs transition-all cursor-pointer focus:outline-none',
                          isActive
                            ? 'font-bold text-slate-900 dark:text-white underline underline-offset-4 decoration-2'
                            : 'font-medium text-slate-500 dark:text-slate-400 hover:font-semibold hover:text-slate-800 dark:hover:text-slate-200',
                        ].join(' ')}
                      >
                        {page}
                      </button>
                    )
                  }
                  return originalElement
                }}
              />
            )}
          </div>
        </div>
      </main>

      <Modal
        open={!!deleteTargetId}
        onOk={confirmDelete}
        onCancel={() => setDeleteTargetId(null)}
        okText="Delete"
        cancelText="Cancel"
        okButtonProps={{ danger: true }}
        title="Delete task"
        width={380}
      >
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Are you sure you want to delete this task? This action cannot be undone.
        </p>
      </Modal>

      <Modal
        open={bulkDeleteOpen}
        onOk={confirmBulkDelete}
        onCancel={() => setBulkDeleteOpen(false)}
        okText={allFilteredSelected ? `Delete all ${selectedIds.size} tasks` : `Delete ${selectedIds.size} task${selectedIds.size !== 1 ? 's' : ''}`}
        cancelText="Cancel"
        okButtonProps={{ danger: true }}
        title={allFilteredSelected ? 'Delete all tasks' : 'Delete selected tasks'}
        width={400}
      >
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Are you sure you want to delete{' '}
          <span className="font-semibold">
            {allFilteredSelected ? 'all' : selectedIds.size}
          </span>{' '}
          task{selectedIds.size !== 1 ? 's' : ''}? This action cannot be undone.
        </p>
      </Modal>
    </div>
  )
}
