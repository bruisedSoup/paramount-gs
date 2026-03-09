import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

const IS = {
    width: '100%', background: '#fff', border: '1px solid #d2d2d7',
    borderRadius: '10px', padding: '12px 14px', color: '#111',
    fontSize: '15px', outline: 'none', boxSizing: 'border-box',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    transition: 'border-color 0.2s',
}
const LS = { display: 'block', color: '#6e6e73', fontSize: '13px', marginBottom: '6px', fontWeight: '600' }

export default function Register() {
    const [form, setForm] = useState({ name: '', email: '', password: '', confirm_password: '' })
    const [errors, setErrors] = useState({})
    const [loading, setLoading] = useState(false)
    const { registerUser } = useAuth()
    const navigate = useNavigate()

    const validate = () => {
        const e = {}
        if (!form.name.trim()) e.name = 'Name required'
        if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Valid email required'
        if (form.password.length < 8) e.password = 'Min 8 characters'
        if (form.password !== form.confirm_password) e.confirm_password = 'Passwords must match'
        setErrors(e); return Object.keys(e).length === 0
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!validate()) return
        setLoading(true)
        try {
            await registerUser(form.name, form.email, form.password, form.confirm_password)
            toast.success('Account created! Welcome!')
            navigate('/')
        } catch (err) {
            const d = err.response?.data
            if (d) setErrors(d)
            toast.error('Registration failed')
        } finally { setLoading(false) }
    }

    const FIELDS = [
        { key: 'name', label: 'Full Name', type: 'text' },
        { key: 'email', label: 'Email Address', type: 'email' },
        { key: 'password', label: 'Password', type: 'password' },
        { key: 'confirm_password', label: 'Confirm Password', type: 'password' },
    ]

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
                width: '100%', maxWidth: '420px',
                boxShadow: '0 4px 24px rgba(0,0,0,0.07)',
            }}>
                <h1 style={{ fontSize: '28px', fontWeight: '800', color: '#111', marginBottom: '6px', letterSpacing: '-0.02em' }}>Create Account</h1>
                <p style={{ color: '#6e6e73', fontSize: '14px', marginBottom: '28px' }}>Join Paramount Gadgets</p>

                <form onSubmit={handleSubmit}>
                    {FIELDS.map(f => (
                        <div key={f.key} style={{ marginBottom: '16px' }}>
                            <label style={LS}>{f.label}</label>
                            <input
                                style={IS}
                                type={f.type}
                                value={form[f.key]}
                                onChange={e => setForm({ ...form, [f.key]: e.target.value })}
                                onFocus={e => e.target.style.borderColor = '#0066cc'}
                                onBlur={e => e.target.style.borderColor = '#d2d2d7'}
                            />
                            {errors[f.key] && <p style={{ color: '#c0392b', fontSize: '12px', marginTop: '4px' }}>{errors[f.key]}</p>}
                        </div>
                    ))}
                    <button
                        type="submit"
                        disabled={loading}
                        style={{
                            width: '100%', background: '#0066cc', color: '#fff',
                            border: 'none', borderRadius: '12px', padding: '14px',
                            fontWeight: '700', fontSize: '15px', cursor: 'pointer',
                            marginTop: '8px', letterSpacing: '-0.01em', transition: 'background 0.15s',
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = '#0077ed'}
                        onMouseLeave={e => e.currentTarget.style.background = '#0066cc'}
                    >
                        {loading ? 'Creating...' : 'Create Account'}
                    </button>
                </form>

                <p style={{ textAlign: 'center', marginTop: '20px', color: '#6e6e73', fontSize: '14px' }}>
                    Have an account?{' '}
                    <Link to="/login" style={{ color: '#0066cc', textDecoration: 'none', fontWeight: '600' }}>Sign in</Link>
                </p>
            </div>
        </div>
    )
}