import { useNavigate, useLocation, Outlet } from 'react-router-dom'
import { Avatar, Tooltip, Dropdown, Button } from 'antd'
import {
    LayoutDashboard,
    Users,
    ListTodo,
    Tag,
    Settings,
    LogOut,
    ChevronRight,
    UserPlus,
    UserCog,
} from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { logout } from '../firebase/authService'

const NAV_ITEMS = [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/admin/dashboard' },
    {
        label: 'Members',
        icon: Users,
        path: '/admin/members',
        children: [
            { label: 'Create Account', path: '/admin/members/create', icon: UserPlus },
            { label: 'Manage Member', path: '/admin/members', icon: UserCog },
        ],
    },
    { label: 'Tasks', icon: ListTodo, path: '/admin/tasks' },
    { label: 'Settings', icon: Settings, path: '/admin/settings' },
]

export default function AdminLayout() {
    const navigate = useNavigate()
    const location = useLocation()
    const { user } = useAuth()

    async function handleLogout() {
        await logout()
        navigate('/login')
    }

    return (
        <div className="flex min-h-screen bg-slate-100 dark:bg-slate-950">
            <aside className="w-64 flex-shrink-0 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col">
                <div className="h-16 px-6 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold text-sm shadow-sm">
                        A
                    </div>
                    <div>
                        <p className="text-sm font-bold text-slate-900 dark:text-white leading-none">Admin Workspace</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">Management Portal</p>
                    </div>
                </div>

                <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
                    <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest px-3 mb-3">
                        Project shortcuts
                    </p>

                    {NAV_ITEMS.map(({ label, icon: Icon, path, children }) => {
                        const isActive = location.pathname === path
                        
                        const buttonComp = (
                            <Button
                                key={path}
                                type="text"
                                onClick={() => navigate(path)}
                                className={`!w-full !flex !items-center !justify-between !px-3 !py-2.5 !h-auto !rounded-xl !text-sm !font-medium transition-all duration-150 group ${
                                    isActive
                                        ? '!bg-blue-50 !text-blue-600 dark:!bg-blue-900/30 dark:!text-blue-400'
                                        : '!text-slate-600 hover:!bg-slate-50 hover:!text-slate-900 dark:!text-slate-400 dark:hover:!bg-slate-800 dark:hover:!text-white'
                                }`}
                            >
                                <div className="flex items-center gap-3">
                                    <Icon
                                        size={18}
                                        className={`flex-shrink-0 transition-colors ${
                                            isActive
                                                ? 'text-blue-600 dark:text-blue-400'
                                                : 'text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300'
                                        }`}
                                    />
                                    {label}
                                </div>
                                {children && (
                                    <ChevronRight
                                        size={14}
                                        className={`transition-colors ${
                                            isActive
                                                ? 'text-blue-600 dark:text-blue-400'
                                                : 'text-slate-300 group-hover:text-slate-500 dark:text-slate-600 dark:group-hover:text-slate-400'
                                        }`}
                                    />
                                )}
                            </Button>
                        )

                        if (children) {
                            return (
                                <Dropdown
                                    key={path}
                                    placement="rightTop"
                                    trigger={['hover']}
                                    menu={{
                                        items: children.map((c) => ({
                                            key: c.label,
                                            label: (
                                                <div className="flex items-center gap-2.5 px-1 py-0.5 text-slate-600 dark:text-slate-300 font-medium text-sm">
                                                    <c.icon size={15} className="text-slate-400 dark:text-slate-500" />
                                                    {c.label}
                                                </div>
                                            ),
                                            onClick: () => navigate(c.path),
                                        })),
                                    }}
                                    rootClassName="[&_.ant-dropdown-menu]:!rounded-xl [&_.ant-dropdown-menu]:!p-2 [&_.ant-dropdown-menu]:!shadow-xl [&_.ant-dropdown-menu]:dark:!bg-slate-800 [&_.ant-dropdown-menu]:dark:!border [&_.ant-dropdown-menu]:dark:!border-slate-700 [&_.ant-dropdown-menu-item:hover]:!bg-slate-50 [&_.ant-dropdown-menu-item:hover]:dark:!bg-slate-700/50 [&_.ant-dropdown-menu-item]:!rounded-lg"
                                >
                                    {buttonComp}
                                </Dropdown>
                            )
                        }

                        return buttonComp
                    })}

                    <div className="pt-4">
                        <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest px-3 mb-3">
                            Quick links
                        </p>
                        {[{ label: 'Reports', path: '/admin/reports' }].map((item) => (
                            <Button
                                key={item.label}
                                type="text"
                                onClick={() => navigate(item.path)}
                                className={`!w-full !flex !items-center !justify-between !px-3 !py-2.5 !h-auto !rounded-xl !text-sm !font-medium transition-all ${
                                    location.pathname === item.path
                                        ? '!bg-blue-50 !text-blue-600 dark:!bg-blue-900/30 dark:!text-blue-400'
                                        : '!text-slate-500 hover:!bg-slate-50 hover:!text-slate-800 dark:!text-slate-500 dark:hover:!bg-slate-800 dark:hover:!text-slate-300'
                                }`}
                            >
                                {item.label}
                                <ChevronRight size={14} className="text-slate-300 dark:text-slate-600" />
                            </Button>
                        ))}
                    </div>
                </nav>

                <div className="border-t border-slate-100 dark:border-slate-800 p-3">
                    <div className="flex items-center gap-2.5 px-2 py-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                        <Avatar
                            src={user?.photoURL}
                            size={34}
                            className="ring-2 ring-slate-200 dark:ring-slate-700 flex-shrink-0"
                        >
                            {(user?.displayName ?? user?.email ?? 'A')[0].toUpperCase()}
                        </Avatar>
                        <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-slate-800 dark:text-white truncate">
                                {user?.displayName ?? 'Admin'}
                            </p>
                            <p className="text-[10px] text-slate-400 truncate">{user?.email}</p>
                        </div>
                        <Tooltip title="Sign out" placement="top">
                            <Button
                                type="text"
                                onClick={handleLogout}
                                icon={<LogOut size={15} />}
                                className="!flex-shrink-0 !p-1.5 !w-8 !h-8 !min-w-[32px] !rounded-lg !text-slate-400 hover:!text-red-500 hover:!bg-red-50 dark:hover:!bg-red-900/20 transition-colors"
                            />
                        </Tooltip>
                    </div>
                </div>
            </aside>

            <main className="flex-1 overflow-auto">
                <Outlet />
            </main>
        </div>
    )
}
