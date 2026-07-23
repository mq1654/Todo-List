import { useState, useCallback, useMemo } from 'react'
import { useStore } from '../store'
import type { TodoPayload } from '../store/types'
import { Plus, X, Check, Pencil, AlignLeft, ChevronDown, ChevronsLeft, ChevronLeft, ChevronRight, ChevronsRight } from 'lucide-react'
import { Button, Checkbox, Popover, Input, DatePicker, Calendar as AntCalendar, AutoComplete, Avatar, Select } from 'antd'
import dayjs from 'dayjs'
import { useMembers } from '../hooks/useMembers'
import { useAuth } from '../hooks/useAuth'
import { auth } from '../firebase/firebaseConfig'

function MemberAssigneeBadge({ assigneeId, activeMembers }: { assigneeId: string | null; activeMembers: ReturnType<typeof useMembers>['activeMembers'] }) {
  if (!assigneeId) {
    return <span className="text-slate-400 dark:text-slate-500 italic text-xs">Unassigned</span>
  }
  const member = activeMembers.find((m) => m.uid === assigneeId)
  const name = member?.name || auth.currentUser?.displayName || auth.currentUser?.email?.split('@')[0] || 'Assigned Member'
  return (
    <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-md text-xs font-medium text-slate-700 dark:text-slate-300 w-fit min-h-[32px]">
      <Avatar size={20} className="bg-blue-600 text-white font-bold text-[10px]">
        {name[0]?.toUpperCase() || 'M'}
      </Avatar>
      <span>{name}</span>
    </div>
  )
}

function AdminAssigneeSelect({
  assigneeId,
  activeMembers,
  onChange,
}: {
  assigneeId: string | null
  activeMembers: ReturnType<typeof useMembers>['activeMembers']
  onChange: (val: string | null) => void
}) {
  return (
    <Select
      size="small"
      showSearch
      value={assigneeId ?? 'unassigned'}
      placeholder="Assign to member"
      filterOption={(input, option) => ((option?.label as string) ?? '').toLowerCase().includes(input.toLowerCase())}
      onChange={(val) => onChange(val === 'unassigned' ? null : val)}
      className="w-48 [&_.ant-select-selector]:!rounded-md [&_.ant-select-selector]:!bg-slate-100 dark:[&_.ant-select-selector]:!bg-slate-800 dark:[&_.ant-select-selector]:!border-slate-700 dark:[&_.ant-select-selection-item]:!text-slate-200"
      classNames={{ popup: { root: 'dark:!bg-slate-800 dark:!border-slate-700' } }}
    >
      <Select.Option value="unassigned" label="Unassigned">
        <span className="text-slate-400 dark:text-slate-500 italic text-xs">Unassigned</span>
      </Select.Option>
      {activeMembers.map((m) => (
        <Select.Option key={m.uid} value={m.uid} label={m.name}>
          <div className="flex items-center gap-2 py-0.5">
            <Avatar size={20} className="bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400 text-[10px] font-bold">
              {m.name[0]?.toUpperCase()}
            </Avatar>
            <span className="text-xs font-medium text-slate-700 dark:text-slate-200">{m.name}</span>
          </div>
        </Select.Option>
      ))}
    </Select>
  )
}

interface TodoEditModalProps {
  id: string
  onClose: () => void
}

export default function TodoEditModal({ id, onClose }: TodoEditModalProps) {
  const { activeMembers } = useMembers()
  const { role } = useAuth()
  const item = useStore((s) => s.todos.entities[id])
  const update = useStore((s) => s.todos.update)
  const toggleCompleted = useStore((s) => s.todos.toggleCompleted)
  
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

  const getPayload = (overrides: Partial<TodoPayload> = {}): TodoPayload & { id: string } => ({
    id,
    title: item?.title || '',
    description: item?.description || '',
    category: item?.category || '',
    priority: item?.priority || 'Low',
    dueDate: item?.dueDate || null,
    ...overrides
  })

  const handleToggleCompleted = () => {
    toggleCompleted(id)
  }

  const handleDescChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setEditDesc(e.target.value)
  }

  const saveDescription = () => {
    if (item) {
      update(getPayload({ description: editDesc }))
    }
    setIsEditingDesc(false)
  }

  if (!item) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="bg-slate-50 dark:bg-slate-900 w-full max-w-2xl rounded-xl shadow-xl overflow-hidden flex flex-col max-h-full -mt-75" onClick={e => e.stopPropagation()}>
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-3">
            <Checkbox checked={item.completed} onChange={handleToggleCompleted} disabled={role === 'member'} />
            {item.title}
          </h2>
          <Button type="text" onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
            Cancel
          </Button>
        </div>

        <div className="p-6 flex-1 overflow-y-auto">
          <div className="flex items-start gap-6 mb-8 flex-wrap">
            <div>
              <h3 className="text-xs font-semibold text-slate-500 mb-2">Category</h3>
              <div className="flex items-center gap-2 min-h-[32px]">
                {itemCategories.length > 0 ? (
                  itemCategories.map((cat) => (
                    <span key={cat} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-200 rounded-md dark:bg-slate-800 dark:text-slate-300 w-fit">
                      {cat}
                    </span>
                  ))
                ) : (
                  role === 'member' && (
                    <span className="text-slate-400 dark:text-slate-500 italic text-xs">No category</span>
                  )
                )}
                {role === 'admin' && (
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
                )}
              </div>
            </div>

            <div>
              <h3 className="text-xs font-semibold text-slate-500 mb-2">Due Date</h3>
              {role === 'admin' ? (
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
              ) : (
                <div className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 rounded-md dark:bg-slate-800 dark:text-slate-300 w-fit min-h-[32px]">
                  <span>{item.dueDate ? dayjs(item.dueDate).format('HH:mm DD MMM') : 'No due date'}</span>
                </div>
              )}
            </div>

            <div>
              <h3 className="text-xs font-semibold text-slate-500 mb-2">Assignee</h3>
              {role === 'member' ? (
                <MemberAssigneeBadge assigneeId={item.assigneeId} activeMembers={activeMembers} />
              ) : (
                <AdminAssigneeSelect
                  assigneeId={item.assigneeId}
                  activeMembers={activeMembers}
                  onChange={(val) => update(getPayload({ assigneeId: val }))}
                />
              )}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <AlignLeft size={18} />
                Description
              </h3>
              {!isEditingDesc && role === 'admin' && (
                <Button size="small" onClick={() => setIsEditingDesc(true)} className="text-xs font-medium bg-slate-200 border-none dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                  Edit
                </Button>
              )}
            </div>
            {!isEditingDesc ? (
              <div 
                className={`text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap p-2 -mx-2 rounded-lg transition-colors ${role === 'admin' ? 'cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800' : ''}`} 
                onClick={() => { if (role === 'admin') setIsEditingDesc(true) }}
              >
                {item.description || 'No description provided.'}
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
  )
}
