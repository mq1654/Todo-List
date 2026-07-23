import { collection, doc, setDoc, updateDoc, deleteDoc, onSnapshot, query } from 'firebase/firestore'
import { db } from './firebaseConfig'

export interface Member {
    uid: string
    name: string
    email: string
    role: 'admin' | 'member'
    status: 'active' | 'inactive'
    createdAt: string
}

export async function createMember(name: string, email: string, password: string): Promise<Member> {
    const apiKey = import.meta.env.VITE_FIREBASE_API_KEY as string

    const res = await fetch(
        `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${apiKey}`,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password, returnSecureToken: true }),
        }
    )

    const data = await res.json()
    if (!res.ok) {
        const code: string = data?.error?.message ?? ''
        if (code === 'EMAIL_EXISTS') throw new Error('Email already exists.')
        throw new Error('Failed to create account. Please try again.')
    }

    const uid: string = data.localId
    const member: Member = {
        uid,
        name: name.trim(),
        email,
        role: 'member',
        status: 'active',
        createdAt: new Date().toISOString(),
    }

    await setDoc(doc(db, 'users', uid), member)
    return member
}

export async function deleteMember(uid: string): Promise<void> {
    await deleteDoc(doc(db, 'users', uid))
}

export function listenToMembers(callback: (members: Member[]) => void): () => void {
    const q = query(collection(db, 'users'))
    return onSnapshot(
        q,
        (snap) => {
            const members = snap.docs.map((d) => d.data() as Member)
            callback(members)
        },
        (err) => {
            console.warn('[listenToMembers] Firestore permission warning:', err.message)
            callback([])
        }
    )
}

export async function updateMemberStatus(uid: string, status: 'active' | 'inactive'): Promise<void> {
    await updateDoc(doc(db, 'users', uid), { status })
}


