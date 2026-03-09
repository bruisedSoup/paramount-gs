import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'
import toast from 'react-hot-toast'

export default function ProductGridCard({ product }) {
    const navigate = useNavigate()
    const { user } = useAuth()
    const { addToCart } = useCart()

    const handleAdminEdit = (e) => {
        e.preventDefault()
        e.stopPropagation()
        navigate(`/admin/products/${product.id}`)
    }

    const handleCustomerBuy = (e) => {
        e.preventDefault()
        e.stopPropagation()
        if (!user) {
            toast.error('Please sign in to purchase')
            navigate('/login')
            return
        }
        addToCart(product, 1)
        toast.success('Added to cart!')
    }

    return (
        <div
            onClick={() => navigate(`/products/${product.id}`)}
            style={{
                background: '#fff',
                borderRadius: '16px',
                overflow: 'hidden',
                boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                padding: '20px 20px 0 20px',
                height: '100%',
                cursor: 'pointer',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
            }}
            onMouseEnter={e => {
                e.currentTarget.style.transform = 'scale(1.02)'
                e.currentTarget.style.boxShadow = '0 8px 30px rgba(0,0,0,0.12)'
            }}
            onMouseLeave={e => {
                e.currentTarget.style.transform = 'scale(1)'
                e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.06)'
            }}
        >
            {/* Text block — top */}
            <div style={{ textAlign: 'left' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '4px', color: '#111', lineHeight: '1.2' }}>
                    {product.name}
                </h3>
                <p style={{
                    fontSize: '12px',
                    color: '#666',
                    marginBottom: '8px',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                    lineHeight: '1.4',
                    minHeight: '34px',
                }}>
                    {product.description || 'No description available.'}
                </p>
                <p style={{ fontSize: '13px', fontWeight: '600', color: '#111', marginBottom: '8px' }}>
                    From ₱{parseFloat(product.price).toLocaleString()}
                </p>
                {user?.role === 'admin' ? (
                    <button
                        onClick={handleAdminEdit}
                        style={{
                            background: 'none',
                            color: '#f59e0b',
                            border: 'none',
                            fontSize: '13px',
                            cursor: 'pointer',
                            padding: 0,
                            fontWeight: '600',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '2px',
                        }}
                    >
                        Edit ›
                    </button>
                ) : (
                    <button
                        onClick={handleCustomerBuy}
                        disabled={product.stock === 0}
                        style={{
                            background: 'none',
                            color: product.stock > 0 ? '#0066cc' : '#999',
                            border: 'none',
                            fontSize: '13px',
                            cursor: product.stock > 0 ? 'pointer' : 'not-allowed',
                            padding: 0,
                            fontWeight: '500',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '2px',
                        }}
                    >
                        {product.stock > 0 ? 'Buy ›' : 'Sold Out'}
                    </button>
                )}
            </div>

            {/* Image — bottom, no padding below */}
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-end', marginTop: '12px' }}>
                <img
                    src={product.image_url || 'https://via.placeholder.com/220x180?text=No+Image'}
                    alt={product.name}
                    style={{ width: '100%', maxHeight: '160px', objectFit: 'contain' }}
                />
            </div>
        </div>
    )
}