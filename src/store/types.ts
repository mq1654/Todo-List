export interface Todo {
  id: string
  title: string
  description: string
  category: string
  priority: 'High' | 'Medium' | 'Low'
  dueDate: string
  completed: boolean
  columnId: string
  createdAt: string
  statusChangedAt?: string
  updatedAt?: string
}

export interface TodoPayload {
  title: string
  description: string
  category: string
  priority: 'High' | 'Medium' | 'Low'
  dueDate: string | null
}

export interface Column {
  id: string
  name: string
  isDoneColumn: boolean
  createdAt: string
}