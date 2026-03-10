import { useCart } from '../context/CartContext'
import { useNavigate } from 'react-router-dom'
import { Trash2, Plus, Minus } from 'lucide-react'

const FF = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif'

export default function Cart() {
    const { cart, removeFromCart, updateQty, total } = useCart()
    const navigate = useNavigate()

    if (cart.length === 0) return (
        <div style={{
            backgroundColor: '#f5f5f7',
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 'clamp(1rem, 5vw, 2rem)',
            fontFamily: FF,
        }}>
            <p style={{ fontSize: 'clamp(2rem, 8vw, 3.5rem)', marginBottom: '16px' }}>🛒</p>
            <p style={{
                fontSize: 'clamp(1.25rem, 4vw, 1.75rem)',
                fontWeight: '700',
                color: '#111',
                marginBottom: '6px',
                textAlign: 'center',
            }}>
                Your bag is empty
            </p>
            <p style={{ color: '#6e6e73', fontSize: 'clamp(13px, 2vw, 14px)', marginBottom: '24px', textAlign: 'center' }}>
                Add items from the store to get started.
            </p>
            <button
                onClick={() => navigate('/')}
                style={{
                    background: '#0066cc',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '10px',
                    padding: 'clamp(10px, 2vw, 12px) clamp(20px, 4vw, 28px)',
                    cursor: 'pointer',
                    fontWeight: '700',
                    fontSize: 'clamp(13px, 2vw, 15px)',
                    transition: 'background 0.15s',
                }}
                onMouseEnter={e => e.currentTarget.style.background = '#0077ed'}
                onMouseLeave={e => e.currentTarget.style.background = '#0066cc'}
            >
                Shop Now
            </button>
        </div>
    )

    return (
        <div style={{ backgroundColor: '#f5f5f7', minHeight: '100vh', fontFamily: FF, paddingBottom: '60px' }}>
            <div style={{
                maxWidth: '800px',
                margin: '0 auto',
                padding: 'clamp(1.5rem, 4vw, 2rem)',
            }}>
                <h1 style={{
                    color: '#111',
                    fontSize: 'clamp(1.75rem, 5vw, 2.25rem)',
                    fontWeight: '800',
                    marginBottom: 'clamp(1.5rem, 4vw, 2rem)',
                    letterSpacing: '-0.02em',
                }}>
                    Shopping Bag
                </h1>

                {cart.map(item => (
                    <div key={item.product.id} style={{
                        background: '#fff',
                        border: '1px solid #d2d2d7',
                        borderRadius: '12px',
                        padding: 'clamp(12px, 3vw, 16px)',
                        marginBottom: '10px',
                        display: 'grid',
                        gridTemplateColumns: 'auto 1fr auto auto auto',
                        gap: 'clamp(8px, 2vw, 16px)',
                        alignItems: 'center',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                        flexWrap: 'wrap',
                    }}>
                        <img
                            src={item.product.image_url || 'https://via.placeholder.com/80'}
                            alt={item.product.name}
                            style={{
                                width: 'clamp(60px, 12vw, 80px)',
                                height: 'clamp(60px, 12vw, 80px)',
                                objectFit: 'contain',
                                borderRadius: '8px',
                                background: '#f5f5f7',
                                padding: '4px',
                                flexShrink: 0,
                            }}
                        />
                        <div style={{ minWidth: 0 }}>
                            <p style={{ color: '#111', fontWeight: '700', fontSize: 'clamp(13px, 2vw, 15px)', marginBottom: '3px' }}>
                                {item.product.name}
                            </p>
                            <p style={{ color: '#6e6e73', fontSize: 'clamp(11px, 2vw, 13px)' }}>
                                ₱{parseFloat(item.product.price).toLocaleString()} each
                            </p>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                            <button
                                onClick={() => updateQty(item.product.id, item.quantity - 1)}
                                style={{
                                    background: '#f5f5f7',
                                    border: '1px solid #d2d2d7',
                                    borderRadius: '6px',
                                    padding: '4px 8px',
                                    cursor: 'pointer',
                                    color: '#111',
                                    display: 'flex',
                                    alignItems: 'center',
                                    transition: 'all 0.15s',
                                }}
                                onMouseEnter={e => e.currentTarget.style.background = '#e8e8ed'}
                                onMouseLeave={e => e.currentTarget.style.background = '#f5f5f7'}
                            >
                                <Minus size={13} />
                            </button>
                            <span style={{ color: '#111', minWidth: '24px', textAlign: 'center', fontWeight: '700', fontSize: 'clamp(12px, 2vw, 15px)' }}>
                                {item.quantity}
                            </span>
                            <button
                                onClick={() => updateQty(item.product.id, item.quantity + 1)}
                                style={{
                                    background: '#f5f5f7',
                                    border: '1px solid #d2d2d7',
                                    borderRadius: '6px',
                                    padding: '4px 8px',
                                    cursor: 'pointer',
                                    color: '#111',
                                    display: 'flex',
                                    alignItems: 'center',
                                    transition: 'all 0.15s',
                                }}
                                onMouseEnter={e => e.currentTarget.style.background = '#e8e8ed'}
                                onMouseLeave={e => e.currentTarget.style.background = '#f5f5f7'}
                            >
                                <Plus size={13} />
                            </button>
                        </div>
                        <p style={{ color: '#111', fontWeight: '700', minWidth: '80px', textAlign: 'right', fontSize: 'clamp(12px, 2vw, 15px)' }}>
                            ₱{(parseFloat(item.product.price) * item.quantity).toLocaleString()}
                        </p>
                        <button
                            onClick={() => removeFromCart(item.product.id)}
                            style={{
                                background: 'rgba(192,57,43,0.08)',
                                border: '1px solid rgba(192,57,43,0.15)',
                                borderRadius: '6px',
                                padding: '6px',
                                cursor: 'pointer',
                                color: '#c0392b',
                                display: 'flex',
                                alignItems: 'center',
                                transition: 'all 0.15s',
                            }}
                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(192,57,43,0.15)'}
                            onMouseLeave={e => e.currentTarget.style.background = 'rgba(192,57,43,0.08)'}
                        >
                            <Trash2 size={14} />
                        </button>
                    </div>
                ))}

                <div style={{
                    background: '#fff',
                    border: '1px solid #d2d2d7',
                    borderRadius: '12px',
                    padding: 'clamp(1.5rem, 3vw, 24px)',
                    marginTop: '16px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                }}>
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '20px',
                    }}>
                        <span style={{ color: '#6e6e73', fontSize: 'clamp(14px, 2vw, 16px)', fontWeight: '500' }}>
                            Total
                        </span>
                        <span style={{
                            color: '#111',
                            fontSize: 'clamp(1.5rem, 4vw, 1.75rem)',
                            fontWeight: '800',
                            letterSpacing: '-0.02em',
                        }}>
                            ₱{total.toLocaleString()}
                        </span>
                    </div>
                    <button
                        onClick={() => navigate('/checkout')}
                        style={{
                            width: '100%',
                            background: '#0066cc',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '10px',
                            padding: 'clamp(12px, 2vw, 15px)',
                            fontWeight: '700',
                            fontSize: 'clamp(13px, 2vw, 16px)',
                            cursor: 'pointer',
                            transition: 'background 0.15s',
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = '#0077ed'}
                        onMouseLeave={e => e.currentTarget.style.background = '#0066cc'}
                    >
                        Proceed to Checkout
                    </button>
                </div>
            </div>
        </div>
    )
}