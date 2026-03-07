import { createContext, useContext, useState } from 'react'
import { login as apiLogin, logout as apiLogout, register as apiRegister } from '../services/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
    const [user, setUser] = useState(() => {
        try { const u = localStorage.getItem('user'); return u ? JSON.parse(u) : null }
        catch { return null }
    })

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
        } finally { localStorage.clear(); setUser(null) }
    }

    return (
        <AuthContext.Provider value={{ user, loginUser, registerUser, logoutUser }}>
            {children}
        </AuthContext.Provider>
    )
}

export const useAuth = () => useContext(AuthContext)