import { collection, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore'
import { db } from './firebaseConfig'

const columnsRef = collection(db, 'columns')

export async function createColumn(name: string, order: number, userId: string) {
  return addDoc(columnsRef, { name, order, userId, createdAt: new Date().toISOString() })
}

export async function updateColumn(id: string, data: Record<string, unknown>) {
  return updateDoc(doc(db, 'columns', id), data)
}

export async function deleteColumn(id: string) {
  return deleteDoc(doc(db, 'columns', id))
}
