import * as Yup from 'yup'

export const todoSchema = Yup.object({
  title: Yup.string()
    .trim()
    .min(3, 'Title must be at least 3 characters.')
    .max(100, 'Title must not exceed 100 characters.')
    .required('Title is required.'),
  description: Yup.string()
    .trim()
    .max(500, 'Description must not exceed 500 characters.')
    .optional(),
  category: Yup.string()
    .oneOf(['Work', 'Personal', 'Learning'], 'Invalid category.')
    .required('Category is required.'),
  priority: Yup.string()
    .oneOf(['High', 'Medium', 'Low'], 'Invalid priority.')
    .required('Priority is required.'),
  dueDate: Yup.string()
    .test('is-valid-date', 'Invalid date format (DD-MM-YYYY).', function (value) {
      if (!value) return true
      if (!/^\d{2}-\d{2}-\d{4}$/.test(value)) return false
      const [day, month, year] = value.split('-')
      const d = new Date(`${year}-${month}-${day}`)
      return d instanceof Date && !isNaN(d) && String(d.getDate()).padStart(2, '0') === day
    })
    .test('is-future', 'Date cannot be in the past.', function (value) {
      if (!value) return true
      if (!/^\d{2}-\d{2}-\d{4}$/.test(value)) return true
      const [day, month, year] = value.split('-')
      const d = new Date(`${year}-${month}-${day}`)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      return d >= today
    })
    .optional(),
})
