// Plain SVG icons used throughout the report card. Colored emoji (👥 🏏 🔴
//🧤 🏆 👑 🤝 🎯) depend on the system's emoji font being available when
// html2canvas rasterizes the card for PNG/PDF export — that font often isn't
// loaded in time, so emoji silently render blank in the downloaded image
// even though they look fine on screen. Plain SVG shapes don't have that
// problem (confirmed by the crest/laurel icons elsewhere in this file).

export function IconPeople({ color = '#fff', size = 18 }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill={color}>
      <circle cx="8.5" cy="7.5" r="3" />
      <path d="M2 20c0-3.6 2.9-6.5 6.5-6.5S15 16.4 15 20z" />
      <circle cx="17" cy="8.5" r="2.4" opacity="0.85" />
      <path d="M13.3 20c.1-2.1.9-3.9 2.1-5.1c.5-.1 1-.2 1.6-.2c3 0 5.5 2.5 5.5 5.3z" opacity="0.85" />
    </svg>
  )
}

export function IconBat({ color = '#fff', size = 18 }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size}>
      <g transform="rotate(24 12 12)">
        <rect x="9" y="9.2" width="6" height="12.8" rx="1.3" fill={color} />
        <rect x="9" y="17.7" width="6" height="4.3" rx="1.3" fill="rgba(0,0,0,0.14)" />
        <line
          x1="12"
          y1="10.4"
          x2="12"
          y2="20.6"
          stroke="rgba(0,0,0,0.18)"
          strokeWidth="0.6"
        />
        <rect x="10.8" y="1.5" width="2.4" height="8.4" rx="1.2" fill={color} />
        <g stroke="rgba(0,0,0,0.32)" strokeWidth="0.7">
          <line x1="10.9" y1="3.8" x2="13.1" y2="3.8" />
          <line x1="10.9" y1="5.6" x2="13.1" y2="5.6" />
          <line x1="10.9" y1="7.4" x2="13.1" y2="7.4" />
        </g>
      </g>
    </svg>
  )
}

export function IconBall({ color = '#fff', size = 18 }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size}>
      <circle cx="12" cy="12" r="9" fill={color} />
      <path
        d="M6.5 6.5c2 1.6 3 4 3 5.5s-1 3.9-3 5.5"
        stroke="rgba(0,0,0,0.3)"
        strokeWidth="1.2"
        fill="none"
      />
      <path
        d="M17.5 6.5c-2 1.6-3 4-3 5.5s1 3.9 3 5.5"
        stroke="rgba(0,0,0,0.3)"
        strokeWidth="1.2"
        fill="none"
      />
      <g stroke="rgba(0,0,0,0.3)" strokeWidth="0.7" strokeLinecap="round">
        <path d="M7.6 8.1l1.1-.5M8.6 10.3l1.2-.3M9 12.3l1.3-.1M8.6 14.3l1.2.3M7.6 16.4l1.1.5" />
        <path d="M16.4 8.1l-1.1-.5M15.4 10.3l-1.2-.3M15 12.3l-1.3-.1M15.4 14.3l-1.2.3M16.4 16.4l-1.1.5" />
      </g>
    </svg>
  )
}

export function IconGlove({ color = '#fff', size = 18 }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill={color}>
      <path d="M5.3 12.8c0-.8.6-1.4 1.4-1.4s1.4.6 1.4 1.4v1.4h.6V7.6c0-.8.6-1.4 1.4-1.4s1.4.6 1.4 1.4v6.1h.6V6.4c0-.8.6-1.4 1.4-1.4s1.4.6 1.4 1.4v7.3h.6V7.9c0-.8.6-1.4 1.4-1.4s1.4.6 1.4 1.4v7.3c0 3.1-2.5 5.6-5.6 5.6h-.5c-2.9 0-5.3-2.4-5.3-5.3z" />
      <path
        d="M8.1 14.2V8.6M10.9 13.5V7.3M13.7 14.2V8.4"
        stroke="rgba(0,0,0,0.22)"
        strokeWidth="0.8"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M6.1 14.8c-.4.4-.6 1-.5 1.6"
        stroke="rgba(0,0,0,0.18)"
        strokeWidth="0.8"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  )
}

export function IconTrophy({ color = '#fff', size = 18 }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill={color}>
      <path d="M7 3h10v4a5 5 0 0 1-5 5a5 5 0 0 1-5-5z" />
      <path d="M5 4h2v3a3 3 0 0 1-3-3z" />
      <path d="M19 4h-2v3a3 3 0 0 0 3-3z" />
      <rect x="11" y="12" width="2" height="4" />
      <rect x="8" y="17" width="8" height="2" rx="1" />
      <rect x="9.5" y="15.5" width="5" height="2" rx="1" />
    </svg>
  )
}

export function IconCrown({ color = '#fff', size = 16 }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill={color}>
      <path d="M3 8l3.2 3L12 5l5.8 6L21 8l-1.6 9H4.6z" />
      <circle cx="3" cy="7" r="1.4" />
      <circle cx="12" cy="4.2" r="1.5" />
      <circle cx="21" cy="7" r="1.4" />
    </svg>
  )
}

export function IconHandshake({ color = '#fff', size = 16 }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill={color}>
      <path d="M2 11l5-4l4 2l3-2l5 3l2-1l1 2l-3 2l-4-2l-3 2l-4-2l-3 2z" />
      <path d="M3 12l4 5l3-2l3 2l4-5l-2-1l-3 3l-3-1l-3 1z" opacity="0.85" />
    </svg>
  )
}

export function IconTarget({ color = '#fff', size = 16 }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size}>
      <circle cx="12" cy="12" r="9" fill="none" stroke={color} strokeWidth="2" />
      <circle cx="12" cy="12" r="5" fill="none" stroke={color} strokeWidth="2" />
      <circle cx="12" cy="12" r="1.8" fill={color} />
    </svg>
  )
}

const MEDAL_COLORS = {
  gold: { base: '#d4a017', shine: '#ffe49a', ribbon: '#b91c1c' },
  silver: { base: '#9aa5b1', shine: '#f2f5f8', ribbon: '#3b4a5a' },
  bronze: { base: '#b06a35', shine: '#e3a978', ribbon: '#5c3a1e' },
}

export function IconMedal({ tier = 'gold', size = 22 }) {
  const c = MEDAL_COLORS[tier] || MEDAL_COLORS.gold
  return (
    <svg viewBox="0 0 24 24" width={size} height={size}>
      <path d="M8.3 2h3.4l1.8 7.2l-3 1.8z" fill={c.ribbon} opacity="0.9" />
      <path d="M15.7 2h-3.4l-1.8 7.2l3 1.8z" fill={c.ribbon} opacity="0.7" />
      <circle cx="12" cy="14" r="8.3" fill={c.base} stroke="rgba(0,0,0,0.25)" strokeWidth="0.5" />
      <circle cx="12" cy="14" r="8.3" fill="none" stroke={c.shine} strokeWidth="1" opacity="0.55" />
      <path
        d="M12 9.3l1.2 2.4l2.6.4l-1.9 1.9l.4 2.6l-2.3-1.2l-2.3 1.2l.4-2.6l-1.9-1.9l2.6-.4z"
        fill={c.shine}
      />
    </svg>
  )
}

export function IconFaceHappy({ size = 24 }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size}>
      <circle cx="12" cy="12" r="10" fill="#ffd34d" stroke="#c98a0a" strokeWidth="0.7" />
      <circle cx="8.6" cy="10.2" r="1.3" fill="#3a2a05" />
      <circle cx="15.4" cy="10.2" r="1.3" fill="#3a2a05" />
      <path
        d="M7.5 14c1 2.1 3 3.2 4.5 3.2s3.5-1.1 4.5-3.2"
        fill="none"
        stroke="#3a2a05"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  )
}

export function IconFaceSad({ size = 24 }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size}>
      <circle cx="12" cy="12" r="10" fill="#9bb4d1" stroke="#45607f" strokeWidth="0.7" />
      <circle cx="8.6" cy="10.4" r="1.3" fill="#1c2b3a" />
      <circle cx="15.4" cy="10.4" r="1.3" fill="#1c2b3a" />
      <path
        d="M7.5 17c1-2.1 3-3.2 4.5-3.2s3.5 1.1 4.5 3.2"
        fill="none"
        stroke="#1c2b3a"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <path d="M6.3 9.5l2.3-1" stroke="#1c2b3a" strokeWidth="1" strokeLinecap="round" opacity="0.6" />
      <path d="M17.7 9.5l-2.3-1" stroke="#1c2b3a" strokeWidth="1" strokeLinecap="round" opacity="0.6" />
    </svg>
  )
}
