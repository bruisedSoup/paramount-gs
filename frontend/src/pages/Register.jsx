import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

const IS = { width: '100%', background: '#0d0d14', border: '1px solid #1e1e2e', borderRadius: '8px', padding: '11px 14px', color: '#e2e8f0', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }
const LS = { display: 'block', color: '#94a3b8', fontSize: '13px', marginBottom: '6px', fontWeight: '600' }

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
        <div style={{ minHeight: '100vh', background: '#0a0a0f', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
            <div style={{ background: '#111118', border: '1px solid #1e1e2e', borderRadius: '12px', padding: '40px', width: '100%', maxWidth: '420px' }}>
                <h1 style={{ fontSize: '26px', fontWeight: '800', color: '#fff', marginBottom: '6px' }}>Create Account</h1>
                <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '28px' }}>Join Paramount Gadget</p>
                <form onSubmit={handleSubmit}>
                    {FIELDS.map(f => (
                        <div key={f.key} style={{ marginBottom: '16px' }}>
                            <label style={LS}>{f.label}</label>
                            <input style={IS} type={f.type} value={form[f.key]} onChange={e => setForm({ ...form, [f.key]: e.target.value })} />
                            {errors[f.key] && <p style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px' }}>{errors[f.key]}</p>}
                        </div>
                    ))}
                    <button type="submit" disabled={loading} style={{ width: '100%', background: '#00e5ff', color: '#000', border: 'none', borderRadius: '8px', padding: '12px', fontWeight: '800', fontSize: '15px', cursor: 'pointer', marginTop: '4px' }}>
                        {loading ? 'Creating...' : 'Create Account'}
                    </button>
                </form>
                <p style={{ textAlign: 'center', marginTop: '20px', color: '#64748b', fontSize: '14px' }}>
                    Have an account? <Link to="/login" style={{ color: '#00e5ff' }}>Sign in</Link>
                </p>
            </div>
        </div>
    )
}