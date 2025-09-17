import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { RootState } from '../../store/store'
import { validateTokenStart, validateTokenSuccess, validateTokenFailure } from '../../store/slices/authSlice'
// import { authAPI } from '../../services/api' // Unused import removed

interface AuthProviderProps {
  children: React.ReactNode
}

const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const dispatch = useDispatch()
  const { token, isAuthenticated, isLoading } = useSelector((state: RootState) => state.auth)

  useEffect(() => {
    const validateToken = async () => {
      console.log('🔍 AuthProvider: Starting token validation', { hasToken: !!token, isAuthenticated })

      // Only validate if we have a token and are not already authenticated
      if (token && !isAuthenticated) {
        dispatch(validateTokenStart())
        console.log('🔄 AuthProvider: Token validation started')

        try {
          // Use a different endpoint for token validation since /auth/me has issues
          // We'll get current user data from users API instead
          const response = await fetch('http://localhost:5000/api/users?limit=1&currentUser=true', {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          })

          console.log('📡 AuthProvider: API Response', { status: response.status, ok: response.ok })

          if (response.ok) {
            const data = await response.json()
            console.log('✅ AuthProvider: API Response Data', data)

            if (data?.success && data?.data?.users?.[0]) {
              const user = data.data.users[0]
              // Convert user data to match expected format
              const formattedUser = {
                id: user._id || user.id,
                email: user.email,
                username: user.username,
                role: user.role,
                status: user.status,
                profile: user.profile,
                permissions: user.permissions,
                preferences: user.preferences
              }
              console.log('✅ AuthProvider: Token validation successful', formattedUser)
              dispatch(validateTokenSuccess({ user: formattedUser }))
            } else {
              console.log('❌ AuthProvider: Invalid response structure')
              dispatch(validateTokenFailure())
            }
          } else {
            console.log('❌ AuthProvider: API request failed', response.status)
            dispatch(validateTokenFailure())
          }
        } catch (error) {
          console.log('❌ AuthProvider: Token validation error', error)
          // Token is invalid, clear it
          dispatch(validateTokenFailure())
        }
      } else if (!token && !isAuthenticated) {
        console.log('ℹ️ AuthProvider: No token found, clearing loading state')
        // No token, clear loading state and set loading to false
        dispatch(validateTokenFailure())
      } else if (token && isAuthenticated) {
        console.log('✅ AuthProvider: Already authenticated, skipping validation')
      }
    }

    validateToken()
  }, [token, isAuthenticated, dispatch])

  // Show loading spinner while validating token
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="text-gray-600 dark:text-gray-400">Validating session...</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}

export default AuthProvider