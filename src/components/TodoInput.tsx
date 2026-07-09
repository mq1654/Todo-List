import { useFormik } from 'formik'
import { useMemo } from 'react'
import { Input, Select, Button } from 'antd'
import { useStore } from '../store'
import { createTodoSchema } from '../schemas/todoSchema'
import type { Todo, TodoPayload } from '../store/types'

const { TextArea } = Input

const EMPTY_VALUES: Partial<Todo> = {
  title: '',
  description: '',
  category: '',
  dueDate: '',
}

const PRIORITIES: Todo['priority'][] = ['High', 'Medium', 'Low']

function FieldError({ message }: { message?: string | false }) {
  if (!message) return null
  return <p className="mt-1 text-xs text-red-500 font-medium">{message}</p>
}

interface FormFieldProps {
  label: string
  required?: boolean
  optional?: boolean
  error?: string | false
  touched?: boolean
  children: React.ReactNode
}
function FormField({ label, required, optional, error, touched, children }: FormFieldProps) {
  return (
    <div>
      <label className="block text-sm font-semibold text-slate-700 mb-1.5 dark:text-slate-300">
        {label}
        {required && <span className="text-red-400 ml-1">*</span>}
        {optional && <span className="ml-1.5 text-xs font-normal text-slate-400 dark:text-slate-500">(optional)</span>}
      </label>
      {children}
      {touched && <FieldError message={error} />}
    </div>
  )
}

interface TodoInputProps {
  onSubmit: (values: TodoPayload) => void
  initialValues?: Partial<Todo>
  onCancel?: () => void
}

function TodoInput({ onSubmit, initialValues, onCancel }: TodoInputProps) {
  const categories = useStore((s) => s.settings.categories)
  const resolvedInitialValues = initialValues ?? EMPTY_VALUES
  const isEditMode = resolvedInitialValues.title !== ''
  const schema = useMemo(() => createTodoSchema(categories), [categories])

  let initialFormattedDate = ''
  if (resolvedInitialValues.dueDate) {
    const [year, month, day] = resolvedInitialValues.dueDate.split('-')
    initialFormattedDate = `${day}-${month}-${year}`
  }

  const formik = useFormik({
    initialValues: {
      ...resolvedInitialValues,
      category: resolvedInitialValues.category || '',
      priority: resolvedInitialValues.priority || '',
      dueDate: initialFormattedDate,
    },
    validationSchema: schema,
    enableReinitialize: true,
    onSubmit: (values, { resetForm }) => {
      let isoDate = ''
      if (values.dueDate) {
        const [day, month, year] = (values.dueDate as string).split('-')
        isoDate = `${year}-${month}-${day}`
      }
      onSubmit({
        title: values.title || '',
        description: values.description || '',
        category: values.category || '',
        priority: (values.priority || 'Low') as 'High' | 'Medium' | 'Low',
        dueDate: isoDate || null,
      })
      resetForm()
    },
  })

  function handleDateChange(e: React.ChangeEvent<HTMLInputElement>) {
    let val = e.target.value
    if (val.endsWith(' ') || val.endsWith('-')) {
      const parts = val.replace(/[\s-]$/, '').split('-')
      const lastPart = parts[parts.length - 1]
      if (lastPart && lastPart.length === 1) parts[parts.length - 1] = `0${lastPart}`
      val = parts.join('-') + '-'
    }
    const digits = val.replace(/[^\d-]/g, '').replace(/\D/g, '')
    let formatted = digits
    if (digits.length > 2 && digits.length <= 4) formatted = `${digits.slice(0, 2)}-${digits.slice(2)}`
    else if (digits.length > 4) formatted = `${digits.slice(0, 2)}-${digits.slice(2, 4)}-${digits.slice(4, 8)}`
    if (val.endsWith('-') && (digits.length === 2 || digits.length === 4)) formatted += '-'
    formik.setFieldValue('dueDate', formatted)
  }

  const hasError = (field: keyof typeof formik.initialValues) =>
    !!(formik.touched[field] && formik.errors[field])

  return (
    <form
      onSubmit={formik.handleSubmit}
      noValidate
      className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4 dark:bg-slate-800 dark:border-slate-700"
    >
      <FormField label="Title" required error={formik.errors.title as string} touched={formik.touched.title as boolean}>
        <Input
          id="title"
          name="title"
          value={formik.values.title as string}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          status={hasError('title') ? 'error' : undefined}
          size="middle"
        />
      </FormField>

      <FormField label="Description" optional error={formik.errors.description as string} touched={formik.touched.description as boolean}>
        <TextArea
          id="description"
          name="description"
          rows={3}
          placeholder="Add task description..."
          value={formik.values.description as string}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          status={hasError('description') ? 'error' : undefined}
          style={{ resize: 'none' }}
        />
      </FormField>

      <div className="grid grid-cols-2 gap-4">
        <FormField label="Category" required error={formik.errors.category as string} touched={formik.touched.category as boolean}>
          <Select
            id="category"
            value={(formik.values.category as string) || undefined}
            onChange={(val) => formik.setFieldValue('category', val)}
            onBlur={() => formik.setFieldTouched('category', true)}
            status={hasError('category') ? 'error' : undefined}
            placeholder="Select"
            style={{ width: '100%' }}
            options={categories.map((cat: string) => ({ value: cat, label: cat }))}
          />
        </FormField>

        <FormField label="Priority" required error={formik.errors.priority as string} touched={formik.touched.priority as boolean}>
          <Select
            id="priority"
            value={(formik.values.priority as string) || undefined}
            onChange={(val) => formik.setFieldValue('priority', val)}
            onBlur={() => formik.setFieldTouched('priority', true)}
            status={hasError('priority') ? 'error' : undefined}
            placeholder="Select"
            style={{ width: '100%' }}
            options={PRIORITIES.map((p) => ({ value: p, label: p }))}
          />
        </FormField>
      </div>

      <FormField label="Due Date" error={formik.errors.dueDate as string} touched={formik.touched.dueDate as boolean}>
        <Input
          id="dueDate"
          name="dueDate"
          placeholder="DD-MM-YYYY"
          autoComplete="off"
          value={formik.values.dueDate as string}
          onChange={handleDateChange}
          onBlur={formik.handleBlur}
          status={hasError('dueDate') ? 'error' : undefined}
        />
      </FormField>

      <div className="flex items-center gap-3 pt-1">
        <Button type="primary" htmlType="submit" loading={formik.isSubmitting}>
          {isEditMode ? 'Save Changes' : 'Add Task'}
        </Button>
        {isEditMode && onCancel && (
          <Button onClick={onCancel}>Cancel</Button>
        )}
      </div>
    </form>
  )
}

export default TodoInput
