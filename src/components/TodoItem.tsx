import { useState, useRef, useCallback, useMemo, memo } from 'react'
import { useStore } from '../store'

import { Trash2, Pencil, Calendar, Tag, AlignLeft, Plus, X, Check, Circle, ChevronDown, ChevronsLeft, ChevronLeft, ChevronRight, ChevronsRight } from 'lucide-react'
import { Button, Checkbox, Popover, Input, Select, DatePicker, Calendar as AntCalendar, AutoComplete } from 'antd'
import { CheckCircleFilled } from '@ant-design/icons'
import type { TodoPayload } from '../store/types'
import { getPriorityColor, isOverdue } from '../utils/todoHelpers'
import dayjs from 'dayjs'

interface TodoItemProps {
  id: string
  columnId?: string
  isSelected?: boolean
  isSelectionMode?: boolean
  onToggleSelect?: (id: string) => void
  onLongPress?: (id: string) => void
}

const TodoItem = memo(({
  id,
  isSelected = false,
  isSelectionMode = false,
  onToggleSelect,
  onLongPress,
}: TodoItemProps) => {
  const item = useStore((s) => s.todos.entities[id])
  const remove = useStore((s) => s.todos.remove)
  const update = useStore((s) => s.todos.update)
  const toggleCompleted = useStore((s) => s.todos.toggleCompleted)

  const [isEditing, setIsEditing] = useState(false)

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const longPressActivated = useRef(false)



  const startLongPress = useCallback((e: React.PointerEvent) => {
    if (e.button !== 0 || (e.target as HTMLElement).closest('button, input')) return
    longPressActivated.current = false
    timerRef.current = setTimeout(() => {
      longPressActivated.current = true
      onLongPress?.(id)
    }, 700)
  }, [id, onLongPress])

  const cancelLongPress = useCallback(() => {
    if (timerRef.current === null) return
    clearTimeout(timerRef.current)
    timerRef.current = null
  }, [])



  const categories = useStore((s) => s.settings.categories)
  const addCategory = useStore((s) => s.settings.addCategory)
  const renameCategory = useStore((s) => s.settings.renameCategory)

  const [editDesc, setEditDesc] = useState(item?.description ?? '')
  const [isEditingDesc, setIsEditingDesc] = useState(false)
  const [isCategoryPopoverOpen, setIsCategoryPopoverOpen] = useState(false)
  const [categorySearch, setCategorySearch] = useState('')
  const [isCreatingCategory, setIsCreatingCategory] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [editingCategory, setEditingCategory] = useState<string | null>(null)
  const [categoryRenameValue, setCategoryRenameValue] = useState('')
  const [isDatePopoverOpen, setIsDatePopoverOpen] = useState(false)
  const [tempDate, setTempDate] = useState<dayjs.Dayjs | null>(null)
  const [timeStr, setTimeStr] = useState('')

  const itemCategories = useMemo(() => {
    if (!item?.category) return []
    return [...new Set(item.category.split(',').map(c => c.trim()).filter(Boolean))]
  }, [item?.category])

  const getPayload = useCallback((overrides: Partial<TodoPayload> = {}): TodoPayload & { id: string } => ({
    id,
    title: item?.title || '',
    description: item?.description || '',
    category: item?.category || '',
    priority: item?.priority || 'Low',
    dueDate: item?.dueDate || null,
    ...overrides
  }), [id, item])

  const handleToggleCompleted = useCallback(() => {
    toggleCompleted(id)
  }, [id, toggleCompleted])

  const isModalOpen = isEditing

  const closeModal = useCallback(() => {
    setIsEditing(false)
    setIsEditingDesc(false)
  }, [])

  const handleDescChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setEditDesc(e.target.value)
  }, [])

  const saveDescription = useCallback(() => {
    if (item) {
      update(getPayload({ description: editDesc }))
    }
    setIsEditingDesc(false)
  }, [update, getPayload, item, editDesc])

  if (!item) return null

  const overdue = isOverdue(item.dueDate, item.completed)

  const quickEditContent = (
    <div className="flex flex-col gap-2 w-48">
      <div>
        <label className="text-xs font-semibold text-slate-500 mb-1 block">Priority</label>
        <Select
          size="small"
          value={item.priority}
          onChange={(val) => update(getPayload({ priority: val }))}
          options={['High', 'Medium', 'Low'].map(p => ({ label: p, value: p }))}
          className="w-full"
        />
      </div>
      <div>
        <label className="text-xs font-semibold text-slate-500 mb-1 block">Due Date</label>
        <DatePicker
          size="small"
          format="DD-MM-YYYY"
          value={item.dueDate ? dayjs(item.dueDate) : null}
          onChange={(d) => update(getPayload({ dueDate: d ? d.format('YYYY-MM-DD') : null }))}
          className="w-full"
        />
      </div>
      <Button danger type="text" size="small" icon={<Trash2 size={14} />} onClick={() => remove(id)} className="text-left mt-1">
        Delete Card
      </Button>
    </div>
  )

  return (
    <div
      onPointerDown={startLongPress}
      onPointerUp={cancelLongPress}
      onPointerLeave={cancelLongPress}
      onPointerCancel={cancelLongPress}

      className={`group relative bg-white border rounded-xl px-3 py-3 shadow-sm transition-colors dark:bg-slate-800 ${item.completed ? 'border-slate-100 dark:border-slate-800/50' : 'border-slate-200 hover:border-slate-300 dark:border-slate-700 dark:hover:border-slate-600'
        } ${isSelected ? 'ring-2 ring-blue-500 bg-blue-50/50 dark:bg-blue-900/20 border-transparent' : ''}`}
    >
      <div className="cursor-pointer" onClick={() => setIsEditing(true)}>
        <div className="flex items-center gap-2 mb-1.5 flex-wrap pr-12">
          <span className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-md border ${getPriorityColor(item.priority)}`}>
            {item.priority}
          </span>
          {itemCategories.map(cat => (
            <span key={cat} className="flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold text-slate-600 bg-slate-100 border border-slate-200 rounded-md dark:bg-slate-700 dark:text-slate-300 dark:border-slate-600">
              <Tag size={10} />
              {cat}
            </span>
          ))}
          {item.dueDate && (
            <span className={`flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold rounded-md border ${item.completed
                ? 'bg-emerald-600 text-white border-emerald-600 dark:bg-emerald-700 dark:border-emerald-700'
                : overdue
                  ? 'bg-red-50 text-red-600 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800/50'
                  : 'bg-slate-50 text-slate-500 border-slate-200 dark:bg-slate-700/50 dark:text-slate-400 dark:border-slate-600'
              }`}>
              <Calendar size={10} />
              {new Date(item.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </span>
          )}
          {item.completed && (
            <span className="flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold rounded-md border bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800/50">
              Completed
            </span>
          )}
        </div>
      </div>

      <div className="flex items-start mt-0.5 group/title">
        <div className={`overflow-hidden transition-all duration-200 flex items-center pt-0.5 ${item.completed ? 'w-5 opacity-100' : 'w-0 opacity-0 group-hover/title:w-5 group-hover/title:opacity-100'
          }`}>
          <Button
            type="text"
            className={`flex-shrink-0 flex items-center justify-center cursor-pointer ${item.completed
                ? '!text-emerald-500 hover:!text-emerald-600'
                : '!text-slate-300 hover:!text-emerald-500 dark:!text-slate-600'
              }`}
            style={{ width: 16, height: 16, minWidth: 16, padding: 0 }}
            icon={item.completed ? (
              <CheckCircleFilled style={{ fontSize: 16 }} className="flex-shrink-0" />
            ) : (
              <Circle size={16} strokeWidth={2.5} className="flex-shrink-0" />
            )}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleToggleCompleted();
            }}
            onPointerDown={(e) => e.stopPropagation()}
          />
        </div>

        <p
          className="flex-1 text-sm font-semibold leading-snug break-words pr-6 cursor-pointer transition-colors text-slate-900 dark:text-white"
          onClick={() => setIsEditing(true)}
        >
          {item.title}
        </p>
      </div>

      {item.description && (
        <div className="mt-2 text-slate-400 dark:text-slate-500 flex items-center cursor-pointer" onClick={() => setIsEditing(true)}>
          <AlignLeft size={14} />
        </div>
      )}

      <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <Popover content={quickEditContent} trigger="click" placement="bottomRight">
          <Button
            type="text"
            className="flex items-center justify-center p-0 w-7 h-7 text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors dark:hover:text-slate-200 dark:hover:bg-slate-600 rounded-md bg-slate-100 dark:bg-slate-700 shadow-sm"
            icon={<Pencil size={13} />}
          />
        </Popover>
      </div>

      {isSelectionMode && (
        <div className="flex items-center self-center pl-2 shrink-0">
          <Checkbox
            checked={isSelected}
            onChange={() => onToggleSelect?.(id)}
            className="dark:accent-slate-400"
          />
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={closeModal}>
          <div className="bg-slate-50 dark:bg-slate-900 w-full max-w-2xl rounded-xl shadow-xl overflow-hidden flex flex-col max-h-full -mt-75" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-3">
                <Checkbox checked={item.completed} onChange={handleToggleCompleted} />
                {item.title}
              </h2>
              <Button type="text" onClick={closeModal} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                Cancel
              </Button>
            </div>

            <div className="p-6 flex-1 overflow-y-auto">
              <div className="flex items-center gap-6 mb-8 flex-wrap">
                <div>
                  <h3 className="text-xs font-semibold text-slate-500 mb-2">Category</h3>
                  <div className="flex items-center gap-2">
                    {itemCategories.map(cat => (
                      <span key={cat} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-200 rounded-md dark:bg-slate-800 dark:text-slate-300 w-fit">
                        {cat}
                      </span>
                    ))}
                    <Popover
                      open={isCategoryPopoverOpen}
                      onOpenChange={(open) => { setIsCategoryPopoverOpen(open); if (!open) { setIsCreatingCategory(false); setCategorySearch(''); setEditingCategory(null); } }}
                      trigger="click"
                      placement="bottom"
                      arrow={false}
                      styles={{ container: { borderRadius: 12, padding: 0 } }}
                      title={
                        <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-slate-100 dark:border-slate-800">
                          <span className="text-sm font-semibold">Category</span>
                          <Button type="text" size="small" icon={<X size={14} />} onClick={() => setIsCategoryPopoverOpen(false)} className="p-0 text-slate-400" />
                        </div>
                      }
                      content={
                        <div className="w-64 flex flex-col gap-2 px-4 pb-4">
                          <Input placeholder="Search category..." value={categorySearch} onChange={e => setCategorySearch(e.target.value)} className="mt-2" autoFocus />
                          <div className="text-xs font-semibold text-slate-500 mt-1">Category</div>
                          <div className="flex flex-col gap-0.5 max-h-48 overflow-y-auto">
                            {categories.filter(c => c.toLowerCase().includes(categorySearch.toLowerCase())).map(cat => (
                              <div key={cat} className="flex items-center gap-2 cursor-pointer rounded-md px-2 py-1.5 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800" onClick={() => {
                                if (editingCategory) return;
                                let newCats = [...itemCategories]
                                if (newCats.includes(cat)) {
                                  newCats = newCats.filter(c => c !== cat)
                                } else {
                                  newCats.push(cat)
                                }
                                update(getPayload({ category: newCats.join(', ') }))
                              }}>
                                {editingCategory === cat ? (
                                  <div className="flex items-center gap-1 w-full" onClick={e => e.stopPropagation()}>
                                    <Input autoFocus size="small" value={categoryRenameValue} onChange={e => setCategoryRenameValue(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { const val = categoryRenameValue.trim(); if (val && val !== cat) { renameCategory({ oldName: cat, newName: val }); if (itemCategories.includes(cat)) { update(getPayload({ category: itemCategories.map(c => c === cat ? val : c).join(', ') })); } } setEditingCategory(null); } else if (e.key === 'Escape') { setEditingCategory(null); } }} />
                                    <Button type="text" size="small" icon={<Check size={14} />} onClick={() => { const val = categoryRenameValue.trim(); if (val && val !== cat) { renameCategory({ oldName: cat, newName: val }); if (itemCategories.includes(cat)) { update(getPayload({ category: itemCategories.map(c => c === cat ? val : c).join(', ') })); } } setEditingCategory(null); }} className="text-emerald-500" />
                                    <Button type="text" size="small" icon={<X size={14} />} onClick={() => setEditingCategory(null)} className="text-slate-400" />
                                  </div>
                                ) : (
                                  <>
                                    <Checkbox checked={itemCategories.includes(cat)} className="pointer-events-none" />
                                    <span className="flex-1 text-sm text-slate-700 dark:text-slate-300 font-medium">{cat}</span>
                                    <Button type="text" size="small" icon={<Pencil size={12} />} onClick={(e) => { e.stopPropagation(); setEditingCategory(cat); setCategoryRenameValue(cat); }} className="text-slate-400 hover:text-slate-600" />
                                  </>
                                )}
                              </div>
                            ))}
                          </div>
                          {isCreatingCategory ? (
                            <div className="flex flex-col gap-2 border-t border-slate-100 dark:border-slate-800 pt-3 mt-1">
                              <Input placeholder="Category name..." value={newCategoryName} onChange={e => setNewCategoryName(e.target.value)} autoFocus onKeyDown={e => { if (e.key === 'Enter' && newCategoryName) { addCategory(newCategoryName); const newCats = [...itemCategories, newCategoryName]; update(getPayload({ category: newCats.join(', ') })); setNewCategoryName(''); setIsCreatingCategory(false); setIsCategoryPopoverOpen(false); } }} />
                              <div className="flex items-center gap-2">
                                <Button type="primary" size="small" onClick={() => { if (newCategoryName) { addCategory(newCategoryName); const newCats = [...itemCategories, newCategoryName]; update(getPayload({ category: newCats.join(', ') })); setNewCategoryName(''); setIsCreatingCategory(false); setIsCategoryPopoverOpen(false); } }}>Create</Button>
                                <Button type="text" size="small" onClick={() => setIsCreatingCategory(false)}>Cancel</Button>
                              </div>
                            </div>
                          ) : (
                            <Button className="mt-1 text-sm w-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-lg hover:bg-slate-50" onClick={() => setIsCreatingCategory(true)}>Create new category</Button>
                          )}
                        </div>
                      }
                    >
                      <Button className="flex items-center justify-center p-0 w-8 h-8 rounded-md bg-slate-100 border-none dark:bg-slate-800 hover:bg-slate-200" icon={<Plus size={16} className="text-slate-500" />} />
                    </Popover>
                  </div>
                </div>

                <div>
                  <h3 className="text-xs font-semibold text-slate-500 mb-2">Due Date</h3>
                  <Popover
                    open={isDatePopoverOpen}
                    onOpenChange={(open) => { setIsDatePopoverOpen(open); if (open) { setTempDate(item.dueDate ? dayjs(item.dueDate) : dayjs()); setTimeStr(item.dueDate ? dayjs(item.dueDate).format('HH:mm') : dayjs().format('HH:mm')); } }}
                    trigger="click"
                    placement="bottomLeft"
                    title={
                      <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                        <span className="text-sm font-semibold">Date</span>
                        <Button type="text" size="small" icon={<X size={14} />} onClick={() => setIsDatePopoverOpen(false)} className="p-0 text-slate-400" />
                      </div>
                    }
                    content={
                      <div className="w-72 flex flex-col gap-4 mt-2">
                        <div>
                          <AntCalendar
                            fullscreen={false}
                            value={tempDate || dayjs()}
                            onChange={(d) => setTempDate(d.hour(tempDate?.hour() || 0).minute(tempDate?.minute() || 0))}
                            headerRender={({ value, onChange }) => {
                              const current = value.clone();
                              return (
                                <div className="flex items-center justify-between px-2 pt-1 pb-4">
                                  <div className="flex items-center gap-1">
                                    <Button type="text" size="small" icon={<ChevronsLeft size={16} />} onClick={() => onChange(current.subtract(1, 'year'))} className="text-slate-400 hover:text-slate-600 p-0 w-7 h-7 flex items-center justify-center" />
                                    <Button type="text" size="small" icon={<ChevronLeft size={16} />} onClick={() => onChange(current.subtract(1, 'month'))} className="text-slate-400 hover:text-slate-600 p-0 w-7 h-7 flex items-center justify-center" />
                                  </div>
                                  <div className="font-semibold text-[15px] text-slate-800 dark:text-slate-200">
                                    {current.format('MMMM YYYY')}
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <Button type="text" size="small" icon={<ChevronRight size={16} />} onClick={() => onChange(current.add(1, 'month'))} className="text-slate-400 hover:text-slate-600 p-0 w-7 h-7 flex items-center justify-center" />
                                    <Button type="text" size="small" icon={<ChevronsRight size={16} />} onClick={() => onChange(current.add(1, 'year'))} className="text-slate-400 hover:text-slate-600 p-0 w-7 h-7 flex items-center justify-center" />
                                  </div>
                                </div>
                              );
                            }}
                          />
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2 block">Due Date</label>
                          <div className="flex items-center gap-2">
                            <Checkbox
                              checked={!!tempDate}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setTempDate(dayjs());
                                  setTimeStr(dayjs().format('HH:mm'));
                                } else {
                                  setTempDate(null);
                                  setTimeStr('');
                                }
                              }}
                            />
                            <DatePicker
                              className="w-32"
                              disabledDate={(current) => current && current < dayjs().startOf('day')}
                              value={tempDate}
                              onChange={d => setTempDate(d ? d.hour(tempDate?.hour() || 0).minute(tempDate?.minute() || 0) : null)}
                              format="DD/MM/YYYY"
                            />
                            <AutoComplete
                              className="w-24"
                              value={timeStr}
                              options={Array.from({ length: 48 }).map((_, i) => {
                                const h = String(Math.floor(i / 2)).padStart(2, '0');
                                const m = i % 2 === 0 ? '00' : '30';
                                return { value: `${h}:${m}` };
                              })}
                              onChange={val => {
                                let newVal = val;
                                const isDeleting = newVal.length < timeStr.length;
                                if (!isDeleting) {
                                  if (newVal.length === 2 && newVal.endsWith(':')) {
                                    newVal = '0' + newVal;
                                  } else if (newVal.length === 2 && !newVal.includes(':')) {
                                    const h = Number(newVal);
                                    if (h >= 0 && h <= 23) newVal += ':';
                                  }
                                }
                                setTimeStr(newVal);
                                if (newVal.includes(':')) {
                                  const [h, m] = newVal.split(':');
                                  if (h && m && !isNaN(Number(h)) && !isNaN(Number(m))) {
                                    setTempDate((prev) => (prev || dayjs()).hour(Number(h)).minute(Number(m)));
                                  }
                                }
                              }}
                              onKeyDown={e => {
                                if (e.key === ' ') {
                                  e.preventDefault();
                                  if (timeStr.length === 1) setTimeStr(`0${timeStr}:`);
                                  else if (timeStr.length === 2 && !timeStr.includes(':')) setTimeStr(`${timeStr}:`);
                                }
                              }}
                            >
                              <Input placeholder="HH:mm" suffix={<ChevronDown size={14} className="text-slate-400" />} />
                            </AutoComplete>
                          </div>
                        </div>
                        <div className="flex flex-col gap-2">
                          <Button type="primary" className="w-full" onClick={() => { update(getPayload({ dueDate: tempDate ? tempDate.format('YYYY-MM-DD HH:mm') : null })); setIsDatePopoverOpen(false); }}>Save</Button>
                          <Button className="w-full bg-slate-100 border-none dark:bg-slate-800" onClick={() => { setTempDate(null); update(getPayload({ dueDate: null })); setIsDatePopoverOpen(false); }}>Remove</Button>
                        </div>
                      </div>
                    }
                  >
                    <div className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-slate-700 bg-slate-100 cursor-pointer rounded-md dark:bg-slate-800 dark:text-slate-300 w-fit">
                      <span>{item.dueDate ? dayjs(item.dueDate).format('HH:mm DD MMM') : 'Add date'}</span>
                      <ChevronDown size={14} className="text-slate-500" />
                    </div>
                  </Popover>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-base font-bold text-slate-800 dark:text-white flex items-center gap-2">
                    <AlignLeft size={18} />
                    Description
                  </h3>
                  {!isEditingDesc && (
                    <Button size="small" onClick={() => setIsEditingDesc(true)} className="text-xs font-medium bg-slate-200 border-none dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                      Edit
                    </Button>
                  )}
                </div>
                {!isEditingDesc ? (
                  <div className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 p-2 -mx-2 rounded-lg transition-colors" onClick={() => setIsEditingDesc(true)}>
                    {item.description || 'Add detailed description...'}
                  </div>
                ) : (
                  <div>
                    <Input.TextArea
                      value={editDesc}
                      onChange={handleDescChange}
                      placeholder="Add detailed description..."
                      autoSize={{ minRows: 4, maxRows: 10 }}
                      className="bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 focus:border-blue-500 mb-3 text-sm rounded-lg"
                    />
                    <div className="flex items-center gap-2 mt-3">
                      <Button type="primary" onClick={saveDescription} className="font-medium">Save</Button>
                      <Button type="text" onClick={() => { setIsEditingDesc(false); setEditDesc(item.description); }} className="text-slate-500 hover:text-slate-700">Cancel</Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
})

export default TodoItem
