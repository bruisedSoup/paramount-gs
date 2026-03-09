import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getDashboard } from '../../services/api'
import { Package, ShoppingBag, DollarSign, Users, BarChart3, TrendingUp } from 'lucide-react'

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
    accent3: '#f59e0b',
}

export default function AdminDashboard() {
    const [data, setData] = useState(null)

    useEffect(() => {
        getDashboard().then(r => setData(r.data)).catch(err => console.error('Dashboard load failed:', err))
    }, [])

    const stats = data ? [
        { label: 'Total Products', value: data.total_products, icon: Package, color: T.accent, bgColor: 'rgba(0, 102, 204, 0.08)' },
        { label: 'Total Orders', value: data.total_orders, icon: ShoppingBag, color: T.accent2, bgColor: 'rgba(52, 199, 89, 0.08)' },
        { label: 'Total Sales', value: `₱${data.total_sales.toLocaleString()}`, icon: DollarSign, color: T.accent3, bgColor: 'rgba(245, 158, 11, 0.08)' },
        { label: 'Customers', value: data.total_customers, icon: Users, color: T.accent, bgColor: 'rgba(0, 102, 204, 0.08)' },
    ] : []

    return (
        <div style={{ minHeight: '100vh', backgroundColor: T.bg, paddingBottom: '60px' }}>
            <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                    <h1 style={{ fontSize: '32px', fontWeight: '800', color: T.text, margin: 0, letterSpacing: '-0.02em' }}>Dashboard</h1>
                    <div style={{ display: 'flex', gap: '12px' }}>
                        <Link to="/admin/products" style={{ background: T.accent, color: '#fff', padding: '10px 24px', borderRadius: '12px', textDecoration: 'none', fontWeight: '700', fontSize: '14px', transition: 'background 0.2s' }} onMouseEnter={e => e.target.style.background = T.accentHover} onMouseLeave={e => e.target.style.background = T.accent}>Products</Link>
                        <Link to="/admin/orders" style={{ background: T.accent2, color: '#fff', padding: '10px 24px', borderRadius: '12px', textDecoration: 'none', fontWeight: '700', fontSize: '14px', transition: 'background 0.2s' }} onMouseEnter={e => e.target.style.background = '#2cb04a'} onMouseLeave={e => e.target.style.background = T.accent2}>Orders</Link>
                    </div>
                </div>

                {!data ? (
                    <div style={{ textAlign: 'center', padding: '4rem', color: T.muted }}>
                        <div style={{ width: '40px', height: '40px', border: '3px solid ' + T.border, borderTop: '3px solid ' + T.accent, borderRadius: '50%', margin: '0 auto 12px', animation: 'spin 1s linear infinite' }} />
                        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
                        Loading dashboard...
                    </div>
                ) : (
                    <>
                        {/* Main stats grid */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                            {stats.map(stat => (
                                <div key={stat.label} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: '16px', padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', transition: 'all 0.2s' }} onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.1)'; e.currentTarget.style.transform = 'translateY(-2px)' }} onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.05)'; e.currentTarget.style.transform = 'translateY(0)' }}>
                                    <div style={{ background: stat.bgColor, borderRadius: '12px', width: '48px', height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
                                        <stat.icon size={24} color={stat.color} />
                                    </div>
                                    <p style={{ fontSize: '28px', fontWeight: '800', color: T.text, margin: '0 0 6px', letterSpacing: '-0.01em' }}>{stat.value}</p>
                                    <p style={{ color: T.muted, fontSize: '13px', margin: 0, fontWeight: '500' }}>{stat.label}</p>
                                </div>
                            ))}
                        </div>

                        {/* Category breakdown section */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
                            {/* Products by Category */}
                            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: '16px', padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
                                    <Package size={18} color={T.accent} />
                                    <h2 style={{ color: T.text, fontSize: '16px', fontWeight: '700', margin: 0 }}>Products by Category</h2>
                                </div>
                                {Object.entries(data.products_by_category).length === 0 ? (
                                    <p style={{ color: T.muted, fontSize: '13px' }}>No products yet</p>
                                ) : (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                        {Object.entries(data.products_by_category)
                                            .sort((a, b) => b[1] - a[1])
                                            .map(([cat, count]) => {
                                                const total = Object.values(data.products_by_category).reduce((a, b) => a + b, 0)
                                                const pct = total > 0 ? (count / total) * 100 : 0
                                                return (
                                                    <div key={cat} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                        <span style={{ color: T.subtext, fontSize: '13px', fontWeight: '600', textTransform: 'capitalize', minWidth: '100px' }}>{cat}</span>
                                                        <div style={{ flex: 1, height: '8px', background: '#e8e8ed', borderRadius: '4px', overflow: 'hidden' }}>
                                                            <div style={{ width: `${pct}%`, height: '100%', background: T.accent, borderRadius: '4px', transition: 'width 0.5s ease' }} />
                                                        </div>
                                                        <span style={{ color: T.accent, fontWeight: '700', minWidth: '35px', textAlign: 'right', fontSize: '13px' }}>{count}</span>
                                                    </div>
                                                )
                                            })}
                                    </div>
                                )}
                            </div>

                            {/* Sales by Category */}
                            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: '16px', padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
                                    <TrendingUp size={18} color={T.accent3} />
                                    <h2 style={{ color: T.text, fontSize: '16px', fontWeight: '700', margin: 0 }}>Sales by Category</h2>
                                </div>
                                {Object.entries(data.sales_by_category).length === 0 ? (
                                    <p style={{ color: T.muted, fontSize: '13px' }}>No sales yet</p>
                                ) : (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                        {Object.entries(data.sales_by_category)
                                            .sort((a, b) => b[1] - a[1])
                                            .map(([cat, sales]) => {
                                                const total = Object.values(data.sales_by_category).reduce((a, b) => a + b, 0)
                                                const pct = total > 0 ? (sales / total) * 100 : 0
                                                return (
                                                    <div key={cat} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                        <span style={{ color: T.subtext, fontSize: '13px', fontWeight: '600', textTransform: 'capitalize', minWidth: '100px' }}>{cat}</span>
                                                        <div style={{ flex: 1, height: '8px', background: '#e8e8ed', borderRadius: '4px', overflow: 'hidden' }}>
                                                            <div style={{ width: `${pct}%`, height: '100%', background: T.accent3, borderRadius: '4px', transition: 'width 0.5s ease' }} />
                                                        </div>
                                                        <span style={{ color: T.accent3, fontWeight: '700', minWidth: '100px', textAlign: 'right', fontSize: '13px' }}>₱{sales.toLocaleString()}</span>
                                                    </div>
                                                )
                                            })}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Orders by Status */}
                        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: '16px', padding: '24px', marginBottom: '2rem', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
                                <BarChart3 size={18} color={T.accent2} />
                                <h2 style={{ color: T.text, fontSize: '16px', fontWeight: '700', margin: 0 }}>Orders by Status</h2>
                            </div>
                            {Object.entries(data.orders_by_status).length === 0 ? (
                                <p style={{ color: T.muted, fontSize: '13px' }}>No orders yet</p>
                            ) : (
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '12px' }}>
                                    {Object.entries(data.orders_by_status).map(([status, count]) => {
                                        const statusColors = {
                                            pending: '#f59e0b',
                                            confirmed: '#0066cc',
                                            processing: '#7c3aed',
                                            shipped: '#06b6d4',
                                            delivered: '#10b981',
                                            cancelled: '#ef4444',
                                        }
                                        return (
                                            <div key={status} style={{ background: '#f5f5f7', border: `1px solid ${statusColors[status]}30`, borderRadius: '12px', padding: '16px', textAlign: 'center' }}>
                                                <p style={{ color: statusColors[status], fontSize: '24px', fontWeight: '900', margin: '0 0 6px' }}>{count}</p>
                                                <p style={{ color: T.subtext, fontSize: '12px', textTransform: 'capitalize', margin: 0, fontWeight: '600' }}>{status}</p>
                                            </div>
                                        )
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Recent Orders */}
                        <div>
                            <h2 style={{ color: T.text, fontSize: '18px', fontWeight: '700', marginBottom: '1rem' }}>Recent Orders</h2>
                            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: '16px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                                {data.recent_orders.length === 0 ? (
                                    <p style={{ color: T.muted, fontSize: '13px', padding: '20px' }}>No orders yet</p>
                                ) : (
                                    data.recent_orders.map((order, idx) => (
                                        <div key={order.id} style={{ padding: '16px 20px', borderBottom: idx < data.recent_orders.length - 1 ? `1px solid ${T.border}` : 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <div>
                                                <p style={{ color: T.text, fontWeight: '600', fontSize: '15px', margin: 0 }}>Order #{order.id.slice(-8).toUpperCase()} — {order.user_name}</p>
                                                <p style={{ color: T.muted, fontSize: '13px', marginTop: '4px', margin: 0 }}>{new Date(order.created_at).toLocaleString()}</p>
                                            </div>
                                            <div style={{ textAlign: 'right' }}>
                                                <p style={{ color: T.accent2, fontWeight: '700', margin: 0, fontSize: '15px' }}>₱{parseFloat(order.total_price).toLocaleString()}</p>
                                                <span style={{ background: 'rgba(0,102,204,0.1)', color: T.accent, padding: '4px 12px', borderRadius: '6px', fontSize: '11px', fontWeight: '700', textTransform: 'capitalize', display: 'inline-block', marginTop: '4px' }}>{order.status}</span>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    )
}