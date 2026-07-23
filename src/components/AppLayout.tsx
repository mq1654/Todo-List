import { useNavigate, useLocation, Outlet } from 'react-router-dom'
import { Settings } from 'lucide-react'
import { Avatar, Button, Segmented, Tooltip, ConfigProvider } from 'antd'
import { LayoutGrid, Table2, BarChart2 } from 'lucide-react'
import { useTodoStats } from '../store'
import { useAuth } from '../hooks/useAuth'
import { logout } from '../firebase/authService'
import { keepParams, TABLE_KEYS } from '../utils/urlHelpers'

const NAV_TABS = [
    { label: 'Board', value: '/board', icon: <LayoutGrid size={14} /> },
    { label: 'Table', value: '/table', icon: <Table2 size={14} /> },
    { label: 'Dashboard', value: '/dashboard', icon: <BarChart2 size={14} /> },
]

export default function AppLayout() {
    const { totalCount, activeCount, completedCount } = useTodoStats()
    const { user } = useAuth()
    const navigate = useNavigate()
    const location = useLocation()

    const activeTab = NAV_TABS.find((t) => t.value === location.pathname)?.value ?? '/board'

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors duration-300 flex flex-col">
            <header className="bg-white border-b border-slate-200 sticky top-0 z-10 dark:bg-slate-800 dark:border-slate-700">
                <div className="max-w-full mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2.5">
                            <div className="w-6 h-6 bg-slate-900 rounded-md dark:bg-slate-100" />
                            <span className="text-sm font-bold text-slate-900 tracking-tight dark:text-white">Todo List</span>
                        </div>

                        {totalCount > 0 && (
                            <div className="hidden sm:flex items-center gap-5 pl-4 border-l border-slate-200 dark:border-slate-700">
                                {[
                                    { count: totalCount, label: 'Total' },
                                    { count: activeCount, label: 'Active' },
                                    { count: completedCount, label: 'Done' },
                                ].map(({ count, label }) => (
                                    <div key={label} className="text-center">
                                        <p className="text-lg font-bold text-slate-900 dark:text-white tabular-nums leading-none">{count}</p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{label}</p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="flex items-center gap-3">
                        {user && (
                            <Tooltip
                                title={
                                    <div className="text-center py-1">
                                        <p className="font-medium text-sm">{user.displayName}</p>
                                        <p className="text-xs opacity-75 mt-0.5">{user.email}</p>
                                        <Button
                                            type="text"
                                            danger
                                            size="small"
                                            onClick={() => logout().then(() => navigate('/login'))}
                                            className="mt-2.5 !text-xs !text-red-400 hover:!text-red-300 transition-colors"
                                        >
                                            Sign out
                                        </Button>
                                    </div>
                                }
                                placement="bottomRight"
                            >
                                <Avatar
                                    src={user.photoURL}
                                    size={32}
                                    className="cursor-pointer ring-2 ring-slate-200 dark:ring-slate-600 hover:ring-blue-400 transition-all"
                                >
                                    {user.displayName?.[0] ?? user.email?.[0]}
                                </Avatar>
                            </Tooltip>
                        )}

                        <Button
                            type="text"
                            onClick={() => navigate('/setting')}
                            className="flex items-center justify-center text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-full transition-colors dark:hover:bg-slate-700 dark:hover:text-white"
                            aria-label="Settings"
                            icon={<Settings size={20} />}
                        />
                    </div>
                </div>
            </header>

            <main className="flex-1 flex flex-col pb-20">
                <Outlet />
            </main>

            <div className="fixed bottom-4 left-0 right-0 flex justify-center z-20 pointer-events-none">
                <div className="pointer-events-auto">
                    <ConfigProvider
                        theme={{
                            components: {
                                Segmented: {
                                    itemSelectedBg: '#eff6ff',
                                    itemSelectedColor: '#2563eb',
                                    itemHoverBg: 'transparent',
                                    itemHoverColor: '#3b82f6',
                                    trackBg: '#ffffff',
                                    borderRadius: 8,
                                },
                            },
                        }}
                    >
                        <Segmented
                            options={NAV_TABS.map((t) => ({
                                label: (
                                    <span className="flex items-center gap-2 px-3 py-1 font-medium">
                                        {t.icon}
                                        {t.label}
                                    </span>
                                ),
                                value: t.value,
                            }))}
                            value={activeTab}
                            onChange={(val) => navigate(val + keepParams(location.search, TABLE_KEYS))}
                            className="!shadow-md !p-1 scale-110 origin-bottom dark:!bg-slate-800"
                            size="large"
                        />
                    </ConfigProvider>
                </div>
            </div>
        </div>
    )
}

