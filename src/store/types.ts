export interface Todo {
  id: string
  title: string
  description: string
  category: string
  priority: 'High' | 'Medium' | 'Low'
  dueDate: string
  completed: boolean
  createdAt: string
  completedAt?: string
  updatedAt?: string
}

export interface TodoPayload {
  title: string
  description: string
  category: string
  priority: 'High' | 'Medium' | 'Low'
  dueDate: string | null
}