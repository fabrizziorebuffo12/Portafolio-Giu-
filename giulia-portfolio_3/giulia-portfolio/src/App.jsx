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

// Base (reference) card size at "focal" distance. Actual on-screen size is
// this * perspective scale, which grows as the card flies toward the viewer.
const CARD_W = 240
const CARD_H = 200

// --- 3D flythrough (Gufram "Space" style) ---
// Each card has a Z depth. Z starts far (large number) and decreases over
// time, flying toward the camera. As Z shrinks, the card's screen position
// pushes outward from a vanishing point AND its scale grows — so cards are
// born tiny near the center and sweep outward past the edges, exactly like
// flying forward through a field of objects.
const Z_FAR = 12       // spawn depth (far away, tiny)
const Z_NEAR = 0.55    // once a card passes this it has flown "past" us
const FOCAL = 3.2      // perspective focal length (bigger = gentler zoom)
const SPEED_MIN = 0.9  // depth units per second
const SPEED_MAX = 1.5
const HOVER_TARGET_SCALE = 1.35
const SCALE_LERP = 0.12

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

    // Give a card a fresh spawn: a random direction out from the vanishing
    // point (angle) and how far off-center it drifts (radius), plus a random
    // starting depth spread so they don't all arrive at once.
    const seed = (startZ) => {
      const angle = rand(0, Math.PI * 2)
      const radius = rand(0.12, 0.62) // fraction of half-diagonal at focal plane
      return {
        angle,
        radius,
        z: startZ,
        speed: rand(SPEED_MIN, SPEED_MAX),
        rot: rand(-8, 8),
        hoverScale: 1,
      }
    }

    projects.forEach((p, i) => {
      // Spread initial depths across the whole range so the field is full.
      cardState.current[p.id] = seed(rand(Z_NEAR + 0.5, Z_FAR))
    })

    let raf
    let last = performance.now()

    const tick = (now) => {
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      const r = rect()
      const cx = r.width / 2
      const cy = r.height / 2
      const halfDiag = Math.hypot(r.width, r.height) / 2

      projects.forEach((p) => {
        const el = wrapRefs.current[p.id]
        const s = cardState.current[p.id]
        if (!el || !s) return

        const isHovered = hoveredIdRef.current === p.id

        if (!isHovered) {
          // Fly toward the camera.
          s.z -= s.speed * dt
          if (s.z <= Z_NEAR) {
            // Passed us — respawn far away in a new direction.
            Object.assign(s, seed(Z_FAR))
          }
        }

        // Perspective projection: screen scale is FOCAL / z. Small z => big.
        const persp = FOCAL / s.z
        const baseScale = persp * 0.5 // tuned so focal plane ~= CARD_W
        // Position: push outward from center proportional to how close it is.
        const dist = s.radius * halfDiag * persp
        const px = cx + Math.cos(s.angle) * dist
        const py = cy + Math.sin(s.angle) * dist

        // Hover: settle to a readable size and pause the fly-in.
        const targetHover = isHovered ? HOVER_TARGET_SCALE / Math.max(baseScale, 0.001) : 1
        s.hoverScale += (targetHover - s.hoverScale) * SCALE_LERP
        const scale = baseScale * s.hoverScale

        // Fade: tiny/far cards fade in; cards flying past the edge fade out.
        let opacity = 1
        if (!isHovered) {
          const fadeInFar = Math.min(1, (Z_FAR - s.z) / 2.5) // fade in from far
          // fade out as it approaches the camera / leaves frame
          const edgeDist = Math.min(px, r.width - px, py, r.height - py)
          const fadeOutEdge = Math.max(0, Math.min(1, (edgeDist + CARD_W * scale * 0.3) / (CARD_W * scale * 0.6 + 80)))
          opacity = Math.min(fadeInFar, fadeOutEdge)
        }

        el.style.transform =
          `translate3d(${(px - CARD_W / 2).toFixed(1)}px, ${(py - CARD_H / 2).toFixed(1)}px, 0) ` +
          `rotate(${(s.rot * (isHovered ? 0 : 1)).toFixed(2)}deg) scale(${scale.toFixed(3)})`
        el.style.opacity = opacity.toFixed(3)
        // Nearer (bigger) cards are crisp and on top; far ones slightly soft.
        el.style.filter = isHovered ? 'none' : `blur(${Math.max(0, (0.6 - baseScale) * 3).toFixed(2)}px)`
        el.style.zIndex = isHovered ? 999 : Math.round(persp * 50)
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
    </div>
  )
}

export default App
