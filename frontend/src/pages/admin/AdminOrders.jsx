import { useState, useEffect } from 'react'
import { getOrders, updateOrderStatus, getProductReviews, replyToReview } from '../../services/api'
import toast from 'react-hot-toast'
import { Star, MessageSquare, ChevronDown, ChevronUp, Send } from 'lucide-react'

const STATUSES = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled']
const STATUS_COLORS = {
    pending: '#f59e0b',
    confirmed: '#3b82f6',
    processing: '#7c3aed',
    shipped: '#06b6d4',
    delivered: '#10b981',
    cancelled: '#ef4444',
}

function StarDisplay({ value }) {
    return (
        <div style={{ display: 'flex', gap: '2px' }}>
            {[1, 2, 3, 4, 5].map(n => (
                <Star key={n} size={12} fill={value >= n ? '#f59e0b' : 'none'} color={value >= n ? '#f59e0b' : '#334155'} />
            ))}
        </div>
    )
}

function ProductReviewsPanel({ productId }) {
    const [data, setData] = useState(null)
    const [replies, setReplies] = useState({})
    const [posting, setPosting] = useState({})

    useEffect(() => {
        getProductReviews(productId).then(r => setData(r.data)).catch(() => { })
    }, [productId])

    const submitReply = async (reviewId) => {
        const body = replies[reviewId]?.trim()
        if (!body) return
        setPosting(p => ({ ...p, [reviewId]: true }))
        try {
            const { data: updated } = await replyToReview(reviewId, body)
            setData(prev => ({
                ...prev,
                reviews: prev.reviews.map(r => r.id === reviewId ? updated : r),
            }))
            setReplies(r => ({ ...r, [reviewId]: '' }))
            toast.success('Reply posted!')
        } catch {
            toast.error('Failed to post reply')
        } finally {
            setPosting(p => ({ ...p, [reviewId]: false }))
        }
    }

    if (!data) return <p style={{ color: '#475569', fontSize: '13px', padding: '12px 0' }}>Loading reviews...</p>
    if (data.total === 0) return <p style={{ color: '#475569', fontSize: '13px', padding: '12px 0' }}>No reviews for this product yet.</p>

    return (
        <div style={{ marginTop: '8px' }}>
            <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginBottom: '12px' }}>
                <span style={{ color: '#f59e0b', fontSize: '24px', fontWeight: '900' }}>{data.average.toFixed(1)}</span>
                <StarDisplay value={data.average} />
                <span style={{ color: '#475569', fontSize: '13px' }}>{data.total} review{data.total !== 1 ? 's' : ''}</span>
            </div>
            {data.reviews.map(review => (
                <div key={review.id} style={{ background: '#111118', border: '1px solid #1e1e2e', borderRadius: '8px', padding: '12px', marginBottom: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                        <p style={{ color: '#e2e8f0', fontWeight: '600', fontSize: '13px' }}>{review.user_name}</p>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <StarDisplay value={review.rating} />
                            <span style={{ color: '#334155', fontSize: '11px' }}>{new Date(review.created_at).toLocaleDateString()}</span>
                        </div>
                    </div>
                    {review.body && <p style={{ color: '#94a3b8', fontSize: '13px', lineHeight: '1.5', marginBottom: '8px' }}>{review.body}</p>}
                    {review.reply ? (
                        <div style={{ background: '#0d0d14', borderRadius: '6px', padding: '8px 12px', borderLeft: '3px solid #00e5ff' }}>
                            <p style={{ color: '#00e5ff', fontSize: '11px', fontWeight: '700', marginBottom: '2px' }}>⚡ You replied:</p>
                            <p style={{ color: '#94a3b8', fontSize: '13px' }}>{review.reply.body}</p>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                            <input
                                value={replies[review.id] || ''}
                                onChange={e => setReplies(r => ({ ...r, [review.id]: e.target.value }))}
                                onKeyDown={e => e.key === 'Enter' && submitReply(review.id)}
                                placeholder="Reply to this review..."
                                style={{ flex: 1, background: '#0d0d14', border: '1px solid #1e1e2e', borderRadius: '6px', padding: '7px 10px', color: '#e2e8f0', fontSize: '13px', outline: 'none' }}
                            />
                            <button onClick={() => submitReply(review.id)} disabled={posting[review.id]}
                                style={{ background: '#00e5ff', color: '#000', border: 'none', borderRadius: '6px', padding: '7px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                                <Send size={13} />
                            </button>
                        </div>
                    )}
                </div>
            ))}
        </div>
    )
}

export default function AdminOrders() {
    const [orders, setOrders] = useState([])
    const [loading, setLoading] = useState(true)
    const [savingId, setSavingId] = useState(null)
    const [pendingStatus, setPending] = useState({})
    const [expanded, setExpanded] = useState({})

    useEffect(() => {
        getOrders()
            .then(r => setOrders(r.data))
            .finally(() => setLoading(false))
    }, [])

    const handleStatusChange = (orderId, newStatus) => {
        setPending(p => ({ ...p, [orderId]: newStatus }))
    }

    const saveStatus = async (orderId) => {
        const newStatus = pendingStatus[orderId]
        if (!newStatus) return
        setSavingId(orderId)
        try {
            await updateOrderStatus(orderId, newStatus)
            setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o))
            setPending(p => { const n = { ...p }; delete n[orderId]; return n })
            toast.success('Status updated!')
        } catch (err) {
            toast.error(err.response?.data?.detail || 'Failed to update status')
        } finally {
            setSavingId(null)
        }
    }

    const toggleExpand = (orderId) => setExpanded(e => ({ ...e, [orderId]: !e[orderId] }))

    if (loading) return (
        <div style={{ textAlign: 'center', padding: '6rem', color: '#64748b' }}>
            <div style={{ width: '36px', height: '36px', border: '3px solid #1e1e2e', borderTop: '3px solid #00e5ff', borderRadius: '50%', margin: '0 auto 12px', animation: 'spin 1s linear infinite' }} />
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
            Loading orders...
        </div>
    )

    return (
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem' }}>
            <h1 style={{ color: '#fff', fontSize: '28px', fontWeight: '800', marginBottom: '2rem' }}>All Orders</h1>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {orders.map(order => {
                    const currentDisplay = pendingStatus[order.id] || order.status
                    const isDirty = pendingStatus[order.id] && pendingStatus[order.id] !== order.status
                    const isExpanded = expanded[order.id]

                    return (
                        <div key={order.id} style={{ background: '#111118', border: '1px solid #1e1e2e', borderRadius: '12px', overflow: 'hidden' }}>
                            {/* Order header */}
                            <div style={{ padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
                                <div>
                                    <p style={{ color: '#fff', fontWeight: '700', fontSize: '16px' }}>Order #{order.id.slice(-8).toUpperCase()}</p>
                                    <p style={{ color: '#94a3b8', fontSize: '14px', marginTop: '2px' }}>{order.user_name} — {order.user_email}</p>
                                    <p style={{ color: '#475569', fontSize: '13px', marginTop: '2px' }}>{new Date(order.created_at).toLocaleString()}</p>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                                    <p style={{ color: '#00e5ff', fontWeight: '800', fontSize: '20px' }}>₱{parseFloat(order.total_price).toLocaleString()}</p>
                                    {/* Status update controls */}
                                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                        <select
                                            value={currentDisplay}
                                            onChange={e => handleStatusChange(order.id, e.target.value)}
                                            style={{
                                                background: '#0d0d14',
                                                border: `1px solid ${STATUS_COLORS[currentDisplay]}`,
                                                borderRadius: '6px',
                                                color: STATUS_COLORS[currentDisplay],
                                                padding: '6px 10px',
                                                cursor: 'pointer',
                                                fontSize: '13px',
                                                fontWeight: '700',
                                                outline: 'none',
                                            }}>
                                            {STATUSES.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                                        </select>
                                        {isDirty && (
                                            <button
                                                onClick={() => saveStatus(order.id)}
                                                disabled={savingId === order.id}
                                                style={{ background: '#00e5ff', color: '#000', border: 'none', borderRadius: '6px', padding: '6px 14px', cursor: 'pointer', fontWeight: '800', fontSize: '13px' }}>
                                                {savingId === order.id ? '...' : 'Save'}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Items */}
                            <div style={{ padding: '0 24px 16px', borderTop: '1px solid #1a1a24' }}>
                                <div style={{ paddingTop: '14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    {order.items.map((item, idx) => (
                                        <div key={idx} style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                            <img src={item.product_image || 'https://via.placeholder.com/40'} alt={item.product_name}
                                                style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '6px', flexShrink: 0 }} />
                                            <span style={{ color: '#94a3b8', fontSize: '14px', flex: 1 }}>{item.product_name} × {item.quantity}</span>
                                            <span style={{ color: '#00e5ff', fontSize: '14px', fontWeight: '600' }}>₱{(parseFloat(item.price_at_purchase) * item.quantity).toLocaleString()}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Shipping address */}
                            {order.shipping_address && (
                                <div style={{ padding: '8px 24px 12px', borderTop: '1px solid #1a1a24' }}>
                                    <p style={{ color: '#334155', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '2px' }}>Ship to</p>
                                    <p style={{ color: '#64748b', fontSize: '13px' }}>{order.shipping_address}</p>
                                </div>
                            )}

                            {/* Reviews panel toggle */}
                            <div style={{ borderTop: '1px solid #1a1a24' }}>
                                <button onClick={() => toggleExpand(order.id)}
                                    style={{ width: '100%', background: 'none', border: 'none', padding: '12px 24px', color: '#475569', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: '600' }}>
                                    <Star size={13} color='#f59e0b' fill='#f59e0b' />
                                    Product Reviews
                                    {isExpanded ? <ChevronUp size={13} style={{ marginLeft: 'auto' }} /> : <ChevronDown size={13} style={{ marginLeft: 'auto' }} />}
                                </button>
                                {isExpanded && (
                                    <div style={{ padding: '4px 24px 20px', background: '#0d0d14' }}>
                                        {order.items.map((item, idx) => (
                                            <div key={idx} style={{ marginBottom: idx < order.items.length - 1 ? '20px' : 0 }}>
                                                <p style={{ color: '#64748b', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px', paddingTop: '12px' }}>
                                                    {item.product_name}
                                                </p>
                                                <ProductReviewsPanel productId={item.product_id} />
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}