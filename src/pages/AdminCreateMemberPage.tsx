import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { App, Button, Form, Input, Select, Switch } from 'antd'
import { UserPlus } from 'lucide-react'
import { createMember } from '../firebase/userService'

export default function AdminCreateMemberPage() {
    const navigate = useNavigate()
    const { message } = App.useApp()
    const [form] = Form.useForm()
    const [submitting, setSubmitting] = useState(false)

    const onFinish = async (values: any) => {
        setSubmitting(true)
        try {
            await createMember(values.name, values.email, values.password)
            message.success('Member account created successfully!')
            navigate('/admin/members')
        } catch (err: unknown) {
            message.error(err instanceof Error ? err.message : 'Failed to create member.')
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <div className="max-w-4xl mx-auto px-6 py-8">
            <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center border border-blue-100 dark:border-blue-800">
                    <UserPlus className="text-blue-600 dark:text-blue-400" size={24} />
                </div>
                <div>
                    <h1 className="text-xl font-bold text-slate-900 dark:text-white">Create Member Account</h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                        Create a new member account to give access to the system
                    </p>
                </div>
            </div>

            <Form
                form={form}
                layout="vertical"
                onFinish={onFinish}
                initialValues={{
                    role: 'member',
                    status: true,
                }}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm"
                requiredMark={false}
            >
                <div className="p-6 md:p-8 border-b border-slate-200 dark:border-slate-800">
                    <h2 className="text-base font-semibold text-slate-900 dark:text-white mb-6">
                        Account Information
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5">
                        <Form.Item
                            name="name"
                            label={<span className="text-sm font-medium text-slate-700 dark:text-slate-300">Full Name <span className="text-red-500">*</span></span>}
                            rules={[{ required: true, message: 'Please enter full name' }]}
                            className="mb-0"
                        >
                            <Input
                                placeholder="Enter full name"
                                size="large"
                                className="!rounded-lg dark:!bg-slate-800 dark:!border-slate-700 dark:!text-white hover:dark:!border-slate-600 focus:dark:!border-blue-500"
                            />
                        </Form.Item>

                        <Form.Item
                            name="email"
                            label={<span className="text-sm font-medium text-slate-700 dark:text-slate-300">Email <span className="text-red-500">*</span></span>}
                            rules={[
                                { required: true, message: 'Please enter email address' },
                                { type: 'email', message: 'Please enter a valid email' }
                            ]}
                            className="mb-0"
                        >
                            <Input
                                placeholder="Enter email address"
                                size="large"
                                className="!rounded-lg dark:!bg-slate-800 dark:!border-slate-700 dark:!text-white hover:dark:!border-slate-600 focus:dark:!border-blue-500"
                            />
                        </Form.Item>

                        <Form.Item
                            name="password"
                            label={<span className="text-sm font-medium text-slate-700 dark:text-slate-300">Password <span className="text-red-500">*</span></span>}
                            rules={[
                                { required: true, message: 'Please enter password' },
                                { min: 8, message: 'Password must be at least 8 characters' }
                            ]}
                            className="mb-0"
                        >
                            <Input.Password
                                placeholder="Enter password"
                                size="large"
                                className="!rounded-lg [&>input]:dark:!bg-slate-800 dark:!bg-slate-800 dark:!border-slate-700 dark:!text-white hover:dark:!border-slate-600 focus-within:dark:!border-blue-500"
                            />
                        </Form.Item>

                        <Form.Item
                            name="confirm"
                            label={<span className="text-sm font-medium text-slate-700 dark:text-slate-300">Confirm Password <span className="text-red-500">*</span></span>}
                            dependencies={['password']}
                            rules={[
                                { required: true, message: 'Please confirm password' },
                                ({ getFieldValue }) => ({
                                    validator(_, value) {
                                        if (!value || getFieldValue('password') === value) {
                                            return Promise.resolve()
                                        }
                                        return Promise.reject(new Error('The two passwords do not match'))
                                    },
                                }),
                            ]}
                            className="mb-0"
                            extra={<span className="text-xs text-slate-500 dark:text-slate-400 mt-1 block">Password must be at least 8 characters long.</span>}
                        >
                            <Input.Password
                                placeholder="Confirm password"
                                size="large"
                                className="!rounded-lg [&>input]:dark:!bg-slate-800 dark:!bg-slate-800 dark:!border-slate-700 dark:!text-white hover:dark:!border-slate-600 focus-within:dark:!border-blue-500"
                            />
                        </Form.Item>
                    </div>
                </div>

                <div className="p-6 md:p-8 border-b border-slate-200 dark:border-slate-800">
                    <h2 className="text-base font-semibold text-slate-900 dark:text-white mb-6">
                        Role & Permissions
                    </h2>

                    <Form.Item
                        name="role"
                        label={<span className="text-sm font-medium text-slate-700 dark:text-slate-300">Role <span className="text-red-500">*</span></span>}
                        rules={[{ required: true }]}
                    >
                        <Select
                            size="large"
                            className="!rounded-lg [&_.ant-select-selector]:!rounded-lg [&_.ant-select-selector]:dark:!bg-slate-800 [&_.ant-select-selector]:dark:!border-slate-700 [&_.ant-select-selection-item]:dark:!text-white hover:[&_.ant-select-selector]:dark:!border-slate-600"
                            classNames={{ popup: { root: "dark:!bg-slate-800 dark:!border dark:!border-slate-700 [&_.ant-select-item]:dark:!text-slate-300 [&_.ant-select-item-option-active]:dark:!bg-slate-700" } }}
                        >
                            <Select.Option value="member">Member</Select.Option>
                            <Select.Option value="admin">Admin</Select.Option>
                        </Select>
                    </Form.Item>
                </div>

                <div className="p-6 md:p-8">
                    <h2 className="text-base font-semibold text-slate-900 dark:text-white mb-6">
                        Additional Information
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div>
                            <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Status</p>
                            <div className="flex items-center gap-3">
                                <Form.Item name="status" valuePropName="checked" noStyle>
                                    <Switch className="dark:bg-slate-600 [&.ant-switch-checked]:!bg-blue-600" />
                                </Form.Item>
                                <span className="text-sm font-medium text-slate-900 dark:text-white">Active</span>
                            </div>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                                Inactive members won't be able to login.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3">
                    <Button
                        size="large"
                        onClick={() => navigate('/admin/members')}
                        className="!rounded-lg !border-slate-300 dark:!border-slate-600 dark:!bg-transparent dark:!text-slate-300 hover:dark:!border-slate-400 hover:dark:!text-white"
                    >
                        Cancel
                    </Button>
                    <Button
                        type="primary"
                        htmlType="submit"
                        size="large"
                        loading={submitting}
                        icon={<UserPlus size={16} />}
                        className="!rounded-lg !bg-blue-600 hover:!bg-blue-700 !border-0 font-medium"
                    >
                        Create Member
                    </Button>
                </div>
            </Form>
        </div>
    )
}
