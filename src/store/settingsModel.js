import { action } from 'easy-peasy'

const settingsModel = {
  theme: 'light',
  categories: ['Work', 'Personal', 'Learning'],
  
  toggleTheme: action((state) => {
    state.theme = state.theme === 'light' ? 'dark' : 'light'
  }),
  
  addCategory: action((state, category) => {
    const trimmed = category.trim()
    if (trimmed && !state.categories.includes(trimmed)) {
      state.categories.push(trimmed)
    }
  }),
  
  removeCategory: action((state, category) => {
    state.categories = state.categories.filter(c => c !== category)
  }),
  
  renameCategory: action((state, payload) => {
    const { oldName, newName } = payload
    const trimmed = newName.trim()
    if (!trimmed || state.categories.includes(trimmed)) return
    const idx = state.categories.indexOf(oldName)
    if (idx !== -1) {
      state.categories[idx] = trimmed
    }
  })
}

export default settingsModel
