import { createStore, StoreProvider, persist } from 'easy-peasy'
import todoModel from './todoModel'
import settingsModel from './settingsModel'

export const store = createStore({
  todos: persist(todoModel, {
    storage: 'localStorage'
  }),
  settings: persist(settingsModel, {
    storage: 'localStorage'
  }),
})

export { StoreProvider }
