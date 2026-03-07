import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getProduct } from '../services/api'
import { useCart } from '../context/CartContext'
import toast from 'react-hot-toast'

export default function ProductDetail() {
    const { id } = useParams()
    const [product, setProduct] = useState(null)
    const [qty, setQty] = useState(1)
    const { addToCart } = useCart()
    const navigate = useNavigate()

    useEffect(() => {
        getProduct(id).then(r => setProduct(r.data)).catch(() => navigate('/'))
    }, [id])

    if (!product) return <p style={{ color: '#64748b', textAlign: 'center', padding: '4rem' }}>Loading...</p>

    return (
        <div style={{ maxWidth: '900px', margin: '0 auto', padding: '2rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                <img src={product.image_url || 'https://via.placeholder.com/400x300?text=No+Image'}
                    alt={product.name} style={{ width: '100%', borderRadius: '12px', objectFit: 'cover' }} />
                <div>
                    <p style={{ color: '#64748b', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px' }}>{product.category}</p>
                    <h1 style={{ color: '#fff', fontSize: '28px', fontWeight: '800', margin: '8px 0' }}>{product.name}</h1>
                    <p style={{ color: '#00e5ff', fontSize: '32px', fontWeight: '800', margin: '12px 0' }}>₱{parseFloat(product.price).toLocaleString()}</p>
                    <p style={{ color: '#94a3b8', lineHeight: '1.7', marginBottom: '20px' }}>{product.description}</p>
                    <p style={{ color: product.stock > 0 ? '#10b981' : '#ef4444', marginBottom: '16px', fontWeight: '600' }}>
                        {product.stock > 0 ? `✓ ${product.stock} in stock` : '✗ Out of stock'}
                    </p>
                    {product.stock > 0 && <>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                            <label style={{ color: '#94a3b8', fontSize: '14px' }}>Qty:</label>
                            <input type="number" min="1" max={product.stock} value={qty}
                                onChange={e => setQty(Number(e.target.value))}
                                style={{ width: '70px', background: '#0d0d14', border: '1px solid #1e1e2e', borderRadius: '6px', padding: '8px', color: '#fff', textAlign: 'center' }} />
                        </div>
                        <button onClick={() => { addToCart(product, qty); toast.success('Added to cart!') }}
                            style={{ width: '100%', background: '#00e5ff', color: '#000', border: 'none', borderRadius: '8px', padding: '14px', fontWeight: '800', fontSize: '16px', cursor: 'pointer' }}>
                            Add to Cart
                        </button>
                    </>}
                </div>
            </div>
        </div>
    )
}