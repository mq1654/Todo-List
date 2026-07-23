import { collection, addDoc, updateDoc, deleteDoc, doc, writeBatch } from 'firebase/firestore'
import { db } from './firebaseConfig'

const tasksRef = collection(db, 'tasks')

export interface CreateTaskInput {
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
}

export async function createTask(payload: CreateTaskInput) {
  return addDoc(tasksRef, { ...payload, createdAt: new Date().toISOString() })
}

export async function updateTask(id: string, data: Record<string, unknown>) {
  return updateDoc(doc(db, 'tasks', id), data)
}

export async function deleteTask(id: string) {
  return deleteDoc(doc(db, 'tasks', id))
}

export async function deleteTasks(ids: string[]) {
  const batch = writeBatch(db)
  ids.forEach((id) => batch.delete(doc(db, 'tasks', id)))
  return batch.commit()
}
