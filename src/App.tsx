import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import TodoPage from './pages/TodoPage'
import TodoDetail from './pages/TodoDetail'
import SettingsPage from './pages/SettingsPage'

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<TodoPage />} />
        <Route path="/todoDetail/:id" element={<TodoDetail />} />
        <Route path="/setting" element={<SettingsPage />} />
      </Routes>
    </Router>
  )
}

export default App
