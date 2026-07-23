import { useState, useEffect } from 'react'
import { listenToMembers, type Member } from '../firebase/userService'
import { useAuth } from './useAuth'
import { auth } from '../firebase/firebaseConfig'

let cachedMembers: Member[] = []
let cachedActiveMembers: Member[] = []
let isLoading = true
let unsubscribe: (() => void) | null = null
const listeners = new Set<() => void>()

function areMembersEqual(a: Member[], b: Member[]): boolean {
    if (a.length !== b.length) return false
    for (let i = 0; i < a.length; i++) {
        if (
            a[i].uid !== b[i].uid ||
            a[i].name !== b[i].name ||
            a[i].email !== b[i].email ||
            a[i].role !== b[i].role ||
            a[i].status !== b[i].status
        ) {
            return false
        }
    }
    return true
}

function notify() {
    listeners.forEach((listener) => listener())
}

function startListening() {
    if (unsubscribe) return
    unsubscribe = listenToMembers((data) => {
        isLoading = false
        if (!areMembersEqual(cachedMembers, data)) {
            cachedMembers = data
            cachedActiveMembers = data.filter((m) => m.status === 'active' || !m.status)
            notify()
        }
    })
}

export function useMembers() {
    const { user, role, userName } = useAuth()
    const [, tick] = useState(0)

    useEffect(() => {
        if (role !== 'admin') return

        const onChange = () => tick((n) => n + 1)
        listeners.add(onChange)
        startListening()

        return () => {
            listeners.delete(onChange)
        }
    }, [role])

    if (role !== 'admin') {
        const currentUser = auth.currentUser
        const memberName = userName || currentUser?.displayName || currentUser?.email?.split('@')[0] || 'Me'
        const currentMember: Member[] = currentUser
            ? [
                  {
                      uid: currentUser.uid,
                      name: memberName,
                      email: currentUser.email || '',
                      role: 'member',
                      status: 'active',
                      createdAt: '',
                  },
              ]
            : []
        return {
            members: currentMember,
            activeMembers: currentMember,
            loading: false,
        }
    }

    return {
        members: cachedMembers,
        activeMembers: cachedActiveMembers,
        loading: isLoading,
    }
}

