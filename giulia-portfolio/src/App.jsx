import { useEffect, useRef, useState } from 'react'
import { Routes, Route, useNavigate } from 'react-router-dom'
import { projects } from './data/projects.js'
import ProjectPage from './ProjectPage.jsx'
import ContactPage from './ContactPage.jsx'

const CARD_W = 300
const CARD_H = 240
const DEPTH_SPAN = 9
const Z_NEAR = 0.6
const FOCAL = 5.6
const AUTO_SPEED = 0.35
const WHEEL_SENSITIVITY = 0.0016
const CAM_LERP = 0.08
const HOVER_ZOOM = 1.3
const HOVER_LERP = 0.1
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

function FloatingCards() {
  const navigate   = useNavigate()
  const zoneRef    = useRef(null)
  const wrapRefs   = useRef({})
  const titleRefs  = useRef({})
  const videoRefs  = useRef({})
  const hoveredIdRef   = useRef(null)
  const [hoveredId, setHoveredId] = useState(null)
  const camRef         = useRef(0)
  const camTargetRef   = useRef(0)
  const hoverScales    = useRef({})
  const frozenZ        = useRef({})

  useEffect(() => {
    const zone = zoneRef.current
    if (!zone) return
    const rect = () => zone.getBoundingClientRect()

    projects.forEach(p => { hoverScales.current[p.id] = 1 })

    const onWheel = e => {
      e.preventDefault()
      camTargetRef.current += e.deltaY * WHEEL_SENSITIVITY
    }
    zone.addEventListener('wheel', onWheel, { passive: false })

    let raf
    let last = performance.now()

    const tick = now => {
      const dt  = Math.min(0.05, (now - last) / 1000)
      last = now
      const r   = rect()
      const cx  = r.width / 2
      const cy  = r.height / 2
      const halfDiag = Math.hypot(r.width, r.height) / 2

      if (!hoveredIdRef.current) camTargetRef.current += AUTO_SPEED * dt
      camRef.current += (camTargetRef.current - camRef.current) * CAM_LERP
      const cam = camRef.current

      projects.forEach((p, i) => {
        const el      = wrapRefs.current[p.id]
        const titleEl = titleRefs.current[p.id]
        const L       = layout[i]
        if (!el) return

        const isHovered = hoveredIdRef.current === p.id

        let z = L.baseDepth - cam
        z = ((z - Z_NEAR) % DEPTH_SPAN + DEPTH_SPAN) % DEPTH_SPAN + Z_NEAR
        if (isHovered) {
          if (frozenZ.current[p.id] == null) frozenZ.current[p.id] = z
          z = frozenZ.current[p.id]
        } else {
          frozenZ.current[p.id] = null
        }

        const persp     = FOCAL / z
        const baseScale = persp * 0.5 * L.sizeMul
        const dist      = L.radius * halfDiag * persp
        const px        = cx + Math.cos(L.angle) * dist
        const py        = cy + Math.sin(L.angle) * dist

        const targetHover = isHovered ? HOVER_ZOOM : 1
        hoverScales.current[p.id] += (targetHover - hoverScales.current[p.id]) * HOVER_LERP
        const scale = baseScale * hoverScales.current[p.id]

        let opacity = 1
        if (!isHovered) {
          const fadeInFar   = Math.min(1, (DEPTH_SPAN + Z_NEAR - z) / 3)
          const edge        = Math.min(px, r.width - px, py, r.height - py)
          const fadeOutEdge = Math.max(0, Math.min(1, (edge + CARD_W * scale * 0.3) / (CARD_W * scale * 0.5 + 90)))
          opacity = Math.min(fadeInFar, fadeOutEdge)
        }

        el.style.transform = `translate3d(${(px - CARD_W/2).toFixed(1)}px,${(py - CARD_H/2).toFixed(1)}px,0) scale(${scale.toFixed(3)})`
        el.style.opacity   = opacity.toFixed(3)
        el.style.filter    = isHovered ? 'none' : `blur(${Math.max(0,(0.55-baseScale)*3).toFixed(2)}px)`
        el.style.zIndex    = isHovered ? 999 : Math.round(persp * 50)

        if (titleEl) {
          const titleY = py + (CARD_H/2) * scale + 10
          titleEl.style.left    = `${px.toFixed(1)}px`
          titleEl.style.top     = `${titleY.toFixed(1)}px`
          titleEl.style.opacity = opacity.toFixed(3)
          titleEl.style.zIndex  = isHovered ? 1000 : Math.round(persp * 50)
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

  const handleEnter = id => {
    hoveredIdRef.current = id
    setHoveredId(id)
    const v = videoRefs.current[id]
    if (v) { v.currentTime = 0; v.play().catch(() => {}) }
  }

  const handleLeave = id => {
    hoveredIdRef.current = null
    setHoveredId(null)
    const v = videoRefs.current[id]
    if (v) { v.pause(); v.currentTime = 0 }
  }

  const handleClick = id => {
    const p = projects.find(x => x.id === id)
    if (p) navigate(`/proyecto/${p.slug}`)
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
        {projects.map((p, i) => (
          <div
            key={p.id}
            ref={el => (wrapRefs.current[p.id] = el)}
            className="float-wrap"
          >
            <div
              className={`card-tile${hoveredId === p.id ? ' is-hovered' : ''}`}
              style={{ backgroundColor: ['#c9c2ea','#f0c9c9','#cfe8f2','#f5e8ad','#a9d2c4','#e6d6ee'][i] }}
              onMouseEnter={() => handleEnter(p.id)}
              onMouseLeave={() => handleLeave(p.id)}
              onClick={() => handleClick(p.id)}
            >
              <video
                ref={el => (videoRefs.current[p.id] = el)}
                className="card-video"
                src={p.renders[0]}
                poster={p.renders[0]}
                muted loop playsInline preload="metadata"
                disablePictureInPicture
                controls={false}
                controlsList="nodownload nofullscreen noremoteplayback"
              />
            </div>
          </div>
        ))}

        {projects.map(p => (
          <span
            key={`title-${p.id}`}
            ref={el => (titleRefs.current[p.id] = el)}
            className="card-title"
          >
            {p.title}
          </span>
        ))}
      </main>

      <a
        className="contact-link"
        href="/contact"
        onClick={e => { e.preventDefault(); navigate('/contact') }}
      >
        Contact me
      </a>
    </div>
  )
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<FloatingCards />} />
      <Route path="/proyecto/:slug" element={<ProjectPage />} />
      <Route path="/contact" element={<ContactPage />} />
    </Routes>
  )
}
