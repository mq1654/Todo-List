import { useEffect } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { Spin } from 'antd'
import { initFirestoreSync, stopFirestoreSync } from '../store'
import { useAuth } from '../hooks/useAuth'
import ForbiddenPage from '../pages/ForbiddenPage'

export default function AuthGuard({ children }: { children: React.ReactNode }) {
    const { user, role, loading } = useAuth()
    const location = useLocation()

    useEffect(() => {
        if (loading) return
        if (user && role) {
            initFirestoreSync(role)
        } else if (!user) {
            stopFirestoreSync()
        }
    }, [user, role, loading])

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
                <Spin size="large" />
            </div>
        )
    }

    if (!user) {
        return <ForbiddenPage reason="unauthenticated" />
    }

    if (role === 'member' && location.pathname.startsWith('/admin')) {
        return <ForbiddenPage reason="admin_only" />
    }

    if (role === 'admin' && !location.pathname.startsWith('/admin') && location.pathname !== '/403') {
        return <Navigate to="/admin/members" replace />
    }

    return <>{children}</>
}
