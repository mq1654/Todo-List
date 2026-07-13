import { useParams, useNavigate } from 'react-router-dom'
import { useStore } from '../store'
import { ArrowLeft, Calendar, Tag, CheckCircle2, Circle, Clock, AlertCircle, Columns } from 'lucide-react'
import { Button, Typography, Card } from 'antd'
import { getPriorityColor } from '../utils/todoHelpers'

export default function TodoDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const todo = useStore((s) => s.todos.entities[id!])
  const columnEntities = useStore((s) => s.board.columnEntities)

  if (!todo) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 transition-colors duration-300 dark:bg-slate-900">
        <AlertCircle size={48} className="text-slate-400 mb-4 dark:text-slate-500" />
        <Typography.Title level={2} className="!text-xl font-bold text-slate-800 mb-2 dark:text-white mb-0">Task Not Found</Typography.Title>
        <p className="text-slate-500 mb-6 text-center dark:text-slate-400">The task you are looking for does not exist or has been deleted.</p>
        <Button
          type="primary"
          onClick={() => navigate('/')}
          className="bg-slate-900 text-white font-medium hover:bg-slate-800 transition-colors dark:bg-slate-700 dark:hover:bg-slate-600 border-none"
        >
          Back to Board
        </Button>
      </div>
    )
  }

  const isOverdue = !todo.completed && todo.dueDate && todo.dueDate < new Date().toISOString().split('T')[0]
  const columnName = columnEntities[todo.columnId]?.name ?? 'Unknown'

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 flex flex-col transition-colors duration-300 dark:bg-slate-900">
      <div className="max-w-2xl mx-auto w-full">
        <Button
          type="text"
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors mb-6 -ml-2 dark:text-slate-400 dark:hover:text-slate-200 p-0 h-auto bg-transparent"
          icon={<ArrowLeft size={16} />}
        >
          Back to Board
        </Button>

        <Card styles={{ body: { padding: 0 } }} className="shadow-sm border-slate-200 dark:border-slate-700">
          <div className="p-6 sm:p-8">
          <div className="flex flex-wrap items-center gap-3 mb-6">
            <span className={`px-2.5 py-1 text-xs font-bold uppercase tracking-wider rounded-md border ${getPriorityColor(todo.priority)}`}>
              {todo.priority} Priority
            </span>
            <span className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-slate-600 bg-slate-100 border border-slate-200 rounded-md dark:bg-slate-700 dark:text-slate-300 dark:border-slate-600">
              <Tag size={12} />
              {todo.category}
            </span>
            <span className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-violet-600 bg-violet-50 border border-violet-200 rounded-md dark:bg-violet-900/20 dark:text-violet-400 dark:border-violet-800/50">
              <Columns size={12} />
              {columnName}
            </span>
            {todo.completed ? (
              <span className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-emerald-700 bg-emerald-100 border border-emerald-200 rounded-md dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800/50">
                <CheckCircle2 size={12} />
                Completed
              </span>
            ) : isOverdue ? (
              <span className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-red-700 bg-red-100 border border-red-200 rounded-md dark:bg-red-900/30 dark:text-red-400 dark:border-red-800/50">
                <AlertCircle size={12} />
                Overdue
              </span>
            ) : (
              <span className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-blue-700 bg-blue-100 border border-blue-200 rounded-md dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800/50">
                <Circle size={12} />
                Active
              </span>
            )}
          </div>

          <Typography.Title level={1} className={`!text-2xl sm:!text-3xl font-bold text-slate-900 mb-4 dark:text-white mb-0 ${todo.completed ? 'line-through text-slate-400 dark:text-slate-500' : ''}`}>
            {todo.title}
          </Typography.Title>

          <div className="prose prose-slate prose-sm sm:prose-base max-w-none mb-8 text-slate-600 dark:text-slate-300">
            {todo.description ? (
              <p className="whitespace-pre-wrap leading-relaxed">{todo.description}</p>
            ) : (
              <p className="italic text-slate-400 dark:text-slate-500">No description provided for this task.</p>
            )}
          </div>

          <div className="border-t border-slate-100 pt-6 grid grid-cols-1 sm:grid-cols-2 gap-4 dark:border-slate-700">
            {todo.dueDate && (
              <div className="flex items-center gap-3 text-sm">
                <div className={`p-2 rounded-lg ${isOverdue ? 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400' : 'bg-slate-50 text-slate-500 dark:bg-slate-700/50 dark:text-slate-400'}`}>
                  <Calendar size={18} />
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-500 mb-0.5 dark:text-slate-400">Due Date</p>
                  <p className={`font-semibold ${isOverdue ? 'text-red-600 dark:text-red-400' : 'text-slate-900 dark:text-slate-200'}`}>
                    {new Date(todo.dueDate).toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'long', day: 'numeric' })}
                    {isOverdue && ' (Overdue)'}
                  </p>
                </div>
              </div>
            )}

            <div className="flex items-center gap-3 text-sm">
              <div className="p-2 bg-slate-50 text-slate-500 rounded-lg dark:bg-slate-700/50 dark:text-slate-400">
                <Clock size={18} />
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500 mb-0.5 dark:text-slate-400">Created</p>
                <p className="font-semibold text-slate-900 dark:text-slate-200">
                  {new Date(todo.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
              </div>
            </div>
          </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
