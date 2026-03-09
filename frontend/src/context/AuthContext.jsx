import { createContext, useContext, useState, useEffect } from 'react'
import { login as apiLogin, logout as apiLogout, register as apiRegister, getProfile } from '../services/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null)
    const [loading, setLoading] = useState(true)  // ← add loading state

    useEffect(() => {
        const validateToken = async () => {
            const token = localStorage.getItem('access_token')
            if (!token) {
                setLoading(false)
                return
            }
            try {
                // Verify token is still valid by hitting the profile endpoint
                const { data } = await getProfile()
                setUser(data)
            } catch {
                // Token is expired or invalid — clear everything
                localStorage.clear()
                setUser(null)
            } finally {
                setLoading(false)
            }
        }
        validateToken()
    }, [])

    const loginUser = async (email, password) => {
        const { data } = await apiLogin({ email, password })
        localStorage.setItem('access_token', data.tokens.access)
        localStorage.setItem('refresh_token', data.tokens.refresh)
        localStorage.setItem('user', JSON.stringify(data.user))
        setUser(data.user)
        return data.user
    }

    const registerUser = async (name, email, password, confirm_password) => {
        const { data } = await apiRegister({ name, email, password, confirm_password })
        localStorage.setItem('access_token', data.tokens.access)
        localStorage.setItem('refresh_token', data.tokens.refresh)
        localStorage.setItem('user', JSON.stringify(data.user))
        setUser(data.user)
        return data.user
    }

    const logoutUser = async () => {
        try {
            const refresh = localStorage.getItem('refresh_token')
            if (refresh) await apiLogout(refresh)
        } finally {
            localStorage.clear()
            setUser(null)
        }
    }

    // Don't render anything until we know if the user is logged in or not
    if (loading) return (
        <div style={{ minHeight: '100vh', background: '#f5f5f7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ width: '36px', height: '36px', border: '3px solid #d2d2d7', borderTop: '3px solid #0066cc', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
    )

    return (
        <AuthContext.Provider value={{ user, loginUser, registerUser, logoutUser }}>
            {children}
        </AuthContext.Provider>
    )
}

export const useAuth = () => useContext(AuthContext)