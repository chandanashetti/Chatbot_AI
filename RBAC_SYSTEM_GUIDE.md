# 🔐 Role-Based Access Control (RBAC) System Guide

## Overview

The Chatbot AI platform now includes a comprehensive Role-Based Access Control (RBAC) system that provides secure, hierarchical permission management for all users and resources.

## 🏗️ System Architecture

### Role Hierarchy

The system implements a 7-level role hierarchy (lower number = higher privilege):

```
1. Super Administrator (superadministrator) - Full system access
2. Super Admin (superadmin) - Administrative access with all permissions
3. Administrator (admin) - Administrative access with limited system permissions
4. Manager (manager) - Management level access for team supervision
5. Operator (operator) - Operational access for daily tasks
6. Viewer (viewer) - Read-only access for viewing information
7. Agent (agent) - Chat agent access for customer support
```

### Permission System

Each role has specific permissions across different modules:

#### Dashboard Permissions
- **view**: Access to dashboard
- **export**: Export dashboard data

#### User Management Permissions
- **view**: View user list
- **create**: Create new users
- **edit**: Edit existing users
- **delete**: Delete users
- **manageRoles**: Assign and manage user roles

#### Bot Management Permissions
- **view**: View bot list
- **create**: Create new bots
- **edit**: Edit existing bots
- **delete**: Delete bots
- **publish**: Publish bots

#### Agent Management Permissions
- **view**: View agent list
- **create**: Create new agents
- **edit**: Edit existing agents
- **delete**: Delete agents
- **assign**: Assign agents to tasks

#### Analytics Permissions
- **view**: View analytics
- **export**: Export analytics data
- **advanced**: Access to advanced analytics

#### Knowledge Base Permissions
- **view**: View knowledge base
- **upload**: Upload documents
- **edit**: Edit documents
- **delete**: Delete documents

#### Settings Permissions
- **view**: View settings
- **edit**: Edit settings
- **system**: Access system settings

#### Chat Management Permissions
- **view**: View chat interface
- **moderate**: Moderate conversations
- **export**: Export chat data

## 🔧 Backend Implementation

### Models

#### User Model (`backend/models/User.js`)
- Enhanced with role hierarchy validation
- Permission inheritance from roles
- User-specific permission overrides
- Role management capabilities

#### Role Model (`backend/models/Role.js`)
- System and custom role types
- Permission templates
- Role priority system
- Soft delete functionality

### Middleware

#### RBAC Middleware (`backend/middleware/rbac.js`)
- `requirePermission(permission)` - Check specific permission
- `requireRoleManagement(targetRole)` - Check role hierarchy
- `requireUserManagement(targetUserId)` - Check user management rights
- `requireRole(...roles)` - Require specific roles
- `populateUserPermissions` - Load user permissions

### API Endpoints

#### Authentication (`/api/auth/`)
- `POST /login` - User login with role-based permissions
- `GET /me` - Get current user with effective permissions
- `POST /logout` - User logout

#### Role Management (`/api/roles/`)
- `GET /` - List all roles (requires `roles.view`)
- `POST /` - Create new role (requires `roles.create`)
- `PUT /:id` - Update role (requires `roles.edit`)
- `DELETE /:id` - Delete role (requires `roles.delete`)
- `POST /initialize` - Initialize system roles (requires `superadministrator` or `superadmin`)

## 🎨 Frontend Implementation

### Redux Store

#### Auth Slice (`src/store/slices/authSlice.ts`)
- Updated with new role types
- Handles role-based authentication
- Manages user permissions

#### User Slice (`src/store/slices/userSlice.ts`)
- Role hierarchy definitions
- Permission templates
- User management state

### Hooks

#### usePermissions (`src/hooks/usePermissions.tsx`)
- `hasPermission(module, action)` - Check specific permission
- `canAccess(resource)` - Check resource access
- `hasRole(role)` - Check user role
- `hasAnyRole(roles)` - Check multiple roles

### Components

#### PermissionGuard (`src/components/common/PermissionGuard.tsx`)
- Wraps components with permission checks
- Supports role-based, permission-based, and resource-based access control
- Provides fallback UI for unauthorized access

#### AdminLayout (`src/components/layout/AdminLayout.tsx`)
- Dynamic navigation based on user role
- Role-specific menu items
- User profile display with role information

## 🚀 Usage Examples

### Backend Usage

#### Protecting Routes
```javascript
// Require specific permission
router.get('/users', requirePermission('users.view'), getUsers);

// Require role hierarchy
router.post('/users', requireUserManagement('userId'), createUser);

// Require specific roles
router.delete('/system', requireRole('superadministrator'), deleteSystem);
```

#### Checking Permissions in Code
```javascript
// Check if user has permission
if (user.hasPermission('users', 'delete')) {
  // Allow deletion
}

// Check role hierarchy
if (user.canManageRole('admin')) {
  // Allow managing admin users
}
```

### Frontend Usage

#### Using PermissionGuard
```jsx
<PermissionGuard permission={{ module: 'users', action: 'create' }}>
  <CreateUserButton />
</PermissionGuard>

<PermissionGuard roles={['admin', 'superadmin']}>
  <AdminPanel />
</PermissionGuard>
```

#### Using usePermissions Hook
```jsx
const { hasPermission, canAccess, hasRole } = usePermissions();

if (hasPermission('users', 'delete')) {
  // Show delete button
}

if (canAccess('dashboard')) {
  // Show dashboard
}

if (hasRole('admin')) {
  // Show admin features
}
```

## 🧪 Testing

### Test Script
Run the comprehensive RBAC test suite:

```bash
cd backend
node test-rbac-system.js
```

### Test Coverage
- ✅ Role hierarchy validation
- ✅ Permission checking
- ✅ User management capabilities
- ✅ Role management capabilities
- ✅ API endpoint protection
- ✅ Frontend permission guards

## 🔒 Security Features

### Role Hierarchy Enforcement
- Users can only manage users with lower roles
- System roles cannot be modified by non-system users
- Role assignments respect hierarchy

### Permission Inheritance
- Users inherit permissions from their role
- User-specific permissions can override role permissions
- Effective permissions combine both sources

### API Protection
- All sensitive endpoints require authentication
- Permission-based access control
- Role hierarchy validation
- User management restrictions

## 📊 Role Permissions Matrix

| Permission | Super Admin | Admin | Manager | Operator | Viewer | Agent |
|------------|-------------|-------|---------|----------|--------|-------|
| Dashboard View | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Dashboard Export | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Users View | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Users Create | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Users Delete | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Users Manage Roles | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Bots View | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| Bots Create | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Bots Delete | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Agents View | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| Agents Create | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Agents Delete | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Analytics View | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Analytics Export | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Knowledge Base View | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Knowledge Base Upload | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| Knowledge Base Delete | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Settings View | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Settings Edit | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Settings System | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Chat View | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Chat Moderate | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ |
| Chat Export | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |

## 🎯 Best Practices

### Role Design
1. **Principle of Least Privilege**: Users should have minimum required permissions
2. **Role Separation**: Separate administrative and operational roles
3. **Hierarchy Clarity**: Clear role hierarchy with defined responsibilities

### Permission Management
1. **Granular Permissions**: Use specific permissions for fine-grained control
2. **Permission Inheritance**: Leverage role-based permission inheritance
3. **User Overrides**: Allow user-specific permission overrides when needed

### Security
1. **API Protection**: Protect all sensitive endpoints with appropriate middleware
2. **Frontend Guards**: Use permission guards to hide unauthorized UI elements
3. **Role Validation**: Always validate role hierarchy in user management operations

## 🔄 Migration Guide

### From Previous System
1. **Update Role Types**: Add `superadministrator` role to existing systems
2. **Permission Mapping**: Map existing permissions to new granular system
3. **User Migration**: Update existing users with appropriate roles
4. **API Updates**: Update API calls to use new permission system

### Database Changes
1. **User Model**: Updated role enum and permission structure
2. **Role Model**: Enhanced with priority and hierarchy support
3. **Migration Scripts**: Run role initialization to create system roles

## 🚨 Troubleshooting

### Common Issues

#### Permission Denied Errors
- Check if user has required role
- Verify permission inheritance
- Ensure role hierarchy is respected

#### Role Assignment Issues
- Validate role hierarchy before assignment
- Check if user can manage target role
- Verify system role restrictions

#### API Access Issues
- Ensure proper authentication
- Check middleware order
- Verify permission requirements

### Debug Tools
- Use test script to verify RBAC functionality
- Check user effective permissions
- Validate role hierarchy relationships

## 📈 Future Enhancements

### Planned Features
1. **Dynamic Role Creation**: UI for creating custom roles
2. **Permission Templates**: Predefined permission sets
3. **Audit Logging**: Track permission changes and access
4. **Multi-tenant Support**: Organization-level role management
5. **Time-based Permissions**: Temporary permission grants

### Integration Opportunities
1. **SSO Integration**: External identity provider support
2. **API Key Management**: Service account permissions
3. **Webhook Security**: Role-based webhook access
4. **Third-party Integrations**: External system permission mapping

---

## 🎉 Conclusion

The RBAC system provides a robust, scalable, and secure foundation for managing user access and permissions in the Chatbot AI platform. With proper implementation and maintenance, it ensures that users have appropriate access to system resources while maintaining security and operational efficiency.

For questions or support, please refer to the test scripts and documentation provided in the codebase.
