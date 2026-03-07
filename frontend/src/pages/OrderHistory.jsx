import { useState, useEffect } from 'react'
import { getOrders } from '../services/api'
import { Package, ChevronRight } from 'lucide-react'

const STATUS_COLORS = {
    pending: '#f59e0b',
    confirmed: '#3b82f6',
    processing: '#7c3aed',
    shipped: '#06b6d4',
    delivered: '#10b981',
    cancelled: '#ef4444',
}

export default function OrderHistory() {
    const [orders, setOrders] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        getOrders()
            .then(r => setOrders(r.data))
            .finally(() => setLoading(false))
    }, [])

    if (loading) return <p style={{ color: '#64748b', textAlign: 'center', padding: '4rem' }}>Loading orders...</p>

    if (orders.length === 0) return (
        <div style={{ textAlign: 'center', padding: '6rem 2rem', color: '#64748b' }}>
            <p style={{ fontSize: '48px' }}>📦</p>
            <p style={{ fontSize: '20px', color: '#fff', marginBottom: '8px' }}>No orders found</p>
            <p>You haven't placed any orders yet.</p>
        </div>
    )

    return (
        <div style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem' }}>
            <h1 style={{ color: '#fff', fontSize: '28px', fontWeight: '800', marginBottom: '2rem' }}>Order History</h1>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {orders.map(order => (
                    <div key={order.id} style={{ background: '#111118', border: '1px solid #1e1e2e', borderRadius: '12px', padding: '20px', cursor: 'default' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                            <div>
                                <p style={{ color: '#94a3b8', fontSize: '13px', marginBottom: '4px' }}>Order #{order.id}</p>
                                <p style={{ color: '#fff', fontWeight: '600' }}>{new Date(order.created_at).toLocaleDateString()}</p>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <p style={{ color: '#00e5ff', fontWeight: '800', fontSize: '18px' }}>₱{parseFloat(order.total_price).toLocaleString()}</p>
                                <span style={{
                                    background: `${STATUS_COLORS[order.status]}20`,
                                    color: STATUS_COLORS[order.status],
                                    padding: '4px 10px',
                                    borderRadius: '6px',
                                    fontSize: '12px',
                                    fontWeight: '700',
                                    textTransform: 'uppercase',
                                    marginTop: '8px',
                                    display: 'inline-block'
                                }}>
                                    {order.status}
                                </span>
                            </div>
                        </div>

                        <div style={{ borderTop: '1px solid #1e1e2e', paddingTop: '16px' }}>
                            {order.items.map((item, idx) => (
                                <div key={idx} style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: idx === order.items.length - 1 ? 0 : '12px' }}>
                                    <div style={{ width: '40px', height: '40px', background: '#1a1a24', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <Package size={20} color="#64748b" />
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <p style={{ color: '#fff', fontSize: '14px', fontWeight: '500' }}>{item.product_name}</p>
                                        <p style={{ color: '#64748b', fontSize: '12px' }}>Qty: {item.quantity}</p>
                                    </div>
                                    <p style={{ color: '#fff', fontSize: '14px', fontWeight: '600' }}>₱{(parseFloat(item.price_at_purchase) * item.quantity).toLocaleString()}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
