import { Wrench } from 'lucide-react'

export default function WorkInProgressPage({ title }: { title?: string }) {
  return (
    <div className="min-h-[60vh] flex items-center justify-center p-6">
      <div className="flex items-center gap-3 px-5 py-3 rounded-2xl bg-white dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <Wrench size={20} className="text-blue-500 dark:text-blue-400" />
        <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
          {title ? `${title} — Work in Progress` : 'Work in Progress'}
        </span>
      </div>
    </div>
  )
}
