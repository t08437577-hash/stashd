import { useState } from 'react'

// ── TOAST ─────────────────────────────────────────────────────────────────────
export function Toast({ msg }) {
  return (
    <div style={{
      position: 'fixed', bottom: 96, left: '50%', transform: 'translateX(-50%)',
      background: 'var(--bg4)', color: 'var(--heading)',
      border: '1px solid var(--line2)',
      padding: '10px 18px', borderRadius: 'var(--r-full)',
      fontSize: 13, fontWeight: 500, zIndex: 9000,
      opacity: msg ? 1 : 0, transition: 'opacity .2s',
      pointerEvents: 'none', whiteSpace: 'nowrap',
      boxShadow: 'var(--shadow-lg)',
    }}>{msg}</div>
  )
}

// ── SPINNER ───────────────────────────────────────────────────────────────────
export function Spinner({ size = 20 }) {
  return (
    <div style={{ width: size, height: size, border: `2px solid var(--line2)`, borderTopColor: 'var(--gold)', borderRadius: '50%', animation: 'spin .7s linear infinite', flexShrink: 0 }}/>
  )
}

// ── BUTTON ────────────────────────────────────────────────────────────────────
export function Btn({ onClick, children, variant = 'primary', size = 'md', disabled, full, style = {} }) {
  const base = {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    gap: 8, fontWeight: 600, borderRadius: 'var(--r-sm)', border: 'none',
    transition: 'all .15s', cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? .45 : 1, width: full ? '100%' : undefined,
    ...style,
  }
  const sizes = {
    sm: { padding: '7px 14px', fontSize: 12 },
    md: { padding: '11px 20px', fontSize: 14 },
    lg: { padding: '14px 24px', fontSize: 15 },
  }
  const variants = {
    primary:  { background: 'var(--gold)',   color: '#0F0E0C' },
    danger:   { background: 'var(--rust)',   color: '#fff'    },
    ghost:    { background: 'var(--bg3)',    color: 'var(--body)', border: '1px solid var(--line2)' },
    outline:  { background: 'transparent',  color: 'var(--gold)', border: '1px solid var(--gold2)' },
    dark:     { background: 'var(--bg4)',    color: 'var(--body)', border: '1px solid var(--line2)' },
  }
  return (
    <button onClick={!disabled ? onClick : undefined} style={{ ...base, ...sizes[size], ...variants[variant] }}>
      {children}
    </button>
  )
}

// ── CHIP / FILTER ─────────────────────────────────────────────────────────────
export function Chip({ active, onClick, count, children }) {
  return (
    <button onClick={onClick} style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '6px 14px', borderRadius: 'var(--r-full)',
      border: `1px solid ${active ? 'var(--gold2)' : 'var(--line2)'}`,
      background: active ? 'var(--gold-dim)' : 'transparent',
      color: active ? 'var(--gold)' : 'var(--subtle)',
      fontSize: 13, fontWeight: active ? 600 : 400, whiteSpace: 'nowrap',
      transition: 'all .12s',
    }}>
      {children}
      {count !== undefined && <span style={{ fontFamily: 'var(--font-m)', fontSize: 10, opacity: .7 }}>{count}</span>}
    </button>
  )
}

// ── PROGRESS BAR ──────────────────────────────────────────────────────────────
export function ProgressBar({ pct, h = 3, color = 'var(--gold)' }) {
  return (
    <div style={{ height: h, background: 'var(--bg4)', borderRadius: 999, overflow: 'hidden' }}>
      <div style={{ height: h, width: `${pct}%`, background: color, borderRadius: 999, transition: 'width .5s ease' }}/>
    </div>
  )
}

// ── BADGE ─────────────────────────────────────────────────────────────────────
const BADGE_STYLES = {
  gold:  { bg: 'var(--gold-dim)',  color: 'var(--gold)'  },
  rust:  { bg: 'var(--rust-dim)', color: 'var(--rust)'  },
  sage:  { bg: 'var(--sage-dim)', color: '#6BAD88'       },
  blue:  { bg: 'var(--blue-dim)', color: '#7AAEE0'       },
  muted: { bg: 'var(--bg4)',      color: 'var(--muted)'  },
  green: { bg: 'rgba(74,158,107,0.15)', color: 'var(--green)' },
  red:   { bg: 'rgba(217,79,79,0.15)',  color: 'var(--red)'   },
}
export function Badge({ variant = 'gold', children, style = {} }) {
  const s = BADGE_STYLES[variant] || BADGE_STYLES.gold
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', padding: '3px 9px', borderRadius: 'var(--r-full)', fontSize: 11, fontWeight: 600, letterSpacing: '.3px', background: s.bg, color: s.color, ...style }}>
      {children}
    </span>
  )
}

// ── ICON TOGGLE BUTTON ────────────────────────────────────────────────────────
export function IconToggle({ active, activeColor = 'gold', onClick, children, style = {} }) {
  const colors = { gold: 'var(--gold)', rust: 'var(--rust)', sage: 'var(--sage)', blue: 'var(--blue)' }
  const ac = colors[activeColor] || colors.gold
  return (
    <button onClick={onClick} style={{
      width: 36, height: 36, borderRadius: 'var(--r-sm)',
      border: `1px solid ${active ? ac + '60' : 'var(--line2)'}`,
      background: active ? ac + '1A' : 'var(--bg3)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: active ? ac : 'var(--muted)',
      transition: 'all .12s', ...style,
    }}>
      {children}
    </button>
  )
}

// ── SECTION HEADER ────────────────────────────────────────────────────────────
export function SectionHeader({ title, action, actionLabel }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', padding: '20px 20px 12px' }}>
      <div style={{ fontFamily: 'var(--font-d)', fontSize: 18, fontWeight: 700, color: 'var(--heading)' }}>{title}</div>
      {action && <button onClick={action} style={{ fontSize: 12, color: 'var(--gold)', background: 'none', border: 'none', fontWeight: 500 }}>{actionLabel}</button>}
    </div>
  )
}

// ── CARD ──────────────────────────────────────────────────────────────────────
export function Card({ children, style = {}, onClick }) {
  return (
    <div onClick={onClick} style={{
      background: 'var(--bg2)', border: '1px solid var(--line)',
      borderRadius: 'var(--r-lg)', overflow: 'hidden',
      cursor: onClick ? 'pointer' : undefined,
      transition: onClick ? 'border-color .12s' : undefined,
      ...style,
    }}>
      {children}
    </div>
  )
}

// ── CONDITION BADGE ───────────────────────────────────────────────────────────
const COND = {
  Mint: { bg: 'rgba(74,158,107,0.15)', color: 'var(--green)' },
  Good: { bg: 'var(--blue-dim)',       color: '#7AAEE0'       },
  Fair: { bg: 'var(--gold-dim)',       color: 'var(--gold)'   },
  Worn: { bg: 'var(--rust-dim)',       color: 'var(--rust)'   },
}
export function CondBadge({ cond }) {
  if (!cond) return null
  const s = COND[cond] || COND.Fair
  return <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 7px', borderRadius: 'var(--r-full)', background: s.bg, color: s.color, letterSpacing: '.3px' }}>{cond}</span>
}

// ── DIVIDER ───────────────────────────────────────────────────────────────────
export function Divider() {
  return <div style={{ height: 1, background: 'var(--line)', margin: '0' }}/>
}

// ── EMPTY STATE ───────────────────────────────────────────────────────────────
export function EmptyState({ icon = '📦', title, body, action, actionLabel }) {
  return (
    <div style={{ padding: '32px 24px', textAlign: 'center' }}>
      <div style={{ fontSize: 36, marginBottom: 12 }}>{icon}</div>
      <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--heading)', marginBottom: 6 }}>{title}</div>
      <div style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.6, marginBottom: action ? 18 : 0 }}>{body}</div>
      {action && <Btn onClick={action} size="sm">{actionLabel}</Btn>}
    </div>
  )
}

// ── CSS KEYFRAME INJECTION ────────────────────────────────────────────────────
if (typeof document !== 'undefined' && !document.getElementById('stashd-keyframes')) {
  const style = document.createElement('style')
  style.id = 'stashd-keyframes'
  style.textContent = `@keyframes spin { to { transform: rotate(360deg) } } @keyframes fadeUp { from { opacity:0; transform:translateY(8px) } to { opacity:1; transform:translateY(0) } }`
  document.head.appendChild(style)
}
