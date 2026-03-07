import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getDashboard } from '../../services/api'
import { Package, ShoppingBag, DollarSign, Users } from 'lucide-react'

export default function AdminDashboard() {
    const [data, setData] = useState(null)

    useEffect(() => {
        getDashboard().then(r => setData(r.data))
    }, [])

    const stats = data ? [
        { label: 'Total Products', value: data.total_products, icon: Package, color: '#00e5ff' },
        { label: 'Total Orders', value: data.total_orders, icon: ShoppingBag, color: '#7c3aed' },
        { label: 'Total Sales', value: `₱${data.total_sales.toLocaleString()}`, icon: DollarSign, color: '#10b981' },
        { label: 'Customers', value: data.total_customers, icon: Users, color: '#f59e0b' },
    ] : []

    return (
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h1 style={{ fontSize: '28px', fontWeight: '800', color: '#fff' }}>Admin Dashboard</h1>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <Link to="/admin/products" style={{ background: '#00e5ff', color: '#000', padding: '8px 20px', borderRadius: '8px', textDecoration: 'none', fontWeight: '700' }}>Products</Link>
                    <Link to="/admin/orders" style={{ background: '#7c3aed', color: '#fff', padding: '8px 20px', borderRadius: '8px', textDecoration: 'none', fontWeight: '700' }}>Orders</Link>
                </div>
            </div>
            {!data ? <p style={{ color: '#64748b' }}>Loading...</p> : <>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                    {stats.map(stat => (
                        <div key={stat.label} style={{ background: '#111118', border: '1px solid #1e1e2e', borderRadius: '12px', padding: '24px', borderLeft: `3px solid ${stat.color}` }}>
                            <stat.icon size={24} color={stat.color} />
                            <p style={{ fontSize: '32px', fontWeight: '800', color: '#fff', margin: '12px 0 4px' }}>{stat.value}</p>
                            <p style={{ color: '#64748b', fontSize: '13px' }}>{stat.label}</p>
                        </div>
                    ))}
                </div>
                <div>
                    <h2 style={{ color: '#fff', fontSize: '18px', fontWeight: '700', marginBottom: '1rem' }}>Recent Orders</h2>
                    <div style={{ background: '#111118', border: '1px solid #1e1e2e', borderRadius: '12px', overflow: 'hidden' }}>
                        {data.recent_orders.map(order => (
                            <div key={order.id} style={{ padding: '16px 20px', borderBottom: '1px solid #1e1e2e', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <p style={{ color: '#fff', fontWeight: '600' }}>Order #{order.id} — {order.user_name}</p>
                                    <p style={{ color: '#64748b', fontSize: '13px' }}>{new Date(order.created_at).toLocaleDateString()}</p>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <p style={{ color: '#00e5ff', fontWeight: '700' }}>₱{parseFloat(order.total_price).toLocaleString()}</p>
                                    <span style={{ background: 'rgba(124,58,237,0.2)', color: '#a78bfa', padding: '2px 8px', borderRadius: '4px', fontSize: '12px' }}>{order.status}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </>}
        </div>
    )
}