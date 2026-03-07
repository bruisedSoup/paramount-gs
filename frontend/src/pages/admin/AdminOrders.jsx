import { useState, useEffect } from 'react'
import { getOrders, updateOrderStatus } from '../../services/api'
import toast from 'react-hot-toast'

const STATUSES = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled']
const STATUS_COLORS = { pending: '#f59e0b', confirmed: '#3b82f6', processing: '#7c3aed', shipped: '#06b6d4', delivered: '#10b981', cancelled: '#ef4444' }

export default function AdminOrders() {
    const [orders, setOrders] = useState([])

    useEffect(() => { getOrders().then(r => setOrders(r.data)) }, [])

    const changeStatus = async (id, status) => {
        await updateOrderStatus(id, status)
        setOrders(prev => prev.map(o => o.id === id ? { ...o, status } : o))
        toast.success('Status updated')
    }

    return (
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem' }}>
            <h1 style={{ color: '#fff', fontSize: '28px', fontWeight: '800', marginBottom: '2rem' }}>All Orders</h1>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {orders.map(order => (
                    <div key={order.id} style={{ background: '#111118', border: '1px solid #1e1e2e', borderRadius: '12px', padding: '20px 24px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
                            <div>
                                <p style={{ color: '#fff', fontWeight: '700', fontSize: '16px' }}>Order #{order.id}</p>
                                <p style={{ color: '#94a3b8', fontSize: '14px' }}>{order.user_name} — {order.user_email}</p>
                                <p style={{ color: '#64748b', fontSize: '13px' }}>{new Date(order.created_at).toLocaleString()}</p>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <p style={{ color: '#00e5ff', fontWeight: '800', fontSize: '20px' }}>₱{parseFloat(order.total_price).toLocaleString()}</p>
                                <select value={order.status} onChange={e => changeStatus(order.id, e.target.value)}
                                    style={{ background: '#0d0d14', border: `1px solid ${STATUS_COLORS[order.status]}`, borderRadius: '6px', color: STATUS_COLORS[order.status], padding: '6px 10px', cursor: 'pointer', marginTop: '8px' }}>
                                    {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </div>
                        </div>
                        <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #1e1e2e' }}>
                            {order.items.map(item => (
                                <div key={item.id} style={{ display: 'flex', gap: '10px', marginBottom: '8px', alignItems: 'center' }}>
                                    <img src={item.product_image || 'https://via.placeholder.com/40'} alt={item.product_name}
                                        style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '6px' }} />
                                    <span style={{ color: '#94a3b8', fontSize: '14px' }}>{item.product_name} × {item.quantity}</span>
                                    <span style={{ color: '#00e5ff', fontSize: '14px', marginLeft: 'auto' }}>₱{(parseFloat(item.price_at_purchase) * item.quantity).toLocaleString()}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}