import { useState, useMemo, useCallback, useDeferredValue } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useStore, useTodoItems, useBoardColumns } from '../store'
import { Select, Tooltip, Modal, Table, Input, Button, Typography, Card, Avatar } from 'antd'
import { Search, Trash2, CheckCircle2, Circle, Download, AlertCircle } from 'lucide-react'
import type { Todo } from '../store/types'
import { getPriorityColor, isOverdue, exportTodosToCSV, formatDueDate, parseCategories } from '../utils/todoHelpers'
import { useMembers } from '../hooks/useMembers'
import { useAuth } from '../hooks/useAuth'

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
  return formatDueDate(d)
}

interface TableFilters {
  globalSearch:   string
  titleSearch:    string
  categoryFilter: string
  priorityFilter: string
  statusFilter:   string
  columnFilter:   string
  currentPage:    number
}

function useTableUrlSync(categories: string[], columnIds: string[]) {
  const [searchParams, setSearchParams] = useSearchParams()

  const filters = useMemo<TableFilters>(() => {
    const page = parseInt(searchParams.get('tPage') ?? '1', 10)
    const cat  = searchParams.get('tCat') ?? 'all'
    const pri  = searchParams.get('tPri') ?? 'all'
    const sta  = searchParams.get('tSta') ?? 'all'
    const col  = searchParams.get('tCol') ?? 'all'

    return {
      globalSearch:   searchParams.get('tQ')    ?? '',
      titleSearch:    searchParams.get('tTitle') ?? '',
      categoryFilter: (categories.includes(cat) || cat === 'all') ? cat : 'all',
      priorityFilter: VALID_PRIORITIES.includes(pri) ? pri : 'all',
      statusFilter:   VALID_STATUSES.includes(sta)   ? sta : 'all',
      columnFilter:   (columnIds.includes(col) || col === 'all') ? col : 'all',
      currentPage:    Number.isFinite(page) && page > 0 ? page : 1,
    }
  }, [searchParams, categories, columnIds])

  const setFilters = (patch: Partial<TableFilters>) => {
    const nextFilters = { ...filters, ...patch }
    const params = new URLSearchParams(searchParams)

    const set = (key: string, val: string, defaultVal: string) =>
      val !== defaultVal ? params.set(key, val) : params.delete(key)

    set('tQ',     nextFilters.globalSearch,   '')
    set('tTitle', nextFilters.titleSearch,    '')
    set('tCat',   nextFilters.categoryFilter, 'all')
    set('tPri',   nextFilters.priorityFilter, 'all')
    set('tSta',   nextFilters.statusFilter,   'all')
    set('tCol',   nextFilters.columnFilter,   'all')

    if (nextFilters.currentPage > 1) params.set('tPage', String(nextFilters.currentPage))
    else params.delete('tPage')

    setSearchParams(params, { replace: true })
  }

  const clearAllFilters = () => {
    setFilters({
      globalSearch:   '',
      titleSearch:    '',
      categoryFilter: 'all',
      priorityFilter: 'all',
      statusFilter:   'all',
      columnFilter:   'all',
      currentPage:    1,
    })
  }

  return { filters, setFilters, resetPage: () => setFilters({ currentPage: 1 }), clearAllFilters }
}

export default function TableViewPage() {
  const navigate = useNavigate()

  const items          = useTodoItems()
  const categories     = useStore((s) => s.settings.categories)
  const remove         = useStore((s) => s.todos.remove)
  const updateTodo     = useStore((s) => s.todos.update)
  const deleteMultiple = useStore((s) => s.todos.deleteMultiple)
  const moveTodoToColumn = useStore((s) => s.todos.moveTodoToColumn)
  const columnsData        = useBoardColumns()
  const { activeMembers } = useMembers()
  const { user, role } = useAuth()
  
  const columnIds = useMemo(() => columnsData.map((c) => c.id), [columnsData])
  const columnNames = useMemo(
    () => Object.fromEntries(columnsData.map((c) => [c.id, c.name])),
    [columnsData]
  )

  const { filters, setFilters, clearAllFilters } = useTableUrlSync(categories, columnIds)
  const { globalSearch, titleSearch, categoryFilter, priorityFilter, statusFilter, columnFilter, currentPage } = filters

  const deferredGlobalSearch = useDeferredValue(globalSearch)
  const deferredTitleSearch  = useDeferredValue(titleSearch)

  const [selectedIds,    setSelectedIds]    = useState<Set<string>>(new Set())
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null)
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false)

  const categoryOptions = useMemo(() => [
    { value: 'all', label: 'All' },
    ...categories.map((c) => ({ value: c, label: c })),
  ], [categories])

  const columnOptions = useMemo(() => [
    { value: 'all', label: 'All Columns' },
    ...columnsData.map((c) => ({ value: c.id, label: c.name })),
  ], [columnsData])

  const filteredData = useMemo(() => {
    const term      = deferredGlobalSearch.toLowerCase().trim()
    const titleTerm = deferredTitleSearch.toLowerCase().trim()

    return items.filter((item) => {
      const itemCats = parseCategories(item.category)

      if (term) {
        const colName = (columnNames[item.columnId] ?? '').toLowerCase()
        const catStr = itemCats.join(', ').toLowerCase()
        const hit =
          item.title.toLowerCase().includes(term)    ||
          catStr.includes(term)                      ||
          item.priority.toLowerCase().includes(term) ||
          item.dueDate?.includes(term)               ||
          colName.includes(term)                     ||
          (item.completed ? 'completed' : 'active').includes(term)
        if (!hit) return false
      }
      if (titleTerm && !item.title.toLowerCase().includes(titleTerm)) return false
      if (categoryFilter !== 'all' && !itemCats.includes(categoryFilter)) return false
      if (priorityFilter !== 'all' && item.priority !== priorityFilter) return false
      if (columnFilter !== 'all' && item.columnId !== columnFilter) return false
      if (statusFilter === 'active'    && (item.completed || isOverdue(item.dueDate, item.completed))) return false
      if (statusFilter === 'completed' && !item.completed) return false
      if (statusFilter === 'overdue'   && !isOverdue(item.dueDate, item.completed)) return false
      return true
    })
  }, [items, deferredGlobalSearch, deferredTitleSearch, categoryFilter, priorityFilter, statusFilter, columnFilter, columnNames])

  const totalFiltered = filteredData.length
  const allFilteredSelected = selectedIds.size === totalFiltered && totalFiltered > 0
  const deleteBtnLabel      = allFilteredSelected ? 'Delete All' : `Delete (${selectedIds.size})`

  const clearSelection  = useCallback(() => setSelectedIds(new Set()), [])

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
    categoryFilter !== 'all' || priorityFilter !== 'all' || statusFilter !== 'all' || columnFilter !== 'all'
  )

  const columns = [
    {
      title: (
        <div className="space-y-2">
          <div>Title</div>
          <Input
            placeholder="Search title..."
            value={titleSearch}
            onChange={(e) => setFilters({ titleSearch: e.target.value, currentPage: 1 })}
            allowClear
            size="small"
          />
        </div>
      ),
      dataIndex: 'title',
      key: 'title',
      render: (text: string, item: Todo) => (
        <Button
          type="link"
          onClick={() => navigate(`/todoDetail/${item.id}`)}
          className={`p-0 h-auto text-left font-medium ${item.completed ? 'line-through !text-slate-400 dark:!text-slate-500' : '!text-slate-900 dark:!text-white'}`}
        >
          {text}
        </Button>
      ),
    },
    {
      title: (
        <div className="space-y-2">
          <div>Category</div>
          <Select 
            size="small" 
            value={categoryFilter} 
            onChange={(v) => setFilters({ categoryFilter: v, currentPage: 1 })} 
            options={categoryOptions} 
            className="w-full min-w-[100px]" 
            popupMatchSelectWidth={false} 
          />
        </div>
      ),
      dataIndex: 'category',
      key: 'category',
      render: (category: string) => {
        return <span className="text-slate-900 dark:text-white text-sm">{category || <EmptyDash />}</span>
      },
    },
    {
      title: (
        <div className="space-y-2">
          <div>Priority</div>
          <Select 
            size="small" 
            value={priorityFilter} 
            onChange={(v) => setFilters({ priorityFilter: v, currentPage: 1 })} 
            options={PRIORITY_OPTIONS} 
            className="w-full min-w-[90px]" 
            popupMatchSelectWidth={false} 
          />
        </div>
      ),
      dataIndex: 'priority',
      key: 'priority',
      render: (priority: Todo['priority']) => <PriorityBadge priority={priority} />,
    },
    {
      title: (
        <div className="space-y-2">
          <div>Column</div>
          <Select 
            size="small" 
            value={columnFilter} 
            onChange={(v) => setFilters({ columnFilter: v, currentPage: 1 })} 
            options={columnOptions} 
            className="w-full min-w-[120px]" 
            popupMatchSelectWidth={false} 
          />
        </div>
      ),
      key: 'columnId',
      render: (_: unknown, item: Todo) => (
        <Select
          size="small"
          value={item.columnId}
          onChange={(colId) => moveTodoToColumn(item.id, colId)}
          options={columnsData.map((c) => ({ value: c.id, label: c.name }))}
          className="w-full min-w-[120px]"
          popupMatchSelectWidth={false}
        />
      ),
    },
    {
      title: (
        <div className="space-y-2">
          <div>Status</div>
          <Select 
            size="small" 
            value={statusFilter} 
            onChange={(v) => setFilters({ statusFilter: v, currentPage: 1 })} 
            options={STATUS_OPTIONS} 
            className="w-full min-w-[100px]" 
            popupMatchSelectWidth={false} 
          />
        </div>
      ),
      key: 'status',
      render: (_: unknown, item: Todo) => <StatusBadge completed={item.completed} overdue={isOverdue(item.dueDate, item.completed)} />,
    },
    {
      title: <div className="mt-7">Assignee</div>,
      key: 'assigneeId',
      render: (_: unknown, item: Todo) => {
        const assignee = activeMembers.find((m) => m.uid === item.assigneeId)
        if (role === 'member') {
          const displayName = assignee?.name || (item.assigneeId && user && item.assigneeId === user.uid ? (user.displayName || user.email?.split('@')[0]) : null)
          return displayName ? (
            <div className="flex items-center gap-2">
              <Avatar size={22} className="bg-blue-600 text-white dark:bg-blue-500 font-bold text-[10px]">
                {displayName[0]?.toUpperCase()}
              </Avatar>
              <span className="text-sm font-medium text-slate-800 dark:text-slate-200">{displayName}</span>
            </div>
          ) : <EmptyDash />
        }
        return (
          <Select
            size="small"
            value={item.assigneeId ?? 'unassigned'}
            onChange={(val) => updateTodo({ id: item.id, title: item.title, description: item.description, category: item.category, priority: item.priority, dueDate: item.dueDate, assigneeId: val === 'unassigned' ? null : val })}
            className="w-full min-w-[130px] [&_.ant-select-selector]:!rounded-md"
            popupMatchSelectWidth={false}
          >
            <Select.Option value="unassigned">
              <span className="text-slate-400 dark:text-slate-500 italic text-xs">Unassigned</span>
            </Select.Option>
            {activeMembers.map((m) => (
              <Select.Option key={m.uid} value={m.uid}>
                <div className="flex items-center gap-2">
                  <Avatar size={18} className="bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400 text-[9px] font-bold">
                    {m.name[0]?.toUpperCase()}
                  </Avatar>
                  <span className="text-xs font-medium">{m.name}</span>
                </div>
              </Select.Option>
            ))}
          </Select>
        )
      },
    },
    {
      title: <div className="mt-7">Due Date</div>,
      dataIndex: 'dueDate',
      key: 'dueDate',
      render: (dueDate: string) => <span className="text-slate-900 dark:text-white text-sm">{formatDate(dueDate) || <EmptyDash />}</span>,
    },
    {
      title: <div className="mt-7 text-right">Actions</div>,
      key: 'actions',
      align: 'right' as const,
      render: (_: unknown, item: Todo) => (
        <Tooltip title="Delete">
          <Button
            type="text"
            danger
            onClick={() => setDeleteTargetId(item.id)}
            className="flex items-center justify-center p-0 w-8 h-8 text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors dark:hover:bg-red-900/20 dark:hover:text-red-400 ml-auto"
            icon={<Trash2 size={14} />}
          />
        </Tooltip>
      ),
    },
  ].filter((col) => col.key !== 'actions' || role === 'admin')

  const rowSelection = {
    selectedRowKeys: Array.from(selectedIds),
    onChange: (newSelectedRowKeys: React.Key[]) => {
      setSelectedIds(new Set(newSelectedRowKeys as string[]))
    },
  }

  return (
    <div className="min-h-screen bg-slate-50 transition-colors duration-300 dark:bg-slate-900">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
          <div className="relative flex-1 min-w-[220px] max-w-xs">
            <Input
              prefix={<Search size={15} className="text-slate-400" />}
              placeholder="Search all columns..."
              value={globalSearch}
              onChange={(e) => setFilters({ globalSearch: e.target.value, currentPage: 1 })}
              allowClear
              className="py-1.5"
            />
          </div>

          <div className="flex items-center gap-2">
            {selectedIds.size > 0 && (
              <>
                {role === 'admin' && (
                  <Button
                    danger
                    type="primary"
                    onClick={() => setBulkDeleteOpen(true)}
                    className="flex items-center gap-1.5 text-xs font-semibold"
                    icon={<Trash2 size={13} />}
                  >
                    {deleteBtnLabel}
                  </Button>
                )}

                <Button
                  onClick={() => {
                    const selected = filteredData.filter((item) => selectedIds.has(item.id))
                    exportTodosToCSV(selected, columnNames, `todos-selected-${Date.now()}.csv`)
                  }}
                  className="flex items-center gap-1.5 text-xs font-semibold"
                  icon={<Download size={13} />}
                >
                  Export CSV
                </Button>

                <Button
                  type="default"
                  onClick={clearSelection}
                  className="text-xs font-medium"
                >
                  Clear Selection
                </Button>
              </>
            )}

            {selectedIds.size === 0 && (
              <div className="flex items-center gap-2">
                {hasActiveFilters && (
                  <Button
                    onClick={clearAllFilters}
                    className="flex items-center gap-1.5 text-xs font-medium"
                  >
                    Clear all filters
                  </Button>
                )}
                {filteredData.length > 0 && (
                  <Button
                    onClick={() => exportTodosToCSV(filteredData, columnNames, `todos-${Date.now()}.csv`)}
                    className="flex items-center gap-1.5 text-xs font-semibold"
                    icon={<Download size={13} />}
                  >
                    Export CSV
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>

        <Card styles={{ body: { padding: 0 } }} className="shadow-sm border-slate-200 overflow-hidden dark:border-slate-700">
          <Table
            rowSelection={rowSelection}
            columns={columns}
            dataSource={filteredData}
            rowKey="id"
            pagination={{
              current: currentPage,
              pageSize: PAGE_SIZE,
              total: totalFiltered,
              onChange: (page) => { setFilters({ currentPage: page }); clearSelection() },
              size: 'small',
              showTotal: (total, range) => `Showing ${range[0]}-${range[1]} of ${total} tasks`,
            }}
            rowClassName={(record, index) => 
              selectedIds.has(record.id) ? 'bg-slate-100 dark:bg-slate-700/40' : 
              index % 2 === 1 ? 'bg-slate-50/50 dark:bg-slate-900/20' : ''
            }
            scroll={{ x: 1000 }}
          />
        </Card>
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
        <p className="text-sm text-black dark:text-black">Are you sure you want to delete this task?</p>
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
          <span className="font-semibold">{allFilteredSelected ? 'all' : selectedIds.size}</span>{' '}
          task{selectedIds.size !== 1 ? 's' : ''}? This action cannot be undone.
        </p>
      </Modal>
    </div>
  )
}
