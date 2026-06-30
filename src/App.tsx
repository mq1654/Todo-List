import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import TodoPage from './pages/TodoPage'
import TodoDetail from './pages/TodoDetail'
import SettingsPage from './pages/SettingsPage'
import TableViewPage from './pages/TableViewPage'

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<TodoPage />} />
        <Route path="/todoDetail/:id" element={<TodoDetail />} />
        <Route path="/setting" element={<SettingsPage />} />
        <Route path="/table" element={<TableViewPage />} />
      </Routes>
    </Router>
  )
}

export default App
