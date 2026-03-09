import { useCart } from '../context/CartContext'
import { useNavigate } from 'react-router-dom'
import { Trash2, Plus, Minus } from 'lucide-react'

const FF = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif'

export default function Cart() {
    const { cart, removeFromCart, updateQty, total } = useCart()
    const navigate = useNavigate()

    if (cart.length === 0) return (
        <div style={{
            backgroundColor: '#f5f5f7', minHeight: '100vh',
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            justifyContent: 'center', padding: '2rem', fontFamily: FF,
        }}>
            <p style={{ fontSize: '52px', marginBottom: '16px' }}>🛒</p>
            <p style={{ fontSize: '22px', fontWeight: '700', color: '#111', marginBottom: '6px' }}>Your bag is empty</p>
            <p style={{ color: '#6e6e73', fontSize: '14px', marginBottom: '24px' }}>Add items from the store to get started.</p>
            <button
                onClick={() => navigate('/')}
                style={{
                    background: '#0066cc', color: '#fff', border: 'none',
                    borderRadius: '12px', padding: '12px 28px',
                    cursor: 'pointer', fontWeight: '700', fontSize: '15px',
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
            <div style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem' }}>
                <h1 style={{ color: '#111', fontSize: '32px', fontWeight: '800', marginBottom: '2rem', letterSpacing: '-0.02em' }}>
                    Shopping Bag
                </h1>

                {cart.map(item => (
                    <div key={item.product.id} style={{
                        background: '#fff', border: '1px solid #d2d2d7',
                        borderRadius: '14px', padding: '16px', marginBottom: '10px',
                        display: 'flex', gap: '16px', alignItems: 'center',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                    }}>
                        <img
                            src={item.product.image_url || 'https://via.placeholder.com/80'}
                            alt={item.product.name}
                            style={{ width: '80px', height: '80px', objectFit: 'contain', borderRadius: '10px', background: '#f5f5f7', padding: '4px', flexShrink: 0 }}
                        />
                        <div style={{ flex: 1 }}>
                            <p style={{ color: '#111', fontWeight: '700', fontSize: '15px', marginBottom: '3px' }}>{item.product.name}</p>
                            <p style={{ color: '#6e6e73', fontSize: '13px' }}>₱{parseFloat(item.product.price).toLocaleString()} each</p>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <button
                                onClick={() => updateQty(item.product.id, item.quantity - 1)}
                                style={{ background: '#f5f5f7', border: '1px solid #d2d2d7', borderRadius: '8px', padding: '6px 10px', cursor: 'pointer', color: '#111', display: 'flex', alignItems: 'center' }}
                            >
                                <Minus size={13} />
                            </button>
                            <span style={{ color: '#111', width: '28px', textAlign: 'center', fontWeight: '700', fontSize: '15px' }}>{item.quantity}</span>
                            <button
                                onClick={() => updateQty(item.product.id, item.quantity + 1)}
                                style={{ background: '#f5f5f7', border: '1px solid #d2d2d7', borderRadius: '8px', padding: '6px 10px', cursor: 'pointer', color: '#111', display: 'flex', alignItems: 'center' }}
                            >
                                <Plus size={13} />
                            </button>
                        </div>
                        <p style={{ color: '#111', fontWeight: '700', width: '90px', textAlign: 'right', fontSize: '15px' }}>
                            ₱{(parseFloat(item.product.price) * item.quantity).toLocaleString()}
                        </p>
                        <button
                            onClick={() => removeFromCart(item.product.id)}
                            style={{ background: 'rgba(192,57,43,0.08)', border: '1px solid rgba(192,57,43,0.15)', borderRadius: '8px', padding: '7px', cursor: 'pointer', color: '#c0392b', display: 'flex', alignItems: 'center' }}
                        >
                            <Trash2 size={14} />
                        </button>
                    </div>
                ))}

                <div style={{
                    background: '#fff', border: '1px solid #d2d2d7',
                    borderRadius: '14px', padding: '24px', marginTop: '16px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                        <span style={{ color: '#6e6e73', fontSize: '16px', fontWeight: '500' }}>Total</span>
                        <span style={{ color: '#111', fontSize: '26px', fontWeight: '800', letterSpacing: '-0.02em' }}>
                            ₱{total.toLocaleString()}
                        </span>
                    </div>
                    <button
                        onClick={() => navigate('/checkout')}
                        style={{
                            width: '100%', background: '#0066cc', color: '#fff',
                            border: 'none', borderRadius: '12px', padding: '15px',
                            fontWeight: '700', fontSize: '16px', cursor: 'pointer',
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