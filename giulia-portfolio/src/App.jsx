import { useEffect, useRef, useState } from 'react'

// Placeholder projects — swap `poster`/`video` for Giulia's real interior
// design photography and clips as soon as she sends them.
//
// top/left: initial resting position (% of the floating zone), used only
// for the very first placement — after a card exits/re-enters it gets a
// new random resting spot.
// ampX/ampY/freq*/phase*: small ambient wander while "floating" at rest.
// depth/rot: same "closer/farther" pulse and gentle spin as before.
const projects = [
  {
    id: 1, size: 'lg', title: 'Sala minimalista',
    top: 10, left: 6,
    ampX: 35, ampY: 26, freqX: 0.055, freqY: 0.07, phaseX: 0, phaseY: 1.4,
    depthAmp: 0.12, freqDepth: 0.04, phaseDepth: 0,
    rotAmp: 3, freqRot: 0.05, phaseRot: 0.6,
    color: '#c9c2ea',
    poster: 'https://picsum.photos/seed/giulia-living/900/700',
    video: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
  },
  {
    id: 2, size: 'sm', title: 'Cocina contemporánea',
    top: 16, left: 41,
    ampX: 28, ampY: 32, freqX: 0.07, freqY: 0.05, phaseX: 2.1, phaseY: 0.3,
    depthAmp: 0.14, freqDepth: 0.045, phaseDepth: 2.2,
    rotAmp: 4, freqRot: 0.06, phaseRot: 1.8,
    color: '#f0c9c9',
    poster: 'https://picsum.photos/seed/giulia-kitchen/700/600',
    video: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
  },
  {
    id: 3, size: 'md', title: 'Habitación principal',
    top: 6, left: 76,
    ampX: 24, ampY: 30, freqX: 0.06, freqY: 0.065, phaseX: 0.8, phaseY: 3.0,
    depthAmp: 0.1, freqDepth: 0.05, phaseDepth: 1.1,
    rotAmp: 3, freqRot: 0.045, phaseRot: 2.6,
    color: '#cfe8f2',
    poster: 'https://picsum.photos/seed/giulia-bedroom/700/600',
    video: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
  },
  {
    id: 4, size: 'md', title: 'Comedor',
    top: 60, left: 9,
    ampX: 30, ampY: 22, freqX: 0.05, freqY: 0.06, phaseX: 3.6, phaseY: 0.9,
    depthAmp: 0.13, freqDepth: 0.038, phaseDepth: 3.4,
    rotAmp: 3.5, freqRot: 0.055, phaseRot: 0.2,
    color: '#f5e8ad',
    poster: 'https://picsum.photos/seed/giulia-dining/900/700',
    video: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
  },
  {
    id: 5, size: 'lg', title: 'Oficina en casa',
    top: 62, left: 40,
    ampX: 26, ampY: 28, freqX: 0.065, freqY: 0.05, phaseX: 1.6, phaseY: 2.4,
    depthAmp: 0.11, freqDepth: 0.042, phaseDepth: 0.5,
    rotAmp: 3, freqRot: 0.05, phaseRot: 3.1,
    color: '#a9d2c4',
    poster: 'https://picsum.photos/seed/giulia-office/700/600',
    video: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
  },
  {
    id: 6, size: 'sm', title: 'Terraza',
    top: 58, left: 78,
    ampX: 22, ampY: 24, freqX: 0.075, freqY: 0.055, phaseX: 2.8, phaseY: 1.1,
    depthAmp: 0.15, freqDepth: 0.05, phaseDepth: 2.9,
    rotAmp: 4, freqRot: 0.065, phaseRot: 1.3,
    color: '#e6d6ee',
    poster: 'https://picsum.photos/seed/giulia-terrace/500/500',
    video: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
  },
]

const SIZE_PX = {
  lg: { w: 320, h: 260 },
  md: { w: 240, h: 200 },
  sm: { w: 180, h: 160 },
}

const EDGE_MARGIN = 120 // how far past the edge a card travels before/after it's "gone"
const FLOAT_MIN = 11000
const FLOAT_MAX = 22000
const HIDDEN_MIN = 2500
const HIDDEN_MAX = 6000
const TRANSIT_MS = 1300 // how long the exit/enter leg takes
// Position/scale/rotation ease toward their target each frame instead of
// snapping — this is what fixes the abrupt stop on hover, and also makes
// exit/enter feel like a glide instead of a jump.
const POS_LERP = 0.055
const SCALE_LERP = 0.09
const OPACITY_LERP = 0.08

const rand = (min, max) => min + Math.random() * (max - min)
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)]

function App() {
  const zoneRef = useRef(null)
  const wrapRefs = useRef({})
  const videoRefs = useRef({})
  const hoveredIdRef = useRef(null)
  const [hoveredId, setHoveredId] = useState(null)

  // Per-card mutable animation state, kept in refs so updates don't
  // trigger React re-renders (everything is painted directly via style).
  const cardState = useRef({})

  useEffect(() => {
    const zone = zoneRef.current
    const rect = () => zone.getBoundingClientRect()

    // Initialize each card's state.
    projects.forEach((p) => {
      const r = rect()
      cardState.current[p.id] = {
        phase: 'float',
        x: (p.left / 100) * r.width,
        y: (p.top / 100) * r.height,
        restX: (p.left / 100) * r.width,
        restY: (p.top / 100) * r.height,
        scale: 1,
        rot: 0,
        opacity: 1,
        phaseStart: performance.now(),
        floatDuration: rand(FLOAT_MIN, FLOAT_MAX),
        exitDir: null,
      }
    })

    let raf
    const start = performance.now()

    const offscreenPoint = (dir, size, r) => {
      const half = { x: size.w / 2, y: size.h / 2 }
      switch (dir) {
        case 'left':
          return { x: -half.x - EDGE_MARGIN, y: rand(half.y, r.height - half.y) }
        case 'right':
          return { x: r.width + half.x + EDGE_MARGIN, y: rand(half.y, r.height - half.y) }
        case 'top':
          return { x: rand(half.x, r.width - half.x), y: -half.y - EDGE_MARGIN }
        default: // 'bottom'
          return { x: rand(half.x, r.width - half.x), y: r.height + half.y + EDGE_MARGIN }
      }
    }

    const newRestPoint = (size, r) => ({
      x: rand(size.w / 2 + 10, r.width - size.w / 2 - 10),
      y: rand(size.h / 2 + 10, r.height - size.h / 2 - 10),
    })

    const tick = (now) => {
      const elapsed = now - start
      const r = rect()

      projects.forEach((p) => {
        const el = wrapRefs.current[p.id]
        const s = cardState.current[p.id]
        if (!el || !s) return

        const isHovered = hoveredIdRef.current === p.id
        const size = SIZE_PX[p.size]
        const inPhaseFor = now - s.phaseStart

        // ---- Decide target (x, y, scale, opacity) based on phase ----
        let targetX = s.restX
        let targetY = s.restY
        let targetScale = 1
        let targetOpacity = 1
        let targetRot = 0

        if (s.phase === 'float') {
          const t = elapsed / 1000
          const wanderX = p.ampX * Math.sin(t * p.freqX * 6.28 + p.phaseX)
          const wanderY = p.ampY * Math.sin(t * p.freqY * 6.28 + p.phaseY)
          const depth = 1 + p.depthAmp * Math.sin(t * p.freqDepth * 6.28 + p.phaseDepth)
          targetX = s.restX + wanderX
          targetY = s.restY + wanderY
          targetScale = depth
          targetRot = p.rotAmp * Math.sin(t * p.freqRot * 6.28 + p.phaseRot)

          if (isHovered) {
            targetScale = depth * 1.35
            targetOpacity = 1
          } else if (!hoveredIdRef.current && inPhaseFor > s.floatDuration) {
            // Time to leave the screen.
            s.phase = 'exit'
            s.phaseStart = now
            s.exitDir = pick(['left', 'right', 'top', 'bottom'])
            const target = offscreenPoint(s.exitDir, size, r)
            s.exitTargetX = target.x
            s.exitTargetY = target.y
          }
        } else if (s.phase === 'exit') {
          targetX = s.exitTargetX
          targetY = s.exitTargetY
          targetScale = 0.7
          targetOpacity = 0
          targetRot = p.rotAmp * 1.5

          if (inPhaseFor > TRANSIT_MS) {
            s.phase = 'hidden'
            s.phaseStart = now
            s.hiddenDuration = rand(HIDDEN_MIN, HIDDEN_MAX)
          }
        } else if (s.phase === 'hidden') {
          targetX = s.exitTargetX
          targetY = s.exitTargetY
          targetScale = 0.7
          targetOpacity = 0

          if (inPhaseFor > s.hiddenDuration) {
            // Re-enter from a (possibly different) edge, at a new resting spot.
            const entryDir = pick(['left', 'right', 'top', 'bottom'])
            const entry = offscreenPoint(entryDir, size, r)
            s.x = entry.x
            s.y = entry.y
            s.scale = 0.7
            s.opacity = 0
            const rest = newRestPoint(size, r)
            s.restX = rest.x
            s.restY = rest.y
            s.phase = 'enter'
            s.phaseStart = now
          }
        } else if (s.phase === 'enter') {
          targetX = s.restX
          targetY = s.restY
          targetScale = 1
          targetOpacity = 1

          if (inPhaseFor > TRANSIT_MS) {
            s.phase = 'float'
            s.phaseStart = now
            s.floatDuration = rand(FLOAT_MIN, FLOAT_MAX)
          }
        }

        // ---- Ease current values toward target (fixes the abrupt hover stop) ----
        s.x += (targetX - s.x) * POS_LERP
        s.y += (targetY - s.y) * POS_LERP
        s.scale += (targetScale - s.scale) * SCALE_LERP
        s.opacity += (targetOpacity - s.opacity) * OPACITY_LERP
        s.rot += (targetRot - s.rot) * POS_LERP

        el.style.transform =
          `translate3d(${s.x - size.w / 2}px, ${s.y - size.h / 2}px, 0) ` +
          `rotate(${s.rot.toFixed(2)}deg) scale(${s.scale.toFixed(3)})`
        el.style.opacity = s.opacity.toFixed(3)
        el.style.filter = isHovered ? 'none' : `blur(${Math.max(0, (1 - s.scale) * 4)}px)`
        el.style.zIndex = isHovered ? 999 : Math.round(s.scale * 100)
        el.style.pointerEvents = s.phase === 'float' ? 'auto' : 'none'
      })

      raf = requestAnimationFrame(tick)
    }

    raf = requestAnimationFrame(tick)

    const handleResize = () => {
      // Re-anchor resting positions proportionally on resize.
      const r = rect()
      projects.forEach((p) => {
        const s = cardState.current[p.id]
        if (!s) return
        s.restX = Math.min(s.restX, r.width - 40)
        s.restY = Math.min(s.restY, r.height - 40)
      })
    }
    window.addEventListener('resize', handleResize)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  const handleEnter = (id) => {
    if (cardState.current[id]?.phase !== 'float') return
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
              className={`card-tile size-${p.size} ${hoveredId === p.id ? 'is-hovered' : ''}`}
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
              <div className="card-overlay">
                <span>{p.title}</span>
              </div>
            </div>
          </div>
        ))}
      </main>

      <a className="about-link" href="#contact">
        Contact me <i className="fa-solid fa-arrow-right"></i>
      </a>
    </div>
  )
}

export default App
