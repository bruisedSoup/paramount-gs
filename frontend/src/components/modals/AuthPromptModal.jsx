import { useNavigate } from 'react-router-dom'
import { X, ShoppingBag, LogIn, UserPlus, Sparkles } from 'lucide-react'

export default function AuthPromptModal({ onClose }) {
    const navigate = useNavigate()

    const go = (path) => {
        onClose()
        navigate(path)
    }

    return (
        <div
            onClick={onClose}
            style={{
                position: 'fixed', inset: 0,
                background: 'rgba(0,0,0,0.85)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                zIndex: 2000, padding: '1rem',
                backdropFilter: 'blur(4px)',
            }}>
            <div
                onClick={e => e.stopPropagation()}
                style={{
                    background: '#111118',
                    border: '1px solid #1e1e2e',
                    borderRadius: '20px',
                    padding: '40px 36px',
                    width: '100%', maxWidth: '420px',
                    position: 'relative',
                    boxShadow: '0 24px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(0,229,255,0.06)',
                }}>

                {/* Close */}
                <button onClick={onClose}
                    style={{ position: 'absolute', top: '16px', right: '16px', background: 'rgba(255,255,255,0.05)', border: 'none', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', color: '#475569', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <X size={15} />
                </button>

                {/* Icon */}
                <div style={{ width: '64px', height: '64px', background: 'linear-gradient(135deg, rgba(0,229,255,0.15), rgba(0,229,255,0.05))', border: '1px solid rgba(0,229,255,0.2)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
                    <ShoppingBag size={28} color='#00e5ff' />
                </div>

                {/* Heading */}
                <h2 style={{ color: '#fff', fontSize: '22px', fontWeight: '900', marginBottom: '8px', lineHeight: 1.2 }}>
                    Ready to order?
                </h2>
                <p style={{ color: '#64748b', fontSize: '14px', lineHeight: '1.6', marginBottom: '28px' }}>
                    Sign in to your account to add items to your cart and start shopping at <span style={{ color: '#00e5ff', fontWeight: '700' }}>Paramount Gadget</span>.
                </p>

                {/* Perks */}
                <div style={{ background: '#0d0d14', borderRadius: '10px', padding: '14px 16px', marginBottom: '24px', border: '1px solid #1a1a28' }}>
                    {[
                        '🛒 Save items to your cart',
                        '📦 Track your orders in real-time',
                        '⭐ Rate & review purchased products',
                        '💬 Comment on product updates',
                    ].map((perk, i) => (
                        <p key={i} style={{ color: '#94a3b8', fontSize: '13px', marginBottom: i < 3 ? '8px' : 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                            {perk}
                        </p>
                    ))}
                </div>

                {/* Buttons */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <button onClick={() => go('/login')}
                        style={{ width: '100%', background: '#00e5ff', color: '#000', border: 'none', borderRadius: '10px', padding: '13px', fontWeight: '800', fontSize: '15px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', letterSpacing: '0.3px' }}>
                        <LogIn size={17} /> Sign In
                    </button>
                    <button onClick={() => go('/register')}
                        style={{ width: '100%', background: 'transparent', color: '#00e5ff', border: '1px solid rgba(0,229,255,0.3)', borderRadius: '10px', padding: '12px', fontWeight: '700', fontSize: '15px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                        <UserPlus size={17} /> Create Account
                    </button>
                    <button onClick={onClose}
                        style={{ width: '100%', background: 'transparent', color: '#475569', border: 'none', padding: '8px', fontWeight: '500', fontSize: '13px', cursor: 'pointer' }}>
                        Continue browsing
                    </button>
                </div>
            </div>
        </div>
    )
}