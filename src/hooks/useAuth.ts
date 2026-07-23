import { createContext, useContext, useEffect, useState, createElement, type ReactNode } from 'react'
import { onAuthStateChanged, signOut, type User } from 'firebase/auth'
import { doc, onSnapshot } from 'firebase/firestore'
import { auth, db } from '../firebase/firebaseConfig'

interface AuthContextType {
    user: User | null
    role: 'admin' | 'member' | null
    userName: string | null
    loading: boolean
}

const AuthContext = createContext<AuthContextType>({
    user: auth.currentUser,
    role: null,
    userName: null,
    loading: true,
})

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(auth.currentUser)
    const [role, setRole] = useState<'admin' | 'member' | null>(null)
    const [userName, setUserName] = useState<string | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        let unsubscribeSnapshot: (() => void) | null = null

        const clearAuthState = async () => {
            await signOut(auth)
            setUser(null)
            setRole(null)
            setUserName(null)
            setLoading(false)
        }

        const handleRevokedUser = async (reason: 'deleted' | 'disabled') => {
            await clearAuthState()
            window.location.href = `/login?reason=${reason}`
        }

        const unsubAuth = onAuthStateChanged(auth, async (u) => {
            if (unsubscribeSnapshot) {
                unsubscribeSnapshot()
                unsubscribeSnapshot = null
            }

            if (u) {
                setUser(u)
                try {
                    await u.getIdToken(true)
                    const userRef = doc(db, 'users', u.uid)

                    unsubscribeSnapshot = onSnapshot(
                        userRef,
                        async (snap) => {
                            if (!snap.exists()) {
                                await handleRevokedUser('deleted')
                            } else if (snap.data()?.status === 'inactive') {
                                await handleRevokedUser('disabled')
                            } else {
                                setUser(u)
                                setRole((snap.data()?.role as 'admin' | 'member') ?? 'member')
                                setUserName(snap.data()?.name ?? u.displayName ?? u.email)
                            }
                            setLoading(false)
                        },
                        async () => {
                            await clearAuthState()
                        }
                    )
                } catch {
                    await clearAuthState()
                }
            } else {
                setUser(null)
                setRole(null)
                setUserName(null)
                setLoading(false)
            }
        })

        return () => {
            unsubAuth()
            if (unsubscribeSnapshot) unsubscribeSnapshot()
        }
    }, [])

    return createElement(AuthContext.Provider, { value: { user, role, userName, loading } }, children)
}

export function useAuth() {
    return useContext(AuthContext)
}
