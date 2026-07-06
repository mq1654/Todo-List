import { createStore, createTypedHooks, persist, StoreProvider } from 'easy-peasy';
import todoModel from './todoModel';
import settingsModel from './settingsModel';
import { StoreModel } from './types'; 

// --- MIGRATION LOGIC ---
const OLD_STORAGE_KEY = '[EasyPeasyStore][todos]';
try {
  const oldDataStr = localStorage.getItem(OLD_STORAGE_KEY);
  if (oldDataStr) {
    const parsed = JSON.parse(oldDataStr);
    if (parsed && parsed.data && Array.isArray(parsed.data.items)) {
      const entities: Record<string, any> = {};
      const allIds: string[] = [];
      parsed.data.items.forEach((item: any) => {
        if (item && item.id) {
          entities[item.id] = item;
          allIds.push(item.id);
        }
      });
      parsed.data.entities = entities;
      parsed.data.allIds = allIds;
      delete parsed.data.items;
      localStorage.setItem(OLD_STORAGE_KEY, JSON.stringify(parsed));
    }
  }
} catch (e) {
  console.error("Migration failed:", e);
}
// -----------------------

export const store = createStore<StoreModel>({
  todos: persist(todoModel, {
    storage: 'localStorage',
    allow: ['entities', 'allIds']
  }),
  settings: persist(settingsModel, {
    storage: 'localStorage',
  }),
});

const typedHooks = createTypedHooks<StoreModel>();
export const useStoreActions = typedHooks.useStoreActions;
export const useStoreDispatch = typedHooks.useStoreDispatch;
export const useStoreState = typedHooks.useStoreState;
export const useStore = typedHooks.useStore;
export { StoreProvider }
