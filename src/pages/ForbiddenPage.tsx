import { useNavigate, useLocation, useSearchParams } from 'react-router-dom'
import { Alert, Button, Typography } from 'antd'
import { InfoCircleOutlined } from '@ant-design/icons'
import { LogIn, LayoutGrid, Shield, Lock, ArrowLeft } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'

const { Title } = Typography

export type ForbiddenReason = 'unauthenticated' | 'admin_only' | 'private_resource'

export default function ForbiddenPage({ reason }: { reason?: ForbiddenReason }) {
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const { user, role } = useAuth()

  const urlReason = searchParams.get('reason') as ForbiddenReason | null

  const activeReason: ForbiddenReason = reason ?? (urlReason || (
    !user
      ? 'unauthenticated'
      : (role === 'member' && location.pathname.startsWith('/admin'))
      ? 'admin_only'
      : 'private_resource'
  ))

  let alertTitle = 'Access Restricted'
  let alertBody = 'The page you are trying to access is only available for a specific role.'
  let buttonText = 'Back to Dashboard'
  let buttonIcon = <LayoutGrid size={16} />
  let handleAction = () => navigate('/')

  if (activeReason === 'unauthenticated') {
    alertTitle = 'Authentication Required'
    alertBody = 'Please log in with an authorized account to access this page.'
    buttonText = 'Log In'
    buttonIcon = <LogIn size={16} />
    const currentPath = location.pathname !== '/403' ? location.pathname + location.search : '/board'
    handleAction = () => navigate(`/login?redirect_to=${encodeURIComponent(currentPath)}`)
  } else if (activeReason === 'admin_only') {
    alertTitle = 'Admin Access Required'
    alertBody = 'This page is restricted to administrators only.'
    buttonText = 'Back to Dashboard'
    buttonIcon = <ArrowLeft size={16} />
    handleAction = () => navigate('/')
  } else if (activeReason === 'private_resource') {
    alertTitle = 'Private Content'
    alertBody = 'This resource is private or belongs to another user.'
    buttonText = 'Back to Dashboard'
    buttonIcon = <ArrowLeft size={16} />
    handleAction = () => navigate('/')
  }

  return (
    <div className="fixed inset-0 z-50 bg-[#070c18] dark:bg-[#070c18] flex items-center justify-center p-6 overflow-y-auto transition-colors duration-300">
      <div className="max-w-2xl w-full flex flex-col items-center text-center py-8 px-4 my-auto">
        <div className="relative w-72 h-64 mx-auto mb-6 flex items-center justify-center">
          <div className="absolute inset-0 bg-blue-500/15 rounded-full blur-3xl transform scale-90" />
          <div className="absolute w-48 h-48 bg-blue-900/35 rounded-full flex items-center justify-center" />

          <span className="absolute -top-2 left-4 text-blue-400/50 text-base font-bold font-mono">✕</span>
          <span className="absolute -top-3 right-6 text-blue-400/50 text-lg font-bold font-mono">✕</span>
          <span className="absolute top-10 -left-6 text-blue-300/40 text-sm font-bold font-mono">+</span>
          <span className="absolute top-12 -right-6 text-blue-300/40 text-sm font-bold font-mono">+</span>
          <span className="absolute bottom-2 left-2 text-blue-400/50 text-lg font-bold font-mono">✕</span>
          <span className="absolute bottom-0 right-4 text-blue-400/50 text-base font-bold font-mono">✕</span>
          <span className="absolute -bottom-3 left-1/3 text-blue-400/30 text-xs">●</span>
          <span className="absolute -top-4 right-1/3 text-blue-400/30 text-xs">●</span>

          <div className="relative z-10 text-blue-400 flex items-center justify-center">
            <Shield size={135} strokeWidth={1.5} className="fill-blue-950/40" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg">
                <Lock size={28} strokeWidth={2.5} />
              </div>
            </div>
          </div>
        </div>

        <Title level={1} className="!text-4xl sm:!text-5xl font-extrabold !text-white !mb-10 tracking-tight">
          403 Forbidden
        </Title>

        <div className="w-full flex justify-center mt-2 mb-8">
          <div className="w-full max-w-md">
            <Alert
              type="info"
              showIcon
              icon={<InfoCircleOutlined className="!text-blue-500 !text-2xl" />}
              title={<span className="font-bold text-slate-100 text-sm sm:text-base">{alertTitle}</span>}
              description={
                <span className="text-xs sm:text-sm text-slate-400 block mt-0.5 leading-relaxed">
                  {alertBody}
                </span>
              }
              className="!bg-[#0f172a]/80 !border-slate-800/90 !rounded-2xl !p-4 sm:!p-5 !text-left shadow-lg"
            />
          </div>
        </div>

        <div className="flex items-center justify-center gap-3 flex-wrap pt-2">
          <Button
            type="primary"
            size="large"
            icon={buttonIcon}
            onClick={handleAction}
            className="bg-blue-600 hover:!bg-blue-700 font-semibold rounded-xl px-6 flex items-center justify-center gap-2 h-11 shadow-sm"
          >
            {buttonText}
          </Button>
        </div>
      </div>
    </div>
  )
}
