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
    top: 12, left: 8, dx: 26, dy: 18, dur: 13, delay: 0,
    poster: 'https://picsum.photos/seed/giulia-living/900/700',
    video: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
  },
  {
    id: 2,
    size: 'md',
    title: 'Cocina contemporánea',
    top: 6, left: 55, dx: 20, dy: 24, dur: 15, delay: 1.2,
    poster: 'https://picsum.photos/seed/giulia-kitchen/700/600',
    video: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
  },
  {
    id: 3,
    size: 'sm',
    title: 'Habitación principal',
    top: 40, left: 3, dx: 18, dy: 22, dur: 11, delay: 0.6,
    poster: 'https://picsum.photos/seed/giulia-bedroom/700/600',
    video: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
  },
  {
    id: 4,
    size: 'md',
    title: 'Comedor',
    top: 45, left: 60, dx: 24, dy: 16, dur: 14, delay: 2,
    poster: 'https://picsum.photos/seed/giulia-dining/900/700',
    video: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
  },
  {
    id: 5,
    size: 'sm',
    title: 'Oficina en casa',
    top: 72, left: 20, dx: 16, dy: 20, dur: 12, delay: 0.9,
    poster: 'https://picsum.photos/seed/giulia-office/700/600',
    video: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
  },
  {
    id: 6,
    size: 'md',
    title: 'Terraza',
    top: 68, left: 62, dx: 22, dy: 18, dur: 16, delay: 1.6,
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
        zIndex: isHovered ? 5 : 1,
      }}
    >
      <div
        className={`card-tile size-${p.size} ${isHovered ? 'is-hovered' : ''}`}
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
      <span className="watermark">Giulia</span>

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

      <a className="about-link" href="#about">
        About me <i className="fa-solid fa-arrow-right"></i>
      </a>
    </div>
  )
}

export default App
