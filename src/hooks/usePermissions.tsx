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
  
  // Use the user directly from auth state (it now includes permissions)
  const currentRole = user?.role || null
  const permissions = user?.permissions || null

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
      'dashboard': ['superadministrator', 'admin', 'manager', 'operator', 'viewer', 'agent'],
      'dashboard.export': ['superadministrator', 'admin', 'manager'],
      
      // User management
      'users': ['superadministrator', 'admin'],
      'users.create': ['superadministrator', 'admin'],
      'users.edit': ['superadministrator', 'admin'],
      'users.delete': ['superadministrator'],
      'users.roles': ['superadministrator'],
      
      // Integrations
      'integrations': ['superadministrator', 'admin', 'manager'],
      'integrations.create': ['superadministrator', 'admin'],
      'integrations.edit': ['superadministrator', 'admin'],
      'integrations.delete': ['superadministrator', 'admin'],
      'integrations.test': ['superadministrator', 'admin', 'manager'],
      
      // Knowledge Base
      'knowledgeBase': ['superadministrator', 'admin', 'manager', 'operator', 'viewer', 'agent'],
      'knowledgeBase.upload': ['superadministrator', 'admin', 'manager', 'operator'],
      'knowledgeBase.edit': ['superadministrator', 'admin', 'manager'],
      'knowledgeBase.delete': ['superadministrator', 'admin'],
      'knowledgeBase.reindex': ['superadministrator', 'admin', 'manager'],
      
      // Analytics
      'analytics': ['superadministrator', 'admin', 'manager', 'operator', 'viewer', 'agent'],
      'analytics.export': ['superadministrator', 'admin', 'manager'],
      'analytics.advanced': ['superadministrator', 'admin', 'manager'],
      
      // Logs
      'logs': ['superadministrator', 'admin', 'manager', 'operator', 'viewer', 'agent'],
      'logs.export': ['superadministrator', 'admin', 'manager'],
      'logs.delete': ['superadministrator', 'admin'],
      
      // Settings
      'settings': ['superadministrator', 'admin', 'manager'],
      'settings.edit': ['superadministrator', 'admin'],
      'settings.system': ['superadministrator'],
      
      // Chat management
      'chat': ['superadministrator', 'admin', 'manager', 'operator', 'viewer', 'agent'],
      'chat.moderate': ['superadministrator', 'admin', 'manager', 'agent'],
      'chat.export': ['superadministrator', 'admin', 'manager'],
      
      // Agent management (Admin view)
      'agents': ['superadministrator', 'admin'],
      'agents.create': ['superadministrator', 'admin'],
      'agents.edit': ['superadministrator', 'admin'],
      'agents.delete': ['superadministrator', 'admin'],
      
      // Agent dashboard and chat (Agent view)
      'agent:view': ['superadministrator', 'admin', 'agent'],
      'agent:chat': ['superadministrator', 'admin', 'agent'],
      'agent:manage': ['superadministrator', 'admin'],
      'agent:handoff': ['superadministrator', 'admin', 'agent'],
      'agent:escalate': ['superadministrator', 'admin', 'agent'],
      'agent:notes': ['superadministrator', 'admin', 'agent'],
      
      // Chat review
      'chatReview': ['superadministrator', 'admin', 'manager'],
      'chatReview.export': ['superadministrator', 'admin', 'manager']
    }
    
    const allowedRoles = accessRules[resource]
    return allowedRoles ? allowedRoles.includes(currentRole) : false
  }

  return {
    hasPermission,
    hasRole,
    hasAnyRole,
    canAccess,
    isAdmin: currentRole === 'admin' || currentRole === 'superadministrator',
    isSuperAdmin: currentRole === 'superadministrator',
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
