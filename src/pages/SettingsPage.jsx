import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStoreState, useStoreActions } from 'easy-peasy'
import { ArrowLeft, Trash2, Plus, Pencil, Check, X, ChevronDown } from 'lucide-react'

export default function SettingsPage() {
  const navigate = useNavigate()
  const theme = useStoreState(state => state.settings?.theme || 'light')
  const categories = useStoreState(state => state.settings?.categories || ['Work', 'Personal', 'Learning'])
  const items = useStoreState(state => state.todos.items)
  
  const toggleTheme = useStoreActions(actions => actions.settings?.toggleTheme)
  const addCategory = useStoreActions(actions => actions.settings?.addCategory)
  const removeCategory = useStoreActions(actions => actions.settings?.removeCategory)
  const renameCategory = useStoreActions(actions => actions.settings?.renameCategory)
  const migrateCategory = useStoreActions(actions => actions.todos.migrateCategory)

  const [newCat, setNewCat] = useState('')
  const [selectedCatToDelete, setSelectedCatToDelete] = useState(categories[0] || '')
  
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [editingCat, setEditingCat] = useState(null)
  const [editCatName, setEditCatName] = useState('')
  const dropdownRef = useRef(null)

  useEffect(() => {
    if (!categories.includes(selectedCatToDelete)) {
      setSelectedCatToDelete(categories[0] || '')
    }
  }, [categories, selectedCatToDelete])

  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsDropdownOpen(false)
        setEditingCat(null)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  function handleAddCategory(e) {
    e.preventDefault()
    if (newCat.trim()) {
      addCategory(newCat)
      setNewCat('')
    }
  }

  function handleRenameCategory(oldCat) {
    const newTrimmed = editCatName.trim()
    if (!newTrimmed || newTrimmed === oldCat) {
      setEditingCat(null)
      return
    }
    if (categories.includes(newTrimmed)) {
      alert('Category already exists!')
      return
    }
    
    if (renameCategory) renameCategory({ oldName: oldCat, newName: newTrimmed })
    migrateCategory({ from: oldCat, to: newTrimmed })
    
    if (selectedCatToDelete === oldCat) {
      setSelectedCatToDelete(newTrimmed)
    }
    setEditingCat(null)
  }

  function handleDeleteCategory(cat) {
    const tasksInCat = items.filter(item => item.category === cat)
    if (tasksInCat.length > 0) {
      if (window.confirm(`Do you want to move all tasks in this category to the default category (Uncategorized)?`)) {
        if (!categories.includes('Uncategorized')) {
          addCategory('Uncategorized')
        }
        migrateCategory({ from: cat, to: 'Uncategorized' })
        removeCategory(cat)
      }
    } else {
      removeCategory(cat)
    }
    if (selectedCatToDelete === cat) {
      setSelectedCatToDelete(categories.find(c => c !== cat) || '')
    }
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
            
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                className="sr-only peer" 
                checked={theme === 'dark'} 
                onChange={() => toggleTheme && toggleTheme()}
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500 dark:bg-slate-600"></div>
            </label>
          </div>

          <div className="p-6 sm:p-8">
            <h2 className="text-lg font-semibold text-slate-900 mb-4 dark:text-white">Categories</h2>
            
            <form onSubmit={handleAddCategory} className="flex gap-2 mb-6">
              <input 
                type="text" 
                value={newCat}
                onChange={e => setNewCat(e.target.value)}
                placeholder="Add new category (e.g. Freelance)" 
                className="flex-1 px-3.5 py-2 text-sm rounded-lg border border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-400 outline-none focus:bg-white focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-colors dark:bg-slate-900 dark:border-slate-600 dark:text-white dark:focus:ring-slate-500 dark:focus:bg-slate-800 dark:placeholder-slate-500"
              />
              <button 
                type="submit"
                className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 text-white text-sm font-semibold rounded-lg hover:bg-slate-800 transition-colors dark:bg-slate-700 dark:hover:bg-slate-600"
              >
                <Plus size={16} /> Add
              </button>
            </form>

            <div className="pt-6 border-t border-slate-100 dark:border-slate-700">
              <h3 className="text-sm font-medium text-slate-700 mb-3 dark:text-slate-300">Manage categories</h3>
              <div className="relative" ref={dropdownRef}>
                <button
                  type="button"
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="w-full flex items-center justify-between px-3.5 py-2 text-sm rounded-lg border border-slate-200 bg-slate-50 text-slate-900 outline-none focus:bg-white focus:ring-2 focus:ring-slate-900 transition-colors dark:bg-slate-900 dark:border-slate-600 dark:text-white dark:focus:bg-slate-800 dark:focus:ring-slate-500"
                >
                  {selectedCatToDelete || 'Select a category'}
                  <ChevronDown size={16} className={`text-slate-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {isDropdownOpen && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg overflow-hidden dark:bg-slate-800 dark:border-slate-700">
                    <ul className="max-h-60 overflow-y-auto py-1">
                      {categories.map(cat => (
                        <li key={cat} className="group flex items-center justify-between px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                          {editingCat === cat ? (
                            <div className="flex items-center gap-2 w-full">
                              <input
                                autoFocus
                                value={editCatName}
                                onChange={e => setEditCatName(e.target.value)}
                                onKeyDown={e => {
                                  if (e.key === 'Enter') handleRenameCategory(cat)
                                  if (e.key === 'Escape') setEditingCat(null)
                                }}
                                className="flex-1 px-2 py-1 text-sm rounded border border-slate-200 bg-white text-slate-900 outline-none focus:ring-2 focus:ring-slate-900 dark:bg-slate-900 dark:border-slate-600 dark:text-white dark:focus:ring-slate-500"
                              />
                              <button onClick={() => handleRenameCategory(cat)} className="p-1 text-emerald-600 hover:bg-emerald-50 rounded dark:text-emerald-400 dark:hover:bg-emerald-900/30">
                                <Check size={14} />
                              </button>
                              <button onClick={() => setEditingCat(null)} className="p-1 text-slate-400 hover:bg-slate-100 rounded dark:hover:bg-slate-700">
                                <X size={14} />
                              </button>
                            </div>
                          ) : (
                            <>
                              <span 
                                onClick={() => { setSelectedCatToDelete(cat); setIsDropdownOpen(false) }}
                                className="flex-1 text-sm text-slate-700 cursor-pointer dark:text-slate-300"
                              >
                                {cat}
                              </span>
                              <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    setEditingCat(cat)
                                    setEditCatName(cat)
                                  }}
                                  className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-colors dark:hover:bg-slate-600 dark:hover:text-slate-200"
                                >
                                  <Pencil size={14} />
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleDeleteCategory(cat)
                                  }}
                                  className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors dark:hover:bg-red-900/30 dark:hover:text-red-400"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
