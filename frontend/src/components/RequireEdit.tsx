import { Navigate, Outlet } from 'react-router-dom'
import { useMe } from '../auth'

export default function RequireEdit() {
  const me = useMe()
  if (me.isPending) return null
  return me.data?.authenticated ? <Outlet /> : <Navigate to="/secret-login" replace />
}
