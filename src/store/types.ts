export interface Todo {
  id: string
  title: string
  description: string
  category: string
  priority: 'High' | 'Medium' | 'Low'
  dueDate: string
  completed: boolean
  columnId: string
  order: number
  assigneeId: string | null
  createdBy: string
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
  assigneeId?: string | null
}

export interface Column {
  id: string
  name: string
  order: number
  userId: string
  createdAt: string
}