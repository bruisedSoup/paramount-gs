import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { createOrder } from '../services/api'
import toast from 'react-hot-toast'

const FF = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif'
const IS = {
    width: '100%', background: '#fff', border: '1px solid #d2d2d7',
    borderRadius: '10px', padding: '12px 14px', color: '#111',
    fontSize: '14px', outline: 'none', boxSizing: 'border-box',
    fontFamily: FF, resize: 'vertical', minHeight: '100px', lineHeight: '1.6',
    transition: 'border-color 0.2s',
}
const LS = { display: 'block', color: '#6e6e73', fontSize: '13px', marginBottom: '6px', fontWeight: '600' }

export default function Checkout() {
    const { cart, total, clearCart } = useCart()
    const [address, setAddress] = useState('')
    const [loading, setLoading] = useState(false)
    const navigate = useNavigate()

    if (cart.length === 0) {
        navigate('/cart')
        return null
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!address.trim()) return toast.error('Address is required')
        setLoading(true)
        try {
            await createOrder({
                items: cart.map(item => ({
                    product_id: item.product.id,
                    quantity: item.quantity,
                })),
                shipping_address: address,
            })
            toast.success('Order placed successfully!')
            clearCart()
            navigate('/orders')
        } catch (err) {
            toast.error(err.response?.data?.detail || 'Failed to place order')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div style={{ backgroundColor: '#f5f5f7', minHeight: '100vh', fontFamily: FF, paddingBottom: '60px' }}>
            <div style={{ maxWidth: '600px', margin: '0 auto', padding: '2rem' }}>
                <h1 style={{ color: '#111', fontSize: '32px', fontWeight: '800', marginBottom: '2rem', letterSpacing: '-0.02em' }}>
                    Checkout
                </h1>

                <div style={{
                    background: '#fff', border: '1px solid #d2d2d7',
                    borderRadius: '16px', padding: '28px',
                    boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
                }}>
                    {/* Order summary */}
                    <div style={{ marginBottom: '24px' }}>
                        <p style={{ color: '#6e6e73', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '12px' }}>
                            Order Summary ({cart.length} item{cart.length > 1 ? 's' : ''})
                        </p>
                        {cart.map(item => (
                            <div key={item.product.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #f5f5f7' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <img
                                        src={item.product.image_url}
                                        alt={item.product.name}
                                        style={{ width: '40px', height: '40px', objectFit: 'contain', borderRadius: '8px', background: '#f5f5f7', padding: '3px' }}
                                    />
                                    <div>
                                        <p style={{ color: '#111', fontSize: '13px', fontWeight: '600' }}>{item.product.name}</p>
                                        <p style={{ color: '#8f8f94', fontSize: '12px' }}>Qty: {item.quantity}</p>
                                    </div>
                                </div>
                                <p style={{ color: '#111', fontSize: '13px', fontWeight: '600' }}>₱{(parseFloat(item.product.price) * item.quantity).toLocaleString()}</p>
                            </div>
                        ))}
                    </div>

                    {/* Shipping address */}
                    <div style={{ marginBottom: '24px' }}>
                        <label style={LS}>Shipping Address</label>
                        <textarea
                            style={IS}
                            value={address}
                            onChange={e => setAddress(e.target.value)}
                            placeholder="Enter your full delivery address..."
                            onFocus={e => e.target.style.borderColor = '#0066cc'}
                            onBlur={e => e.target.style.borderColor = '#d2d2d7'}
                        />
                    </div>

                    {/* Total & CTA */}
                    <div style={{ borderTop: '1px solid #e8e8ed', paddingTop: '20px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <span style={{ color: '#6e6e73', fontSize: '16px', fontWeight: '500' }}>Order Total</span>
                            <span style={{ color: '#111', fontSize: '24px', fontWeight: '800', letterSpacing: '-0.02em' }}>
                                ₱{total.toLocaleString()}
                            </span>
                        </div>
                        <button
                            onClick={handleSubmit}
                            disabled={loading}
                            style={{
                                width: '100%', background: '#0066cc', color: '#fff',
                                border: 'none', borderRadius: '12px', padding: '15px',
                                fontWeight: '700', fontSize: '16px', cursor: 'pointer',
                                transition: 'background 0.15s',
                            }}
                            onMouseEnter={e => e.currentTarget.style.background = '#0077ed'}
                            onMouseLeave={e => e.currentTarget.style.background = '#0066cc'}
                        >
                            {loading ? 'Processing...' : 'Place Order'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}