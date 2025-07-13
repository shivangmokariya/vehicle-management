import { createContext, useContext, useState } from 'react'
import { useQuery } from 'react-query'
import { authAPI } from '../services/api'
import toast from 'react-hot-toast'

const AuthContext = createContext()

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // Check if token exists in localStorage
  const token = localStorage.getItem('token')

  // Initial auth check only if token exists
  useQuery(
    'user',
    authAPI.getCurrentUser,
    {
      enabled: !!token, // Only run query if token exists
      retry: false,
      refetchOnWindowFocus: false,
      onError: (error) => {
        if (error?.response) {
          // Handle error silently
        }
        localStorage.removeItem('token')
        setUser(null)
        setLoading(false) // Only set to false after first check
      },
      onSuccess: (data) => {
        setUser(data.data)
        setLoading(false) // Only set to false after first check
      }
    }
  )

  // If no token exists, set loading to false immediately
  if (!token && loading) {
    setLoading(false)
  }

  const login = async (credentials) => {
    try {
      const response = await authAPI.login(credentials)
      const { token, user } = response.data
      localStorage.setItem('token', token)
      setUser(user)
      toast.success('Login successful!')
      return { success: true }
    } catch (error) {
      const message = error.response?.data?.message || 'Login failed'
      toast.error(message)
      return { success: false, error: message }
    }
  }

  const logout = () => {
    localStorage.removeItem('token')
    setUser(null)
    toast.success('Logged out successfully')
  }

  const value = {
    user,
    loading,
    login,
    logout,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
} 