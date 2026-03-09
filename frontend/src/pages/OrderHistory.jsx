import { useState, useEffect, useRef } from 'react'
import { getOrders, confirmReceived, createReview, getMyReviews } from '../services/api'
import { Star, Truck, CheckCircle, Clock, Package, ChevronDown, ChevronUp, Send, ImagePlus, X, Eye } from 'lucide-react'
import toast from 'react-hot-toast'

const STATUS_COLORS = {
    pending: '#f59e0b', confirmed: '#3b82f6', processing: '#7c3aed',
    shipped: '#06b6d4', delivered: '#10b981', cancelled: '#ef4444',
}

const TABS = [
    { key: 'to_ship', label: 'To Ship', icon: Clock, color: '#f59e0b' },
    { key: 'to_receive', label: 'To Receive', icon: Truck, color: '#06b6d4' },
    { key: 'to_rate', label: 'To Rate', icon: Star, color: '#f59e0b' },
    { key: 'all', label: 'All Orders', icon: Package, color: '#00e5ff' },
]

function StarPicker({ value, onChange }) {
    const [hovered, setHovered] = useState(0)
    return (
        <div style={{ display: 'flex', gap: '6px' }}>
            {[1, 2, 3, 4, 5].map(n => (
                <Star key={n} size={32}
                    fill={(hovered || value) >= n ? '#f59e0b' : 'none'}
                    color={(hovered || value) >= n ? '#f59e0b' : '#d2d2d7'}
                    style={{ cursor: 'pointer', transition: 'all 0.1s', filter: (hovered || value) >= n ? 'drop-shadow(0 0 6px #f59e0b88)' : 'none' }}
                    onMouseEnter={() => setHovered(n)}
                    onMouseLeave={() => setHovered(0)}
                    onClick={() => onChange(n)}
                />
            ))}
        </div>
    )
}

function StarDisplay({ value, size = 14 }) {
    return (
        <div style={{ display: 'flex', gap: '2px' }}>
            {[1, 2, 3, 4, 5].map(n => (
                <Star key={n} size={size} fill={value >= n ? '#f59e0b' : 'none'} color={value >= n ? '#f59e0b' : '#d2d2d7'} />
            ))}
        </div>
    )
}

function RateModal({ order, item, onClose, onDone }) {
    const [rating, setRating] = useState(0)
    const [body, setBody] = useState('')
    const [images, setImages] = useState([])   // File[]
    const [previews, setPreviews] = useState([]) // data URLs
    const [loading, setLoading] = useState(false)
    const fileRef = useRef()

    const addImages = (files) => {
        const remaining = 3 - images.length
        const chosen = Array.from(files).slice(0, remaining)
        setImages(prev => [...prev, ...chosen])
        chosen.forEach(f => {
            const reader = new FileReader()
            reader.onload = e => setPreviews(prev => [...prev, e.target.result])
            reader.readAsDataURL(f)
        })
    }

    const removeImage = (idx) => {
        setImages(prev => prev.filter((_, i) => i !== idx))
        setPreviews(prev => prev.filter((_, i) => i !== idx))
    }

    const submit = async () => {
        if (!rating) return toast.error('Please select a star rating')
        setLoading(true)
        try {
            const fd = new FormData()
            fd.append('order_id', order.id)
            fd.append('rating', rating)
            fd.append('body', body)
            images.forEach((img, i) => fd.append(`image_${i}`, img))
            await createReview(item.product_id, fd)
            toast.success('Review submitted!')
            onDone()
            onClose()
        } catch (err) {
            toast.error(err.response?.data?.detail || 'Failed to submit review')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
            <div style={{ background: '#fff', border: '1px solid #d2d2d7', borderRadius: '16px', padding: '32px', width: '100%', maxWidth: '500px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                    <div>
                        <h2 style={{ color: '#111', fontWeight: '800', fontSize: '20px', marginBottom: '4px' }}>Rate Product</h2>
                        <p style={{ color: '#6e6e73', fontSize: '13px' }}>{item.product_name}</p>
                    </div>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#8f8f94', cursor: 'pointer' }}><X size={20} /></button>
                </div>

                <div style={{ display: 'flex', gap: '14px', alignItems: 'center', background: '#f5f5f7', borderRadius: '10px', padding: '14px', marginBottom: '20px', border: '1px solid #e8e8ed' }}>
                    <img src={item.product_image || 'https://via.placeholder.com/56'} alt={item.product_name}
                        style={{ width: '56px', height: '56px', objectFit: 'contain', borderRadius: '8px', flexShrink: 0 }} />
                    <div>
                        <p style={{ color: '#6e6e73', fontSize: '12px', marginBottom: '8px' }}>How would you rate this?</p>
                        <StarPicker value={rating} onChange={setRating} />
                        {rating > 0 && (
                            <p style={{ color: '#f59e0b', fontSize: '12px', marginTop: '4px', fontWeight: '700' }}>
                                {['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'][rating]}
                            </p>
                        )}
                    </div>
                </div>

                <textarea value={body} onChange={e => setBody(e.target.value)}
                    placeholder="Share your experience (optional)..."
                    rows={4}
                    style={{ width: '100%', background: '#fff', border: '1px solid #d2d2d7', borderRadius: '8px', padding: '12px', color: '#111', fontSize: '14px', outline: 'none', resize: 'vertical', boxSizing: 'border-box', marginBottom: '16px', lineHeight: '1.6', fontFamily: 'inherit' }}
                />

                {/* Image upload */}
                <div style={{ marginBottom: '20px' }}>
                    <p style={{ color: '#8f8f94', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '10px' }}>
                        Add Photos ({images.length}/3)
                    </p>
                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                        {previews.map((src, idx) => (
                            <div key={idx} style={{ position: 'relative', width: '80px', height: '80px' }}>
                                <img src={src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '8px', border: '1px solid #d2d2d7' }} />
                                <button onClick={() => removeImage(idx)}
                                    style={{ position: 'absolute', top: '-6px', right: '-6px', background: '#ef4444', border: 'none', borderRadius: '50%', width: '20px', height: '20px', cursor: 'pointer', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}>
                                    <X size={11} />
                                </button>
                            </div>
                        ))}
                        {images.length < 3 && (
                            <button onClick={() => fileRef.current?.click()}
                                style={{ width: '80px', height: '80px', background: '#f5f5f7', border: '2px dashed #d2d2d7', borderRadius: '8px', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '4px', color: '#8f8f94' }}>
                                <ImagePlus size={20} />
                                <span style={{ fontSize: '11px' }}>Add</span>
                            </button>
                        )}
                        <input ref={fileRef} type="file" accept="image/*" multiple style={{ display: 'none' }}
                            onChange={e => addImages(e.target.files)} />
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                    <button onClick={onClose} style={{ flex: 1, background: '#f5f5f7', color: '#6e6e73', border: '1px solid #d2d2d7', borderRadius: '8px', padding: '12px', cursor: 'pointer', fontWeight: '700' }}>
                        Cancel
                    </button>
                    <button onClick={submit} disabled={loading || !rating}
                        style={{ flex: 2, background: rating ? '#f59e0b' : '#e8e8ed', color: rating ? '#000' : '#8f8f94', border: 'none', borderRadius: '8px', padding: '12px', cursor: rating ? 'pointer' : 'not-allowed', fontWeight: '800', transition: 'all 0.2s' }}>
                        {loading ? 'Submitting...' : 'Submit Review'}
                    </button>
                </div>
            </div>
        </div>
    )
}

function MyReviewCard({ review }) {
    return (
        <div style={{ background: '#f5f5f7', border: '1px solid #e8e8ed', borderRadius: '10px', padding: '14px', marginTop: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <StarDisplay value={review.rating} size={14} />
                <span style={{ color: '#8f8f94', fontSize: '11px' }}>{new Date(review.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
            </div>
            {review.body && <p style={{ color: '#6e6e73', fontSize: '13px', lineHeight: '1.6', marginBottom: review.image_urls?.length ? '10px' : 0 }}>{review.body}</p>}
            {review.image_urls?.length > 0 && (
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: review.reply ? '10px' : 0 }}>
                    {review.image_urls.map((url, i) => (
                        <img key={i} src={url} alt="" style={{ width: '64px', height: '64px', objectFit: 'cover', borderRadius: '6px', border: '1px solid #d2d2d7', cursor: 'pointer' }}
                            onClick={() => window.open(url, '_blank')} />
                    ))}
                </div>
            )}
            {review.reply && (
                <div style={{ background: 'rgba(0,102,204,0.04)', borderRadius: '8px', padding: '10px', borderLeft: '3px solid #0066cc', marginTop: '8px', border: '1px solid rgba(0,102,204,0.12)' }}>
                    <p style={{ color: '#0066cc', fontSize: '11px', fontWeight: '700', marginBottom: '3px' }}>⚡ {review.reply.admin_name} · Admin Reply</p>
                    <p style={{ color: '#6e6e73', fontSize: '13px', lineHeight: '1.5' }}>{review.reply.body}</p>
                </div>
            )}
        </div>
    )
}

function OrderCard({ order, myReviews, showReceiveBtn, showRateBtn, onReceived, onRate }) {
    const [expanded, setExpanded] = useState(false)
    const [receiving, setReceiving] = useState(false)

    const handleReceive = async () => {
        setReceiving(true)
        try {
            await confirmReceived(order.id)
            toast.success('Order marked as received!')
            onReceived()
        } catch (err) {
            toast.error(err.response?.data?.detail || 'Failed')
        } finally { setReceiving(false) }
    }

    // map product_id → my review for this order
    const reviewMap = {}
    myReviews.forEach(r => { if (r.order_id === order.id) reviewMap[r.product_id] = r })

    return (
        <div style={{ background: '#fff', border: '1px solid #d2d2d7', borderRadius: '14px', overflow: 'hidden', marginBottom: '10px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
            <div style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                    <p style={{ color: '#8f8f94', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>
                        Order #{order.id.slice(-8).toUpperCase()}
                    </p>
                    <p style={{ color: '#111', fontWeight: '600' }}>{order.items.length} item{order.items.length > 1 ? 's' : ''}</p>
                    <p style={{ color: '#8f8f94', fontSize: '12px', marginTop: '2px' }}>
                        {new Date(order.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                    </p>
                </div>
                <div style={{ textAlign: 'right' }}>
                    <p style={{ color: '#111', fontWeight: '800', fontSize: '20px' }}>₱{parseFloat(order.total_price).toLocaleString()}</p>
                    <span style={{
                        background: `${STATUS_COLORS[order.status]}15`,
                        color: STATUS_COLORS[order.status],
                        border: `1px solid ${STATUS_COLORS[order.status]}35`,
                        padding: '3px 10px', borderRadius: '20px', fontSize: '11px',
                        fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px',
                        display: 'inline-block', marginTop: '6px',
                    }}>{order.status}</span>
                </div>
            </div>

            {/* Items */}
            <div style={{ padding: '0 20px 16px', borderTop: '1px solid #e8e8ed' }}>
                {order.items.map((item, idx) => {
                    const myReview = reviewMap[item.product_id]
                    return (
                        <div key={idx} style={{ paddingTop: '14px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#f5f5f7', borderRadius: '8px', padding: '10px 12px', border: '1px solid #e8e8ed' }}>
                                <img src={item.product_image || 'https://via.placeholder.com/40'} alt={item.product_name}
                                    style={{ width: '40px', height: '40px', objectFit: 'contain', borderRadius: '6px', flexShrink: 0 }} />
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <p style={{ color: '#111', fontSize: '13px', fontWeight: '600', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.product_name}</p>
                                    <p style={{ color: '#8f8f94', fontSize: '12px' }}>x{item.quantity} · ₱{parseFloat(item.price_at_purchase).toLocaleString()}</p>
                                </div>
                                <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                                    {myReview ? (
                                        <span style={{ background: 'rgba(16,185,129,0.12)', color: '#10b981', border: '1px solid rgba(16,185,129,0.25)', borderRadius: '6px', padding: '4px 10px', fontSize: '12px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            <Star size={11} fill='#10b981' color='#10b981' /> Reviewed
                                        </span>
                                    ) : showRateBtn ? (
                                        <button onClick={() => onRate(order, item)}
                                            style={{ background: 'rgba(245,158,11,0.12)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.25)', borderRadius: '6px', padding: '4px 12px', cursor: 'pointer', fontSize: '12px', fontWeight: '700' }}>
                                            ⭐ Rate
                                        </button>
                                    ) : null}
                                </div>
                            </div>
                            {/* Show my review inline */}
                            {myReview && <MyReviewCard review={myReview} />}
                        </div>
                    )
                })}
            </div>

            {/* Footer actions */}
            <div style={{ borderTop: '1px solid #e8e8ed', padding: '12px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                <button onClick={() => setExpanded(e => !e)}
                    style={{ background: 'none', border: 'none', color: '#8f8f94', cursor: 'pointer', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                    {expanded ? 'Hide details' : 'View details'}
                </button>
                {showReceiveBtn && (
                    <button onClick={handleReceive} disabled={receiving}
                        style={{ background: '#10b981', color: '#fff', border: 'none', borderRadius: '8px', padding: '8px 20px', cursor: 'pointer', fontWeight: '700', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '7px' }}>
                        <CheckCircle size={15} />
                        {receiving ? 'Confirming...' : 'Order Received'}
                    </button>
                )}
            </div>

            {expanded && (
                <div style={{ padding: '14px 20px 18px', borderTop: '1px solid #e8e8ed', background: '#f5f5f7' }}>
                    {order.shipping_address && (
                        <div style={{ marginBottom: '8px' }}>
                            <p style={{ color: '#8f8f94', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '3px' }}>Ship To</p>
                            <p style={{ color: '#6e6e73', fontSize: '13px' }}>{order.shipping_address}</p>
                        </div>
                    )}
                    {order.notes && (
                        <div>
                            <p style={{ color: '#8f8f94', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '3px' }}>Notes</p>
                            <p style={{ color: '#6e6e73', fontSize: '13px' }}>{order.notes}</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}

export default function OrderHistory() {
    const [orders, setOrders] = useState([])
    const [myReviews, setMyReviews] = useState([])
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState('all')
    const [rateModal, setRateModal] = useState(null)

    const load = async () => {
        setLoading(true)
        try {
            const [ordRes, revRes] = await Promise.all([getOrders(), getMyReviews()])
            setOrders(ordRes.data)
            setMyReviews(revRes.data)
        } catch { /* silently fail */ }
        finally { setLoading(false) }
    }

    useEffect(() => { load() }, [])

    const filtered = {
        to_ship: orders.filter(o => ['pending', 'confirmed', 'processing'].includes(o.status)),
        to_receive: orders.filter(o => o.status === 'shipped'),
        to_rate: orders.filter(o => o.status === 'delivered'),
        all: orders,
    }

    if (loading) return (
        <div style={{ textAlign: 'center', padding: '6rem', color: '#6e6e73', backgroundColor: '#f5f5f7', minHeight: '100vh' }}>
            <div style={{ width: '36px', height: '36px', border: '3px solid #d2d2d7', borderTop: '3px solid #0066cc', borderRadius: '50%', margin: '0 auto 12px', animation: 'spin 1s linear infinite' }} />
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
            Loading your orders...
        </div>
    )

    return (
        <div style={{ backgroundColor: '#f5f5f7', minHeight: '100vh', paddingBottom: '60px', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif' }}>
            <div style={{ maxWidth: '860px', margin: '0 auto', padding: '2rem' }}>
                <h1 style={{ color: '#111', fontSize: '32px', fontWeight: '800', marginBottom: '24px', letterSpacing: '-0.02em' }}>My Orders</h1>

                {/* Tabs */}
                <div style={{ display: 'flex', gap: '4px', marginBottom: '24px', background: '#e8e8ed', borderRadius: '12px', padding: '4px', border: '1px solid #d2d2d7' }}>
                    {TABS.map(tab => {
                        const Icon = tab.icon
                        const count = filtered[tab.key].length
                        const active = activeTab === tab.key
                        return (
                            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                                style={{
                                    flex: 1, background: active ? '#fff' : 'transparent',
                                    color: active ? '#111' : '#8f8f94',
                                    border: active ? '1px solid #d2d2d7' : '1px solid transparent',
                                    borderRadius: '8px', padding: '8px 4px', cursor: 'pointer',
                                    fontWeight: active ? '700' : '500', fontSize: '12px',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    gap: '5px', transition: 'all 0.15s',
                                    boxShadow: active ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
                                    fontFamily: 'inherit',
                                }}>
                                <Icon size={13} color={active ? tab.color : '#8f8f94'} />
                                {tab.label}
                                {count > 0 && (
                                    <span style={{ background: active ? tab.color : '#d2d2d7', color: active ? '#000' : '#6e6e73', borderRadius: '10px', padding: '1px 6px', fontSize: '11px', fontWeight: '700' }}>
                                        {count}
                                    </span>
                                )}
                            </button>
                        )
                    })}
                </div>

                {/* Empty state */}
                {filtered[activeTab].length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '4rem 2rem', color: '#8f8f94' }}>
                        <p style={{ fontSize: '42px', marginBottom: '12px' }}>
                            {activeTab === 'to_ship' ? '📦' : activeTab === 'to_receive' ? '🚚' : activeTab === 'to_rate' ? '⭐' : '🛒'}
                        </p>
                        <p style={{ color: '#111', fontSize: '17px', fontWeight: '600', marginBottom: '6px' }}>
                            {activeTab === 'to_ship' ? 'No orders being prepared' :
                                activeTab === 'to_receive' ? 'No orders on the way' :
                                    activeTab === 'to_rate' ? 'Nothing to rate yet' : 'No orders yet'}
                        </p>
                        <p style={{ fontSize: '13px', color: '#8f8f94' }}>
                            {activeTab === 'to_rate' ? 'Mark orders as received to start rating' : 'Orders will appear here once placed'}
                        </p>
                    </div>
                ) : (
                    filtered[activeTab].map(order => (
                        <OrderCard key={order.id} order={order} myReviews={myReviews}
                            showReceiveBtn={order.status === 'shipped'}
                            showRateBtn={activeTab === 'to_rate'}
                            onReceived={load}
                            onRate={(o, item) => setRateModal({ order: o, item })}
                        />
                    ))
                )}

                {rateModal && (
                    <RateModal
                        order={rateModal.order}
                        item={rateModal.item}
                        onClose={() => setRateModal(null)}
                        onDone={load}
                    />
                )}
            </div>
        </div>
    )
}