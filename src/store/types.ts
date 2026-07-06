import { Action, Computed } from 'easy-peasy';

export interface Todo {
  id: string;
  title: string;
  description: string;
  category: string;
  priority: 'High' | 'Medium' | 'Low';
  dueDate: string;
  completed: boolean;
  createdAt: string;
  completedAt?: string;
  updatedAt?: string;
}

export interface TodoPayload {
  title: string;
  description: string;
  category: string;
  priority: 'High' | 'Medium' | 'Low';
  dueDate: string | null;
}

export interface TodoModel {
  entities: Record<string, Todo>;
  allIds: string[];

  
  totalCount: Computed<TodoModel, number>;
  activeCount: Computed<TodoModel, number>;
  completedCount: Computed<TodoModel, number>;
  overdueCount: Computed<TodoModel, number>;
  items: Computed<TodoModel, Todo[]>;
  recentTasks: Computed<TodoModel, Todo[]>;
  dueSoonTasks: Computed<TodoModel, (Todo & { daysLeft: number })[]>;

  add: Action<TodoModel, TodoPayload>;
  remove: Action<TodoModel, string>;
  deleteMultiple: Action<TodoModel, string[]>;
  update: Action<TodoModel, TodoPayload & { id: string }>;
  toggleStatus: Action<TodoModel, string>;
  reorderTodo: Action<TodoModel, { sourceId: string; destinationId: string; isMovingDown: boolean }>;

  migrateCategory: Action<TodoModel, { from: string; to: string }>;
}

export interface SettingsModel {
    theme: string;
    categories: string[];
    toggleTheme: Action<SettingsModel>;
    addCategory: Action<SettingsModel, string>;
    removeCategory: Action<SettingsModel, string>;
    renameCategory: Action<SettingsModel, { oldName: string; newName: string }>;
}

export interface StoreModel {
  todos: TodoModel;
  settings: SettingsModel;
}