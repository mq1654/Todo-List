import { action, computed } from 'easy-peasy'
import { TodoModel } from './types';
import { isOverdue } from '../utils/todoHelpers';

const priorityValue: Record<string, number> = { High: 3, Medium: 2, Low: 1 };

const todoModel : TodoModel = {
  entities: {},
  allIds: [],
  items: computed((state) => state.allIds.map(id => state.entities[id])),

  totalCount: computed((state) => state.items.length),
  activeCount: computed((state) => state.items.filter((i) => !i.completed).length),
  completedCount: computed((state) => state.items.filter((i) => i.completed).length),
  overdueCount: computed((state) => state.items.filter((i) => isOverdue(i.dueDate, i.completed)).length),

  recentTasks: computed((state) => 
    [...state.items].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 3)
  ),
  
  dueSoonTasks: computed((state) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayMs = today.getTime();
    const todayStr = today.toISOString().split('T')[0];
    
    return state.items
      .filter((i) => !i.completed && i.dueDate && i.dueDate >= todayStr)
      .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
      .slice(0, 3)
      .map((i) => ({
        ...i,
        daysLeft: Math.ceil((new Date(i.dueDate).getTime() - todayMs) / 86400000),
      }));
  }),



  add: action((state, payload) => {
    const id = crypto.randomUUID()
    const newTodo = {
      id,
      title: payload.title.trim(),
      description: payload.description ? payload.description.trim() : '',
      category: payload.category,
      priority: payload.priority,
      dueDate: payload.dueDate ?? '',
      completed: false,
      createdAt: new Date().toISOString(),
    }
    state.entities[id] = newTodo
    state.allIds.unshift(id)
  }),

  remove: action((state, id) => {
    delete state.entities[id]
    state.allIds = state.allIds.filter((i) => i !== id)
  }),

  deleteMultiple: action((state, ids) => {
    ids.forEach(id => delete state.entities[id])
    const idSet = new Set(ids);
    state.allIds = state.allIds.filter((i) => !idSet.has(i));
  }),

  update: action((state, payload) => {
    if (state.entities[payload.id]) {
      state.entities[payload.id] = {
        ...state.entities[payload.id],
        title: payload.title.trim(),
        description: payload.description ? payload.description.trim() : '',
        category: payload.category,
        priority: payload.priority,
        dueDate: payload.dueDate ?? '',
        updatedAt: new Date().toISOString(),
      }
    }
  }),

  toggleStatus: action((state, id) => {
    const item = state.entities[id]
    if (item) {
      item.completed = !item.completed
      if (item.completed) {
        item.completedAt = new Date().toISOString()
      } else {
        delete item.completedAt
      }
    }
  }),



  migrateCategory: action((state, payload) => {
    const { from, to } = payload
    state.allIds.forEach(id => {
      if (state.entities[id].category === from) {
        state.entities[id].category = to
      }
    })
  }),

  reorderTodo: action((state, { sourceId, destinationId, isMovingDown }) => {
    const sourceIdx = state.allIds.indexOf(sourceId);
    if (sourceIdx === -1) return;

    const [removedId] = state.allIds.splice(sourceIdx, 1);

    const destIdx = state.allIds.indexOf(destinationId);
    if (destIdx !== -1) {
      state.allIds.splice(isMovingDown ? destIdx + 1 : destIdx, 0, removedId);
    } else {
      state.allIds.unshift(removedId);
    }
  }),
}

export default todoModel
