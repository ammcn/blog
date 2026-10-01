import { lazy, Suspense } from 'react'
import { Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import ResumePage from './pages/ResumePage'
import BlogPage from './pages/BlogPage'
import PostPage from './pages/PostPage'
import LoginPage from './pages/LoginPage'
import RequireEdit from './components/RequireEdit'

const WritePage = lazy(() => import('./pages/WritePage'))

export default function App() {
  return (
    <Suspense>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<ResumePage />} />
          <Route path="blog" element={<BlogPage />} />
          <Route path="blog/:slug" element={<PostPage />} />
          <Route path="secret-login" element={<LoginPage />} />
          <Route element={<RequireEdit />}>
            <Route path="write" element={<WritePage />} />
            <Route path="write/:slug" element={<WritePage />} />
          </Route>
        </Route>
      </Routes>
    </Suspense>
  )
}
