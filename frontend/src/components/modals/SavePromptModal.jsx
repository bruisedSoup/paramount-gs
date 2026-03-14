import { useNavigate } from 'react-router-dom'
import { X, Heart, LogIn, UserPlus } from 'lucide-react'

export default function SavePromptModal({ onClose }) {
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
                background: 'rgba(0,0,0,0.45)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                zIndex: 2000, padding: '1rem',
                backdropFilter: 'blur(8px)',
            }}
        >
            <div
                onClick={e => e.stopPropagation()}
                style={{
                    background: '#fff',
                    border: '1px solid #d2d2d7',
                    borderRadius: '20px',
                    padding: '40px 36px',
                    width: '100%', maxWidth: '380px',
                    position: 'relative',
                    boxShadow: '0 24px 60px rgba(0,0,0,0.15)',
                    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
                }}
            >
                {/* Close */}
                <button
                    onClick={onClose}
                    style={{
                        position: 'absolute', top: '16px', right: '16px',
                        background: '#f5f5f7', border: 'none', borderRadius: '50%',
                        width: '32px', height: '32px', cursor: 'pointer',
                        color: '#6e6e73', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                >
                    <X size={15} />
                </button>

                {/* Icon */}
                <div style={{
                    width: '60px', height: '60px',
                    background: 'rgba(224,91,91,0.08)',
                    border: '1px solid rgba(224,91,91,0.18)',
                    borderRadius: '16px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    marginBottom: '20px',
                }}>
                    <Heart size={26} color='#e05b5b' fill='#e05b5b' />
                </div>

                {/* Heading */}
                <h2 style={{ color: '#111', fontSize: '22px', fontWeight: '800', marginBottom: '8px', lineHeight: 1.2, letterSpacing: '-0.02em' }}>
                    Save this product
                </h2>
                <p style={{ color: '#6e6e73', fontSize: '14px', lineHeight: '1.6', marginBottom: '24px' }}>
                    Sign in to save products to your wishlist and access them anytime from your{' '}
                    <span style={{ color: '#0066cc', fontWeight: '700' }}>Shopping Bag</span>.
                </p>

                {/* Perks */}
                <div style={{
                    background: '#f5f5f7', borderRadius: '12px',
                    padding: '14px 16px', marginBottom: '24px',
                    border: '1px solid #e8e8ed',
                }}>
                    {[
                        '♥ Save unlimited products',
                        '🛍️ Access saves from your bag',
                        '🔔 Get notified when stock changes',
                        '📦 Buy saved items anytime',
                    ].map((perk, i) => (
                        <p key={i} style={{
                            color: '#444', fontSize: '13px',
                            marginBottom: i < 3 ? '8px' : 0,
                            display: 'flex', alignItems: 'center', gap: '8px',
                        }}>
                            {perk}
                        </p>
                    ))}
                </div>

                {/* Buttons */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <button
                        onClick={() => go('/login')}
                        style={{
                            width: '100%', background: '#0066cc', color: '#fff',
                            border: 'none', borderRadius: '12px', padding: '13px',
                            fontWeight: '700', fontSize: '15px', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            gap: '8px', letterSpacing: '-0.01em', transition: 'background 0.15s',
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = '#0077ed'}
                        onMouseLeave={e => e.currentTarget.style.background = '#0066cc'}
                    >
                        <LogIn size={17} /> Sign In
                    </button>
                    <button
                        onClick={() => go('/register')}
                        style={{
                            width: '100%', background: '#f5f5f7', color: '#0066cc',
                            border: '1px solid #d2d2d7', borderRadius: '12px', padding: '12px',
                            fontWeight: '700', fontSize: '15px', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            gap: '8px', transition: 'background 0.15s',
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = '#e8e8ed'}
                        onMouseLeave={e => e.currentTarget.style.background = '#f5f5f7'}
                    >
                        <UserPlus size={17} /> Create Account
                    </button>
                    <button
                        onClick={onClose}
                        style={{
                            width: '100%', background: 'transparent', color: '#8f8f94',
                            border: 'none', padding: '8px', fontWeight: '500',
                            fontSize: '13px', cursor: 'pointer',
                        }}
                    >
                        Continue browsing
                    </button>
                </div>
            </div>
        </div>
    )
}