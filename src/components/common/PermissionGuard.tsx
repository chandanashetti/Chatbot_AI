import { ReactNode } from 'react'
import { usePermissions } from '../../hooks/usePermissions'
import { UserPermissions } from '../../store/slices/userSlice'
import { UserRole } from '../../store/slices/userSlice'
import { Shield, Lock } from 'lucide-react'

interface PermissionGuardProps {
  children: ReactNode
  // Permission-based access
  permission?: {
    module: keyof UserPermissions
    action: string
  }
  // Resource-based access
  resource?: string
  // Role-based access
  roles?: UserRole | UserRole[]
  // Require any of the specified roles (OR logic)
  anyRole?: UserRole[]
  // Custom fallback component
  fallback?: ReactNode
  // Show loading state
  loading?: boolean
  // Custom access check function
  customCheck?: () => boolean
}

const PermissionGuard = ({
  children,
  permission,
  resource,
  roles,
  anyRole,
  fallback,
  loading = false,
  customCheck
}: PermissionGuardProps) => {
  const { hasPermission, canAccess, hasRole, hasAnyRole } = usePermissions()

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="spinner"></div>
      </div>
    )
  }

  let hasAccess = true

  // Check custom access function first
  if (customCheck) {
    hasAccess = customCheck()
  }
  // Check permission-based access
  else if (permission) {
    hasAccess = hasPermission(permission.module, permission.action)
  }
  // Check resource-based access
  else if (resource) {
    hasAccess = canAccess(resource)
  }
  // Check role-based access
  else if (roles) {
    hasAccess = hasRole(roles)
  }
  // Check any role access
  else if (anyRole) {
    hasAccess = hasAnyRole(anyRole)
  }

  if (!hasAccess) {
    if (fallback) {
      return <>{fallback}</>
    }

    return (
      <div className="flex flex-col items-center justify-center py-12 px-4">
        <div className="card p-8 text-center max-w-md">
          <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">
            Access Restricted
          </h3>
          <p className="text-slate-600 dark:text-slate-400 mb-6">
            You don't have the necessary permissions to access this content. Please contact your administrator if you believe this is an error.
          </p>
          <div className="flex items-center justify-center space-x-2 text-sm text-slate-500 dark:text-slate-400">
            <Shield className="w-4 h-4" />
            <span>Protected Resource</span>
          </div>
        </div>
      </div>
    )
  }

  return <>{children}</>
}

export default PermissionGuard

// Convenience components for common use cases
export const AdminOnly = ({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) => (
  <PermissionGuard roles={['admin', 'superadmin']} fallback={fallback}>
    {children}
  </PermissionGuard>
)

export const SuperAdminOnly = ({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) => (
  <PermissionGuard roles="superadmin" fallback={fallback}>
    {children}
  </PermissionGuard>
)

export const ManagerAndUp = ({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) => (
  <PermissionGuard roles={['superadmin', 'admin', 'manager']} fallback={fallback}>
    {children}
  </PermissionGuard>
)

export const AuthenticatedOnly = ({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) => {
  const { currentRole } = usePermissions()
  
  return (
    <PermissionGuard 
      customCheck={() => currentRole !== null} 
      fallback={fallback}
    >
      {children}
    </PermissionGuard>
  )
}
