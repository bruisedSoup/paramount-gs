import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'
import toast from 'react-hot-toast'
import AuthPromptModal from './modals/AuthPromptModal'

export default function ProductGridCard({ product }) {
    const navigate = useNavigate()
    const { user } = useAuth()
    const { addToCart } = useCart()
    const [showAuthModal, setShowAuthModal] = useState(false)

    const handleCustomerBuy = (e) => {
        e.preventDefault()
        e.stopPropagation()
        if (!user) {
            setShowAuthModal(true)
            return
        }
        addToCart(product, 1)
        toast.success('Added to cart!')
    }

    return (
        <>
            {showAuthModal && <AuthPromptModal onClose={() => setShowAuthModal(false)} />}

            <div
                onClick={() => {
                    if (user?.role === 'admin') {
                        navigate(`/admin/products/${product.id}`)
                    } else {
                        navigate(`/products/${product.id}`)
                    }
                }}
                style={{
                    background: '#fff',
                    borderRadius: 'var(--radius)',
                    overflow: 'hidden',
                    boxShadow: 'var(--shadow-sm)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    padding: 'clamp(12px, 3vw, 20px)',
                    height: '100%',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    border: '1px solid transparent',
                }}
                onMouseEnter={e => {
                    e.currentTarget.style.transform = 'scale(1.02)'
                    e.currentTarget.style.boxShadow = 'var(--shadow-md)'
                    e.currentTarget.style.borderColor = '#d2d2d7'
                }}
                onMouseLeave={e => {
                    e.currentTarget.style.transform = 'scale(1)'
                    e.currentTarget.style.boxShadow = 'var(--shadow-sm)'
                    e.currentTarget.style.borderColor = 'transparent'
                }}
            >
                {/* Text block — top */}
                <div style={{ textAlign: 'left' }}>
                    <h4 style={{
                        fontSize: 'clamp(13px, 2.5vw, 16px)',
                        fontWeight: '700',
                        marginBottom: '4px',
                        color: '#111',
                        lineHeight: '1.2',
                    }}>
                        {product.name}
                    </h4>
                    <p style={{
                        fontSize: 'clamp(11px, 2vw, 13px)',
                        color: '#666',
                        marginBottom: '8px',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        lineHeight: '1.4',
                        minHeight: '28px',
                    }}>
                        {product.description || 'No description available.'}
                    </p>
                    <p style={{
                        fontSize: 'clamp(12px, 2.5vw, 13px)',
                        fontWeight: '600',
                        color: '#111',
                        marginBottom: '8px',
                    }}>
                        From ₱{parseFloat(product.price).toLocaleString()}
                    </p>
                    {user?.role !== 'admin' && (
                        <button
                            onClick={handleCustomerBuy}
                            disabled={product.stock === 0}
                            style={{
                                background: 'none',
                                color: product.stock > 0 ? '#0066cc' : '#999',
                                border: 'none',
                                fontSize: 'clamp(11px, 2vw, 13px)',
                                cursor: product.stock > 0 ? 'pointer' : 'not-allowed',
                                padding: 0,
                                fontWeight: '500',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '2px',
                                transition: 'color 0.15s',
                            }}
                            onMouseEnter={e => {
                                if (product.stock > 0) e.target.style.color = '#0077ed'
                            }}
                            onMouseLeave={e => {
                                if (product.stock > 0) e.target.style.color = '#0066cc'
                            }}
                        >
                            {product.stock > 0 ? 'Buy ›' : 'Sold Out'}
                        </button>
                    )}
                </div>

                {/* Image — bottom, no padding below */}
                <div style={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'flex-end',
                    marginTop: 'clamp(8px, 2vw, 12px)',
                }}>
                    <img
                        src={product.image_url || 'https://via.placeholder.com/220x180?text=No+Image'}
                        alt={product.name}
                        loading="lazy"
                        decoding="async"
                        style={{
                            width: '100%',
                            maxHeight: 'clamp(100px, 20vw, 160px)',
                            objectFit: 'contain',
                        }}
                    />
                </div>
            </div>
        </>
    )
}