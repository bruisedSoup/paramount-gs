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
    const [menuOpen, setMenuOpen] = useState(false)
    const [searchOpen, setSearchOpen] = useState(false)
    const [searchValue, setSearchValue] = useState('')
    const bagRef = useRef(null)
    const searchRef = useRef(null)
    const searchInputRef = useRef(null)

    const handleLogout = async () => {
        await logoutUser()
        toast.success('Logged out')
        navigate('/login')
    }

    const handleSearchSubmit = (e) => {
        e.preventDefault()
        const q = searchValue.trim()
        if (q) {
            navigate(`/?search=${encodeURIComponent(q)}`)
        } else {
            navigate('/')
        }
        setSearchOpen(false)
        setSearchValue('')
    }

    const openSearch = () => {
        setSearchOpen(true)
        setBagOpen(false)
        setTimeout(() => searchInputRef.current?.focus(), 50)
    }

    useEffect(() => {
        function handleClickOutside(event) {
            if (searchRef.current && !searchRef.current.contains(event.target)) {
                setSearchOpen(false)
            }
            if (bagRef.current && !bagRef.current.contains(event.target)) {
                setBagOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    useEffect(() => {
        const onResize = () => { if (window.innerWidth > 768) setMenuOpen(false) }
        window.addEventListener('resize', onResize)
        return () => window.removeEventListener('resize', onResize)
    }, [])

    useEffect(() => {
        const onKey = (e) => { if (e.key === 'Escape') { setSearchOpen(false); setSearchValue('') } }
        window.addEventListener('keydown', onKey)
        return () => window.removeEventListener('keydown', onKey)
    }, [])

    const nav = {
        background: '#fff',
        borderBottom: '1px solid #d2d2d7',
        height: '44px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        width: '100%',
        boxSizing: 'border-box',
        overflow: 'hidden',
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
        alignItems: 'center',
    }

    const LINKS = ['Store', 'Phones', 'Laptops', 'Tablets', 'Accessories', 'Audio', 'Cameras', 'Gaming']

    return (
        <>
            <style>{`
                .nav-links-desktop {
                    display: flex;
                    gap: 28px;
                    align-items: center;
                    flex: 1;
                    justify-content: center;
                }
                .nav-hamburger {
                    display: none;
                    background: none;
                    border: none;
                    cursor: pointer;
                    padding: 0;
                    color: rgba(0,0,0,0.8);
                    align-items: center;
                }
                .nav-mobile-dropdown {
                    display: none;
                    position: fixed;
                    top: 44px;
                    left: 0;
                    right: 0;
                    background: #fff;
                    border-bottom: 1px solid #d2d2d7;
                    z-index: 99;
                    padding: 8px 0 16px;
                    flex-direction: column;
                }
                .nav-mobile-dropdown.open {
                    display: flex;
                }
                .nav-mobile-link {
                    display: block;
                    padding: 11px 22px;
                    color: rgba(0,0,0,0.8);
                    text-decoration: none;
                    font-size: 14px;
                    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
                    font-weight: 400;
                    border: none;
                    background: none;
                    width: 100%;
                    text-align: left;
                    cursor: pointer;
                    transition: background 0.15s;
                    box-sizing: border-box;
                }
                .nav-mobile-link:hover { background: #f5f5f7; }
                .nav-mobile-divider {
                    height: 1px;
                    background: #e8e8ed;
                    margin: 8px 22px;
                }
                @media (max-width: 768px) {
                    .nav-links-desktop { display: none !important; }
                    .nav-hamburger { display: flex !important; }
                }
            `}</style>

            <nav style={nav}>
                <div style={containerStyle}>
                    <Link to="/" style={{ display: 'flex', alignItems: 'center' }} onClick={() => setMenuOpen(false)}>
                        <img src="/paramount-gs.png" alt="Paramount Gadgets" style={{ height: '24px' }} />
                    </Link>

                    {!searchOpen && (
                        <div className="nav-links-desktop">
                            {LINKS.map(item => (
                                <Link
                                    key={item}
                                    to={`/?category=${item === 'Store' ? 'All' : item.toLowerCase()}`}
                                    style={link}
                                >
                                    {item}
                                </Link>
                            ))}
                        </div>
                    )}

                    {searchOpen && (
                        <form
                            ref={searchRef}
                            onSubmit={handleSearchSubmit}
                            style={{
                                flex: 1,
                                display: 'flex',
                                alignItems: 'center',
                                margin: '0 20px',
                                background: '#e8e8ed',
                                borderRadius: '980px',
                                padding: '0 12px',
                                height: '28px',
                                gap: '6px',
                                overflow: 'hidden',
                            }}
                        >
                            <Search size={13} style={{ color: '#6e6e73', flexShrink: 0 }} />
                            <input
                                ref={searchInputRef}
                                type="text"
                                value={searchValue}
                                onChange={e => setSearchValue(e.target.value)}
                                placeholder="Search products…"
                                style={{
                                    flex: 1,
                                    background: 'none',
                                    border: 'none',
                                    outline: 'none',
                                    fontSize: '13px',
                                    color: '#111',
                                    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
                                }}
                            />
                            {searchValue && (
                                <button
                                    type="button"
                                    onClick={() => setSearchValue('')}
                                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', color: '#6e6e73' }}
                                >
                                    <X size={13} />
                                </button>
                            )}
                        </form>
                    )}

                    <div style={{ display: 'flex', gap: '20px', alignItems: 'center', position: 'relative' }}>
                        <button
                            className="nav-hamburger"
                            onClick={() => setMenuOpen(o => !o)}
                            aria-label="Toggle menu"
                        >
                            {menuOpen ? <X size={16} /> : <Menu size={16} />}
                        </button>

                        <button
                            onClick={searchOpen ? handleSearchSubmit : openSearch}
                            style={{ ...link, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                            aria-label="Search"
                        >
                            <Search size={14} style={{ opacity: 0.8 }} />
                        </button>

                        {user?.role !== 'admin' && (
                            <div ref={bagRef}>
                                <button
                                    style={{ ...link, background: 'none', border: 'none', cursor: 'pointer', position: 'relative', padding: 0 }}
                                    onClick={() => setBagOpen(!bagOpen)}
                                >
                                    <ShoppingBag size={14} style={{ opacity: 0.8 }} />
                                    {count > 0 && (
                                        <span style={{
                                            position: 'absolute', top: '-6px', right: '-8px',
                                            background: '#0066cc', color: '#fff',
                                            borderRadius: '50%', minWidth: '14px', height: '14px',
                                            fontSize: '9px', display: 'flex',
                                            alignItems: 'center', justifyContent: 'center',
                                            fontWeight: '700', padding: '0 2px',
                                        }}>
                                            {count}
                                        </span>
                                    )}
                                </button>

                                {bagOpen && (
                                    <div style={{
                                        position: 'absolute',
                                        top: '34px',
                                        right: '-30px',
                                        width: 'min(280px, calc(100vw - 32px))',
                                        background: '#fff',
                                        borderRadius: '18px',
                                        border: '1px solid #d2d2d7',
                                        padding: '20px',
                                        boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
                                        zIndex: 101,
                                        textAlign: 'left',
                                        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
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
                                                    display: 'block', width: '100%', background: '#0066cc', color: '#fff',
                                                    textAlign: 'center', padding: '12px 0', borderRadius: '12px',
                                                    textDecoration: 'none', fontSize: '14px', fontWeight: '400', boxSizing: 'border-box',
                                                }}>
                                                    Review Bag
                                                </Link>
                                            </div>
                                        )}

                                        <div style={{ borderTop: '1px solid #e8e8ed', paddingTop: '16px' }}>
                                            <h5 style={{ color: '#6e6e73', fontSize: '12px', fontWeight: '600', marginBottom: '12px', marginTop: 0 }}>My Profile</h5>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                <Link to="/orders" onClick={() => setBagOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#111', textDecoration: 'none', fontSize: '13px', padding: '8px 0', borderBottom: '1px solid #f5f5f7' }}>
                                                    <Package size={14} color="#8f8f94" /> Orders
                                                </Link>
                                                <Link to="/orders" onClick={() => setBagOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#111', textDecoration: 'none', fontSize: '13px', padding: '8px 0', borderBottom: '1px solid #f5f5f7' }}>
                                                    <Heart size={14} color="#8f8f94" /> Your Saves
                                                </Link>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#111', fontSize: '13px', padding: '8px 0', borderBottom: '1px solid #f5f5f7' }}>
                                                    <User size={14} color="#8f8f94" /> Account
                                                </div>
                                                {user ? (
                                                    <button onClick={() => { handleLogout(); setBagOpen(false) }} style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'none', border: 'none', padding: '8px 0', color: '#111', fontSize: '13px', cursor: 'pointer', textAlign: 'left' }}>
                                                        <LogOut size={14} color="#8f8f94" /> Sign out {user.name}
                                                    </button>
                                                ) : (
                                                    <Link to="/login" onClick={() => setBagOpen(false)} style={{ display: 'block', color: '#0066cc', textDecoration: 'none', fontSize: '13px', padding: '8px 0', marginTop: '4px' }}>
                                                        Sign in to your account
                                                    </Link>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {user?.role === 'admin' && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                <Link to="/admin" style={{ ...link, fontWeight: '600', color: '#0066cc' }}>
                                    <Settings size={14} style={{ marginRight: '6px' }} /> Dashboard
                                </Link>
                                <button onClick={handleLogout} style={{ ...link, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                                    <LogOut size={14} style={{ marginRight: '6px' }} /> Sign Out
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </nav>

            {/* Mobile dropdown menu */}
            <div className={`nav-mobile-dropdown${menuOpen ? ' open' : ''}`}>
                <form onSubmit={handleSearchSubmit} style={{ padding: '8px 22px 4px', display: 'flex', alignItems: 'center', gap: '8px', background: '#e8e8ed', margin: '0 22px 4px', borderRadius: '10px' }}>
                    <Search size={14} color="#6e6e73" />
                    <input
                        type="text"
                        value={searchValue}
                        onChange={e => setSearchValue(e.target.value)}
                        placeholder="Search products…"
                        style={{ flex: 1, background: 'none', border: 'none', outline: 'none', fontSize: '14px', color: '#111', padding: '8px 0', fontFamily: 'inherit' }}
                    />
                </form>
                {LINKS.map(item => (
                    <Link
                        key={item}
                        to={`/?category=${item === 'Store' ? 'All' : item.toLowerCase()}`}
                        className="nav-mobile-link"
                        onClick={() => setMenuOpen(false)}
                    >
                        {item}
                    </Link>
                ))}
                <div className="nav-mobile-divider" />
                {!user ? (
                    <>
                        <Link to="/login" className="nav-mobile-link" onClick={() => setMenuOpen(false)}>Sign In</Link>
                        <Link to="/register" className="nav-mobile-link" onClick={() => setMenuOpen(false)}>Create Account</Link>
                    </>
                ) : (
                    <>
                        <Link to="/orders" className="nav-mobile-link" onClick={() => setMenuOpen(false)}>My Orders</Link>
                        <button className="nav-mobile-link" onClick={() => { handleLogout(); setMenuOpen(false) }}>
                            Sign Out
                        </button>
                    </>
                )}
            </div>
        </>
    )
}