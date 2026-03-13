import React from 'react'

import phonesImg from '../assets/phones.jpg'
import laptopsImg from '../assets/laptops.png'
import tabletsImg from '../assets/tablets.jpg'
import accessoriesImg from '../assets/accessories.png'
import audioImg from '../assets/audio.png'
import camerasImg from '../assets/camera.jpg'
import gamingImg from '../assets/gaming.jpg'

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
            </div>
        </div>
    )
}