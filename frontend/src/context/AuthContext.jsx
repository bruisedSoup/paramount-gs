import { createContext, useContext, useState, useEffect } from 'react'
import { login as apiLogin, logout as apiLogout, register as apiRegister, getProfile } from '../services/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const validateToken = async () => {
            const token = localStorage.getItem('access_token')
            if (!token) {
                setLoading(false)
                return
            }
            try {
                const { data } = await getProfile()
                setUser(data)
            } catch (err) {
                localStorage.removeItem('access_token')
                localStorage.removeItem('refresh_token')
                localStorage.removeItem('user')
                setUser(null)
            } finally {
                setLoading(false)
            }
        }

        const timeout = setTimeout(() => {
            setLoading(false)
        }, 8000)

        validateToken().finally(() => clearTimeout(timeout))
    }, [])

    const loginUser = async (email, password) => {
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
        localStorage.removeItem('user')

        const { data } = await apiLogin({ email, password })
        localStorage.setItem('access_token', data.tokens.access)
        localStorage.setItem('refresh_token', data.tokens.refresh)
        localStorage.setItem('user', JSON.stringify(data.user))
        setUser(data.user)
        return data.user
    }

    const registerUser = async (name, email, password, confirm_password) => {
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
        localStorage.removeItem('user')

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
        } catch {
            // ignore logout errors
        } finally {
            localStorage.removeItem('access_token')
            localStorage.removeItem('refresh_token')
            localStorage.removeItem('user')
            setUser(null)
        }
    }

    // Remove the loading spinner block — let routes handle loading state
    // This prevents the whole app from being blocked during token validation

    return (
        <AuthContext.Provider value={{ user, loading, loginUser, registerUser, logoutUser }}>
            {children}
        </AuthContext.Provider>
    )
}

export const useAuth = () => useContext(AuthContext)