import { createStore, StoreProvider } from 'easy-peasy'
import todoModel from './todoModel'

export const store = createStore({
  todos: todoModel,
})

export { StoreProvider }
