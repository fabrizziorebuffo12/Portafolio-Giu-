import { useEffect, useRef, useState } from 'react'

// Placeholder projects — swap `poster`/`video` for Giulia's real interior
// design photography and clips as soon as she sends them.
const projects = [
  {
    id: 1, title: 'Sala minimalista', color: '#c9c2ea',
    poster: 'https://picsum.photos/seed/giulia-living/900/700',
    video: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
  },
  {
    id: 2, title: 'Cocina contemporánea', color: '#f0c9c9',
    poster: 'https://picsum.photos/seed/giulia-kitchen/700/600',
    video: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
  },
  {
    id: 3, title: 'Habitación principal', color: '#cfe8f2',
    poster: 'https://picsum.photos/seed/giulia-bedroom/700/600',
    video: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
  },
  {
    id: 4, title: 'Comedor', color: '#f5e8ad',
    poster: 'https://picsum.photos/seed/giulia-dining/900/700',
    video: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
  },
  {
    id: 5, title: 'Oficina en casa', color: '#a9d2c4',
    poster: 'https://picsum.photos/seed/giulia-office/700/600',
    video: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
  },
  {
    id: 6, title: 'Terraza', color: '#e6d6ee',
    poster: 'https://picsum.photos/seed/giulia-terrace/500/500',
    video: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
  },
]

const CARD_W = 240
const CARD_H = 200

// --- Gufram-style camera flythrough ---
// Cards sit at FIXED positions in a 3D field (fixed angle out from center,
// fixed lateral radius, fixed base depth spacing). A single shared "camera"
// value moves forward through the field. Scrolling the wheel moves the
// camera; it also drifts forward slowly on its own. Each card's apparent
// depth = its base depth minus the camera position, wrapped into a fixed
// range so the 6 cards loop endlessly (near -> pass -> respawn far).
const DEPTH_SPAN = 9        // total depth range the field wraps over
const Z_NEAR = 0.6          // closest before it has flown past the viewer
const FOCAL = 3.0           // perspective focal length
const AUTO_SPEED = 0.35     // depth units/sec the camera drifts on its own
const WHEEL_SENSITIVITY = 0.0016 // how much one wheel notch moves the camera
const CAM_LERP = 0.08       // smooths scroll so it glides instead of jerks
const HOVER_TARGET_SCALE = 1.35
const HOVER_LERP = 0.14

// Fixed layout per card: spread around the circle, varied radius, evenly
// spaced base depths so at any moment there's a mix of near and far.
const layout = projects.map((p, i) => {
  const angle = (i / projects.length) * Math.PI * 2 + 0.5
  return {
    angle,
    radius: 0.30 + (i % 3) * 0.16, // how far off-center it drifts out to
    baseDepth: (i / projects.length) * DEPTH_SPAN, // staggered along Z
    rot: (i % 2 === 0 ? 1 : -1) * (4 + (i % 3) * 2),
  }
})

function App() {
  const zoneRef = useRef(null)
  const wrapRefs = useRef({})
  const videoRefs = useRef({})
  const hoveredIdRef = useRef(null)
  const [hoveredId, setHoveredId] = useState(null)
  const camRef = useRef(0)        // eased camera position (actual)
  const camTargetRef = useRef(0)  // where the camera wants to be (scroll adds here)
  const hoverScales = useRef({})

  useEffect(() => {
    const zone = zoneRef.current
    if (!zone) return
    const rect = () => zone.getBoundingClientRect()

    projects.forEach((p) => { hoverScales.current[p.id] = 1 })

    // Wheel scroll nudges the camera target forward/backward.
    const onWheel = (e) => {
      e.preventDefault()
      camTargetRef.current += e.deltaY * WHEEL_SENSITIVITY
    }
    zone.addEventListener('wheel', onWheel, { passive: false })

    let raf
    let last = performance.now()

    const tick = (now) => {
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      const r = rect()
      const cx = r.width / 2
      const cy = r.height / 2
      const halfDiag = Math.hypot(r.width, r.height) / 2

      // Camera drifts forward automatically, plus wherever scroll pushed it.
      const anyHover = hoveredIdRef.current !== null
      if (!anyHover) camTargetRef.current += AUTO_SPEED * dt
      // Ease actual camera toward target (smooth scroll feel).
      camRef.current += (camTargetRef.current - camRef.current) * CAM_LERP
      const cam = camRef.current

      projects.forEach((p, i) => {
        const el = wrapRefs.current[p.id]
        const L = layout[i]
        if (!el) return

        const isHovered = hoveredIdRef.current === p.id

        // Apparent depth: fixed base minus camera, wrapped into [Z_NEAR, +span].
        let z = L.baseDepth - cam
        z = ((z - Z_NEAR) % DEPTH_SPAN + DEPTH_SPAN) % DEPTH_SPAN + Z_NEAR

        const persp = FOCAL / z
        const baseScale = persp * 0.5
        const dist = L.radius * halfDiag * persp
        const px = cx + Math.cos(L.angle) * dist
        const py = cy + Math.sin(L.angle) * dist

        // Hover: settle to a readable, centered-ish size.
        const targetHover = isHovered
          ? HOVER_TARGET_SCALE / Math.max(baseScale, 0.001)
          : 1
        hoverScales.current[p.id] += (targetHover - hoverScales.current[p.id]) * HOVER_LERP
        const scale = baseScale * hoverScales.current[p.id]

        // Fade in from far, fade out as it flies past the frame edges.
        let opacity = 1
        if (!isHovered) {
          const fadeInFar = Math.min(1, (DEPTH_SPAN + Z_NEAR - z) / 3)
          const edge = Math.min(px, r.width - px, py, r.height - py)
          const fadeOutEdge = Math.max(0, Math.min(1, (edge + CARD_W * scale * 0.3) / (CARD_W * scale * 0.5 + 90)))
          opacity = Math.min(fadeInFar, fadeOutEdge)
        }

        el.style.transform =
          `translate3d(${(px - CARD_W / 2).toFixed(1)}px, ${(py - CARD_H / 2).toFixed(1)}px, 0) ` +
          `rotate(${(isHovered ? 0 : L.rot).toFixed(2)}deg) scale(${scale.toFixed(3)})`
        el.style.opacity = opacity.toFixed(3)
        el.style.filter = isHovered ? 'none' : `blur(${Math.max(0, (0.55 - baseScale) * 3).toFixed(2)}px)`
        el.style.zIndex = isHovered ? 999 : Math.round(persp * 50)
      })

      raf = requestAnimationFrame(tick)
    }

    raf = requestAnimationFrame(tick)
    return () => {
      cancelAnimationFrame(raf)
      zone.removeEventListener('wheel', onWheel)
    }
  }, [])

  const handleEnter = (id) => {
    hoveredIdRef.current = id
    setHoveredId(id)
    const v = videoRefs.current[id]
    if (v) {
      v.currentTime = 0
      v.play().catch(() => {})
    }
  }

  const handleLeave = (id) => {
    hoveredIdRef.current = null
    setHoveredId(null)
    const v = videoRefs.current[id]
    if (v) {
      v.pause()
      v.currentTime = 0
    }
  }

  return (
    <div className="giulia-page">
      <div className="watermark-layer">
        <svg className="watermark-svg" viewBox="0 0 1200 300" aria-hidden="true">
          <text x="0" y="235" textLength="1200" lengthAdjust="spacingAndGlyphs">
            Giulia
          </text>
        </svg>
      </div>

      <header className="top-bar">
        <span className="tag">xx2026</span>
      </header>

      <main className="float-zone" ref={zoneRef}>
        {projects.map((p) => (
          <div
            key={p.id}
            ref={(el) => (wrapRefs.current[p.id] = el)}
            className="float-wrap"
          >
            <div
              className={`card-tile ${hoveredId === p.id ? 'is-hovered' : ''}`}
              style={{ backgroundColor: p.color }}
              onMouseEnter={() => handleEnter(p.id)}
              onMouseLeave={() => handleLeave(p.id)}
            >
              <video
                ref={(el) => (videoRefs.current[p.id] = el)}
                className="card-video"
                src={p.video}
                poster={p.poster}
                muted
                loop
                playsInline
                preload="metadata"
              />
            </div>
            <span className="card-title">{p.title}</span>
          </div>
        ))}
      </main>

      <a className="contact-link" href="#contact">Contact me</a>
      <span className="scroll-hint">scroll ↕</span>
    </div>
  )
}

export default App
