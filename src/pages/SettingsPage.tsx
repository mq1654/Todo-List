import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Input, Button, Popconfirm, Switch, Typography, Card, message } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined, CheckOutlined, CloseOutlined } from '@ant-design/icons'
import { ArrowLeft } from 'lucide-react'
import { useStore } from '../store'

export default function SettingsPage() {
  const navigate = useNavigate()
  const theme = useStore((s) => s.settings.theme)
  const categories = useStore((s) => s.settings.categories)

  const toggleTheme = useStore((s) => s.settings.toggleTheme)
  const addCategory = useStore((s) => s.settings.addCategory)
  const removeCategory = useStore((s) => s.settings.removeCategory)
  const renameCategory = useStore((s) => s.settings.renameCategory)

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
    if (categories.includes(newTrimmed)) {
      message.warning('Category already exists!')
      return
    }
    renameCategory({ oldName: oldCat, newName: newTrimmed })
    setEditingCat(null)
  }

  function handleDeleteCategory(cat: string) {
    removeCategory(cat)
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 transition-colors duration-300 dark:bg-slate-900">
      <div className="max-w-2xl mx-auto">
        <Button
          type="text"
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors mb-6 dark:text-slate-400 dark:hover:text-slate-200 p-0 h-auto bg-transparent"
          icon={<ArrowLeft size={16} />}
        >
          Back
        </Button>

        <Typography.Title level={1} className="!text-2xl sm:!text-3xl font-bold text-slate-900 mb-8 dark:text-white">Settings</Typography.Title>

        <Card styles={{ body: { padding: 0 } }} className="mb-8 shadow-sm border-slate-200 dark:border-slate-700">
          <div className="p-6 sm:p-8 border-b border-slate-100 flex items-center justify-between dark:border-slate-700">
            <div>
              <Typography.Title level={2} className="!text-lg font-semibold text-slate-900 dark:text-white">Appearance</Typography.Title>
              <p className="text-sm text-slate-500 mt-1 dark:text-slate-400">Toggle between light and dark mode</p>
            </div>
            <Switch
              checked={theme === 'dark'}
              onChange={() => toggleTheme()}
            />
          </div>

          <div className="p-6 sm:p-8">
            <Typography.Title level={2} className="!text-lg font-semibold text-slate-900 mb-4 dark:text-white">Categories</Typography.Title>

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
              <div className="divide-y divide-slate-100 dark:divide-slate-700">
                {categories.map((cat: string) => (
                  <div key={cat} className="py-3 flex items-center justify-between gap-4">
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
                        className="max-w-[240px]"
                      />
                    ) : (
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{cat}</span>
                    )}

                    <div className="flex items-center gap-1">
                      {editingCat === cat ? (
                        <>
                          <Button
                            type="text"
                            icon={<CheckOutlined />}
                            className="text-emerald-500"
                            onClick={() => handleRenameCategory(cat)}
                          />
                          <Button
                            type="text"
                            icon={<CloseOutlined />}
                            onClick={() => setEditingCat(null)}
                          />
                        </>
                      ) : (
                        <>
                          <Button
                            type="text"
                            icon={<EditOutlined />}
                            onClick={() => { setEditingCat(cat); setEditCatName(cat) }}
                          />
                          <Popconfirm
                            title={`Delete "${cat}"?`}
                            description="Tasks in this category will be updated automatically."
                            onConfirm={() => handleDeleteCategory(cat)}
                            okText="Delete"
                            okButtonProps={{ danger: true }}
                            cancelText="Cancel"
                          >
                            <Button type="text" icon={<DeleteOutlined />} danger />
                          </Popconfirm>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
