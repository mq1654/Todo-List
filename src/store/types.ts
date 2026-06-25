import { Action, Computed } from 'easy-peasy';

export interface Todo {
  id: string;
  title: string;
  description: string;
  category: string;
  priority: 'High' | 'Medium' | 'Low';
  dueDate: string | null;
  completed: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface TodoModel {
  items: Todo[];
  filter: 'all' | 'active' | 'completed';
  searchTerm: string;
  categoryFilter: string;
  sortByPriority: boolean;
  showOverdueOnly: boolean;
  
  totalCount: Computed<TodoModel, number>;
  activeCount: Computed<TodoModel, number>;
  completedCount: Computed<TodoModel, number>;
  filteredItems: Computed<TodoModel, Todo[]>;

  add: Action<TodoModel, { title: string; description: string; category: string; priority: 'High' | 'Medium' | 'Low'; dueDate: string | null }>;
  remove: Action<TodoModel, string>;
  update: Action<TodoModel, { id: string; title: string; description: string; category: string; priority: 'High' | 'Medium' | 'Low'; dueDate: string | null }>;
  toggleStatus: Action<TodoModel, string>;

  setFilter: Action<TodoModel, 'all' | 'active' | 'completed'>;
  setSearchTerm: Action<TodoModel, string>;
  setCategoryFilter: Action<TodoModel, string>;
  toggleSortByPriority: Action<TodoModel>;
  toggleShowOverdueOnly: Action<TodoModel>;

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