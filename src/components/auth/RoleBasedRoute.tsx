import { useSelector } from 'react-redux'
import { Navigate } from 'react-router-dom'
import { RootState } from '../../store/store'
import { UserRole, getRoleDashboard } from '../../utils/roleUtils'

interface RoleBasedRouteProps {
  children: React.ReactNode
  allowedRoles: UserRole[]
  redirectTo?: string
}

const RoleBasedRoute: React.FC<RoleBasedRouteProps> = ({
  children,
  allowedRoles
}) => {
  const { isAuthenticated, user } = useSelector((state: RootState) => state.auth)

  console.log('🔐 RoleBasedRoute check:', { isAuthenticated, userRole: user?.role, allowedRoles })

  // Not authenticated
  if (!isAuthenticated) {
    console.log('❌ Not authenticated, redirecting to login')
    return <Navigate to="/login" replace />
  }

  // No user data
  if (!user) {
    console.log('❌ No user data, redirecting to login')
    return <Navigate to="/login" replace />
  }

  // User role not allowed
  if (!allowedRoles.includes(user.role as UserRole)) {
    console.log(`❌ Role ${user.role} not in allowed roles:`, allowedRoles)
    // Redirect to appropriate dashboard based on role
    const roleDashboard = getRoleDashboard(user.role as UserRole)
    console.log(`🔄 Redirecting to ${roleDashboard}`)
    return <Navigate to={roleDashboard} replace />
  }

  console.log('✅ Access granted for role:', user.role)
  return <>{children}</>
}

export default RoleBasedRoute