import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'
import toast from 'react-hot-toast'
import { Search, ShoppingBag, Package, Heart, User, LogOut, Settings, Menu, X } from 'lucide-react'

export default function Navbar() {
    const { user, logoutUser } = useAuth()
    const { count } = useCart()
    const navigate = useNavigate()
    const [bagOpen, setBagOpen] = useState(false)
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
    const bagRef = useRef(null)

    const handleLogout = async () => {
        await logoutUser()
        toast.success('Logged out')
        navigate('/login')
    }

    useEffect(() => {
        function handleClickOutside(event) {
            if (bagRef.current && !bagRef.current.contains(event.target)) {
                setBagOpen(false)
            }
        }
        document.addEventListener("mousedown", handleClickOutside)
        return () => document.removeEventListener("mousedown", handleClickOutside)
    }, [bagRef])

    const CATEGORIES = ['Store', 'Phones', 'Laptops', 'Tablets', 'Accessories', 'Audio', 'Cameras', 'Gaming']

    return (
        <nav style={{
            position: 'sticky',
            top: 0,
            zIndex: 100,
            background: 'rgba(255, 255, 255, 0.8)',
            backdropFilter: 'saturate(180%) blur(20px)',
            borderBottom: '1px solid rgba(0, 0, 0, 0.08)',
            height: 'auto',
            minHeight: '44px',
        }}>
            <div style={{
                maxWidth: '1280px',
                margin: '0 auto',
                padding: '0 1rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                height: '100%',
                minHeight: '44px',
            }}>
                {/* Logo */}
                <Link to="/" style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                    <img src="/paramount-gs.png" alt="Paramount Gadget" style={{ height: '24px', width: 'auto' }} />
                </Link>

                {/* Desktop Categories */}
                <div style={{
                    display: 'none',
                    gap: '24px',
                    alignItems: 'center',
                    flex: 1,
                    justifyContent: 'center',
                    '@media (min-width: 1024px)': {
                        display: 'flex'
                    }
                }}>
                    {CATEGORIES.map(item => (
                        <Link
                            key={item}
                            to={`/?category=${item === 'Store' ? 'All' : item.toLowerCase()}`}
                            style={{
                                color: 'rgba(0, 0, 0, 0.8)',
                                fontSize: '12px',
                                fontWeight: '400',
                                opacity: 0.8,
                                transition: 'opacity 0.2s',
                            }}
                            onMouseEnter={e => e.currentTarget.style.opacity = '1'}
                            onMouseLeave={e => e.currentTarget.style.opacity = '0.8'}
                        >
                            {item}
                        </Link>
                    ))}
                </div>

                {/* Right Icons */}
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexShrink: 0 }}>
                    <button
                        onClick={() => navigate('/')}
                        style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            padding: '8px',
                            display: 'flex',
                            alignItems: 'center',
                            color: 'rgba(0, 0, 0, 0.8)',
                        }}
                    >
                        <Search size={16} />
                    </button>

                    {user?.role !== 'admin' && (
                        <div ref={bagRef} style={{ position: 'relative' }}>
                            <button
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    cursor: 'pointer',
                                    padding: '8px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    position: 'relative',
                                    color: 'rgba(0, 0, 0, 0.8)',
                                }}
                                onClick={() => setBagOpen(!bagOpen)}
                            >
                                <ShoppingBag size={16} />
                                {count > 0 && (
                                    <span style={{
                                        position: 'absolute',
                                        top: '-2px',
                                        right: '-2px',
                                        background: '#0066cc',
                                        color: '#fff',
                                        borderRadius: '50%',
                                        minWidth: '16px',
                                        height: '16px',
                                        fontSize: '9px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontWeight: '700',
                                        padding: '0 2px',
                                    }}>
                                        {count}
                                    </span>
                                )}
                            </button>

                            {bagOpen && (
                                <div style={{
                                    position: 'absolute',
                                    top: 'calc(100% + 8px)',
                                    right: 0,
                                    width: 'min(100vw, 320px)',
                                    background: '#fff',
                                    borderRadius: '12px',
                                    border: '1px solid #d2d2d7',
                                    padding: '16px',
                                    boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
                                    zIndex: 101,
                                    textAlign: 'left',
                                }}>
                                    <h4 style={{ color: '#6e6e73', fontSize: '13px', fontWeight: '600', marginBottom: '12px', marginTop: 0 }}>
                                        {count === 0 ? 'Your Bag is empty.' : `${count} item${count > 1 ? 's' : ''} in your bag`}
                                    </h4>

                                    {count === 0 ? (
                                        <Link to="/" onClick={() => setBagOpen(false)} style={{ color: '#0066cc', fontSize: '12px', display: 'block', marginBottom: '16px' }}>
                                            Shop Now
                                        </Link>
                                    ) : (
                                        <Link to="/cart" onClick={() => setBagOpen(false)} style={{
                                            display: 'block',
                                            width: '100%',
                                            background: '#0066cc',
                                            color: '#fff',
                                            textAlign: 'center',
                                            padding: '10px 0',
                                            borderRadius: '8px',
                                            fontSize: '13px',
                                            fontWeight: '400',
                                            marginBottom: '16px',
                                        }}>
                                            Review Bag
                                        </Link>
                                    )}

                                    <div style={{ borderTop: '1px solid #e8e8ed', paddingTop: '12px' }}>
                                        <h5 style={{ color: '#6e6e73', fontSize: '11px', fontWeight: '600', marginBottom: '8px', marginTop: 0, textTransform: 'uppercase' }}>My Profile</h5>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                            <Link to="/orders" onClick={() => setBagOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#111', fontSize: '12px', padding: '6px 0', borderBottom: '1px solid #f5f5f7' }}>
                                                <Package size={14} color="#8f8f94" /> Orders
                                            </Link>
                                            <Link to="/orders" onClick={() => setBagOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#111', fontSize: '12px', padding: '6px 0', borderBottom: '1px solid #f5f5f7' }}>
                                                <Heart size={14} color="#8f8f94" /> Saves
                                            </Link>
                                            {user ? (
                                                <button onClick={() => { handleLogout(); setBagOpen(false) }} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'none', border: 'none', padding: '6px 0', color: '#111', fontSize: '12px', cursor: 'pointer', textAlign: 'left' }}>
                                                    <LogOut size={14} color="#8f8f94" /> Sign out {user.name}
                                                </button>
                                            ) : (
                                                <Link to="/login" onClick={() => setBagOpen(false)} style={{ color: '#0066cc', fontSize: '12px', padding: '6px 0', display: 'block' }}>Sign in to your account</Link>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {user?.role === 'admin' && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <Link to="/admin" style={{ fontSize: '12px', fontWeight: '600', color: '#0066cc', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <Settings size={14} /> Dashboard
                            </Link>
                            <button onClick={handleLogout} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: '#0066cc', fontSize: '12px' }}>
                                <LogOut size={14} />
                            </button>
                        </div>
                    )}

                    {/* Mobile menu toggle */}
                    <button
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        style={{
                            display: 'none',
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            padding: '8px',
                            '@media (max-width: 1024px)': {
                                display: 'flex'
                            }
                        }}
                    >
                        {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
                    </button>
                </div>
            </div>

            {/* Mobile menu */}
            {mobileMenuOpen && (
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(2, 1fr)',
                    gap: '8px',
                    padding: '12px',
                    borderTop: '1px solid #d2d2d7',
                }}>
                    {CATEGORIES.map(item => (
                        <Link
                            key={item}
                            to={`/?category=${item === 'Store' ? 'All' : item.toLowerCase()}`}
                            onClick={() => setMobileMenuOpen(false)}
                            style={{
                                fontSize: '13px',
                                padding: '8px',
                                textAlign: 'center',
                                color: '#0066cc',
                                fontWeight: '500',
                            }}
                        >
                            {item}
                        </Link>
                    ))}
                </div>
            )}
        </nav>
    )
}