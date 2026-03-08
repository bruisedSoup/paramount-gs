import { useState, useEffect } from 'react'
import { getOrders, confirmReceived, createReview } from '../services/api'
import { Package, Star, Truck, CheckCircle, Clock, ChevronDown, ChevronUp, Send } from 'lucide-react'
import toast from 'react-hot-toast'

const STATUS_COLORS = {
    pending: '#f59e0b',
    confirmed: '#3b82f6',
    processing: '#7c3aed',
    shipped: '#06b6d4',
    delivered: '#10b981',
    cancelled: '#ef4444',
}

const TABS = [
    { key: 'to_ship', label: 'To Ship', icon: Clock },
    { key: 'to_receive', label: 'To Receive', icon: Truck },
    { key: 'to_rate', label: 'To Rate', icon: Star },
    { key: 'all', label: 'All Orders', icon: Package },
]

function StarRating({ value, onChange, readonly = false }) {
    const [hovered, setHovered] = useState(0)
    return (
        <div style={{ display: 'flex', gap: '4px' }}>
            {[1, 2, 3, 4, 5].map(n => (
                <Star
                    key={n}
                    size={24}
                    fill={(hovered || value) >= n ? '#f59e0b' : 'none'}
                    color={(hovered || value) >= n ? '#f59e0b' : '#475569'}
                    style={{ cursor: readonly ? 'default' : 'pointer', transition: 'all 0.15s' }}
                    onMouseEnter={() => !readonly && setHovered(n)}
                    onMouseLeave={() => !readonly && setHovered(0)}
                    onClick={() => !readonly && onChange && onChange(n)}
                />
            ))}
        </div>
    )
}

function RateModal({ order, item, onClose, onDone }) {
    const [rating, setRating] = useState(0)
    const [body, setBody] = useState('')
    const [loading, setLoading] = useState(false)

    const submit = async () => {
        if (!rating) return toast.error('Please select a star rating')
        setLoading(true)
        try {
            await createReview(item.product_id, {
                order_id: order.id,
                rating,
                body,
            })
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
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
            <div style={{ background: '#111118', border: '1px solid #1e1e2e', borderRadius: '16px', padding: '32px', width: '100%', maxWidth: '480px' }}>
                <h2 style={{ color: '#fff', fontWeight: '800', fontSize: '20px', marginBottom: '4px' }}>Rate Product</h2>
                <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '24px' }}>{item.product_name}</p>

                <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginBottom: '20px' }}>
                    <img src={item.product_image || 'https://via.placeholder.com/60'} alt={item.product_name}
                        style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '8px' }} />
                    <div>
                        <p style={{ color: '#94a3b8', fontSize: '13px', marginBottom: '8px' }}>Your rating</p>
                        <StarRating value={rating} onChange={setRating} />
                    </div>
                </div>

                <textarea
                    value={body}
                    onChange={e => setBody(e.target.value)}
                    placeholder="Share your experience (optional)..."
                    rows={4}
                    style={{ width: '100%', background: '#0d0d14', border: '1px solid #1e1e2e', borderRadius: '8px', padding: '12px', color: '#e2e8f0', fontSize: '14px', outline: 'none', resize: 'vertical', boxSizing: 'border-box', marginBottom: '16px' }}
                />

                <div style={{ display: 'flex', gap: '12px' }}>
                    <button onClick={onClose} style={{ flex: 1, background: '#1e1e2e', color: '#94a3b8', border: 'none', borderRadius: '8px', padding: '12px', cursor: 'pointer', fontWeight: '700' }}>
                        Cancel
                    </button>
                    <button onClick={submit} disabled={loading} style={{ flex: 2, background: '#f59e0b', color: '#000', border: 'none', borderRadius: '8px', padding: '12px', cursor: 'pointer', fontWeight: '800' }}>
                        {loading ? 'Submitting...' : 'Submit Review'}
                    </button>
                </div>
            </div>
        </div>
    )
}

function OrderCard({ order, showReceiveBtn, showRateBtn, onReceived, onRate }) {
    const [expanded, setExpanded] = useState(false)
    const [receiving, setReceiving] = useState(false)

    const handleReceive = async () => {
        setReceiving(true)
        try {
            await confirmReceived(order.id)
            toast.success('Order marked as received!')
            onReceived()
        } catch (err) {
            toast.error(err.response?.data?.detail || 'Failed to confirm receipt')
        } finally {
            setReceiving(false)
        }
    }

    return (
        <div style={{ background: '#111118', border: '1px solid #1e1e2e', borderRadius: '12px', overflow: 'hidden', marginBottom: '12px' }}>
            {/* Header */}
            <div style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                    <p style={{ color: '#64748b', fontSize: '12px', marginBottom: '4px' }}>ORDER #{order.id.slice(-8).toUpperCase()}</p>
                    <p style={{ color: '#fff', fontWeight: '600', fontSize: '15px' }}>
                        {order.items.length} item{order.items.length > 1 ? 's' : ''}
                    </p>
                    <p style={{ color: '#475569', fontSize: '13px', marginTop: '2px' }}>
                        {new Date(order.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                    </p>
                </div>
                <div style={{ textAlign: 'right' }}>
                    <p style={{ color: '#00e5ff', fontWeight: '800', fontSize: '20px' }}>₱{parseFloat(order.total_price).toLocaleString()}</p>
                    <span style={{
                        background: `${STATUS_COLORS[order.status]}18`,
                        color: STATUS_COLORS[order.status],
                        border: `1px solid ${STATUS_COLORS[order.status]}40`,
                        padding: '3px 10px', borderRadius: '20px',
                        fontSize: '11px', fontWeight: '700', textTransform: 'uppercase',
                        letterSpacing: '0.5px', display: 'inline-block', marginTop: '6px'
                    }}>{order.status}</span>
                </div>
            </div>

            {/* Items preview */}
            <div style={{ padding: '0 20px 16px', borderTop: '1px solid #1a1a24' }}>
                <div style={{ paddingTop: '16px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {order.items.map((item, idx) => (
                        <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#0d0d14', borderRadius: '8px', padding: '8px 12px', flex: '1', minWidth: '200px' }}>
                            <img src={item.product_image || 'https://via.placeholder.com/36'} alt={item.product_name}
                                style={{ width: '36px', height: '36px', objectFit: 'cover', borderRadius: '6px' }} />
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <p style={{ color: '#e2e8f0', fontSize: '13px', fontWeight: '600', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.product_name}</p>
                                <p style={{ color: '#475569', fontSize: '12px' }}>x{item.quantity} · ₱{parseFloat(item.price_at_purchase).toLocaleString()}</p>
                            </div>
                            {showRateBtn && (
                                <button onClick={() => onRate(order, item)}
                                    style={{ background: 'rgba(245,158,11,0.15)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.3)', borderRadius: '6px', padding: '4px 10px', cursor: 'pointer', fontSize: '12px', fontWeight: '700', whiteSpace: 'nowrap' }}>
                                    ⭐ Rate
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Actions */}
            {(showReceiveBtn || order.shipping_address) && (
                <div style={{ padding: '12px 20px', borderTop: '1px solid #1a1a24', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                    <button onClick={() => setExpanded(e => !e)}
                        style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        {expanded ? 'Hide details' : 'View details'}
                    </button>
                    {showReceiveBtn && (
                        <button onClick={handleReceive} disabled={receiving}
                            style={{ background: '#10b981', color: '#fff', border: 'none', borderRadius: '8px', padding: '8px 20px', cursor: 'pointer', fontWeight: '700', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <CheckCircle size={16} />
                            {receiving ? 'Confirming...' : 'Order Received'}
                        </button>
                    )}
                </div>
            )}

            {/* Expanded details */}
            {expanded && (
                <div style={{ padding: '16px 20px', borderTop: '1px solid #1a1a24', background: '#0d0d14' }}>
                    {order.shipping_address && (
                        <div style={{ marginBottom: '8px' }}>
                            <p style={{ color: '#64748b', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>Shipping Address</p>
                            <p style={{ color: '#94a3b8', fontSize: '14px' }}>{order.shipping_address}</p>
                        </div>
                    )}
                    {order.notes && (
                        <div>
                            <p style={{ color: '#64748b', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>Notes</p>
                            <p style={{ color: '#94a3b8', fontSize: '14px' }}>{order.notes}</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}

export default function OrderHistory() {
    const [orders, setOrders] = useState([])
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState('all')
    const [rateModal, setRateModal] = useState(null) // { order, item }

    const load = () => {
        setLoading(true)
        getOrders()
            .then(r => setOrders(r.data))
            .finally(() => setLoading(false))
    }

    useEffect(() => { load() }, [])

    const filtered = {
        to_ship: orders.filter(o => ['pending', 'confirmed', 'processing'].includes(o.status)),
        to_receive: orders.filter(o => o.status === 'shipped'),
        to_rate: orders.filter(o => o.status === 'delivered'),
        all: orders,
    }

    const counts = Object.fromEntries(Object.entries(filtered).map(([k, v]) => [k, v.length]))

    if (loading) return (
        <div style={{ textAlign: 'center', padding: '6rem 2rem', color: '#64748b' }}>
            <div style={{ width: '40px', height: '40px', border: '3px solid #1e1e2e', borderTop: '3px solid #00e5ff', borderRadius: '50%', margin: '0 auto 16px', animation: 'spin 1s linear infinite' }} />
            <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
            Loading orders...
        </div>
    )

    return (
        <div style={{ maxWidth: '860px', margin: '0 auto', padding: '2rem' }}>
            <h1 style={{ color: '#fff', fontSize: '28px', fontWeight: '800', marginBottom: '24px' }}>My Orders</h1>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: '4px', marginBottom: '24px', background: '#0d0d14', borderRadius: '10px', padding: '4px', border: '1px solid #1e1e2e' }}>
                {TABS.map(tab => {
                    const Icon = tab.icon
                    const count = counts[tab.key]
                    const active = activeTab === tab.key
                    return (
                        <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                            style={{
                                flex: 1, background: active ? '#111118' : 'transparent',
                                color: active ? '#fff' : '#475569',
                                border: active ? '1px solid #1e1e2e' : '1px solid transparent',
                                borderRadius: '8px', padding: '8px 4px', cursor: 'pointer',
                                fontWeight: active ? '700' : '500', fontSize: '13px',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                gap: '6px', transition: 'all 0.2s',
                            }}>
                            <Icon size={14} color={active ? (tab.key === 'to_rate' ? '#f59e0b' : tab.key === 'to_receive' ? '#06b6d4' : tab.key === 'to_ship' ? '#f59e0b' : '#00e5ff') : '#475569'} />
                            <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                {tab.label}
                                {count > 0 && (
                                    <span style={{ background: active ? '#00e5ff' : '#1e1e2e', color: active ? '#000' : '#64748b', borderRadius: '10px', padding: '0 6px', fontSize: '11px', fontWeight: '700', lineHeight: '18px', display: 'inline-block' }}>
                                        {count}
                                    </span>
                                )}
                            </span>
                        </button>
                    )
                })}
            </div>

            {/* Orders */}
            {filtered[activeTab].length === 0 ? (
                <div style={{ textAlign: 'center', padding: '4rem 2rem', color: '#64748b' }}>
                    <p style={{ fontSize: '40px', marginBottom: '12px' }}>
                        {activeTab === 'to_ship' ? '📦' : activeTab === 'to_receive' ? '🚚' : activeTab === 'to_rate' ? '⭐' : '🛒'}
                    </p>
                    <p style={{ color: '#fff', fontSize: '18px', marginBottom: '6px', fontWeight: '600' }}>
                        {activeTab === 'to_ship' ? 'No orders being prepared' :
                            activeTab === 'to_receive' ? 'No orders on the way' :
                                activeTab === 'to_rate' ? 'No items to rate' : 'No orders yet'}
                    </p>
                    <p style={{ fontSize: '14px' }}>
                        {activeTab === 'to_rate' ? 'Orders you receive will appear here for rating' : 'Your orders will appear here'}
                    </p>
                </div>
            ) : (
                filtered[activeTab].map(order => (
                    <OrderCard
                        key={order.id}
                        order={order}
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
    )
}