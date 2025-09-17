// Role hierarchy and permissions management
export type UserRole =
  | 'superadministrator'
  | 'admin'
  | 'manager'
  | 'operator'
  | 'agent'
  | 'viewer'

export interface Permission {
  create?: boolean
  read?: boolean
  update?: boolean
  delete?: boolean
  manage?: boolean
  export?: boolean
  view?: boolean
  assign?: boolean
  publish?: boolean
  system?: boolean
}

export interface RolePermissions {
  dashboard: Permission
  users: Permission
  bots: Permission
  agents: Permission
  analytics: Permission
  knowledgeBase: Permission
  settings: Permission
  handoffs: Permission
  chats: Permission
  tickets: Permission
  roles: Permission
  integrations: Permission
  logs: Permission
}

// Role hierarchy - higher index = more permissions
export const ROLE_HIERARCHY: UserRole[] = [
  'viewer',
  'agent',
  'operator',
  'manager',
  'admin',
  'superadministrator'
]

// Default permissions for each role
export const DEFAULT_ROLE_PERMISSIONS: Record<UserRole, Partial<RolePermissions>> = {
  superadministrator: {
    dashboard: { view: true, export: true, manage: true },
    users: { create: true, read: true, update: true, delete: true, manage: true },
    bots: { create: true, read: true, update: true, delete: true, manage: true, publish: true },
    agents: { create: true, read: true, update: true, delete: true, manage: true, assign: true },
    analytics: { view: true, export: true, manage: true },
    knowledgeBase: { create: true, read: true, update: true, delete: true, manage: true },
    settings: { view: true, update: true, system: true, manage: true },
    handoffs: { view: true, manage: true, assign: true },
    chats: { view: true, manage: true },
    tickets: { create: true, read: true, update: true, delete: true, manage: true },
    roles: { create: true, read: true, update: true, delete: true, manage: true },
    integrations: { create: true, read: true, update: true, delete: true, manage: true },
    logs: { view: true, export: true }
  },
  admin: {
    dashboard: { view: true, export: true },
    users: { create: true, read: true, update: true, delete: true },
    bots: { create: true, read: true, update: true, delete: true, publish: true },
    agents: { create: true, read: true, update: true, delete: true, assign: true },
    analytics: { view: true, export: true },
    knowledgeBase: { create: true, read: true, update: true, delete: true },
    settings: { view: true, update: true },
    handoffs: { view: true, assign: true },
    chats: { view: true },
    tickets: { create: true, read: true, update: true, delete: true },
    roles: { read: true, update: true },
    integrations: { create: true, read: true, update: true, delete: true },
    logs: { view: true }
  },
  manager: {
    dashboard: { view: true, export: true },
    users: { read: true, update: true },
    bots: { read: true, update: true },
    agents: { read: true, update: true, assign: true },
    analytics: { view: true, export: true },
    knowledgeBase: { read: true, update: true },
    settings: { view: true },
    handoffs: { view: true, assign: true },
    chats: { view: true },
    tickets: { create: true, read: true, update: true },
    roles: { read: true },
    integrations: { read: true },
    logs: { view: true }
  },
  operator: {
    dashboard: { view: true },
    users: { read: true },
    bots: { read: true },
    agents: { read: true },
    analytics: { view: true },
    knowledgeBase: { read: true, update: true },
    settings: { view: true },
    handoffs: { view: true },
    chats: { view: true },
    tickets: { create: true, read: true, update: true },
    roles: { read: true },
    integrations: { read: true },
    logs: { view: true }
  },
  agent: {
    dashboard: { view: true },
    analytics: { view: true },
    knowledgeBase: { read: true },
    handoffs: { view: true, update: true },
    chats: { view: true, update: true },
    tickets: { read: true, update: true }
  },
  viewer: {
    dashboard: { view: true },
    analytics: { view: true },
    knowledgeBase: { read: true },
    chats: { view: true },
    tickets: { read: true }
  }
}

// Check if user has specific permission
export const hasPermission = (
  userRole: UserRole,
  resource: keyof RolePermissions,
  action: keyof Permission
): boolean => {
  const rolePermissions = DEFAULT_ROLE_PERMISSIONS[userRole]
  const resourcePermissions = rolePermissions?.[resource]
  return !!resourcePermissions?.[action]
}

// Check if user can access a route
export const canAccessRoute = (userRole: UserRole, route: string): boolean => {
  // Admin routes
  if (route.startsWith('/admin')) {
    return ['admin', 'superadministrator', 'manager', 'operator', 'viewer'].includes(userRole)
  }

  // Agent routes
  if (route.startsWith('/agent')) {
    return userRole === 'agent'
  }

  // Public routes
  return true
}

// Get role level (higher number = more permissions)
export const getRoleLevel = (role: UserRole): number => {
  return ROLE_HIERARCHY.indexOf(role)
}

// Check if user role is higher than another role
export const isRoleHigher = (userRole: UserRole, targetRole: UserRole): boolean => {
  return getRoleLevel(userRole) > getRoleLevel(targetRole)
}

// Get appropriate dashboard for role
export const getRoleDashboard = (role: UserRole): string => {
  switch (role) {
    case 'agent':
      return '/agent/dashboard'
    case 'admin':
    case 'superadministrator':
    case 'manager':
    case 'operator':
    case 'viewer':
    default:
      return '/admin'
  }
}

// Get allowed roles for admin panel
export const getAdminRoles = (): UserRole[] => {
  return ['admin', 'superadministrator', 'manager', 'operator', 'viewer']
}

// Get allowed roles for agent panel
export const getAgentRoles = (): UserRole[] => {
  return ['agent']
}