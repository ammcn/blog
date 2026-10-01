import { useState, type FormEvent } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { Heading, Sheet, Status } from '../components/Section'
import { useLogin, useMe } from '../auth'

const field = 'w-full border border-neutral-300 rounded px-3 py-2 text-sm bg-white focus:outline-accent'

export default function LoginPage() {
  const me = useMe()
  const login = useLogin()
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')

  if (me.data?.authenticated) return <Navigate to="/blog" replace />

  const submit = (e: FormEvent) => {
    e.preventDefault()
    login.mutate({ username, password }, { onSuccess: () => navigate('/blog', { replace: true }) })
  }

  return (
    <Sheet>
      <form onSubmit={submit} className="max-w-sm mx-auto space-y-4">
        <Heading title="Sign In" className="text-center mb-8" />
        <input
          className={field}
          placeholder="Username"
          autoComplete="username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <input
          className={field}
          type="password"
          placeholder="Password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {login.error && <Status>{login.error.message}</Status>}
        <button
          type="submit"
          className="w-full bg-accent text-white px-5 py-2 rounded text-sm uppercase tracking-widest disabled:opacity-40"
          disabled={!username || !password || login.isPending}
        >
          Sign in
        </button>
      </form>
    </Sheet>
  )
}
