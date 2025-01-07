// Using new JSX transform
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { RootLayout } from './layouts/RootLayout'
import { Toaster } from './components/ui/toaster'
import './App.css'

// Lazy load pages
import ProjectsPage from './pages/ProjectsPage'
import ProjectPage from './pages/ProjectPage'
import ChatPage from './pages/ChatPage'

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<RootLayout />}>
          <Route index element={<ProjectsPage />} />
          <Route path="projects/:projectId/*" element={<ProjectPage />}>
            <Route path="chats/:chatId" element={<ChatPage />} />
          </Route>
        </Route>
      </Routes>
      <Toaster />
    </Router>
  )
}

export default App
