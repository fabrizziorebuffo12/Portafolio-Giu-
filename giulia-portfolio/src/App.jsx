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

const CARD_W = 300
const CARD_H = 240

// --- Gufram-style camera flythrough ---
const DEPTH_SPAN = 9
const Z_NEAR = 0.6
const FOCAL = 5.6           // bigger => cards read larger overall
const AUTO_SPEED = 0.35
const WHEEL_SENSITIVITY = 0.0016
const CAM_LERP = 0.08
const HOVER_ZOOM = 1.3      // relative zoom on hover (multiplies current size)
const HOVER_LERP = 0.1      // smoother, more gradual hover in/out

// Per-card size multipliers, arranged so no two neighbours share a size
// class: L (large) / S (small) / M (medium) alternating around the ring.
const CARD_SIZES = [1.55, 0.7, 1.05, 1.55, 0.7, 1.05]
const layout = projects.map((p, i) => {
  const angle = (i / projects.length) * Math.PI * 2 + 0.5
  return {
    angle,
    radius: 0.26 + (i % 3) * 0.14,
    baseDepth: (i / projects.length) * DEPTH_SPAN,
    sizeMul: CARD_SIZES[i] ?? 1,
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
  const frozenZ = useRef({})

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
        // When hovered, freeze the depth where it was so the card stops
        // drifting toward/away and just holds still while you read it.
        let z = L.baseDepth - cam
        z = ((z - Z_NEAR) % DEPTH_SPAN + DEPTH_SPAN) % DEPTH_SPAN + Z_NEAR
        if (isHovered) {
          if (frozenZ.current[p.id] == null) frozenZ.current[p.id] = z
          z = frozenZ.current[p.id]
        } else {
          frozenZ.current[p.id] = null
        }

        const persp = FOCAL / z
        const baseScale = persp * 0.5 * L.sizeMul
        const dist = L.radius * halfDiag * persp
        const px = cx + Math.cos(L.angle) * dist
        const py = cy + Math.sin(L.angle) * dist

        // Hover = a gentle RELATIVE zoom on top of whatever size the card
        // already is (no jump to an absolute size), which reads as fluid.
        const targetHover = isHovered ? HOVER_ZOOM : 1
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
          `scale(${scale.toFixed(3)})`
        el.style.opacity = opacity.toFixed(3)
        el.style.filter = isHovered ? 'none' : `blur(${Math.max(0, (0.55 - baseScale) * 3).toFixed(2)}px)`
        el.style.zIndex = isHovered ? 999 : Math.round(persp * 50)

        // If the card sits low, put its (hover) title above it so the
        // enlarged card never pushes the name off the bottom of the screen.
        if (isHovered) {
          const lowHalf = py > r.height * 0.6
          el.classList.toggle('title-above', lowHalf)
        }
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
        <span className="watermark">Giulia</span>
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
