import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

const inputStyle = { width: '100%', background: '#0d0d14', border: '1px solid #1e1e2e', borderRadius: '8px', padding: '11px 14px', color: '#e2e8f0', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }
const labelStyle = { display: 'block', color: '#94a3b8', fontSize: '13px', marginBottom: '6px', fontWeight: '600' }

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
        <div style={{ minHeight: '100vh', background: '#0a0a0f', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
            <div style={{ background: '#111118', border: '1px solid #1e1e2e', borderRadius: '12px', padding: '40px', width: '100%', maxWidth: '400px' }}>
                <h1 style={{ fontSize: '26px', fontWeight: '800', color: '#fff', marginBottom: '6px' }}>Sign In</h1>
                <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '28px' }}>Welcome back to Paramount Gadget</p>
                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: '16px' }}>
                        <label style={labelStyle}>Email</label>
                        <input style={inputStyle} type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
                        {errors.email && <p style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px' }}>{errors.email}</p>}
                    </div>
                    <div style={{ marginBottom: '20px' }}>
                        <label style={labelStyle}>Password</label>
                        <input style={inputStyle} type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
                        {errors.password && <p style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px' }}>{errors.password}</p>}
                    </div>
                    <button type="submit" disabled={loading} style={{ width: '100%', background: '#00e5ff', color: '#000', border: 'none', borderRadius: '8px', padding: '12px', fontWeight: '800', fontSize: '15px', cursor: 'pointer' }}>
                        {loading ? 'Signing in...' : 'Sign In'}
                    </button>
                </form>
                <p style={{ textAlign: 'center', marginTop: '20px', color: '#64748b', fontSize: '14px' }}>
                    No account? <Link to="/register" style={{ color: '#00e5ff' }}>Register here</Link>
                </p>
            </div>
        </div>
    )
}