import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Form, Input, Button, Typography, Card, Divider, App } from 'antd'
import { Mail, Lock } from 'lucide-react'
import GoogleLoginButton from '../components/GoogleLoginButton'
import { loginWithGoogle, loginWithEmail } from '../firebase/authService'

const REASON_MESSAGES: Record<string, string> = {
    disabled: 'Your account is currently disabled.',
    deleted: 'Your account has been deleted by Admin.',
}

export default function LoginPage() {
    const navigate = useNavigate()
    const [searchParams] = useSearchParams()
    const redirectTo = searchParams.get('redirect_to')
    const reason = searchParams.get('reason')
    const { message } = App.useApp()
    const [googleLoading, setGoogleLoading] = useState(false)
    const [emailLoading, setEmailLoading] = useState(false)
    const hasShownReasonRef = useRef(false)

    useEffect(() => {
        if (reason && REASON_MESSAGES[reason] && !hasShownReasonRef.current) {
            hasShownReasonRef.current = true
            message.error(REASON_MESSAGES[reason])
        }
    }, [reason, message])

    async function onFinish(values: { email: string; password: string }) {
        setEmailLoading(true)
        try {
            await loginWithEmail(values.email, values.password)
            navigate(redirectTo || '/board', { replace: true })
        } catch (error: unknown) {
            if (error instanceof Error && error.message === 'Your account is currently disabled.') {
                message.error('Your account is currently disabled.')
            } else if (error instanceof Error && error.message === 'Your account does not exist.') {
                message.error('Your account does not exist.')
            } else {
                message.error('Email or password is incorrect.')
            }
        } finally {
            setEmailLoading(false)
        }
    }

    async function handleGoogleLogin() {
        setGoogleLoading(true)
        try {
            await loginWithGoogle()
            navigate(redirectTo || '/board', { replace: true })
        } catch (error: unknown) {
            if (error instanceof Error && error.message === 'Your account is currently disabled.') {
                message.error('Your account is currently disabled.')
            } else {
                message.error('Your account does not exist.')
            }
        } finally {
            setGoogleLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-4 transition-colors duration-300">
            <div className="w-full max-w-md">
                <div className="text-center mb-8">
                    <Typography.Title level={2} className="!text-3xl font-bold text-slate-900 dark:text-white mb-2">
                        Welcome back
                    </Typography.Title>
                    <p className="text-slate-500 dark:text-slate-400">
                        Please enter to sign in.
                    </p>
                </div>

                <Card className="shadow-sm border-slate-200 dark:border-slate-700">
                    <Form
                        name="login"
                        layout="vertical"
                        onFinish={onFinish}
                        autoComplete="off"
                        requiredMark={false}
                        size="large"
                    >
                        <Form.Item
                            label={<span className="text-sm font-medium text-slate-700 dark:text-slate-300">Email</span>}
                            name="email"
                            rules={[{ required: true, message: 'Please input your email!' }, { type: 'email', message: 'Please enter a valid email!' }]}
                        >
                            <Input
                                prefix={<Mail size={18} className="text-slate-400 mr-2" />}
                                placeholder="Enter your email"
                            />
                        </Form.Item>

                        <Form.Item
                            label={<span className="text-sm font-medium text-slate-700 dark:text-slate-300">Password</span>}
                            name="password"
                            rules={[{ required: true, message: 'Please input your password!' }]}
                        >
                            <Input.Password
                                prefix={<Lock size={18} className="text-slate-400 mr-2" />}
                                placeholder="••••••••"
                            />
                        </Form.Item>

                        <div className="flex items-center justify-between mb-6 mt-[-10px]">
                            <div />
                            <a className="text-sm font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300 transition-colors" href="#">
                                Forgot password?
                            </a>
                        </div>

                        <Form.Item className="mb-0">
                            <Button
                                type="primary"
                                htmlType="submit"
                                loading={emailLoading}
                                className="w-full h-11 text-base font-semibold shadow-sm"
                            >
                                Sign in
                            </Button>
                        </Form.Item>
                    </Form>

                    <Divider className="!text-slate-400 dark:!text-slate-500 !text-xs !my-5">
                        or
                    </Divider>

                    <GoogleLoginButton onClick={handleGoogleLogin} loading={googleLoading} />
                </Card>

            </div>
        </div>
    )
}
