import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'
import toast from 'react-hot-toast'
import { ShoppingCart, LogOut, LayoutDashboard, Package, ClipboardList } from 'lucide-react'

export default function Navbar() {
    const { user, logoutUser } = useAuth()
    const { count } = useCart()
    const navigate = useNavigate()

    const handleLogout = async () => {
        await logoutUser()
        toast.success('Logged out')
        navigate('/login')
    }

    const nav = { background: '#0f172a', padding: '0 2rem', height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #1e293b', position: 'sticky', top: 0, zIndex: 100 }
    const link = { color: '#94a3b8', textDecoration: 'none', display: 'flex', alignItems: 'center' }

    return (
        <nav style={nav}>
            <Link to="/" style={{ color: '#00e5ff', fontWeight: '800', fontSize: '18px', textDecoration: 'none' }}>⚡ PARAMOUNT GADGET</Link>
            <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                <Link to="/" style={link} title="Products"><Package size={20} /></Link>
                {user && <>
                    <Link to="/cart" style={{ ...link, position: 'relative' }} title="Cart">
                        <ShoppingCart size={20} />
                        {count > 0 && <span style={{ position: 'absolute', top: '-8px', right: '-8px', background: '#00e5ff', color: '#000', borderRadius: '50%', width: '18px', height: '18px', fontSize: '11px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700' }}>{count}</span>}
                    </Link>
                    <Link to="/orders" style={link} title="My Orders"><ClipboardList size={20} /></Link>
                    {user.role === 'admin' && <Link to="/admin" style={{ ...link, color: '#f59e0b' }} title="Admin"><LayoutDashboard size={20} /></Link>}
                    <span style={{ color: '#475569', fontSize: '14px' }}>Hi, {user.name}</span>
                    <button onClick={handleLogout} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', display: 'flex' }} title="Logout"><LogOut size={18} /></button>
                </>}
                {!user && <>
                    <Link to="/login" style={{ color: '#94a3b8', textDecoration: 'none', fontSize: '14px' }}>Login</Link>
                    <Link to="/register" style={{ background: '#00e5ff', color: '#000', padding: '6px 16px', borderRadius: '6px', textDecoration: 'none', fontSize: '14px', fontWeight: '700' }}>Register</Link>
                </>}
            </div>
        </nav>
    )
}