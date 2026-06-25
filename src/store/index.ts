import { createStore, createTypedHooks, persist, StoreProvider } from 'easy-peasy';
import todoModel from './todoModel';
import settingsModel from './settingsModel';
import { StoreModel } from './types'; 

export const store = createStore<StoreModel>({
  todos: persist(todoModel, {
    storage: 'localStorage'
  }),
  settings: persist(settingsModel, {
    storage: 'localStorage'
  }),
});

const typedHooks = createTypedHooks<StoreModel>();
export const useStoreActions = typedHooks.useStoreActions;
export const useStoreDispatch = typedHooks.useStoreDispatch;
export const useStoreState = typedHooks.useStoreState;
export { StoreProvider }
