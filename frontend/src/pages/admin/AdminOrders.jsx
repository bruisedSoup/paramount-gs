import { useState, useEffect } from 'react'
import { getOrders, updateOrderStatus, getProductReviews, replyToReview } from '../../services/api'
import toast from 'react-hot-toast'
import { Star, MessageSquare, ChevronDown, ChevronUp, Send, Search } from 'lucide-react'

const STATUSES = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled']
const STATUS_COLORS = {
    pending: '#f59e0b',
    confirmed: '#3b82f6',
    processing: '#7c3aed',
    shipped: '#0066cc',
    delivered: '#34c759',
    cancelled: '#ef4444',
}

const T = {
    bg: '#f5f5f7',
    card: '#ffffff',
    border: '#d2d2d7',
    text: '#111111',
    subtext: '#6e6e73',
    muted: '#8f8f94',
    accent: '#0066cc',
    accentHover: '#0077ed',
    accent2: '#34c759',
}

function StarDisplay({ value }) {
    return (
        <div style={{ display: 'flex', gap: '2px' }}>
            {[1, 2, 3, 4, 5].map(n => (
                <Star key={n} size={12} fill={value >= n ? '#f59e0b' : 'none'} color={value >= n ? '#f59e0b' : T.muted} />
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

    if (!data) return <p style={{ color: T.muted, fontSize: '13px', padding: '12px 0' }}>Loading reviews...</p>
    if (data.total === 0) return <p style={{ color: T.muted, fontSize: '13px', padding: '12px 0' }}>No reviews for this product yet.</p>

    return (
        <div style={{ marginTop: '8px' }}>
            <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginBottom: '12px' }}>
                <span style={{ color: '#f59e0b', fontSize: '24px', fontWeight: '900' }}>{data.average.toFixed(1)}</span>
                <StarDisplay value={data.average} />
                <span style={{ color: T.subtext, fontSize: '13px' }}>{data.total} review{data.total !== 1 ? 's' : ''}</span>
            </div>
            {data.reviews.map(review => (
                <div key={review.id} style={{ background: T.bg, border: `1px solid ${T.border}`, borderRadius: '8px', padding: '12px', marginBottom: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                        <p style={{ color: T.text, fontWeight: '600', fontSize: '13px' }}>{review.user_name}</p>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <StarDisplay value={review.rating} />
                            <span style={{ color: T.muted, fontSize: '11px' }}>{new Date(review.created_at).toLocaleDateString()}</span>
                        </div>
                    </div>
                    {review.body && <p style={{ color: T.subtext, fontSize: '13px', lineHeight: '1.5', marginBottom: '8px' }}>{review.body}</p>}
                    {review.reply ? (
                        <div style={{ background: 'rgba(0, 102, 204, 0.05)', borderRadius: '6px', padding: '8px 12px', borderLeft: `3px solid ${T.accent}` }}>
                            <p style={{ color: T.accent, fontSize: '11px', fontWeight: '700', marginBottom: '2px' }}>⚡ You replied:</p>
                            <p style={{ color: T.subtext, fontSize: '13px' }}>{review.reply.body}</p>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                            <input
                                value={replies[review.id] || ''}
                                onChange={e => setReplies(r => ({ ...r, [review.id]: e.target.value }))}
                                onKeyDown={e => e.key === 'Enter' && submitReply(review.id)}
                                placeholder="Reply to this review..."
                                style={{ flex: 1, background: T.card, border: `1px solid ${T.border}`, borderRadius: '6px', padding: '7px 10px', color: T.text, fontSize: '13px', outline: 'none' }}
                            />
                            <button onClick={() => submitReply(review.id)} disabled={posting[review.id]}
                                style={{ background: T.accent, color: '#fff', border: 'none', borderRadius: '6px', padding: '7px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
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
    const [filteredOrders, setFilteredOrders] = useState([])
    const [loading, setLoading] = useState(true)
    const [savingId, setSavingId] = useState(null)
    const [pendingStatus, setPending] = useState({})
    const [expanded, setExpanded] = useState({})
    const [selectedCategory, setSelectedCategory] = useState('All')
    const [searchQuery, setSearchQuery] = useState('')

    useEffect(() => {
        getOrders()
            .then(r => setOrders(r.data))
            .finally(() => setLoading(false))
    }, [])

    useEffect(() => {
        let filtered = orders

        if (selectedCategory !== 'All') {
            filtered = filtered.filter(o => o.status === selectedCategory)
        }

        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase()
            filtered = filtered.filter(o =>
                o.id.toLowerCase().includes(query) ||
                o.user_name.toLowerCase().includes(query) ||
                o.user_email.toLowerCase().includes(query)
            )
        }

        setFilteredOrders(filtered)
    }, [orders, selectedCategory, searchQuery])

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

    const IS = { width: '100%', background: T.bg, border: `1px solid ${T.border}`, borderRadius: '10px', padding: '12px 14px', color: T.text, fontSize: '14px', outline: 'none', boxSizing: 'border-box' }

    if (loading) return (
        <div style={{ textAlign: 'center', padding: '6rem', color: T.subtext, minHeight: '100vh', backgroundColor: T.bg }}>
            <div style={{ width: '36px', height: '36px', border: `3px solid ${T.border}`, borderTop: `3px solid ${T.accent}`, borderRadius: '50%', margin: '0 auto 12px', animation: 'spin 1s linear infinite' }} />
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
            Loading orders...
        </div>
    )

    return (
        <div style={{ minHeight: '100vh', backgroundColor: T.bg, paddingBottom: '60px' }}>
            <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem' }}>
                <h1 style={{ color: T.text, fontSize: '32px', fontWeight: '800', marginBottom: '2rem', letterSpacing: '-0.02em' }}>Orders</h1>

                {/* Search and filter section */}
                <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: '16px', padding: '20px', marginBottom: '2rem', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                    {/* Search bar */}
                    <div style={{ marginBottom: '20px' }}>
                        <div style={{ position: 'relative' }}>
                            <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: T.muted }} />
                            <input
                                type="text"
                                placeholder="Search orders by ID, name, or email..."
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                style={{ ...IS, paddingLeft: '40px', background: T.bg }}
                            />
                        </div>
                    </div>

                    {/* Category filter tabs */}
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                        {['All', ...STATUSES].map(cat => {
                            const count = cat === 'All' ? orders.length : orders.filter(o => o.status === cat).length
                            const isSelected = selectedCategory === cat
                            return (
                                <button
                                    key={cat}
                                    onClick={() => setSelectedCategory(cat)}
                                    style={{
                                        background: isSelected ? T.accent : T.bg,
                                        color: isSelected ? '#fff' : T.text,
                                        border: `1px solid ${isSelected ? T.accent : T.border}`,
                                        borderRadius: '10px',
                                        padding: '8px 16px',
                                        cursor: 'pointer',
                                        fontWeight: '600',
                                        fontSize: '13px',
                                        transition: 'all 0.2s',
                                        textTransform: 'capitalize',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '6px',
                                    }}
                                    onMouseEnter={e => {
                                        if (!isSelected) e.target.style.backgroundColor = '#e8e8ed'
                                    }}
                                    onMouseLeave={e => {
                                        if (!isSelected) e.target.style.backgroundColor = T.bg
                                    }}
                                >
                                    {cat}
                                    <span style={{ background: isSelected ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.05)', borderRadius: '12px', padding: '2px 8px', fontSize: '12px', fontWeight: '700', minWidth: '22px', textAlign: 'center' }}>
                                        {count}
                                    </span>
                                </button>
                            )
                        })}
                    </div>
                </div>

                {filteredOrders.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '4rem', backgroundColor: T.card, border: `1px solid ${T.border}`, borderRadius: '16px' }}>
                        <p style={{ fontSize: '42px', marginBottom: '12px' }}>📃</p>
                        <p style={{ color: T.text, fontSize: '18px', fontWeight: '600', marginBottom: '4px' }}>No orders found</p>
                        <p style={{ color: T.muted, fontSize: '14px' }}>
                            {selectedCategory !== 'All' || searchQuery ? 'Try adjusting your filters' : 'No orders have been placed yet'}
                        </p>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {filteredOrders.map(order => {
                            const currentDisplay = pendingStatus[order.id] || order.status
                            const isDirty = pendingStatus[order.id] && pendingStatus[order.id] !== order.status
                            const isExpanded = expanded[order.id]

                            return (
                                <div key={order.id} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: '16px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                                    {/* Order header */}
                                    <div style={{ padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
                                        <div>
                                            <p style={{ color: T.text, fontWeight: '700', fontSize: '16px' }}>Order #{order.id.slice(-8).toUpperCase()}</p>
                                            <p style={{ color: T.subtext, fontSize: '14px', marginTop: '4px' }}>{order.user_name} — {order.user_email}</p>
                                            <p style={{ color: T.muted, fontSize: '13px', marginTop: '2px' }}>{new Date(order.created_at).toLocaleString()}</p>
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                                            <p style={{ color: T.text, fontWeight: '800', fontSize: '20px' }}>₱{parseFloat(order.total_price).toLocaleString()}</p>
                                            {/* Status update controls */}
                                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                                <select
                                                    value={currentDisplay}
                                                    onChange={e => handleStatusChange(order.id, e.target.value)}
                                                    style={{
                                                        background: T.bg,
                                                        border: `1px solid ${STATUS_COLORS[currentDisplay]}`,
                                                        borderRadius: '8px',
                                                        color: STATUS_COLORS[currentDisplay],
                                                        padding: '8px 12px',
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
                                                        style={{ background: T.accent, color: '#fff', border: 'none', borderRadius: '8px', padding: '8px 16px', cursor: 'pointer', fontWeight: '700', fontSize: '13px', transition: 'background 0.2s' }}
                                                        onMouseEnter={e => e.target.style.background = T.accentHover}
                                                        onMouseLeave={e => e.target.style.background = T.accent}
                                                    >
                                                        {savingId === order.id ? '...' : 'Save'}
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Items */}
                                    <div style={{ padding: '0 24px 16px', borderTop: `1px solid ${T.border}` }}>
                                        <div style={{ paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                            {order.items.map((item, idx) => (
                                                <div key={idx} style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                                    <img src={item.product_image || 'https://via.placeholder.com/48'} alt={item.product_name}
                                                        style={{ width: '48px', height: '48px', objectFit: 'cover', borderRadius: '8px', flexShrink: 0, border: `1px solid ${T.border}` }} />
                                                    <span style={{ color: T.text, fontSize: '14px', flex: 1, fontWeight: '500' }}>{item.product_name} <span style={{ color: T.muted }}>× {item.quantity}</span></span>
                                                    <span style={{ color: T.text, fontSize: '14px', fontWeight: '600' }}>₱{(parseFloat(item.price_at_purchase) * item.quantity).toLocaleString()}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Shipping address */}
                                    {order.shipping_address && (
                                        <div style={{ padding: '12px 24px 16px', borderTop: `1px solid ${T.border}` }}>
                                            <p style={{ color: T.muted, fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>Ship to</p>
                                            <p style={{ color: T.subtext, fontSize: '14px' }}>{order.shipping_address}</p>
                                        </div>
                                    )}

                                    {/* Reviews panel toggle */}
                                    <div style={{ borderTop: `1px solid ${T.border}` }}>
                                        <button onClick={() => toggleExpand(order.id)}
                                            style={{ width: '100%', background: 'none', border: 'none', padding: '16px 24px', color: T.subtext, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: '600' }}
                                            onMouseEnter={e => e.currentTarget.style.backgroundColor = '#fafafa'}
                                            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                                        >
                                            <Star size={16} color='#f59e0b' fill={isExpanded ? '#f59e0b' : 'none'} />
                                            Product Reviews
                                            {isExpanded ? <ChevronUp size={16} style={{ marginLeft: 'auto' }} /> : <ChevronDown size={16} style={{ marginLeft: 'auto' }} />}
                                        </button>
                                        {isExpanded && (
                                            <div style={{ padding: '12px 24px 24px', background: '#fafafa', borderTop: `1px solid ${T.border}` }}>
                                                {order.items.map((item, idx) => (
                                                    <div key={idx} style={{ marginBottom: idx < order.items.length - 1 ? '24px' : 0 }}>
                                                        <p style={{ color: T.text, fontSize: '13px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px', paddingTop: '12px' }}>
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
                )}
            </div>
        </div>
    )
}