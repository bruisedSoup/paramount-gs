import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { createOrder } from '../services/api'
import toast from 'react-hot-toast'

const IS = { width: '100%', background: '#0d0d14', border: '1px solid #1e1e2e', borderRadius: '8px', padding: '11px 14px', color: '#e2e8f0', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }
const LS = { display: 'block', color: '#94a3b8', fontSize: '13px', marginBottom: '6px', fontWeight: '600' }

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
            const orderData = {
                items: cart.map(item => ({
                    product: item.product.id,
                    quantity: item.quantity
                })),
                shipping_address: address,
                total_price: total
            }
            await createOrder(orderData)
            toast.success('Order placed successfully!')
            clearCart()
            navigate('/orders')
        } catch (err) {
            toast.error('Failed to place order')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div style={{ maxWidth: '600px', margin: '0 auto', padding: '2rem' }}>
            <h1 style={{ color: '#fff', fontSize: '28px', fontWeight: '800', marginBottom: '2rem' }}>Checkout</h1>
            <div style={{ background: '#111118', border: '1px solid #1e1e2e', borderRadius: '12px', padding: '24px' }}>
                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: '20px' }}>
                        <label style={LS}>Shipping Address</label>
                        <textarea
                            style={{ ...IS, minHeight: '100px', resize: 'vertical' }}
                            value={address}
                            onChange={e => setAddress(e.target.value)}
                            placeholder="Enter your full delivery address..."
                        />
                    </div>

                    <div style={{ borderTop: '1px solid #1e1e2e', paddingTop: '20px', marginTop: '20px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                            <span style={{ color: '#94a3b8' }}>Order Total</span>
                            <span style={{ color: '#00e5ff', fontSize: '20px', fontWeight: '800' }}>₱{total.toLocaleString()}</span>
                        </div>
                        <button
                            type="submit"
                            disabled={loading}
                            style={{ width: '100%', background: '#00e5ff', color: '#000', border: 'none', borderRadius: '8px', padding: '14px', fontWeight: '800', fontSize: '16px', cursor: 'pointer' }}
                        >
                            {loading ? 'Processing...' : 'Place Order'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
