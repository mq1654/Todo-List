import { useFormik } from 'formik'
import { todoSchema } from '../schemas/todoSchema'

const EMPTY_VALUES = {
  title: '',
  description: '',
  category: 'Personal',
  priority: 'Medium',
  dueDate: '',
}

const CATEGORIES = ['Work', 'Personal', 'Learning']
const PRIORITIES = ['High', 'Medium', 'Low']

function FieldError({ message }) {
  if (!message) return null
  return <p className="mt-1 text-xs text-red-500 font-medium">{message}</p>
}

function FormInput({ id, label, isRequired, error, touched, optionalText, children }) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-semibold text-slate-700 mb-1.5">
        {label}
        {isRequired && <span className="text-red-400 ml-1">*</span>}
        {optionalText && <span className="ml-1.5 text-xs font-normal text-slate-400">({optionalText})</span>}
      </label>
      {children}
      {touched && <FieldError message={error} />}
    </div>
  )
}

function TodoInput({ onSubmit, initialValues = EMPTY_VALUES, onCancel }) {
  const isEditMode = initialValues !== EMPTY_VALUES && initialValues.title !== ''

  let initialFormattedDate = ''
  if (initialValues.dueDate) {
    const [year, month, day] = initialValues.dueDate.split('-')
    initialFormattedDate = `${day}-${month}-${year}`
  }

  const formikInitialValues = {
    ...initialValues,
    dueDate: initialFormattedDate,
  }

  const formik = useFormik({
    initialValues: formikInitialValues,
    validationSchema: todoSchema,
    enableReinitialize: true,
    onSubmit: (values, { resetForm }) => {
      let isoDate = ''
      if (values.dueDate) {
        const [day, month, year] = values.dueDate.split('-')
        isoDate = `${year}-${month}-${day}`
      }
      onSubmit({ ...values, dueDate: isoDate })
      resetForm()
    },
  })

  function handleDateChange(e) {
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

  const baseInputClass = "w-full px-3.5 py-2.5 text-sm rounded-lg border bg-slate-50 text-slate-900 transition-colors outline-none focus:bg-white focus:ring-2 focus:ring-slate-900 focus:border-transparent placeholder:text-slate-400"
  
  const getInputClass = (field) => 
    `${baseInputClass} ${formik.touched[field] && formik.errors[field] ? 'border-red-400 focus:ring-red-400' : 'border-slate-200'}`

  return (
    <form
      onSubmit={formik.handleSubmit}
      noValidate
      className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4"
    >
      <FormInput id="title" label="Title" isRequired error={formik.errors.title} touched={formik.touched.title}>
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

      <FormInput id="description" label="Description" optionalText="optional" error={formik.errors.description} touched={formik.touched.description}>
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
        <FormInput id="category" label="Category" error={formik.errors.category} touched={formik.touched.category}>
          <select
            id="category"
            name="category"
            value={formik.values.category}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            className={getInputClass('category')}
          >
            {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
          </select>
        </FormInput>

        <FormInput id="priority" label="Priority" error={formik.errors.priority} touched={formik.touched.priority}>
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

      <FormInput id="dueDate" label="Due Date" optionalText="DD-MM-YYYY" error={formik.errors.dueDate} touched={formik.touched.dueDate}>
        <input
          id="dueDate"
          name="dueDate"
          type="text"
          placeholder="DD-MM-YYYY"
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
          className="px-4 py-2 text-sm font-semibold bg-slate-900 text-white rounded-lg hover:bg-slate-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-900 disabled:opacity-50"
        >
          {isEditMode ? 'Save Changes' : 'Add Task'}
        </button>
        {isEditMode && onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm font-semibold text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-400"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  )
}

export default TodoInput
