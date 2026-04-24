import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Instagram, Facebook, Youtube, Twitter } from 'lucide-react'

// Payment card assets — adjust paths if your bundler resolves differently
import visaImg from '../assets/cards/visa.png'
import mastercardImg from '../assets/cards/mastercard.png'
import paypalImg from '../assets/cards/paypal.png'
import gcashImg from '../assets/cards/gcash.png'
import grabpayImg from '../assets/cards/grabpay.png'
import mayaImg from '../assets/cards/maya.png'

// Logo asset
import logoImg from '../../unbox-lab_logo.png'

// ── Data ──────────────────────────────────────────────────────────────────────

const NAV_STORE = [
    { label: 'Phones', to: '/?category=phones', isRoute: true },
    { label: 'Laptops', to: '/?category=laptops', isRoute: true },
    { label: 'Tablets', to: '/?category=tablets', isRoute: true },
]

const NAV_INFO = [
    { label: 'About', isRoute: false },
    { label: 'Blog', isRoute: false },
    { label: 'Contact Us', isRoute: false },
]

const NAV_LEGAL = [
    { label: 'Privacy', isRoute: false },
    { label: 'Refunds', isRoute: false },
    { label: 'Shipping', isRoute: false },
]

const SOCIALS = [
    { icon: Instagram, label: 'Instagram' },
    { icon: Facebook, label: 'Facebook' },
    { icon: Twitter, label: 'X' },
    { icon: Youtube, label: 'YouTube' },
]

const PAYMENT_CARDS = [
    { src: visaImg, alt: 'Visa' },
    { src: mastercardImg, alt: 'Mastercard' },
    { src: paypalImg, alt: 'PayPal' },
    { src: gcashImg, alt: 'GCash' },
    { src: grabpayImg, alt: 'GrabPay' },
    { src: mayaImg, alt: 'Maya' },
]

const FF = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif'

// ── Sub-components ────────────────────────────────────────────────────────────

/** Renders a single nav link — routes for Store items, static for the rest */
function NavLink({ item }) {
    const base = {
        color: '#6e6e73',
        fontSize: '14px',
        fontWeight: '400',
        textDecoration: 'none',
        fontFamily: FF,
        display: 'inline-block',
        transition: 'color 0.15s',
        cursor: 'pointer',
        background: 'none',
        border: 'none',
        padding: 0,
        textAlign: 'left',   // override browser-default center on <button>
        width: '100%',       // fill column so alignment is consistent
    }

    if (item.isRoute) {
        return (
            <Link
                to={item.to}
                style={base}
                onMouseEnter={e => e.currentTarget.style.color = '#111'}
                onMouseLeave={e => e.currentTarget.style.color = '#6e6e73'}
            >
                {item.label}
            </Link>
        )
    }

    return (
        <button
            type="button"
            style={base}
            onMouseEnter={e => e.currentTarget.style.color = '#111'}
            onMouseLeave={e => e.currentTarget.style.color = '#6e6e73'}
        >
            {item.label}
        </button>
    )
}

/** A single nav column with a heading and list of links */
function NavColumn({ heading, items }) {
    return (
        <div className="footer-nav-column" style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
            <p style={{
                fontSize: '14px',
                fontWeight: '600',
                color: '#111',
                marginBottom: '16px',
                fontFamily: FF,
            }}>
                {heading}
            </p>
            <nav style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {items.map(item => (
                    <NavLink key={item.label} item={item} />
                ))}
            </nav>
        </div>
    )
}

// ── Main Footer ───────────────────────────────────────────────────────────────
export default function Footer() {
    const [email, setEmail] = useState('')
    const [socialHover, setSocialHover] = useState(null)
    const navigate = useNavigate()

    return (
        <>
            <style>{`
                .footer-subscribe-btn:hover {
                    background: #0077ed !important;
                }
                .footer-email-input:focus {
                    outline: none;
                    border-color: #0066cc !important;
                    box-shadow: 0 0 0 3px rgba(0, 102, 204, 0.08);
                }
                .footer-card-img {
                    height: 24px;
                    object-fit: contain;
                    display: block;
                    filter: grayscale(0%);
                    transition: opacity 0.15s;
                }
                .footer-card-img:hover {
                    opacity: 0.75;
                }
                @media (max-width: 900px) {
                    .footer-top-grid {
                        grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) !important;
                        gap: 2.5rem !important;
                    }
                    .footer-brand-col {
                        grid-column: 1 / -1;
                    }
                    .footer-links-grid {
                        grid-column: 1 / 2;
                    }
                    .footer-newsletter-col {
                        grid-column: 2 / 3;
                    }
                }
                @media (max-width: 560px) {
                    .footer-top-grid {
                        grid-template-columns: 1fr !important;
                        gap: 1.75rem !important;
                    }
                    .footer-shell {
                        padding: 36px 20px 28px !important;
                    }
                    .footer-brand-col {
                        order: 1;
                    }
                    .footer-newsletter-col {
                        order: 2;
                        grid-column: auto !important;
                    }
                    .footer-brand-copy {
                        max-width: none !important;
                    }
                    .footer-links-grid {
                        order: 3;
                        grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
                        gap: 24px 18px !important;
                    }
                    .footer-nav-column:last-child {
                        grid-column: 1 / -1;
                    }
                    .footer-newsletter-col {
                        gap: 16px !important;
                    }
                    .footer-newsletter-title {
                        font-size: 16px !important;
                    }
                    .footer-newsletter-row {
                        flex-direction: column !important;
                    }
                    .footer-newsletter-row input,
                    .footer-newsletter-row button {
                        width: 100% !important;
                    }
                    .footer-newsletter-row button {
                        justify-content: center !important;
                    }
                    .footer-social-row {
                        gap: 12px !important;
                    }
                    .footer-brand-button {
                        gap: 12px !important;
                        margin-bottom: 12px !important;
                    }
                    .footer-brand-logo {
                        height: 34px !important;
                    }
                    .footer-brand-name {
                        font-size: 17px !important;
                        line-height: 1.05 !important;
                    }
                    .footer-bottom-bar {
                        flex-direction: column !important;
                        align-items: center !important;
                        text-align: center !important;
                        gap: 14px !important;
                    }
                    .footer-bottom-right {
                        display: block !important;
                    }
                    .footer-cards-row {
                        flex-wrap: wrap !important;
                        justify-content: center !important;
                        gap: 10px !important;
                    }
                    .footer-bottom-copy {
                        white-space: normal !important;
                    }
                    .footer-bottom-shell {
                        padding: 16px 20px 20px !important;
                    }
                }
            `}</style>

            <footer style={{
                background: '#fff',
                borderTop: '1px solid #d2d2d7',
                fontFamily: FF,
            }}>
                {/* ── Top section ── */}
                <div className="footer-shell" style={{
                    maxWidth: '980px',
                    margin: '0 auto',
                    padding: '52px 22px 40px',
                }}>
                    <div
                        className="footer-top-grid"
                        style={{
                            display: 'grid',
                            gridTemplateColumns: '240px minmax(0, 1fr) 280px',
                            gap: '2rem',
                            alignItems: 'start',
                        }}
                    >
                        {/* Brand column */}
                        <div className="footer-brand-col">
                            <button
                                className="footer-brand-button"
                                type="button"
                                onClick={() => navigate('/')}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '10px',
                                    background: 'none',
                                    border: 'none',
                                    cursor: 'pointer',
                                    padding: 0,
                                    marginBottom: '16px',
                                }}
                            >
                                <img
                                    src={logoImg}
                                    alt="Unbox Lab logo"
                                    className="footer-brand-logo"
                                    style={{ height: '36px', width: 'auto', objectFit: 'contain' }}
                                />
                                <span className="footer-brand-name" style={{
                                    fontSize: '20px',
                                    fontWeight: '700',
                                    color: '#111',
                                    letterSpacing: '-0.02em',
                                    lineHeight: 1,
                                }}>
                                    unbox lab
                                </span>
                            </button>
                            <p className="footer-brand-copy" style={{
                                fontSize: '13px',
                                color: '#6e6e73',
                                lineHeight: '1.65',
                                maxWidth: '200px',
                                margin: 0,
                            }}>
                                Shop high-performance tech built for real life — smart, durable, and ready to handle everything you do.
                            </p>
                        </div>

                        {/* Newsletter + social column */}
                        <div className="footer-newsletter-col" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            <p className="footer-newsletter-title" style={{
                                fontSize: '18px',
                                fontWeight: '700',
                                color: '#111',
                                letterSpacing: '-0.02em',
                                margin: 0,
                            }}>
                                Stay in the Loop
                            </p>

                            {/* Email subscribe */}
                            <div className="footer-newsletter-row" style={{ display: 'flex', gap: '8px', alignItems: 'stretch' }}>
                                <input
                                    className="footer-email-input"
                                    type="email"
                                    placeholder="Your Email"
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    style={{
                                        flex: 1,
                                        minWidth: 0,
                                        border: '1px solid #d2d2d7',
                                        borderRadius: '10px',
                                        padding: '9px 13px',
                                        fontSize: '13px',
                                        color: '#111',
                                        background: '#fff',
                                        fontFamily: FF,
                                        transition: 'border-color 0.2s, box-shadow 0.2s',
                                    }}
                                />
                                <button
                                    type="button"
                                    className="footer-subscribe-btn"
                                    style={{
                                        background: '#0066cc',
                                        color: '#fff',
                                        border: 'none',
                                        borderRadius: '10px',
                                        padding: '9px 14px',
                                        fontSize: '13px',
                                        fontWeight: '600',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '5px',
                                        whiteSpace: 'nowrap',
                                        transition: 'background 0.15s',
                                        flexShrink: 0,
                                        fontFamily: FF,
                                    }}
                                >
                                    Subscribe
                                    <svg
                                        width="14" height="14" viewBox="0 0 24 24"
                                        fill="none" stroke="currentColor"
                                        strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                                        style={{ marginLeft: '1px' }}
                                    >
                                        <path d="M5 12h14M12 5l7 7-7 7" />
                                    </svg>
                                </button>
                            </div>

                            {/* Social icons */}
                            <div className="footer-social-row" style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                                {SOCIALS.map(({ icon: Icon, label }) => (
                                    <button
                                        key={label}
                                        type="button"
                                        aria-label={label}
                                        onMouseEnter={() => setSocialHover(label)}
                                        onMouseLeave={() => setSocialHover(null)}
                                        style={{
                                            width: '40px',
                                            height: '40px',
                                            borderRadius: '10px',
                                            border: '1px solid #d2d2d7',
                                            background: socialHover === label ? '#f5f5f7' : '#fff',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            transition: 'background 0.15s, border-color 0.15s, box-shadow 0.2s, transform 0.2s',
                                            flexShrink: 0,
                                            boxShadow: socialHover === label
                                                ? '0 6px 18px rgba(0, 0, 0, 0.13), 0 2px 6px rgba(0, 0, 0, 0.08)'
                                                : '0 2px 6px rgba(0, 0, 0, 0.07), 0 1px 2px rgba(0, 0, 0, 0.05)',
                                            transform: socialHover === label ? 'translateY(-2px)' : 'translateY(0)',
                                        }}
                                    >
                                        <Icon
                                            size={17}
                                            color={socialHover === label ? '#111' : '#444'}
                                            strokeWidth={1.75}
                                        />
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Nav columns */}
                        <div
                            className="footer-links-grid"
                            style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
                                gap: '2rem',
                            }}
                        >
                            <NavColumn heading="Store" items={NAV_STORE} />
                            <NavColumn heading="Info" items={NAV_INFO} />
                            <NavColumn heading="Legal" items={NAV_LEGAL} />
                        </div>
                    </div>
                </div>

                {/* ── Bottom bar ── */}
                <div className="footer-bottom-shell" style={{
                    borderTop: '1px solid #d2d2d7',
                    maxWidth: '980px',
                    margin: '0 auto',
                    padding: '16px 22px',
                }}>
                    <div
                        className="footer-bottom-bar"
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: '16px',
                        }}
                    >
                        {/* Copyright */}
                        <p className="footer-bottom-copy" style={{
                            fontSize: '12px',
                            color: '#6e6e73',
                            margin: 0,
                            whiteSpace: 'nowrap',
                            flexShrink: 0,
                        }}>
                            Copyright @ {new Date().getFullYear()} Unbox Lab Inc.
                        </p>

                        {/* Payment cards */}
                        <div
                            className="footer-cards-row"
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px',
                            }}
                        >
                            {PAYMENT_CARDS.map(card => (
                                <img
                                    key={card.alt}
                                    src={card.src}
                                    alt={card.alt}
                                    className="footer-card-img"
                                />
                            ))}
                        </div>

                        {/* Region */}
                        <p
                            className="footer-bottom-right"
                            style={{
                                fontSize: '12px',
                                color: '#6e6e73',
                                margin: 0,
                                whiteSpace: 'nowrap',
                                flexShrink: 0,
                            }}
                        >
                            Philippines
                        </p>
                    </div>
                </div>
            </footer>
        </>
    )
}
