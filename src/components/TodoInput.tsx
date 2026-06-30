import { useFormik } from 'formik'
import { useMemo } from 'react'
import { useStoreState } from '../store';
import { createTodoSchema } from '../schemas/todoSchema';
import type { Todo, TodoPayload } from '../store/types';

const EMPTY_VALUES: Partial<Todo> = {
  title: '',
  description: '',
  category: '',
  priority: 'Low',
  dueDate: '',
};

const PRIORITIES: Todo['priority'][] = ['High', 'Medium', 'Low'];
interface FieldErrorProps {
  message?: string | false;
}
function FieldError({ message }: FieldErrorProps) {
  if (!message) return null
  return <p className="mt-1 text-xs text-red-500 font-medium">{message}</p>
}
interface FormInputProps {
  id: string;
  label: string;
  isRequired?: boolean;
  error?: string | false | undefined;
  touched?: boolean;
  optionalText?: string;
  children: React.ReactNode;
}
function FormInput({ id, label, isRequired, error, touched, optionalText, children }: FormInputProps) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-semibold text-slate-700 mb-1.5 dark:text-slate-300">
        {label}
        {isRequired && <span className="text-red-400 ml-1">*</span>}
        {optionalText && <span className="ml-1.5 text-xs font-normal text-slate-400 dark:text-slate-500">({optionalText})</span>}
      </label>
      {children}
      {touched && <FieldError message={error} />}
    </div>
  );
}
interface TodoInputProps {
  onSubmit: (values: TodoPayload) => void;
  initialValues?: Partial<Todo>;
  onCancel?: () => void;
}
function TodoInput({ onSubmit, initialValues, onCancel }: TodoInputProps) {
  const categories = useStoreState(state => state.settings?.categories || ['Work', 'Personal', 'Learning'])
  const resolvedInitialValues = initialValues ?? EMPTY_VALUES
  const isEditMode = resolvedInitialValues.title !== ''
  const schema = useMemo(() => createTodoSchema(categories), [categories])

  let initialFormattedDate = ''
  if (resolvedInitialValues.dueDate) {
    const [year, month, day] = resolvedInitialValues.dueDate.split('-')
    initialFormattedDate = `${day}-${month}-${year}`
  }

  const formikInitialValues = {
    ...resolvedInitialValues,
    category: resolvedInitialValues.category || categories[0] || '',
    dueDate: initialFormattedDate,
  }

  const formik = useFormik({
    initialValues: formikInitialValues,
    validationSchema: schema,
    enableReinitialize: true,
    onSubmit: (values, { resetForm }) => {
      let isoDate = ''
      if (values.dueDate) {
        const [day, month, year] = values.dueDate.split('-')
        isoDate = `${year}-${month}-${day}`
      }
      onSubmit({ 
        title: values.title || '', 
        description: values.description || '', 
        category: values.category || '', 
        priority: (values.priority || 'Low') as 'High' | 'Medium' | 'Low', 
        dueDate: isoDate || null 
      })
      resetForm()
    },
  })

  function handleDateChange(e: React.ChangeEvent<HTMLInputElement>) {
    let val = e.target.value

    if (val.endsWith(' ') || val.endsWith('-')) {
      const parts = val.replace(/[\s-]$/, '').split('-')
      const lastPart = parts[parts.length - 1]
      if (lastPart && lastPart.length === 1) {
        parts[parts.length - 1] = `0${lastPart}`
      }
      val = parts.join('-') + '-'
    }

    const cleaned = val.replace(/[^\d-]/g, '')
    const digits = cleaned.replace(/\D/g, '')
    
    let formatted = digits
    if (digits.length > 2 && digits.length <= 4) {
      formatted = `${digits.slice(0, 2)}-${digits.slice(2)}`
    } else if (digits.length > 4) {
      formatted = `${digits.slice(0, 2)}-${digits.slice(2, 4)}-${digits.slice(4, 8)}`
    }

    if (val.endsWith('-') && (digits.length === 2 || digits.length === 4)) {
      formatted += '-'
    }

    formik.setFieldValue('dueDate', formatted)
  }

  const baseInputClass = "w-full px-3.5 py-2.5 text-sm rounded-lg border bg-slate-50 text-slate-900 transition-colors outline-none focus:bg-white focus:ring-2 focus:ring-slate-900 focus:border-transparent placeholder:text-slate-400 dark:bg-slate-900 dark:text-white dark:focus:bg-slate-900 dark:focus:ring-slate-500 dark:placeholder-slate-500"
  
  const getInputClass = (field: keyof typeof formikInitialValues) => 
    `${baseInputClass} ${formik.touched[field] && formik.errors[field] ? 'border-red-400 focus:ring-red-400 dark:border-red-500 dark:focus:ring-red-500' : 'border-slate-200 dark:border-slate-700'}`

  return (
    <form
      onSubmit={formik.handleSubmit}
      noValidate
      className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4 dark:bg-slate-800 dark:border-slate-700"
    >
      <FormInput id="title" label="Title" isRequired error={formik.errors.title as string} touched={formik.touched.title as boolean}>
        <input
          id="title"
          name="title"
          type="text"
          value={formik.values.title}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          className={getInputClass('title')}
        />
      </FormInput>

      <FormInput id="description" label="Description" optionalText="optional" error={formik.errors.description as string} touched={formik.touched.description as boolean}>
        <textarea
          id="description"
          name="description"
          rows={3}
          placeholder="Add task description..."
          value={formik.values.description}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          className={`${getInputClass('description')} resize-none`}
        />
      </FormInput>

      <div className="grid grid-cols-2 gap-4">
        <FormInput id="category" label="Category" error={formik.errors.category as string} touched={formik.touched.category as boolean}>
          <select
            id="category"
            name="category"
            value={formik.values.category}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            className={`${getInputClass('category')} appearance-none pr-8`}
          >
            {categories.map((cat: string) => <option key={cat} value={cat}>{cat}</option>)}
          </select>
        </FormInput>

        <FormInput id="priority" label="Priority" error={formik.errors.priority as string} touched={formik.touched.priority as boolean}>
          <select
            id="priority"
            name="priority"
            value={formik.values.priority}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            className={getInputClass('priority')}
          >
            {PRIORITIES.map(pri => <option key={pri} value={pri}>{pri}</option>)}
          </select>
        </FormInput>
      </div>

      <FormInput id="dueDate" label="Due Date" error={formik.errors.dueDate as string} touched={formik.touched.dueDate as boolean}>
        <input
          id="dueDate"
          name="dueDate"
          type="text"
          placeholder="DD-MM-YYYY"
          autoComplete="off"
          value={formik.values.dueDate}
          onChange={handleDateChange}
          onBlur={formik.handleBlur}
          className={getInputClass('dueDate')}
        />
      </FormInput>

      <div className="flex items-center gap-3 pt-1">
        <button
          type="submit"
          disabled={formik.isSubmitting}
          className="px-4 py-2 text-sm font-semibold bg-slate-900 text-white rounded-lg hover:bg-slate-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-900 disabled:opacity-50 dark:bg-slate-700 dark:hover:bg-slate-600 dark:focus:ring-slate-500 dark:focus:ring-offset-slate-800"
        >
          {isEditMode ? 'Save Changes' : 'Add Task'}
        </button>
        {isEditMode && onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm font-semibold text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-400 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600 dark:focus:ring-slate-500 dark:focus:ring-offset-slate-800"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  )
}

export default TodoInput
