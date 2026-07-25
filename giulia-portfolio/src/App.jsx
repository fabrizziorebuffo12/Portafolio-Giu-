import { useRef, useState } from 'react'

// Placeholder projects — swap `poster`/`video` for Giulia's real interior
// design photography and clips as soon as she sends them.
// top/left are the resting position (% of the floating zone).
// dx/dy set how far each card drifts while floating (px).
const projects = [
  {
    id: 1,
    size: 'lg',
    title: 'Sala minimalista',
    top: 8, left: 6, dx: 46, dy: 32, dur: 15, delay: 0, ease: 'ease-in-out',
    color: '#c9c2ea',
    poster: 'https://picsum.photos/seed/giulia-living/900/700',
    video: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
  },
  {
    id: 2,
    size: 'sm',
    title: 'Cocina contemporánea',
    top: 14, left: 41, dx: 34, dy: 40, dur: 12, delay: 1.4, ease: 'cubic-bezier(.45,0,.55,1)',
    color: '#f0c9c9',
    poster: 'https://picsum.photos/seed/giulia-kitchen/700/600',
    video: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
  },
  {
    id: 3,
    size: 'md',
    title: 'Habitación principal',
    top: 6, left: 76, dx: 28, dy: 36, dur: 11, delay: 0.7, ease: 'ease-in-out',
    color: '#cfe8f2',
    poster: 'https://picsum.photos/seed/giulia-bedroom/700/600',
    video: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
  },
  {
    id: 4,
    size: 'md',
    title: 'Comedor',
    top: 58, left: 9, dx: 36, dy: 26, dur: 14, delay: 2.1, ease: 'cubic-bezier(.37,0,.63,1)',
    color: '#f5e8ad',
    poster: 'https://picsum.photos/seed/giulia-dining/900/700',
    video: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
  },
  {
    id: 5,
    size: 'lg',
    title: 'Oficina en casa',
    top: 60, left: 40, dx: 30, dy: 34, dur: 16, delay: 0.9, ease: 'ease-in-out',
    color: '#a9d2c4',
    poster: 'https://picsum.photos/seed/giulia-office/700/600',
    video: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
  },
  {
    id: 6,
    size: 'sm',
    title: 'Terraza',
    top: 56, left: 78, dx: 24, dy: 30, dur: 10, delay: 1.7, ease: 'cubic-bezier(.45,0,.55,1)',
    color: '#e6d6ee',
    poster: 'https://picsum.photos/seed/giulia-terrace/500/500',
    video: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
  },
]

function ProjectCard({ p, isHovered, onEnter, onLeave }) {
  const videoRef = useRef(null)

  const handleEnter = () => {
    onEnter(p.id)
    const v = videoRef.current
    if (v) {
      v.currentTime = 0
      v.play().catch(() => {})
    }
  }

  const handleLeave = () => {
    onLeave()
    const v = videoRef.current
    if (v) {
      v.pause()
      v.currentTime = 0
    }
  }

  return (
    <div
      className="float-wrap"
      style={{
        top: `${p.top}%`,
        left: `${p.left}%`,
        '--dx': `${p.dx}px`,
        '--dy': `${p.dy}px`,
        '--dur': `${p.dur}s`,
        '--delay': `${p.delay}s`,
        '--ease': p.ease,
        zIndex: isHovered ? 5 : 1,
      }}
    >
      <div
        className={`card-tile size-${p.size} ${isHovered ? 'is-hovered' : ''}`}
        style={{ backgroundColor: p.color }}
        onMouseEnter={handleEnter}
        onMouseLeave={handleLeave}
      >
        <video
          ref={videoRef}
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
  )
}

function App() {
  const [hovered, setHovered] = useState(null)

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
          <ProjectCard
            key={p.id}
            p={p}
            isHovered={hovered === p.id}
            onEnter={setHovered}
            onLeave={() => setHovered(null)}
          />
        ))}
      </main>

      <a className="about-link" href="#contact">
        Contact me <i className="fa-solid fa-arrow-right"></i>
      </a>
    </div>
  )
}

export default App
