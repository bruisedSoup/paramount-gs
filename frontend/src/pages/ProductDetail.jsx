import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getProduct, getProductReviews, getProductUpdates, commentOnUpdate } from '../services/api'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'
import { Star, MessageCircle, ChevronDown, ChevronUp, Send } from 'lucide-react'

function StarDisplay({ value, size = 16 }) {
    return (
        <div style={{ display: 'flex', gap: '2px' }}>
            {[1, 2, 3, 4, 5].map(n => (
                <Star key={n} size={size}
                    fill={value >= n ? '#f59e0b' : value >= n - 0.5 ? '#f59e0b' : 'none'}
                    color={value >= n ? '#f59e0b' : '#334155'}
                />
            ))}
        </div>
    )
}

function RatingStats({ total, average, distribution }) {
    return (
        <div style={{ background: '#0d0d14', borderRadius: '12px', padding: '20px', marginBottom: '24px', border: '1px solid #1e1e2e' }}>
            <div style={{ display: 'flex', gap: '32px', alignItems: 'center', flexWrap: 'wrap' }}>
                {/* Big average */}
                <div style={{ textAlign: 'center', minWidth: '80px' }}>
                    <p style={{ color: '#f59e0b', fontSize: '48px', fontWeight: '900', lineHeight: 1 }}>{average.toFixed(1)}</p>
                    <StarDisplay value={average} size={14} />
                    <p style={{ color: '#475569', fontSize: '12px', marginTop: '6px' }}>{total} review{total !== 1 ? 's' : ''}</p>
                </div>
                {/* Distribution bars */}
                <div style={{ flex: 1, minWidth: '200px' }}>
                    {[5, 4, 3, 2, 1].map(star => {
                        const count = distribution[star] || 0
                        const pct = total ? (count / total) * 100 : 0
                        return (
                            <div key={star} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                                <span style={{ color: '#64748b', fontSize: '12px', width: '8px' }}>{star}</span>
                                <Star size={11} fill='#f59e0b' color='#f59e0b' />
                                <div style={{ flex: 1, height: '6px', background: '#1e1e2e', borderRadius: '3px', overflow: 'hidden' }}>
                                    <div style={{ width: `${pct}%`, height: '100%', background: '#f59e0b', borderRadius: '3px', transition: 'width 0.5s ease' }} />
                                </div>
                                <span style={{ color: '#475569', fontSize: '12px', width: '20px', textAlign: 'right' }}>{count}</span>
                            </div>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}

function ReviewCard({ review }) {
    return (
        <div style={{ background: '#0d0d14', border: '1px solid #1e1e2e', borderRadius: '10px', padding: '16px', marginBottom: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                <div>
                    <p style={{ color: '#fff', fontWeight: '700', fontSize: '14px' }}>{review.user_name}</p>
                    <p style={{ color: '#475569', fontSize: '12px' }}>{new Date(review.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</p>
                </div>
                <StarDisplay value={review.rating} size={13} />
            </div>
            {review.body && <p style={{ color: '#94a3b8', fontSize: '14px', lineHeight: '1.6', marginBottom: review.reply ? '12px' : 0 }}>{review.body}</p>}
            {review.reply && (
                <div style={{ background: '#111118', border: '1px solid #1e293b', borderRadius: '8px', padding: '12px', marginTop: '10px', borderLeft: '3px solid #00e5ff' }}>
                    <p style={{ color: '#00e5ff', fontSize: '12px', fontWeight: '700', marginBottom: '4px' }}>⚡ {review.reply.admin_name} · Admin</p>
                    <p style={{ color: '#94a3b8', fontSize: '14px', lineHeight: '1.6' }}>{review.reply.body}</p>
                </div>
            )}
        </div>
    )
}

function UpdateCard({ update, user }) {
    const [expanded, setExpanded] = useState(false)
    const [comment, setComment] = useState('')
    const [posting, setPosting] = useState(false)
    const [localUpdate, setLocalUpdate] = useState(update)

    const submitComment = async () => {
        if (!comment.trim()) return
        setPosting(true)
        try {
            const { data } = await commentOnUpdate(update.id, comment)
            setLocalUpdate(data)
            setComment('')
            toast.success('Comment posted!')
        } catch {
            toast.error('Failed to post comment')
        } finally {
            setPosting(false)
        }
    }

    return (
        <div style={{ background: '#0d0d14', border: '1px solid #1e1e2e', borderRadius: '10px', padding: '16px', marginBottom: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                <div>
                    <span style={{ background: 'rgba(0,229,255,0.1)', color: '#00e5ff', fontSize: '11px', fontWeight: '700', padding: '2px 8px', borderRadius: '4px', marginBottom: '8px', display: 'inline-block' }}>
                        ⚡ {localUpdate.admin_name}
                    </span>
                    <h4 style={{ color: '#fff', fontWeight: '700', fontSize: '15px', margin: '6px 0 4px' }}>{localUpdate.title}</h4>
                    <p style={{ color: '#475569', fontSize: '12px' }}>{new Date(localUpdate.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                </div>
            </div>
            <p style={{ color: '#94a3b8', fontSize: '14px', lineHeight: '1.7', marginBottom: '12px' }}>{localUpdate.body}</p>

            {/* Comments toggle */}
            <button onClick={() => setExpanded(e => !e)}
                style={{ background: 'none', border: 'none', color: '#475569', cursor: 'pointer', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <MessageCircle size={13} />
                {localUpdate.comments.length} comment{localUpdate.comments.length !== 1 ? 's' : ''}
                {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
            </button>

            {expanded && (
                <div style={{ marginTop: '12px', borderTop: '1px solid #1e1e2e', paddingTop: '12px' }}>
                    {localUpdate.comments.map((c, idx) => (
                        <div key={idx} style={{ marginBottom: '10px', padding: '10px', background: '#111118', borderRadius: '8px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                <p style={{ color: '#e2e8f0', fontSize: '13px', fontWeight: '600' }}>{c.user_name}</p>
                                <p style={{ color: '#334155', fontSize: '11px' }}>{new Date(c.created_at).toLocaleDateString()}</p>
                            </div>
                            <p style={{ color: '#94a3b8', fontSize: '13px', lineHeight: '1.5' }}>{c.body}</p>
                        </div>
                    ))}

                    {user && (
                        <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                            <input
                                value={comment}
                                onChange={e => setComment(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && submitComment()}
                                placeholder="Write a comment..."
                                style={{ flex: 1, background: '#111118', border: '1px solid #1e1e2e', borderRadius: '8px', padding: '8px 12px', color: '#e2e8f0', fontSize: '13px', outline: 'none' }}
                            />
                            <button onClick={submitComment} disabled={posting}
                                style={{ background: '#00e5ff', color: '#000', border: 'none', borderRadius: '8px', padding: '8px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                                <Send size={14} />
                            </button>
                        </div>
                    )}
                    {!user && <p style={{ color: '#475569', fontSize: '12px', marginTop: '8px' }}>Log in to comment</p>}
                </div>
            )}
        </div>
    )
}

export default function ProductDetail() {
    const { id } = useParams()
    const [product, setProduct] = useState(null)
    const [qty, setQty] = useState(1)
    const [reviewData, setReviewData] = useState(null)
    const [updates, setUpdates] = useState([])
    const [section, setSection] = useState('reviews') // 'reviews' | 'updates'
    const { addToCart } = useCart()
    const { user } = useAuth()
    const navigate = useNavigate()

    useEffect(() => {
        getProduct(id).then(r => setProduct(r.data)).catch(() => navigate('/'))
        getProductReviews(id).then(r => setReviewData(r.data)).catch(() => { })
        getProductUpdates(id).then(r => setUpdates(r.data)).catch(() => { })
    }, [id])

    if (!product) return (
        <div style={{ textAlign: 'center', padding: '6rem', color: '#64748b' }}>
            <div style={{ width: '36px', height: '36px', border: '3px solid #1e1e2e', borderTop: '3px solid #00e5ff', borderRadius: '50%', margin: '0 auto 12px', animation: 'spin 1s linear infinite' }} />
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
    )

    return (
        <div style={{ maxWidth: '960px', margin: '0 auto', padding: '2rem' }}>
            {/* Product info */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2.5rem', marginBottom: '3rem' }}>
                <img src={product.image_url || 'https://via.placeholder.com/480x360?text=No+Image'}
                    alt={product.name}
                    style={{ width: '100%', borderRadius: '14px', objectFit: 'cover', aspectRatio: '4/3', border: '1px solid #1e1e2e' }} />
                <div>
                    <p style={{ color: '#475569', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1.5px', fontWeight: '700' }}>{product.category}</p>
                    <h1 style={{ color: '#fff', fontSize: '28px', fontWeight: '900', margin: '8px 0 4px', lineHeight: 1.2 }}>{product.name}</h1>

                    {/* Inline rating summary */}
                    {reviewData && reviewData.total > 0 && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                            <StarDisplay value={reviewData.average} size={14} />
                            <span style={{ color: '#f59e0b', fontWeight: '700', fontSize: '14px' }}>{reviewData.average.toFixed(1)}</span>
                            <span style={{ color: '#475569', fontSize: '13px' }}>({reviewData.total} reviews)</span>
                        </div>
                    )}

                    <p style={{ color: '#00e5ff', fontSize: '34px', fontWeight: '900', margin: '12px 0' }}>₱{parseFloat(product.price).toLocaleString()}</p>
                    <p style={{ color: '#94a3b8', lineHeight: '1.7', marginBottom: '20px', fontSize: '14px' }}>{product.description}</p>
                    <p style={{ color: product.stock > 0 ? '#10b981' : '#ef4444', marginBottom: '16px', fontWeight: '700', fontSize: '14px' }}>
                        {product.stock > 0 ? `✓ ${product.stock} in stock` : '✗ Out of stock'}
                    </p>
                    {product.stock > 0 && <>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                            <label style={{ color: '#64748b', fontSize: '13px', fontWeight: '700' }}>QTY</label>
                            <div style={{ display: 'flex', alignItems: 'center', background: '#0d0d14', border: '1px solid #1e1e2e', borderRadius: '8px', overflow: 'hidden' }}>
                                <button onClick={() => setQty(q => Math.max(1, q - 1))}
                                    style={{ background: 'none', border: 'none', color: '#94a3b8', padding: '8px 14px', cursor: 'pointer', fontSize: '16px' }}>−</button>
                                <span style={{ color: '#fff', fontWeight: '700', padding: '0 8px', minWidth: '32px', textAlign: 'center' }}>{qty}</span>
                                <button onClick={() => setQty(q => Math.min(product.stock, q + 1))}
                                    style={{ background: 'none', border: 'none', color: '#94a3b8', padding: '8px 14px', cursor: 'pointer', fontSize: '16px' }}>+</button>
                            </div>
                        </div>
                        <button onClick={() => { addToCart(product, qty); toast.success('Added to cart!') }}
                            style={{ width: '100%', background: '#00e5ff', color: '#000', border: 'none', borderRadius: '10px', padding: '14px', fontWeight: '900', fontSize: '16px', cursor: 'pointer', letterSpacing: '0.5px' }}>
                            Add to Cart
                        </button>
                    </>}
                </div>
            </div>

            {/* Section tabs */}
            <div style={{ display: 'flex', gap: '0', marginBottom: '24px', borderBottom: '1px solid #1e1e2e' }}>
                {[
                    { key: 'reviews', label: `Reviews${reviewData ? ` (${reviewData.total})` : ''}` },
                    { key: 'updates', label: `Product Updates${updates.length ? ` (${updates.length})` : ''}` },
                ].map(tab => (
                    <button key={tab.key} onClick={() => setSection(tab.key)}
                        style={{
                            background: 'none', border: 'none', borderBottom: section === tab.key ? '2px solid #00e5ff' : '2px solid transparent',
                            color: section === tab.key ? '#fff' : '#475569', padding: '12px 20px',
                            cursor: 'pointer', fontWeight: '700', fontSize: '14px', marginBottom: '-1px',
                            transition: 'all 0.2s',
                        }}>
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Reviews section */}
            {section === 'reviews' && (
                <div>
                    {reviewData && reviewData.total > 0 ? (
                        <>
                            <RatingStats {...reviewData} />
                            {reviewData.reviews.map(r => <ReviewCard key={r.id} review={r} />)}
                        </>
                    ) : (
                        <div style={{ textAlign: 'center', padding: '3rem', color: '#475569' }}>
                            <p style={{ fontSize: '36px', marginBottom: '12px' }}>⭐</p>
                            <p style={{ color: '#fff', fontWeight: '600', marginBottom: '4px' }}>No reviews yet</p>
                            <p style={{ fontSize: '14px' }}>Be the first to review this product after purchase</p>
                        </div>
                    )}
                </div>
            )}

            {/* Product updates section */}
            {section === 'updates' && (
                <div>
                    {updates.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '3rem', color: '#475569' }}>
                            <p style={{ fontSize: '36px', marginBottom: '12px' }}>📢</p>
                            <p style={{ color: '#fff', fontWeight: '600', marginBottom: '4px' }}>No updates yet</p>
                            <p style={{ fontSize: '14px' }}>Check back for product news and announcements</p>
                        </div>
                    ) : (
                        updates.map(u => <UpdateCard key={u.id} update={u} user={user} />)
                    )}
                </div>
            )}
        </div>
    )
}