import { useCart } from '../context/CartContext'
import { useNavigate } from 'react-router-dom'
import { Trash2, Plus, Minus } from 'lucide-react'

export default function Cart() {
    const { cart, removeFromCart, updateQty, total } = useCart()
    const navigate = useNavigate()

    if (cart.length === 0) return (
        <div style={{ textAlign: 'center', padding: '6rem 2rem', color: '#64748b' }}>
            <p style={{ fontSize: '48px' }}>🛒</p>
            <p style={{ fontSize: '20px', color: '#fff', marginBottom: '8px' }}>Your cart is empty</p>
            <button onClick={() => navigate('/')} style={{ background: '#00e5ff', color: '#000', border: 'none', borderRadius: '8px', padding: '10px 24px', cursor: 'pointer', fontWeight: '700', marginTop: '1rem' }}>Shop Now</button>
        </div>
    )

    return (
        <div style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem' }}>
            <h1 style={{ color: '#fff', fontSize: '28px', fontWeight: '800', marginBottom: '2rem' }}>Shopping Cart</h1>
            {cart.map(item => (
                <div key={item.product.id} style={{ background: '#111118', border: '1px solid #1e1e2e', borderRadius: '12px', padding: '16px', marginBottom: '12px', display: 'flex', gap: '16px', alignItems: 'center' }}>
                    <img src={item.product.image_url || 'https://via.placeholder.com/80'} alt={item.product.name}
                        style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '8px' }} />
                    <div style={{ flex: 1 }}>
                        <p style={{ color: '#fff', fontWeight: '700' }}>{item.product.name}</p>
                        <p style={{ color: '#00e5ff', fontWeight: '700' }}>₱{parseFloat(item.product.price).toLocaleString()}</p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <button onClick={() => updateQty(item.product.id, item.quantity - 1)} style={{ background: '#1e1e2e', border: 'none', borderRadius: '6px', padding: '6px', cursor: 'pointer', color: '#fff' }}><Minus size={14} /></button>
                        <span style={{ color: '#fff', width: '24px', textAlign: 'center', fontWeight: '700' }}>{item.quantity}</span>
                        <button onClick={() => updateQty(item.product.id, item.quantity + 1)} style={{ background: '#1e1e2e', border: 'none', borderRadius: '6px', padding: '6px', cursor: 'pointer', color: '#fff' }}><Plus size={14} /></button>
                    </div>
                    <p style={{ color: '#fff', fontWeight: '700', width: '80px', textAlign: 'right' }}>
                        ₱{(parseFloat(item.product.price) * item.quantity).toLocaleString()}
                    </p>
                    <button onClick={() => removeFromCart(item.product.id)} style={{ background: 'rgba(239,68,68,0.1)', border: 'none', borderRadius: '6px', padding: '6px', cursor: 'pointer', color: '#ef4444' }}><Trash2 size={14} /></button>
                </div>
            ))}
            <div style={{ background: '#111118', border: '1px solid #1e1e2e', borderRadius: '12px', padding: '24px', marginTop: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                    <span style={{ color: '#94a3b8', fontSize: '16px' }}>Total</span>
                    <span style={{ color: '#00e5ff', fontSize: '24px', fontWeight: '800' }}>₱{total.toLocaleString()}</span>
                </div>
                <button onClick={() => navigate('/checkout')} style={{ width: '100%', background: '#00e5ff', color: '#000', border: 'none', borderRadius: '8px', padding: '14px', fontWeight: '800', fontSize: '16px', cursor: 'pointer' }}>
                    Proceed to Checkout
                </button>
            </div>
        </div>
    )
}