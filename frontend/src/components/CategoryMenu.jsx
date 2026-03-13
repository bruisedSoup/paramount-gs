import React from 'react'

import phonesImg from '../assets/phones.png'
import laptopsImg from '../assets/laptops.png'
import tabletsImg from '../assets/tablets.png'
import accessoriesImg from '../assets/accessories.png'
import audioImg from '../assets/audio.png'
import camerasImg from '../assets/camera.png'
import gamingImg from '../assets/gaming.png'

export const categoryImages = {
    phones: phonesImg,
    laptops: laptopsImg,
    tablets: tabletsImg,
    accessories: accessoriesImg,
    audio: audioImg,
    cameras: camerasImg,
    gaming: gamingImg,
}

export default function CategoryMenu({ categories = [], selectedCategory, onSelect }) {
    return (
        <div style={{
            overflowX: 'auto',
            overflowY: 'hidden',
            WebkitOverflowScrolling: 'touch',
            scrollbarWidth: 'none', // Firefox
            msOverflowStyle: 'none', // IE/Edge
            padding: 'clamp(1.5rem, 4vw, 2rem) 0',
            marginBottom: 'clamp(1.5rem, 3vw, 2rem)',
        }}>
            <style>
                {`
                    div::-webkit-scrollbar {
                        display: none;
                    }
                `}
            </style>
            <div style={{
                display: 'flex',
                gap: 'clamp(1.5rem, 4vw, 3rem)',
                justifyContent: 'flex-start',
                paddingLeft: '4px',
                paddingRight: '4px',
            }}>
                {categories.filter(cat => cat !== 'All').map(cat => (
                    <button
                        key={cat}
                        onClick={() => onSelect(cat)}
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '8px',
                            cursor: 'pointer',
                            opacity: selectedCategory === cat || selectedCategory === 'All' ? 1 : 0.55,
                            transition: 'opacity 0.2s, transform 0.2s',
                            background: 'none',
                            border: 'none',
                            padding: '0 clamp(8px, 2vw, 12px)',
                            minWidth: 'clamp(72px, 14vw, 100px)',
                            flexShrink: 0,
                        }}
                        onMouseEnter={e => {
                            e.currentTarget.style.opacity = '1'
                            e.currentTarget.style.transform = 'translateY(-2px)'
                        }}
                        onMouseLeave={e => {
                            e.currentTarget.style.opacity = selectedCategory === cat ? '1' : '0.55'
                            e.currentTarget.style.transform = 'translateY(0)'
                        }}
                    >
                        <img
                            src={categoryImages[cat]}
                            alt={cat}
                            style={{
                                width: 'clamp(72px, 14vw, 96px)',
                                height: 'clamp(72px, 14vw, 96px)',
                                objectFit: 'contain',
                            }}
                        />
                        <span style={{
                            fontSize: 'clamp(13px, 2.2vw, 15px)',
                            fontWeight: selectedCategory === cat ? '700' : '500',
                            color: selectedCategory === cat ? '#111' : '#444',
                            textTransform: 'capitalize',
                            textAlign: 'center',
                            lineHeight: 1.2,
                            transition: 'color 0.2s, font-weight 0.2s',
                        }}>
                            {cat}
                        </span>
                    </button>
                ))}

                {/* Right arrow button — Apple-style */}
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    paddingLeft: '4px',
                    paddingRight: '8px',
                }}>
                    <button
                        style={{
                            width: 'clamp(36px, 5vw, 44px)',
                            height: 'clamp(36px, 5vw, 44px)',
                            borderRadius: '50%',
                            background: '#e8e8ed',
                            border: 'none',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'background 0.2s, transform 0.2s',
                            flexShrink: 0,
                        }}
                        onMouseEnter={e => {
                            e.currentTarget.style.background = '#d1d1d6'
                            e.currentTarget.style.transform = 'scale(1.08)'
                        }}
                        onMouseLeave={e => {
                            e.currentTarget.style.background = '#e8e8ed'
                            e.currentTarget.style.transform = 'scale(1)'
                        }}
                        aria-label="See all categories"
                    >
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M6 3L11 8L6 13" stroke="#555" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    )
}