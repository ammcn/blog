import { NavLink, Outlet } from 'react-router-dom'
import { useCanEdit, useLogout } from '../auth'

const link = ({ isActive }: { isActive: boolean }) =>
  `uppercase tracking-[0.25em] text-xs ${isActive ? 'text-ink underline underline-offset-4' : 'text-ink/60 hover:text-ink'}`

export default function Layout() {
  const canEdit = useCanEdit()
  const logout = useLogout()
  return (
    <div className="min-h-screen flex flex-col pt-8 px-4">
      <nav className="no-print mx-auto w-full max-w-6xl mb-4 flex gap-6 justify-end">
        <NavLink to="/" end className={link}>
          Resume
        </NavLink>
        <NavLink to="/blog" className={link}>
          Blog
        </NavLink>
        {canEdit && (
          <>
            <NavLink to="/write" className={link}>
              Write
            </NavLink>
            <button className={link({ isActive: false })} onClick={() => logout.mutate()}>
              Sign out
            </button>
          </>
        )}
      </nav>
      <main className="flex-1 flex flex-col mx-auto w-full max-w-6xl bg-white shadow-lg print:shadow-none">
        <Outlet />
      </main>
    </div>
  )
}
