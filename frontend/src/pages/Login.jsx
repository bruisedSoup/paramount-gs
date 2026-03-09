import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

const inputStyle = {
    width: '100%', background: '#fff', border: '1px solid #d2d2d7',
    borderRadius: '10px', padding: '12px 14px', color: '#111',
    fontSize: '15px', outline: 'none', boxSizing: 'border-box',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    transition: 'border-color 0.2s',
}
const labelStyle = {
    display: 'block', color: '#6e6e73', fontSize: '13px',
    marginBottom: '6px', fontWeight: '600',
}

export default function Login() {
    const [form, setForm] = useState({ email: '', password: '' })
    const [errors, setErrors] = useState({})
    const [loading, setLoading] = useState(false)
    const { loginUser } = useAuth()
    const navigate = useNavigate()

    const validate = () => {
        const e = {}
        if (!form.email) e.email = 'Email required'
        else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Invalid email'
        if (!form.password) e.password = 'Password required'
        setErrors(e); return Object.keys(e).length === 0
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!validate()) return
        setLoading(true)
        try {
            const user = await loginUser(form.email, form.password)
            toast.success(`Welcome back, ${user.name}!`)
            navigate(user.role === 'admin' ? '/admin' : '/')
        } catch (err) {
            toast.error(err.response?.data?.detail || 'Login failed')
        } finally { setLoading(false) }
    }

    return (
        <div style={{
            minHeight: '100vh', background: '#f5f5f7',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '2rem',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
        }}>
            <div style={{
                background: '#fff', border: '1px solid #d2d2d7',
                borderRadius: '18px', padding: '44px 40px',
                width: '100%', maxWidth: '400px',
                boxShadow: '0 4px 24px rgba(0,0,0,0.07)',
            }}>
                <h1 style={{ fontSize: '28px', fontWeight: '800', color: '#111', marginBottom: '6px', letterSpacing: '-0.02em' }}>Sign In</h1>
                <p style={{ color: '#6e6e73', fontSize: '14px', marginBottom: '28px' }}>Welcome back to Paramount Gadgets</p>

                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: '16px' }}>
                        <label style={labelStyle}>Email</label>
                        <input
                            style={inputStyle}
                            type="email"
                            value={form.email}
                            onChange={e => setForm({ ...form, email: e.target.value })}
                            onFocus={e => e.target.style.borderColor = '#0066cc'}
                            onBlur={e => e.target.style.borderColor = '#d2d2d7'}
                        />
                        {errors.email && <p style={{ color: '#c0392b', fontSize: '12px', marginTop: '4px' }}>{errors.email}</p>}
                    </div>
                    <div style={{ marginBottom: '24px' }}>
                        <label style={labelStyle}>Password</label>
                        <input
                            style={inputStyle}
                            type="password"
                            value={form.password}
                            onChange={e => setForm({ ...form, password: e.target.value })}
                            onFocus={e => e.target.style.borderColor = '#0066cc'}
                            onBlur={e => e.target.style.borderColor = '#d2d2d7'}
                        />
                        {errors.password && <p style={{ color: '#c0392b', fontSize: '12px', marginTop: '4px' }}>{errors.password}</p>}
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        style={{
                            width: '100%', background: '#0066cc', color: '#fff',
                            border: 'none', borderRadius: '12px', padding: '14px',
                            fontWeight: '700', fontSize: '15px', cursor: 'pointer',
                            letterSpacing: '-0.01em', transition: 'background 0.15s',
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = '#0077ed'}
                        onMouseLeave={e => e.currentTarget.style.background = '#0066cc'}
                    >
                        {loading ? 'Signing in...' : 'Sign In'}
                    </button>
                </form>

                <p style={{ textAlign: 'center', marginTop: '20px', color: '#6e6e73', fontSize: '14px' }}>
                    No account?{' '}
                    <Link to="/register" style={{ color: '#0066cc', textDecoration: 'none', fontWeight: '600' }}>Register here</Link>
                </p>
            </div>
        </div>
    )
}