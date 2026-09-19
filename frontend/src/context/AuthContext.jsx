/**
 * AuthContext — global authentication state.
 * Stores the JWT token in localStorage and provides login/logout helpers.
 */
import { createContext, useContext, useState, useEffect } from 'react'
import { authApi } from '../api/authApi.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(() => localStorage.getItem('cs_token'))
  const [loading, setLoading] = useState(true)

  // On mount, verify the stored token is still valid
  useEffect(() => {
    if (token) {
      authApi.me()
        .then((data) => setUser(data))
        .catch(() => {
          // Token expired or invalid — clear it
          localStorage.removeItem('cs_token')
          setToken(null)
        })
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [token])

  function login(userData, accessToken) {
    localStorage.setItem('cs_token', accessToken)
    setToken(accessToken)
    setUser(userData)
  }

  function logout() {
    localStorage.removeItem('cs_token')
    setToken(null)
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

/** Hook to access auth state from any component. */
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
