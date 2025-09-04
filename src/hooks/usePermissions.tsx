import React from 'react'
import { useSelector } from 'react-redux'
import { RootState } from '../store/store'
import { UserRole, UserPermissions } from '../store/slices/userSlice'

export interface PermissionCheck {
  hasPermission: (module: keyof UserPermissions, action: string) => boolean
  hasRole: (role: UserRole | UserRole[]) => boolean
  hasAnyRole: (roles: UserRole[]) => boolean
  canAccess: (resource: string) => boolean
  isAdmin: boolean
  isSuperAdmin: boolean
  currentRole: UserRole | null
  permissions: UserPermissions | null
}

export const usePermissions = (): PermissionCheck => {
  const { user } = useSelector((state: RootState) => state.auth)
  const { users } = useSelector((state: RootState) => state.users)
  
  // Get current user's full details including permissions
  const currentUser = user ? users.find(u => u.email === user.email) : null
  const currentRole = currentUser?.role || null
  const permissions = currentUser?.permissions || null

  const hasPermission = (module: keyof UserPermissions, action: string): boolean => {
    if (!permissions || !permissions[module]) return false
    
    // Type assertion to access the action property
    const modulePermissions = permissions[module] as any
    return modulePermissions[action] === true
  }

  const hasRole = (role: UserRole | UserRole[]): boolean => {
    if (!currentRole) return false
    
    if (Array.isArray(role)) {
      return role.includes(currentRole)
    }
    
    return currentRole === role
  }

  const hasAnyRole = (roles: UserRole[]): boolean => {
    if (!currentRole) return false
    return roles.includes(currentRole)
  }

  const canAccess = (resource: string): boolean => {
    if (!currentRole) return false
    
    // Define resource access rules
    const accessRules: Record<string, UserRole[]> = {
      // Dashboard access
      'dashboard': ['superadmin', 'admin', 'manager', 'operator', 'viewer'],
      'dashboard.export': ['superadmin', 'admin', 'manager'],
      
      // User management
      'users': ['superadmin', 'admin'],
      'users.create': ['superadmin', 'admin'],
      'users.edit': ['superadmin', 'admin'],
      'users.delete': ['superadmin'],
      'users.roles': ['superadmin'],
      
      // Integrations
      'integrations': ['superadmin', 'admin', 'manager'],
      'integrations.create': ['superadmin', 'admin'],
      'integrations.edit': ['superadmin', 'admin'],
      'integrations.delete': ['superadmin', 'admin'],
      'integrations.test': ['superadmin', 'admin', 'manager'],
      
      // Knowledge Base
      'knowledgeBase': ['superadmin', 'admin', 'manager', 'operator', 'viewer'],
      'knowledgeBase.upload': ['superadmin', 'admin', 'manager', 'operator'],
      'knowledgeBase.edit': ['superadmin', 'admin', 'manager'],
      'knowledgeBase.delete': ['superadmin', 'admin'],
      'knowledgeBase.reindex': ['superadmin', 'admin', 'manager'],
      
      // Analytics
      'analytics': ['superadmin', 'admin', 'manager', 'operator', 'viewer'],
      'analytics.export': ['superadmin', 'admin', 'manager'],
      'analytics.advanced': ['superadmin', 'admin', 'manager'],
      
      // Logs
      'logs': ['superadmin', 'admin', 'manager', 'operator', 'viewer'],
      'logs.export': ['superadmin', 'admin', 'manager'],
      'logs.delete': ['superadmin', 'admin'],
      
      // Settings
      'settings': ['superadmin', 'admin', 'manager'],
      'settings.edit': ['superadmin', 'admin'],
      'settings.system': ['superadmin'],
      
      // Chat management
      'chat': ['superadmin', 'admin', 'manager', 'operator', 'viewer'],
      'chat.moderate': ['superadmin', 'admin', 'manager'],
      'chat.export': ['superadmin', 'admin', 'manager'],
      
      // Agent management (Admin view)
      'agents': ['superadmin', 'admin'],
      'agents.create': ['superadmin', 'admin'],
      'agents.edit': ['superadmin', 'admin'],
      'agents.delete': ['superadmin', 'admin'],
      
      // Agent dashboard and chat (Agent view)
      'agent:view': ['superadmin', 'admin', 'agent'],
      'agent:chat': ['superadmin', 'admin', 'agent'],
      'agent:manage': ['superadmin', 'admin'],
      'agent:handoff': ['superadmin', 'admin', 'agent'],
      'agent:escalate': ['superadmin', 'admin', 'agent'],
      'agent:notes': ['superadmin', 'admin', 'agent'],
      
      // Chat review
      'chatReview': ['superadmin', 'admin', 'manager'],
      'chatReview.export': ['superadmin', 'admin', 'manager']
    }
    
    const allowedRoles = accessRules[resource]
    return allowedRoles ? allowedRoles.includes(currentRole) : false
  }

  return {
    hasPermission,
    hasRole,
    hasAnyRole,
    canAccess,
    isAdmin: currentRole === 'admin' || currentRole === 'superadmin',
    isSuperAdmin: currentRole === 'superadmin',
    currentRole,
    permissions
  }
}

// Higher-order component for protecting routes/components based on permissions
export const withPermission = <P extends object>(
  WrappedComponent: React.ComponentType<P>,
  requiredPermission: { module: keyof UserPermissions; action: string } | string,
  fallbackComponent?: React.ComponentType
) => {
  return (props: P) => {
    const { hasPermission, canAccess } = usePermissions()
    
    let hasAccess = false
    
    if (typeof requiredPermission === 'string') {
      hasAccess = canAccess(requiredPermission)
    } else {
      hasAccess = hasPermission(requiredPermission.module, requiredPermission.action)
    }
    
    if (!hasAccess) {
      if (fallbackComponent) {
        const FallbackComponent = fallbackComponent
        return <FallbackComponent {...props} />
      }
      
      return (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🔒</div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
            Access Denied
          </h3>
          <p className="text-slate-600 dark:text-slate-400">
            You don&apos;t have permission to access this resource.
          </p>
        </div>
      )
    }
    
    return <WrappedComponent {...props} />
  }
}

// Hook for conditional rendering based on permissions
export const useConditionalRender = () => {
  const { hasPermission, canAccess, hasRole } = usePermissions()
  
  const renderIf = (
    condition: boolean | (() => boolean),
    component: React.ReactNode,
    fallback?: React.ReactNode
  ) => {
    const shouldRender = typeof condition === 'function' ? condition() : condition
    return shouldRender ? component : (fallback || null)
  }
  
  const renderIfPermission = (
    module: keyof UserPermissions,
    action: string,
    component: React.ReactNode,
    fallback?: React.ReactNode
  ) => {
    return renderIf(() => hasPermission(module, action), component, fallback)
  }
  
  const renderIfAccess = (
    resource: string,
    component: React.ReactNode,
    fallback?: React.ReactNode
  ) => {
    return renderIf(() => canAccess(resource), component, fallback)
  }
  
  const renderIfRole = (
    role: UserRole | UserRole[],
    component: React.ReactNode,
    fallback?: React.ReactNode
  ) => {
    return renderIf(() => hasRole(role), component, fallback)
  }
  
  return {
    renderIf,
    renderIfPermission,
    renderIfAccess,
    renderIfRole
  }
}
