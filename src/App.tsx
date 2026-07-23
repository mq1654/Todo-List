import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import AuthGuard from './components/AuthGuard'
import AppLayout from './components/AppLayout'
import AdminLayout from './components/AdminLayout'
import TodoPage from './pages/TodoPage'
import TodoDetail from './pages/TodoDetail'
import SettingsPage from './pages/SettingsPage'
import TableViewPage from './pages/TableViewPage'
import DashboardPage from './pages/DashboardPage'
import LoginPage from './pages/LoginPage'
import AdminMembersPage from './pages/AdminMembersPage'
import AdminCreateMemberPage from './pages/AdminCreateMemberPage'

import WorkInProgressPage from './pages/WorkInProgressPage'
import ForbiddenPage from './pages/ForbiddenPage'

function App() {
    return (
        <Router>
            <Routes>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/403" element={<ForbiddenPage />} />

                <Route path="/admin" element={<AuthGuard><AdminLayout /></AuthGuard>}>
                    <Route index element={<Navigate to="/admin/members" replace />} />
                    <Route path="dashboard" element={<WorkInProgressPage title="Dashboard" />} />
                    <Route path="members" element={<AdminMembersPage />} />
                    <Route path="members/create" element={<AdminCreateMemberPage />} />
                    <Route path="tasks" element={<TodoPage />} />
                    <Route path="reports" element={<WorkInProgressPage title="Reports" />} />
                    <Route path="settings" element={<SettingsPage />} />
                </Route>

                <Route element={<AuthGuard><AppLayout /></AuthGuard>}>
                    <Route path="/" element={<TodoPage />} />
                    <Route path="/board" element={<TodoPage />} />
                    <Route path="/table" element={<TableViewPage />} />
                    <Route path="/dashboard" element={<DashboardPage />} />
                    <Route path="/todoDetail/:id" element={<TodoDetail />} />
                    <Route path="/setting" element={<SettingsPage />} />
                </Route>
            </Routes>
        </Router>
    )
}

export default App
