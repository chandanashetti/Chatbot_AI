import { useState, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { RootState } from '../../store/store'
import { updateUser, addActivity, User } from '../../store/slices/userSlice'
import {
  User as UserIcon,
  MapPin,
  Calendar,
  Shield,
  Key,
  Clock,
  Activity,
  Save,
  Camera,
  Edit,
  Lock,
  Unlock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Settings
} from 'lucide-react'
import { format } from 'date-fns'
import toast from 'react-hot-toast'

interface UserProfileProps {
  userId?: string
}

const UserProfile = ({ userId }: UserProfileProps) => {
  const dispatch = useDispatch()
  const { users } = useSelector((state: RootState) => state.users)
  const { user: currentUser } = useSelector((state: RootState) => state.auth)
  
  const [user, setUser] = useState<User | null>(null)
  const [activeTab, setActiveTab] = useState('profile')
  const [isEditing, setIsEditing] = useState(false)
  const [showPasswordForm, setShowPasswordForm] = useState(false)
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phoneNumber: '',
    department: '',
    timezone: '',
    language: '',
    avatar: ''
  })

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })

  const [preferences, setPreferences] = useState({
    emailNotifications: true,
    pushNotifications: false,
    weeklyReports: true,
    securityAlerts: true,
    theme: 'system',
    dateFormat: 'MM/dd/yyyy',
    timeFormat: '12h'
  })

  useEffect(() => {
    const targetUser = userId ? users.find(u => u.id === userId) : users.find(u => u.email === currentUser?.email)
    if (targetUser) {
      setUser(targetUser)
      setFormData({
        name: targetUser.name,
        email: targetUser.email,
        phoneNumber: targetUser.phoneNumber || '',
        department: targetUser.department || '',
        timezone: targetUser.timezone || 'UTC',
        language: targetUser.language || 'en',
        avatar: targetUser.avatar || ''
      })
    }
  }, [userId, users, currentUser])

  const handleSaveProfile = async () => {
    if (!user) return

    try {
      const updatedData = {
        id: user.id,
        ...formData
      }
      
      dispatch(updateUser(updatedData))
      dispatch(addActivity({
        userId: currentUser?.id || '1',
        action: 'Profile Updated',
        module: 'Profile',
        details: `Updated profile information`
      }))
      
      toast.success('Profile updated successfully!')
      setIsEditing(false)
    } catch (error) {
      toast.error('Failed to update profile')
    }
  }

  const handlePasswordChange = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('New passwords do not match')
      return
    }

    if (passwordData.newPassword.length < 8) {
      toast.error('Password must be at least 8 characters long')
      return
    }

    try {
      // In a real app, this would call the API
      // await usersAPI.changePassword(user.id, passwordData)
      
      dispatch(addActivity({
        userId: user?.id || '1',
        action: 'Password Changed',
        module: 'Security',
        details: 'Password updated successfully'
      }))
      
      toast.success('Password changed successfully!')
      setShowPasswordForm(false)
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' })
    } catch (error) {
      toast.error('Failed to change password')
    }
  }

  const handleTwoFactorToggle = async () => {
    if (!user) return

    try {
      const newStatus = !user.twoFactorEnabled
      dispatch(updateUser({ id: user.id, twoFactorEnabled: newStatus }))
      
      dispatch(addActivity({
        userId: currentUser?.id || '1',
        action: newStatus ? '2FA Enabled' : '2FA Disabled',
        module: 'Security',
        details: `Two-factor authentication ${newStatus ? 'enabled' : 'disabled'}`
      }))
      
      toast.success(`Two-factor authentication ${newStatus ? 'enabled' : 'disabled'}!`)
    } catch (error) {
      toast.error('Failed to update two-factor authentication')
    }
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <UserIcon className="w-12 h-12 text-slate-400 mx-auto mb-4" />
          <p className="text-slate-600 dark:text-slate-400">User not found</p>
        </div>
      </div>
    )
  }

  const tabs = [
    { id: 'profile', name: 'Profile', icon: UserIcon },
    { id: 'security', name: 'Security', icon: Shield },
    { id: 'preferences', name: 'Preferences', icon: Settings },
    { id: 'activity', name: 'Activity', icon: Activity }
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gradient mb-2">
            {userId ? `${user.name}'s Profile` : 'My Profile'}
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Manage profile information, security settings, and preferences
          </p>
        </div>
      </div>

      {/* User Header Card */}
      <div className="card p-8">
        <div className="flex flex-col md:flex-row items-center md:items-start space-y-6 md:space-y-0 md:space-x-8">
          <div className="relative">
            <div className="w-24 h-24 bg-gradient-to-r from-primary-600 to-accent-600 rounded-3xl flex items-center justify-center text-white text-2xl font-bold">
              {user.avatar ? (
                <img src={user.avatar} alt={user.name} className="w-full h-full rounded-3xl object-cover" />
              ) : (
                user.name.split(' ').map(n => n[0]).join('').toUpperCase()
              )}
            </div>
            <button className="absolute -bottom-2 -right-2 w-8 h-8 bg-white dark:bg-slate-800 rounded-full shadow-lg flex items-center justify-center border-2 border-slate-200 dark:border-slate-600">
              <Camera className="w-4 h-4 text-slate-600 dark:text-slate-400" />
            </button>
          </div>

          <div className="flex-1 text-center md:text-left">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">
              {user.name}
            </h2>
            <p className="text-slate-600 dark:text-slate-400 mb-4">
              {user.email}
            </p>
            
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-sm text-slate-600 dark:text-slate-400">
              <div className="flex items-center space-x-2">
                <Shield className="w-4 h-4" />
                <span className="capitalize font-medium">{user.role}</span>
              </div>
              <div className="flex items-center space-x-2">
                <MapPin className="w-4 h-4" />
                <span>{user.department || 'No department'}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4" />
                <span>Joined {format(new Date(user.createdAt), 'MMM yyyy')}</span>
              </div>
              {user.lastLogin && (
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4" />
                  <span>Last login {format(new Date(user.lastLogin), 'MMM dd, HH:mm')}</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <div className={`px-3 py-1 rounded-xl text-sm font-medium ${
              user.status === 'active' 
                ? 'bg-success-100 text-success-800 dark:bg-success-900/20 dark:text-success-400'
                : user.status === 'inactive'
                ? 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400'
                : user.status === 'pending'
                ? 'bg-warning-100 text-warning-800 dark:bg-warning-900/20 dark:text-warning-400'
                : 'bg-error-100 text-error-800 dark:bg-error-900/20 dark:text-error-400'
            }`}>
              {user.status}
            </div>
            {user.twoFactorEnabled && (
              <div className="px-3 py-1 bg-primary-100 text-primary-800 dark:bg-primary-900/20 dark:text-primary-400 rounded-xl text-sm font-medium">
                2FA Enabled
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="card">
        <div className="border-b border-slate-200 dark:border-slate-700">
          <nav className="flex space-x-8 px-6">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                      : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.name}</span>
                </button>
              )
            })}
          </nav>
        </div>

        <div className="p-6">
          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                  Profile Information
                </h3>
                <button
                  onClick={() => {
                    if (isEditing) {
                      handleSaveProfile()
                    } else {
                      setIsEditing(true)
                    }
                  }}
                  className={isEditing ? 'btn-primary' : 'btn-secondary'}
                >
                  {isEditing ? (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Save Changes
                    </>
                  ) : (
                    <>
                      <Edit className="w-4 h-4 mr-2" />
                      Edit Profile
                    </>
                  )}
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    disabled={!isEditing}
                    className="input-field"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    disabled={!isEditing}
                    className="input-field"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={formData.phoneNumber}
                    onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                    disabled={!isEditing}
                    className="input-field"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Department
                  </label>
                  <input
                    type="text"
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    disabled={!isEditing}
                    className="input-field"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Timezone
                  </label>
                  <select
                    value={formData.timezone}
                    onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
                    disabled={!isEditing}
                    className="input-field"
                  >
                    <option value="UTC">UTC</option>
                    <option value="America/New_York">Eastern Time</option>
                    <option value="America/Chicago">Central Time</option>
                    <option value="America/Denver">Mountain Time</option>
                    <option value="America/Los_Angeles">Pacific Time</option>
                    <option value="Europe/London">London</option>
                    <option value="Asia/Shanghai">Shanghai</option>
                    <option value="Asia/Tokyo">Tokyo</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Language
                  </label>
                  <select
                    value={formData.language}
                    onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                    disabled={!isEditing}
                    className="input-field"
                  >
                    <option value="en">English</option>
                    <option value="es">Spanish</option>
                    <option value="fr">French</option>
                    <option value="de">German</option>
                    <option value="zh">Chinese</option>
                    <option value="ja">Japanese</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Security Tab */}
          {activeTab === 'security' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                Security Settings
              </h3>

              {/* Password Section */}
              <div className="card-gradient p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h4 className="font-semibold text-slate-900 dark:text-slate-100">Password</h4>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Last changed {user.lastPasswordChange ? format(new Date(user.lastPasswordChange), 'MMM dd, yyyy') : 'Never'}
                    </p>
                  </div>
                  <button
                    onClick={() => setShowPasswordForm(!showPasswordForm)}
                    className="btn-secondary"
                  >
                    <Key className="w-4 h-4 mr-2" />
                    Change Password
                  </button>
                </div>

                {showPasswordForm && (
                  <div className="space-y-4 border-t border-slate-200 dark:border-slate-700 pt-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Current Password
                      </label>
                      <input
                        type="password"
                        value={passwordData.currentPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                        className="input-field"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        New Password
                      </label>
                      <input
                        type="password"
                        value={passwordData.newPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                        className="input-field"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Confirm New Password
                      </label>
                      <input
                        type="password"
                        value={passwordData.confirmPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                        className="input-field"
                      />
                    </div>
                    <div className="flex items-center space-x-3">
                      <button onClick={handlePasswordChange} className="btn-primary">
                        Update Password
                      </button>
                      <button
                        onClick={() => {
                          setShowPasswordForm(false)
                          setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' })
                        }}
                        className="btn-secondary"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Two-Factor Authentication */}
              <div className="card-gradient p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold text-slate-900 dark:text-slate-100 flex items-center">
                      Two-Factor Authentication
                      {user.twoFactorEnabled ? (
                        <CheckCircle className="w-5 h-5 text-success-500 ml-2" />
                      ) : (
                        <XCircle className="w-5 h-5 text-slate-400 ml-2" />
                      )}
                    </h4>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      {user.twoFactorEnabled 
                        ? 'Your account is protected with 2FA' 
                        : 'Add an extra layer of security to your account'
                      }
                    </p>
                  </div>
                  <button
                    onClick={handleTwoFactorToggle}
                    className={user.twoFactorEnabled ? 'btn-secondary' : 'btn-primary'}
                  >
                    {user.twoFactorEnabled ? (
                      <>
                        <Unlock className="w-4 h-4 mr-2" />
                        Disable 2FA
                      </>
                    ) : (
                      <>
                        <Lock className="w-4 h-4 mr-2" />
                        Enable 2FA
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Login Attempts */}
              <div className="card-gradient p-6">
                <h4 className="font-semibold text-slate-900 dark:text-slate-100 mb-4">Login Security</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                      {user.loginAttempts}
                    </div>
                    <div className="text-sm text-slate-600 dark:text-slate-400">Failed Attempts</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-success-600">
                      {user.lastLogin ? '✓' : '—'}
                    </div>
                    <div className="text-sm text-slate-600 dark:text-slate-400">Last Login</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary-600">
                      {user.twoFactorEnabled ? '✓' : '✗'}
                    </div>
                    <div className="text-sm text-slate-600 dark:text-slate-400">2FA Status</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Preferences Tab */}
          {activeTab === 'preferences' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                Preferences
              </h3>

              {/* Notification Preferences */}
              <div className="card-gradient p-6">
                <h4 className="font-semibold text-slate-900 dark:text-slate-100 mb-4">Notifications</h4>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-slate-900 dark:text-slate-100">Email Notifications</div>
                      <div className="text-sm text-slate-600 dark:text-slate-400">Receive notifications via email</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={preferences.emailNotifications}
                      onChange={(e) => setPreferences({ ...preferences, emailNotifications: e.target.checked })}
                      className="rounded border-slate-300 dark:border-slate-600"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-slate-900 dark:text-slate-100">Push Notifications</div>
                      <div className="text-sm text-slate-600 dark:text-slate-400">Receive browser push notifications</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={preferences.pushNotifications}
                      onChange={(e) => setPreferences({ ...preferences, pushNotifications: e.target.checked })}
                      className="rounded border-slate-300 dark:border-slate-600"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-slate-900 dark:text-slate-100">Weekly Reports</div>
                      <div className="text-sm text-slate-600 dark:text-slate-400">Receive weekly activity reports</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={preferences.weeklyReports}
                      onChange={(e) => setPreferences({ ...preferences, weeklyReports: e.target.checked })}
                      className="rounded border-slate-300 dark:border-slate-600"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-slate-900 dark:text-slate-100">Security Alerts</div>
                      <div className="text-sm text-slate-600 dark:text-slate-400">Receive security-related notifications</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={preferences.securityAlerts}
                      onChange={(e) => setPreferences({ ...preferences, securityAlerts: e.target.checked })}
                      className="rounded border-slate-300 dark:border-slate-600"
                    />
                  </div>
                </div>
              </div>

              {/* Display Preferences */}
              <div className="card-gradient p-6">
                <h4 className="font-semibold text-slate-900 dark:text-slate-100 mb-4">Display & Format</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Date Format
                    </label>
                    <select
                      value={preferences.dateFormat}
                      onChange={(e) => setPreferences({ ...preferences, dateFormat: e.target.value })}
                      className="input-field"
                    >
                      <option value="MM/dd/yyyy">MM/DD/YYYY</option>
                      <option value="dd/MM/yyyy">DD/MM/YYYY</option>
                      <option value="yyyy-MM-dd">YYYY-MM-DD</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Time Format
                    </label>
                    <select
                      value={preferences.timeFormat}
                      onChange={(e) => setPreferences({ ...preferences, timeFormat: e.target.value })}
                      className="input-field"
                    >
                      <option value="12h">12 Hour</option>
                      <option value="24h">24 Hour</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Activity Tab */}
          {activeTab === 'activity' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                Recent Activity
              </h3>
              
              <div className="space-y-4">
                {/* Mock activity data */}
                {[
                  { action: 'Profile Updated', time: '2 hours ago', icon: UserIcon, color: 'text-blue-500' },
                  { action: 'Password Changed', time: '1 day ago', icon: Key, color: 'text-green-500' },
                  { action: '2FA Enabled', time: '3 days ago', icon: Shield, color: 'text-purple-500' },
                  { action: 'Login from New Device', time: '1 week ago', icon: AlertTriangle, color: 'text-yellow-500' }
                ].map((activity, index) => {
                  const Icon = activity.icon
                  return (
                    <div key={index} className="flex items-center space-x-4 p-4 card-gradient">
                      <div className={`p-2 rounded-xl bg-slate-100 dark:bg-slate-800 ${activity.color}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-slate-900 dark:text-slate-100">
                          {activity.action}
                        </div>
                        <div className="text-sm text-slate-600 dark:text-slate-400">
                          {activity.time}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default UserProfile
