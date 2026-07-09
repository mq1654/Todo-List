import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Input, Button, List, Popconfirm, Switch } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined, CheckOutlined, CloseOutlined } from '@ant-design/icons'
import { ArrowLeft } from 'lucide-react'
import { useStore, useTodoItems } from '../store'

export default function SettingsPage() {
  const navigate = useNavigate()
  const theme = useStore((s) => s.settings.theme)
  const categories = useStore((s) => s.settings.categories)
  const items = useTodoItems()

  const toggleTheme = useStore((s) => s.settings.toggleTheme)
  const addCategory = useStore((s) => s.settings.addCategory)
  const removeCategory = useStore((s) => s.settings.removeCategory)
  const renameCategory = useStore((s) => s.settings.renameCategory)
  const migrateCategory = useStore((s) => s.todos.migrateCategory)

  const [newCat, setNewCat] = useState('')
  const [editingCat, setEditingCat] = useState<string | null>(null)
  const [editCatName, setEditCatName] = useState('')

  function handleAddCategory(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (newCat.trim()) {
      addCategory(newCat)
      setNewCat('')
    }
  }

  function handleRenameCategory(oldCat: string) {
    const newTrimmed = editCatName.trim()
    if (!newTrimmed || newTrimmed === oldCat) { setEditingCat(null); return }
    if (categories.includes(newTrimmed)) { alert('Category already exists!'); return }
    renameCategory({ oldName: oldCat, newName: newTrimmed })
    migrateCategory({ from: oldCat, to: newTrimmed })
    setEditingCat(null)
  }

  function handleDeleteCategory(cat: string) {
    const tasksInCat = items.filter((item) => item.category === cat)
    if (tasksInCat.length > 0) {
      if (!categories.includes('Uncategorized')) addCategory('Uncategorized')
      migrateCategory({ from: cat, to: 'Uncategorized' })
    }
    removeCategory(cat)
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 transition-colors duration-300 dark:bg-slate-900">
      <div className="max-w-2xl mx-auto">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors mb-6 dark:text-slate-400 dark:hover:text-slate-200"
        >
          <ArrowLeft size={16} />
          Back
        </button>

        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-8 dark:text-white">Settings</h1>

        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm mb-8 dark:bg-slate-800 dark:border-slate-700">
          <div className="p-6 sm:p-8 border-b border-slate-100 flex items-center justify-between dark:border-slate-700">
            <div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Appearance</h2>
              <p className="text-sm text-slate-500 mt-1 dark:text-slate-400">Toggle between light and dark mode</p>
            </div>
            <Switch
              checked={theme === 'dark'}
              onChange={() => toggleTheme()}
            />
          </div>

          <div className="p-6 sm:p-8">
            <h2 className="text-lg font-semibold text-slate-900 mb-4 dark:text-white">Categories</h2>

            <form onSubmit={handleAddCategory} className="flex gap-2 mb-6">
              <Input
                value={newCat}
                onChange={(e) => setNewCat(e.target.value)}
                placeholder="Add new category (e.g. Freelance)"
                allowClear
              />
              <Button type="primary" htmlType="submit" icon={<PlusOutlined />}>
                Add
              </Button>
            </form>

            <div className="pt-6 border-t border-slate-100 dark:border-slate-700">
              <h3 className="text-sm font-medium text-slate-700 mb-3 dark:text-slate-300">Manage categories</h3>
              <List
                dataSource={categories}
                renderItem={(cat: string) => (
                  <List.Item
                    key={cat}
                    actions={
                      editingCat === cat
                        ? [
                            <Button
                              key="save"
                              type="text"
                              icon={<CheckOutlined />}
                              className="text-emerald-500"
                              onClick={() => handleRenameCategory(cat)}
                            />,
                            <Button
                              key="cancel"
                              type="text"
                              icon={<CloseOutlined />}
                              onClick={() => setEditingCat(null)}
                            />,
                          ]
                        : [
                            <Button
                              key="edit"
                              type="text"
                              icon={<EditOutlined />}
                              onClick={() => { setEditingCat(cat); setEditCatName(cat) }}
                            />,
                            <Popconfirm
                              key="delete"
                              title={`Delete "${cat}"?`}
                              description={
                                items.filter((i) => i.category === cat).length > 0
                                  ? 'Tasks in this category will be moved to "Uncategorized".'
                                  : 'This action cannot be undone.'
                              }
                              onConfirm={() => handleDeleteCategory(cat)}
                              okText="Delete"
                              okButtonProps={{ danger: true }}
                              cancelText="Cancel"
                            >
                              <Button type="text" icon={<DeleteOutlined />} danger />
                            </Popconfirm>,
                          ]
                    }
                  >
                    {editingCat === cat ? (
                      <Input
                        autoFocus
                        value={editCatName}
                        onChange={(e) => setEditCatName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleRenameCategory(cat)
                          if (e.key === 'Escape') setEditingCat(null)
                        }}
                        size="small"
                        style={{ maxWidth: 240 }}
                      />
                    ) : (
                      <span className="text-sm text-slate-700 dark:text-slate-300">{cat}</span>
                    )}
                  </List.Item>
                )}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
