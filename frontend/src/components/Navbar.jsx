import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'
import toast from 'react-hot-toast'
import { Search, ShoppingBag } from 'lucide-react'

export default function Navbar() {
    const { user, logoutUser } = useAuth()
    const { count } = useCart()
    const navigate = useNavigate()
    const [bagOpen, setBagOpen] = useState(false)
    const bagRef = useRef(null)

    const handleLogout = async () => {
        await logoutUser()
        toast.success('Logged out')
        navigate('/login')
    }

    // Close bag when clicking outside
    useEffect(() => {
        function handleClickOutside(event) {
            if (bagRef.current && !bagRef.current.contains(event.target)) {
                setBagOpen(false)
            }
        }
        document.addEventListener("mousedown", handleClickOutside)
        return () => document.removeEventListener("mousedown", handleClickOutside)
    }, [bagRef])

    const nav = {
        background: 'rgba(255, 255, 255, 0.8)',
        backdropFilter: 'saturate(180%) blur(20px)',
        height: '44px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        width: '100%',
        boxSizing: 'border-box'
    }

    const containerStyle = {
        width: '100%',
        maxWidth: '980px',
        margin: '0 auto',
        padding: '0 22px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
    }

    const link = {
        color: 'rgba(0, 0, 0, 0.8)',
        textDecoration: 'none',
        fontSize: '12px',
        fontWeight: '400',
        letterSpacing: '-.01em',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
        opacity: 0.8,
        transition: 'opacity 0.2s',
        display: 'flex',
        alignItems: 'center'
    }

    const LINKS = ['Store', 'Phones', 'Laptops', 'Tablets', 'Accessories', 'Audio', 'Cameras', 'Gaming']

    return (
        <nav style={nav}>
            <div style={containerStyle}>
                {/* Logo */}
                <Link to="/" style={{ display: 'flex', alignItems: 'center' }}>
                    <img src="/paramount-gs.png" alt="Paramount Gadget" style={{ height: '24px' }} />
                </Link>

                {/* Categories */}
                <div style={{ display: 'flex', gap: '28px', alignItems: 'center', flex: 1, justifyContent: 'center' }}>
                    {LINKS.map(item => (
                        <Link key={item} to={`/?category=${item === 'Store' ? 'All' : item.toLowerCase()}`} style={link}>{item}</Link>
                    ))}
                </div>

                {/* Icons */}
                <div style={{ display: 'flex', gap: '24px', alignItems: 'center', position: 'relative' }}>
                    <Link to="/" style={link}>
                        <Search size={14} style={{ opacity: 0.8 }} />
                    </Link>

                    <div ref={bagRef}>
                        <button
                            style={{ ...link, background: 'none', border: 'none', cursor: 'pointer', position: 'relative', padding: 0 }}
                            onClick={() => setBagOpen(!bagOpen)}
                        >
                            <ShoppingBag size={14} style={{ opacity: 0.8 }} />
                            {count > 0 && (
                                <span style={{
                                    position: 'absolute', top: '-6px', right: '-8px', background: '#0066cc', color: '#fff',
                                    borderRadius: '50%', minWidth: '14px', height: '14px', fontSize: '9px', display: 'flex',
                                    alignItems: 'center', justifyContent: 'center', fontWeight: '700', padding: '0 2px'
                                }}>
                                    {count}
                                </span>
                            )}
                        </button>

                        {/* Bag Dropdown Overlay */}
                        {bagOpen && (
                            <div style={{
                                position: 'absolute',
                                top: '34px',
                                right: '-30px',
                                width: '280px',
                                background: '#fff',
                                borderRadius: '18px',
                                border: '1px solid #d2d2d7',
                                padding: '20px',
                                boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
                                zIndex: 101,
                                textAlign: 'left',
                                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif'
                            }}>
                                <h4 style={{ color: '#6e6e73', fontSize: '14px', fontWeight: '600', marginBottom: '16px', marginTop: 0 }}>
                                    {count === 0 ? 'Your Bag is empty.' : `${count} item${count > 1 ? 's' : ''} in your bag`}
                                </h4>

                                {count === 0 && (
                                    <Link to="/" onClick={() => setBagOpen(false)} style={{ color: '#0066cc', textDecoration: 'underline', fontSize: '12px', display: 'block', marginBottom: '20px' }}>
                                        Shop Now
                                    </Link>
                                )}

                                {count > 0 && (
                                    <div style={{ marginBottom: '20px' }}>
                                        <Link to="/cart" onClick={() => setBagOpen(false)} style={{
                                            display: 'block', width: '100%', background: '#0066cc', color: '#fff', textAlign: 'center',
                                            padding: '12px 0', borderRadius: '12px', textDecoration: 'none', fontSize: '14px', fontWeight: '400',
                                            boxSizing: 'border-box'
                                        }}>
                                            Review Bag
                                        </Link>
                                    </div>
                                )}

                                {user ? (
                                    <div>
                                        <h5 style={{ color: '#6e6e73', fontSize: '12px', fontWeight: '600', marginBottom: '12px', marginTop: '16px' }}>My Profile</h5>
                                        <Link to="/orders" onClick={() => setBagOpen(false)} style={{ display: 'block', color: '#1d1d1f', textDecoration: 'none', fontSize: '12px', padding: '8px 0', borderBottom: '1px solid #eee' }}>📦 Orders</Link>
                                        <Link to="/orders" onClick={() => setBagOpen(false)} style={{ display: 'block', color: '#1d1d1f', textDecoration: 'none', fontSize: '12px', padding: '8px 0', borderBottom: '1px solid #eee' }}>🔖 Your Saves</Link>
                                        <div style={{ display: 'block', color: '#1d1d1f', fontSize: '12px', padding: '8px 0', borderBottom: '1px solid #eee' }}>👤 Account</div>
                                        {user.role === 'admin' && (
                                            <Link to="/admin" onClick={() => setBagOpen(false)} style={{ display: 'block', color: '#f59e0b', textDecoration: 'none', fontSize: '12px', padding: '8px 0', borderBottom: '1px solid #eee' }}>⚙️ Admin Dashboard</Link>
                                        )}
                                        <button onClick={() => { handleLogout(); setBagOpen(false) }} style={{ background: 'none', border: 'none', padding: '8px 0', color: '#1d1d1f', fontSize: '12px', cursor: 'pointer', display: 'block', width: '100%', textAlign: 'left' }}>
                                            ⎋ Sign out {user.name}
                                        </button>
                                    </div>
                                ) : (
                                    <div style={{ borderTop: '1px solid #eee', paddingTop: '16px', marginTop: '16px' }}>
                                        <Link to="/login" onClick={() => setBagOpen(false)} style={{ display: 'block', color: '#0066cc', textDecoration: 'none', fontSize: '12px', padding: '8px 0' }}>Sign In</Link>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    )
}