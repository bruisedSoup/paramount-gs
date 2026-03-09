import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getDashboard } from '../../services/api'
import { Package, ShoppingBag, DollarSign, Users, TrendingUp, BarChart3 } from 'lucide-react'

export default function AdminDashboard() {
    const [data, setData] = useState(null)

    useEffect(() => {
        getDashboard().then(r => setData(r.data)).catch(err => console.error('Dashboard load failed:', err))
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
                {/* Main stats grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                    {stats.map(stat => (
                        <div key={stat.label} style={{ background: '#111118', border: '1px solid #1e1e2e', borderRadius: '12px', padding: '24px', borderLeft: `3px solid ${stat.color}` }}>
                            <stat.icon size={24} color={stat.color} />
                            <p style={{ fontSize: '32px', fontWeight: '800', color: '#fff', margin: '12px 0 4px' }}>{stat.value}</p>
                            <p style={{ color: '#64748b', fontSize: '13px' }}>{stat.label}</p>
                        </div>
                    ))}
                </div>

                {/* Category breakdown section */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
                    {/* Products by Category */}
                    <div style={{ background: '#111118', border: '1px solid #1e1e2e', borderRadius: '12px', padding: '24px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
                            <Package size={18} color='#00e5ff' />
                            <h2 style={{ color: '#fff', fontSize: '16px', fontWeight: '700', margin: 0 }}>Products by Category</h2>
                        </div>
                        {Object.entries(data.products_by_category).length === 0 ? (
                            <p style={{ color: '#475569', fontSize: '13px' }}>No products yet</p>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                {Object.entries(data.products_by_category)
                                    .sort((a, b) => b[1] - a[1])
                                    .map(([cat, count]) => {
                                        const total = Object.values(data.products_by_category).reduce((a, b) => a + b, 0)
                                        const pct = total > 0 ? (count / total) * 100 : 0
                                        return (
                                            <div key={cat} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                <span style={{ color: '#94a3b8', fontSize: '13px', fontWeight: '600', textTransform: 'capitalize', minWidth: '100px' }}>{cat}</span>
                                                <div style={{ flex: 1, height: '8px', background: '#0d0d14', borderRadius: '4px', overflow: 'hidden' }}>
                                                    <div style={{ width: `${pct}%`, height: '100%', background: '#00e5ff', borderRadius: '4px', transition: 'width 0.5s ease' }} />
                                                </div>
                                                <span style={{ color: '#00e5ff', fontWeight: '700', minWidth: '35px', textAlign: 'right' }}>{count}</span>
                                            </div>
                                        )
                                    })}
                            </div>
                        )}
                    </div>

                    {/* Sales by Category */}
                    <div style={{ background: '#111118', border: '1px solid #1e1e2e', borderRadius: '12px', padding: '24px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
                            <DollarSign size={18} color='#10b981' />
                            <h2 style={{ color: '#fff', fontSize: '16px', fontWeight: '700', margin: 0 }}>Sales by Category</h2>
                        </div>
                        {Object.entries(data.sales_by_category).length === 0 ? (
                            <p style={{ color: '#475569', fontSize: '13px' }}>No sales yet</p>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                {Object.entries(data.sales_by_category)
                                    .sort((a, b) => b[1] - a[1])
                                    .map(([cat, sales]) => {
                                        const total = Object.values(data.sales_by_category).reduce((a, b) => a + b, 0)
                                        const pct = total > 0 ? (sales / total) * 100 : 0
                                        return (
                                            <div key={cat} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                <span style={{ color: '#94a3b8', fontSize: '13px', fontWeight: '600', textTransform: 'capitalize', minWidth: '100px' }}>{cat}</span>
                                                <div style={{ flex: 1, height: '8px', background: '#0d0d14', borderRadius: '4px', overflow: 'hidden' }}>
                                                    <div style={{ width: `${pct}%`, height: '100%', background: '#10b981', borderRadius: '4px', transition: 'width 0.5s ease' }} />
                                                </div>
                                                <span style={{ color: '#10b981', fontWeight: '700', minWidth: '100px', textAlign: 'right' }}>₱{sales.toLocaleString()}</span>
                                            </div>
                                        )
                                    })}
                            </div>
                        )}
                    </div>
                </div>

                {/* Orders by Status */}
                <div style={{ background: '#111118', border: '1px solid #1e1e2e', borderRadius: '12px', padding: '24px', marginBottom: '2rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
                        <ShoppingBag size={18} color='#7c3aed' />
                        <h2 style={{ color: '#fff', fontSize: '16px', fontWeight: '700', margin: 0 }}>Orders by Status</h2>
                    </div>
                    {Object.entries(data.orders_by_status).length === 0 ? (
                        <p style={{ color: '#475569', fontSize: '13px' }}>No orders yet</p>
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px' }}>
                            {Object.entries(data.orders_by_status).map(([status, count]) => {
                                const statusColors = {
                                    pending: '#f59e0b',
                                    confirmed: '#3b82f6',
                                    processing: '#7c3aed',
                                    shipped: '#06b6d4',
                                    delivered: '#10b981',
                                    cancelled: '#ef4444',
                                }
                                return (
                                    <div key={status} style={{ background: '#0d0d14', border: `1px solid ${statusColors[status]}50`, borderRadius: '8px', padding: '16px', textAlign: 'center' }}>
                                        <p style={{ color: statusColors[status], fontSize: '24px', fontWeight: '900', margin: '0 0 6px' }}>{count}</p>
                                        <p style={{ color: '#94a3b8', fontSize: '12px', textTransform: 'capitalize', margin: 0 }}>{status}</p>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>

                {/* Recent Orders */}
                <div>
                    <h2 style={{ color: '#fff', fontSize: '18px', fontWeight: '700', marginBottom: '1rem' }}>Recent Orders</h2>
                    <div style={{ background: '#111118', border: '1px solid #1e1e2e', borderRadius: '12px', overflow: 'hidden' }}>
                        {data.recent_orders.length === 0 ? (
                            <p style={{ color: '#475569', fontSize: '13px', padding: '20px' }}>No orders yet</p>
                        ) : (
                            data.recent_orders.map(order => (
                                <div key={order.id} style={{ padding: '16px 20px', borderBottom: '1px solid #1e1e2e', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>
                                        <p style={{ color: '#fff', fontWeight: '600' }}>Order #{order.id.slice(-8).toUpperCase()} — {order.user_name}</p>
                                        <p style={{ color: '#64748b', fontSize: '13px', marginTop: '4px' }}>{new Date(order.created_at).toLocaleString()}</p>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <p style={{ color: '#10b981', fontWeight: '700' }}>₱{parseFloat(order.total_price).toLocaleString()}</p>
                                        <span style={{ background: 'rgba(124,58,237,0.2)', color: '#a78bfa', padding: '2px 8px', borderRadius: '4px', fontSize: '12px', textTransform: 'capitalize' }}>{order.status}</span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </>}
        </div>
    )
}