import { useEffect, useRef, useState } from 'react'

// Placeholder projects — swap `poster`/`video` for Giulia's real interior
// design photography and clips as soon as she sends them.
const projects = [
  {
    id: 1, size: 'md', title: 'Sala minimalista', color: '#c9c2ea',
    poster: 'https://picsum.photos/seed/giulia-living/900/700',
    video: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
  },
  {
    id: 2, size: 'sm', title: 'Cocina contemporánea', color: '#f0c9c9',
    poster: 'https://picsum.photos/seed/giulia-kitchen/700/600',
    video: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
  },
  {
    id: 3, size: 'md', title: 'Habitación principal', color: '#cfe8f2',
    poster: 'https://picsum.photos/seed/giulia-bedroom/700/600',
    video: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
  },
  {
    id: 4, size: 'sm', title: 'Comedor', color: '#f5e8ad',
    poster: 'https://picsum.photos/seed/giulia-dining/900/700',
    video: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
  },
  {
    id: 5, size: 'md', title: 'Oficina en casa', color: '#a9d2c4',
    poster: 'https://picsum.photos/seed/giulia-office/700/600',
    video: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
  },
  {
    id: 6, size: 'sm', title: 'Terraza', color: '#e6d6ee',
    poster: 'https://picsum.photos/seed/giulia-terrace/500/500',
    video: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
  },
]

const SIZE_PX = {
  md: { w: 240, h: 200 },
  sm: { w: 180, h: 160 },
}

// Each card drifts in a straight-ish direction across the whole space.
// When it fully leaves one edge it wraps and re-enters from the opposite
// side at a new vertical/horizontal offset, so the flow feels endless and
// omnidirectional (Gufram "Space" style). Fade happens near every edge.
const SPEED_MIN = 14 // px/sec
const SPEED_MAX = 26
const FADE_MARGIN = 140 // px from edge over which the card fades in/out
const OFFSCREEN_PAD = 60 // extra px past the edge before it counts as "gone"
const DEPTH_MIN = 0.82
const DEPTH_MAX = 1.12
const HOVER_TARGET_SCALE = 1.4
const SCALE_LERP = 0.09

const rand = (min, max) => min + Math.random() * (max - min)

function App() {
  const zoneRef = useRef(null)
  const wrapRefs = useRef({})
  const videoRefs = useRef({})
  const hoveredIdRef = useRef(null)
  const [hoveredId, setHoveredId] = useState(null)
  const cardState = useRef({})

  useEffect(() => {
    const zone = zoneRef.current
    if (!zone) return
    const rect = () => zone.getBoundingClientRect()

    // Give a card a fresh drift direction + speed and a random spot to
    // start from. Used both at init and whenever it wraps around.
    const seedMotion = (r) => {
      const angle = rand(0, Math.PI * 2)
      const speed = rand(SPEED_MIN, SPEED_MAX)
      return {
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        baseDepth: rand(DEPTH_MIN, DEPTH_MAX),
        // gentle independent bobbing so paths aren't perfectly straight
        bobAmp: rand(6, 16),
        bobFreq: rand(0.15, 0.35),
        bobPhase: rand(0, Math.PI * 2),
        rotAmp: rand(-4, 4),
        rotFreq: rand(0.1, 0.25),
        rotPhase: rand(0, Math.PI * 2),
      }
    }

    const r0 = rect()
    projects.forEach((p, i) => {
      const m = seedMotion(r0)
      cardState.current[p.id] = {
        x: rand(0.15, 0.85) * r0.width,
        y: rand(0.15, 0.85) * r0.height,
        scale: m.baseDepth,
        ...m,
        t0: rand(0, 100),
      }
    })

    let raf
    let last = performance.now()

    const tick = (now) => {
      const dt = Math.min(0.05, (now - last) / 1000) // clamp for tab-switches
      last = now
      const r = rect()

      projects.forEach((p) => {
        const el = wrapRefs.current[p.id]
        const s = cardState.current[p.id]
        if (!el || !s) return

        const size = SIZE_PX[p.size]
        const isHovered = hoveredIdRef.current === p.id

        if (isHovered) {
          // Pause drift, hold position, settle to readable size.
          s.targetScale = HOVER_TARGET_SCALE
        } else {
          // Advance along drift vector.
          s.x += s.vx * dt
          s.y += s.vy * dt
          s.targetScale = s.baseDepth

          // Wrap: once fully past an edge, re-enter from the opposite side
          // with a fresh direction, at a new perpendicular offset.
          const halfW = size.w / 2
          const halfH = size.h / 2
          const goneLeft = s.x < -halfW - OFFSCREEN_PAD
          const goneRight = s.x > r.width + halfW + OFFSCREEN_PAD
          const goneTop = s.y < -halfH - OFFSCREEN_PAD
          const goneBottom = s.y > r.height + halfH + OFFSCREEN_PAD

          if (goneLeft || goneRight || goneTop || goneBottom) {
            const m = seedMotion(r)
            Object.assign(s, m)
            if (goneLeft) { s.x = r.width + halfW; s.y = rand(halfH, r.height - halfH); if (s.vx > 0) s.vx *= -1 }
            else if (goneRight) { s.x = -halfW; s.y = rand(halfH, r.height - halfH); if (s.vx < 0) s.vx *= -1 }
            else if (goneTop) { s.y = r.height + halfH; s.x = rand(halfW, r.width - halfW); if (s.vy > 0) s.vy *= -1 }
            else { s.y = -halfH; s.x = rand(halfW, r.width - halfW); if (s.vy < 0) s.vy *= -1 }
          }
        }

        // Bobbing offset perpendicular-ish, plus rotation — gives organic feel.
        const tt = now / 1000 + s.t0
        const bobX = s.bobAmp * Math.sin(tt * s.bobFreq * 6.28 + s.bobPhase)
        const bobY = s.bobAmp * Math.cos(tt * s.bobFreq * 6.28 + s.bobPhase)
        const rot = s.rotAmp * Math.sin(tt * s.rotFreq * 6.28 + s.rotPhase)

        // Ease scale toward its target (smooth hover in/out).
        s.scale += ((s.targetScale ?? s.baseDepth) - s.scale) * SCALE_LERP

        const drawX = s.x + bobX
        const drawY = s.y + bobY

        // Opacity fades near any edge so entering/leaving never "cuts".
        let opacity = 1
        if (!isHovered) {
          const dLeft = drawX
          const dRight = r.width - drawX
          const dTop = drawY
          const dBottom = r.height - drawY
          const dMin = Math.min(dLeft, dRight, dTop, dBottom)
          opacity = Math.max(0, Math.min(1, (dMin + size.w / 2) / (FADE_MARGIN + size.w / 2)))
        }

        el.style.transform =
          `translate3d(${(drawX - size.w / 2).toFixed(1)}px, ${(drawY - size.h / 2).toFixed(1)}px, 0) ` +
          `rotate(${rot.toFixed(2)}deg) scale(${s.scale.toFixed(3)})`
        el.style.opacity = opacity.toFixed(3)
        el.style.filter = isHovered ? 'none' : `blur(${Math.max(0, (1 - s.scale) * 3).toFixed(2)}px)`
        el.style.zIndex = isHovered ? 999 : Math.round(s.scale * 100)
      })

      raf = requestAnimationFrame(tick)
    }

    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
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
      {/* Edge-to-edge wordmark, real Arimo font stretched with textLength. */}
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
            </div>
            {/* Title appears under the card only on hover. */}
            <span className="card-title">{p.title}</span>
          </div>
        ))}
      </main>

      <a className="contact-link" href="#contact">Contact me</a>
    </div>
  )
}

export default App
