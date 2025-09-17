import { useEffect } from 'react'
import { useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { RootState } from '../../store/store'
import { getRoleDashboard } from '../../utils/roleUtils'

const DashboardRedirect: React.FC = () => {
  const { isAuthenticated, user } = useSelector((state: RootState) => state.auth)
  const navigate = useNavigate()

  useEffect(() => {
    if (isAuthenticated && user) {
      const dashboard = getRoleDashboard(user.role)
      console.log(`🚀 Redirecting ${user.role} to ${dashboard}`)
      navigate(dashboard, { replace: true })
    } else if (!isAuthenticated) {
      navigate('/login', { replace: true })
    }
  }, [isAuthenticated, user, navigate])

  // Show loading while redirecting
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
      <div className="flex flex-col items-center space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <p className="text-gray-600 dark:text-gray-400">Redirecting to dashboard...</p>
      </div>
    </div>
  )
}

export default DashboardRedirect