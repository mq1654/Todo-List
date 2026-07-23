import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Table, Input, Select, Button, Tag, Popconfirm, App, Avatar, Segmented, Tooltip } from 'antd'
import { Search, Plus, Trash2, Users, UserCheck, UserX, ShieldAlert, Download } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { listenToMembers, deleteMember, updateMemberStatus, type Member } from '../firebase/userService'
import { exportMembersToCSV } from '../utils/todoHelpers'

export default function AdminMembersPage() {
    const navigate = useNavigate()
    const { user } = useAuth()
    const { message } = App.useApp()

    const [members, setMembers] = useState<Member[]>([])
    const [loading, setLoading] = useState(true)
    const [searchText, setSearchText] = useState('')
    const [roleFilter, setRoleFilter] = useState('All Roles')
    const [statusFilter, setStatusFilter] = useState('All Statuses')

    useEffect(() => {
        setLoading(true)
        const unsub = listenToMembers((data) => {
            setMembers(data.sort((a, b) => b.createdAt.localeCompare(a.createdAt)))
            setLoading(false)
        })
        return unsub
    }, [])

    const handleStatusToggle = async (uid: string, newStatus: 'active' | 'inactive') => {
        const target = members.find((m) => m.uid === uid)
        if (target?.role === 'admin') {
            message.error('Admin accounts cannot be disabled.')
            return
        }
        try {
            await updateMemberStatus(uid, newStatus)
            message.success(`Status changed to ${newStatus}.`)
        } catch {
            message.error('Failed to update status.')
        }
    }

    const handleDelete = async (uid: string) => {
        const target = members.find((m) => m.uid === uid)
        if (target?.role === 'admin') {
            message.error('Admin accounts cannot be deleted.')
            return
        }
        try {
            await deleteMember(uid)
            message.success('Member deleted successfully.')
        } catch {
            message.error('Failed to delete member.')
        }
    }

    const filteredMembers = members.filter((m) => {
        const matchSearch =
            m.name.toLowerCase().includes(searchText.toLowerCase()) ||
            m.email.toLowerCase().includes(searchText.toLowerCase())
        const matchRole = roleFilter === 'All Roles' || (roleFilter === 'Admin' && m.role === 'admin') || (roleFilter === 'Member' && m.role === 'member')
        const matchStatus = statusFilter === 'All Statuses' || (statusFilter === 'Active' && m.status === 'active') || (statusFilter === 'Inactive' && m.status === 'inactive')
        return matchSearch && matchRole && matchStatus
    })

    const totalMembers = members.length
    const activeMembers = members.filter(m => m.status === 'active' || !m.status).length
    const inactiveMembers = members.filter(m => m.status === 'inactive').length
    const adminMembers = members.filter(m => m.role === 'admin').length

    const columns = [
        {
            title: 'Member',
            dataIndex: 'name',
            key: 'name',
            render: (name: string, record: Member) => (
                <div className="flex items-center gap-3">
                    <Avatar className="bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 font-medium font-sm border-0">
                        {name[0]?.toUpperCase()}
                    </Avatar>
                    <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-800 dark:text-slate-200">{name}</span>
                        {record.uid === user?.uid && (
                            <Tag className="!bg-emerald-50 !text-emerald-600 !border-emerald-100 dark:!bg-emerald-500/10 dark:!text-emerald-400 dark:!border-emerald-500/20 !rounded-md !m-0 !px-1.5 !py-0 !text-[10px] font-semibold">
                                You
                            </Tag>
                        )}
                    </div>
                </div>
            ),
        },
        {
            title: 'Email',
            dataIndex: 'email',
            key: 'email',
            render: (text: string) => <span className="text-slate-500 dark:text-slate-400">{text}</span>,
        },
        {
            title: 'Role',
            dataIndex: 'role',
            key: 'role',
            render: (role: string) => (
                <Tag className={`!rounded-full !px-3 font-medium capitalize ${role === 'admin'
                    ? '!bg-amber-50 !text-amber-600 !border-amber-200 dark:!bg-amber-500/10 dark:!text-amber-400 dark:!border-amber-500/20'
                    : '!bg-blue-50 !text-blue-600 !border-blue-200 dark:!bg-blue-500/10 dark:!text-blue-400 dark:!border-blue-500/20'
                    }`}>
                    {role}
                </Tag>
            ),
        },
        {
            title: 'Status',
            dataIndex: 'status',
            key: 'status',
            render: (status: string, record: Member) => {
                const currentStatus = status === 'inactive' ? 'inactive' : 'active'
                const isSelf = record.uid === user?.uid
                const isAdmin = record.role === 'admin'
                const isDisabled = isAdmin || isSelf

                const segmentedComp = (
                    <Segmented
                        size="small"
                        value={currentStatus}
                        disabled={isDisabled}
                        options={[
                            { label: 'Active', value: 'active' },
                            { label: 'Inactive', value: 'inactive' },
                        ]}
                        onChange={(val) => handleStatusToggle(record.uid, val as 'active' | 'inactive')}
                        className={`
                            !rounded-lg !p-1 overflow-hidden font-medium text-xs border border-slate-200/80 dark:border-slate-700/60
                            !bg-slate-100 dark:!bg-slate-800/80
                            [&_.ant-segmented-thumb]:!rounded-md
                            [&_.ant-segmented-item]:!rounded-md
                            ${currentStatus === 'active'
                                ? '[&_.ant-segmented-thumb]:!bg-blue-50 dark:[&_.ant-segmented-thumb]:!bg-blue-950/60 [&_.ant-segmented-item-selected_.ant-segmented-item-label]:!text-blue-600 dark:[&_.ant-segmented-item-selected_.ant-segmented-item-label]:!text-blue-400 [&_.ant-segmented-item-selected_.ant-segmented-item-label]:!font-semibold'
                                : '[&_.ant-segmented-thumb]:!bg-rose-50 dark:[&_.ant-segmented-thumb]:!bg-rose-950/60 [&_.ant-segmented-item-selected_.ant-segmented-item-label]:!text-rose-600 dark:[&_.ant-segmented-item-selected_.ant-segmented-item-label]:!text-rose-400 [&_.ant-segmented-item-selected_.ant-segmented-item-label]:!font-semibold'
                            }
                            [&_.ant-segmented-item-label]:!px-2 [&_.ant-segmented-item-label]:!py-0.5 [&_.ant-segmented-item-label]:!relative [&_.ant-segmented-item-label]:!z-10
                            [&_.ant-segmented-item:not(.ant-segmented-item-selected)_.ant-segmented-item-label]:!text-slate-600 dark:[&_.ant-segmented-item:not(.ant-segmented-item-selected)_.ant-segmented-item-label]:!text-slate-400
                        `}
                    />
                )

                if (isDisabled) {
                    const tooltipTitle = isSelf
                        ? "You cannot disable your own account"
                        : "You cannot disable another Admin account"
                    return (
                        <Tooltip title={tooltipTitle}>
                            <span className="inline-block cursor-not-allowed opacity-80">{segmentedComp}</span>
                        </Tooltip>
                    )
                }

                return segmentedComp
            },
        },
        {
            title: 'Created At',
            dataIndex: 'createdAt',
            key: 'createdAt',
            render: (date: string) => (
                <span className="text-slate-500 dark:text-slate-400">
                    {new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
            ),
        },
        {
            title: 'Actions',
            key: 'actions',
            align: 'center' as const,
            render: (_: any, record: Member) => {
                const isAdmin = record.role === 'admin'
                const isSelf = record.uid === user?.uid

                return (
                    <div className="flex items-center justify-center gap-2">
                        {isAdmin ? (
                            <Tooltip title={isSelf ? "You cannot delete your own account" : "You cannot delete another Admin account"}>
                                <Button
                                    type="text"
                                    danger
                                    disabled
                                    icon={<Trash2 size={15} />}
                                    className="!text-slate-300 dark:!text-slate-600 !px-2 cursor-not-allowed"
                                />
                            </Tooltip>
                        ) : (
                            <Popconfirm
                                title="Delete member?"
                                description="This action cannot be undone."
                                onConfirm={() => handleDelete(record.uid)}
                                okText="Delete"
                                cancelText="Cancel"
                                okButtonProps={{ danger: true }}
                            >
                                <Button
                                    type="text"
                                    danger
                                    icon={<Trash2 size={15} />}
                                    className="!text-slate-400 hover:!text-red-500 hover:!bg-red-50 dark:hover:!bg-red-900/20 !px-2"
                                    title="Delete member"
                                />
                            </Popconfirm>
                        )}
                    </div>
                )
            },
        },
    ]

    return (
        <div className="p-6 md:p-8 max-w-[1400px] mx-auto space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Members</h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                        Manage member accounts and their access to the system
                    </p>
                </div>
                <Button
                    type="primary"
                    icon={<Plus size={16} />}
                    onClick={() => navigate('/admin/members/create')}
                    className="!bg-blue-600 hover:!bg-blue-700 !rounded-lg !h-10 !px-4 font-medium !border-0 shadow-sm"
                >
                    Create Account
                </Button>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: 'Total Members', value: totalMembers, icon: Users, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-900/20' },
                    { label: 'Active Members', value: activeMembers, icon: UserCheck, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
                    { label: 'Inactive Members', value: inactiveMembers, icon: UserX, color: 'text-slate-600 dark:text-slate-400', bg: 'bg-slate-100 dark:bg-slate-800' },
                    { label: 'Admin Members', value: adminMembers, icon: ShieldAlert, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-900/20' },
                ].map((stat, i) => (
                    <div key={i} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 flex items-center gap-4 shadow-sm">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${stat.bg}`}>
                            <stat.icon size={22} className={stat.color} />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-slate-900 dark:text-white tabular-nums leading-none mb-1">{stat.value}</p>
                            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{stat.label}</p>
                        </div>
                    </div>
                ))}
            </div>

            <div className="flex flex-col md:flex-row md:items-center gap-3">
                <Input
                    placeholder="Search by name or email..."
                    prefix={<Search size={16} className="text-slate-400" />}
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    className="md:max-w-xs !h-10 !rounded-lg dark:!bg-slate-900 dark:!border-slate-700 dark:!text-white"
                />
                <Select
                    value={roleFilter}
                    onChange={setRoleFilter}
                    className="md:w-36 !h-10 [&_.ant-select-selector]:!rounded-lg [&_.ant-select-selector]:!h-10 [&_.ant-select-selection-item]:!leading-[38px] dark:[&_.ant-select-selector]:!bg-slate-900 dark:[&_.ant-select-selector]:!border-slate-700 dark:[&_.ant-select-selection-item]:!text-white"
                    classNames={{ popup: { root: "dark:!bg-slate-800 dark:!border dark:!border-slate-700 [&_.ant-select-item]:dark:!text-slate-300 [&_.ant-select-item-option-active]:dark:!bg-slate-700" } }}
                >
                    <Select.Option value="All Roles">All Roles</Select.Option>
                    <Select.Option value="Admin">Admin</Select.Option>
                    <Select.Option value="Member">Member</Select.Option>
                </Select>
                <Select
                    value={statusFilter}
                    onChange={setStatusFilter}
                    className="md:w-36 !h-10 [&_.ant-select-selector]:!rounded-lg [&_.ant-select-selector]:!h-10 [&_.ant-select-selection-item]:!leading-[38px] dark:[&_.ant-select-selector]:!bg-slate-900 dark:[&_.ant-select-selector]:!border-slate-700 dark:[&_.ant-select-selection-item]:!text-white"
                    classNames={{ popup: { root: "dark:!bg-slate-800 dark:!border dark:!border-slate-700 [&_.ant-select-item]:dark:!text-slate-300 [&_.ant-select-item-option-active]:dark:!bg-slate-700" } }}
                >
                    <Select.Option value="All Statuses">All Statuses</Select.Option>
                    <Select.Option value="Active">Active</Select.Option>
                    <Select.Option value="Inactive">Inactive</Select.Option>
                </Select>

                <div className="flex-1" />

                <Button
                    icon={<Download size={16} />}
                    onClick={() => exportMembersToCSV(filteredMembers, `members-${Date.now()}.csv`)}
                    className="!h-10 !rounded-lg !border-slate-200 dark:!border-slate-700 dark:!bg-slate-900 dark:!text-slate-300 dark:hover:!border-slate-600 dark:hover:!text-white"
                >
                    Export CSV
                </Button>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
                <Table
                    columns={columns}
                    dataSource={filteredMembers}
                    rowKey="uid"
                    loading={loading}
                    pagination={{
                        pageSize: 10,
                        showTotal: (total, range) => `${range[0]}-${range[1]} of ${total}`,
                        className: '!mb-0 !px-6 !py-4 border-t border-slate-100 dark:border-slate-800 [&_.ant-pagination-item]:!rounded-md [&_.ant-pagination-item-active]:!border-blue-600 [&_.ant-pagination-item-active_a]:!text-blue-600 dark:[&_.ant-pagination-item-active]:!bg-blue-900/30 dark:[&_.ant-pagination-item]:!bg-slate-800 dark:[&_.ant-pagination-item_a]:!text-slate-400 dark:[&_.ant-pagination-item-active_a]:!text-blue-400',
                    }}
                    rowSelection={{
                        type: 'checkbox',
                        columnWidth: 48,
                    }}
                    className="
                        [&_.ant-table]:!bg-transparent 
                        [&_.ant-table-thead>tr>th]:!bg-slate-50 [&_.ant-table-thead>tr>th]:dark:!bg-slate-900/50 [&_.ant-table-thead>tr>th]:!text-slate-500 [&_.ant-table-thead>tr>th]:dark:!text-slate-400 [&_.ant-table-thead>tr>th]:!font-semibold [&_.ant-table-thead>tr>th]:!text-xs [&_.ant-table-thead>tr>th]:!uppercase [&_.ant-table-thead>tr>th]:!tracking-wider [&_.ant-table-thead>tr>th]:!border-slate-100 [&_.ant-table-thead>tr>th]:dark:!border-slate-800
                        [&_.ant-table-tbody>tr>td]:!border-slate-100 [&_.ant-table-tbody>tr>td]:dark:!border-slate-800
                        [&_.ant-table-tbody>tr:hover>td]:!bg-slate-50/50 [&_.ant-table-tbody>tr:hover>td]:dark:!bg-slate-800/30
                        [&_.ant-checkbox-checked_.ant-checkbox-inner]:!bg-blue-600 [&_.ant-checkbox-checked_.ant-checkbox-inner]:!border-blue-600
                        dark:[&_.ant-checkbox-inner]:!bg-slate-800 dark:[&_.ant-checkbox-inner]:!border-slate-600
                        dark:[&_.ant-empty-description]:!text-slate-500
                    "
                />
            </div>
        </div>
    )
}
