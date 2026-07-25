import { useEffect, useRef, useState } from 'react'

// Placeholder projects — swap `poster`/`video` for Giulia's real interior
// design photography and clips as soon as she sends them.
//
// top/left: resting position (% of the floating zone).
// ampX/ampY: how far (px) the card wanders from its resting position.
// freqX/freqY: how fast it wanders (smaller = slower, more graceful).
// phaseX/phaseY: offsets so cards don't move in sync.
// depthAmp/freqDepth/phaseDepth: controls the "closer / farther" pulse
//   (scale + slight blur), which is what gives the parallax feel.
// rotAmp/freqRot/phaseRot: continuous gentle rotation while floating.
const projects = [
  {
    id: 1, size: 'lg', title: 'Sala minimalista',
    top: 10, left: 6,
    ampX: 55, ampY: 40, freqX: 0.055, freqY: 0.07, phaseX: 0, phaseY: 1.4,
    depthAmp: 0.14, freqDepth: 0.04, phaseDepth: 0,
    rotAmp: 3, freqRot: 0.05, phaseRot: 0.6,
    color: '#c9c2ea',
    poster: 'https://picsum.photos/seed/giulia-living/900/700',
    video: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
  },
  {
    id: 2, size: 'sm', title: 'Cocina contemporánea',
    top: 16, left: 41,
    ampX: 42, ampY: 50, freqX: 0.07, freqY: 0.05, phaseX: 2.1, phaseY: 0.3,
    depthAmp: 0.16, freqDepth: 0.045, phaseDepth: 2.2,
    rotAmp: 4, freqRot: 0.06, phaseRot: 1.8,
    color: '#f0c9c9',
    poster: 'https://picsum.photos/seed/giulia-kitchen/700/600',
    video: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
  },
  {
    id: 3, size: 'md', title: 'Habitación principal',
    top: 6, left: 76,
    ampX: 36, ampY: 46, freqX: 0.06, freqY: 0.065, phaseX: 0.8, phaseY: 3.0,
    depthAmp: 0.12, freqDepth: 0.05, phaseDepth: 1.1,
    rotAmp: 3, freqRot: 0.045, phaseRot: 2.6,
    color: '#cfe8f2',
    poster: 'https://picsum.photos/seed/giulia-bedroom/700/600',
    video: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
  },
  {
    id: 4, size: 'md', title: 'Comedor',
    top: 60, left: 9,
    ampX: 46, ampY: 34, freqX: 0.05, freqY: 0.06, phaseX: 3.6, phaseY: 0.9,
    depthAmp: 0.15, freqDepth: 0.038, phaseDepth: 3.4,
    rotAmp: 3.5, freqRot: 0.055, phaseRot: 0.2,
    color: '#f5e8ad',
    poster: 'https://picsum.photos/seed/giulia-dining/900/700',
    video: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
  },
  {
    id: 5, size: 'lg', title: 'Oficina en casa',
    top: 62, left: 40,
    ampX: 40, ampY: 44, freqX: 0.065, freqY: 0.05, phaseX: 1.6, phaseY: 2.4,
    depthAmp: 0.13, freqDepth: 0.042, phaseDepth: 0.5,
    rotAmp: 3, freqRot: 0.05, phaseRot: 3.1,
    color: '#a9d2c4',
    poster: 'https://picsum.photos/seed/giulia-office/700/600',
    video: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
  },
  {
    id: 6, size: 'sm', title: 'Terraza',
    top: 58, left: 78,
    ampX: 34, ampY: 38, freqX: 0.075, freqY: 0.055, phaseX: 2.8, phaseY: 1.1,
    depthAmp: 0.17, freqDepth: 0.05, phaseDepth: 2.9,
    rotAmp: 4, freqRot: 0.065, phaseRot: 1.3,
    color: '#e6d6ee',
    poster: 'https://picsum.photos/seed/giulia-terrace/500/500',
    video: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
  },
]

function App() {
  const wrapRefs = useRef({})
  const videoRefs = useRef({})
  const frozenAt = useRef({}) // id -> elapsed time (ms) when hover started
  const hoveredIdRef = useRef(null)
  const [hoveredId, setHoveredId] = useState(null)

  useEffect(() => {
    let raf
    const start = performance.now()

    const tick = (now) => {
      const elapsed = now - start

      projects.forEach((p) => {
        const el = wrapRefs.current[p.id]
        if (!el) return

        const isHovered = hoveredIdRef.current === p.id
        // Freeze this card's clock while hovered so it stops drifting.
        const t = isHovered
          ? (frozenAt.current[p.id] ?? elapsed) / 1000
          : elapsed / 1000
        if (!isHovered) frozenAt.current[p.id] = elapsed

        const x = p.ampX * Math.sin(t * p.freqX * 6.28 + p.phaseX)
        const y = p.ampY * Math.sin(t * p.freqY * 6.28 + p.phaseY)
        const depth = 1 + p.depthAmp * Math.sin(t * p.freqDepth * 6.28 + p.phaseDepth)
        const rot = p.rotAmp * Math.sin(t * p.freqRot * 6.28 + p.phaseRot)

        const hoverBoost = isHovered ? 1.35 : 1
        const scale = depth * hoverBoost

        el.style.transform = `translate3d(${x}px, ${y}px, 0) rotate(${rot}deg) scale(${scale})`
        // Cards that are "farther" (smaller depth) blur slightly for a
        // parallax/depth-of-field feel; hovered card is always crisp.
        el.style.filter = isHovered ? 'none' : `blur(${Math.max(0, (1 - depth) * 4)}px)`
        // Closer (bigger) cards sit above farther ones; hovered card is always on top.
        el.style.zIndex = isHovered ? 999 : Math.round(depth * 100)
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
    delete frozenAt.current[id]
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

      <main className="float-zone">
        {projects.map((p) => (
          <div
            key={p.id}
            ref={(el) => (wrapRefs.current[p.id] = el)}
            className="float-wrap"
            style={{ top: `${p.top}%`, left: `${p.left}%` }}
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
