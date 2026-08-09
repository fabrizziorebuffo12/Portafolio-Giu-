import { useEffect, useRef, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { projects } from './data/projects.js'
import './ProjectPage.css'

const SLIDE_INTERVAL = 4000
const CENTER_W_RATIO = 0.62  // center slide = 62% of viewport width
const SIDE_W_RATIO   = 0.13  // each ear = 13% of viewport width

export default function ProjectPage() {
  const { slug } = useParams()
  const navigate  = useNavigate()

  const projectIndex = projects.findIndex(p => p.slug === slug)
  const project = projects[projectIndex] ?? projects[0]

  const [renderIdx, setRenderIdx] = useState(0)
  const [visible,   setVisible]   = useState(false)
  const [zoomed,    setZoomed]    = useState(false)
  const timerRef = useRef(null)

  // Fade in on mount
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 30)
    return () => clearTimeout(t)
  }, [])

  // Reset render index when project changes
  useEffect(() => { setRenderIdx(0) }, [slug])

  const total = project.renders.length

  const prev = useCallback(() => {
    setRenderIdx(i => (i - 1 + total) % total)
  }, [total])

  const next = useCallback(() => {
    setRenderIdx(i => (i + 1) % total)
  }, [total])

  // Auto-advance when not zoomed
  useEffect(() => {
    if (zoomed) { clearInterval(timerRef.current); return }
    timerRef.current = setInterval(next, SLIDE_INTERVAL)
    return () => clearInterval(timerRef.current)
  }, [zoomed, next])

  const prevProject = () => {
    const idx = (projectIndex - 1 + projects.length) % projects.length
    navigate(`/proyecto/${projects[idx].slug}`)
  }

  const nextProject = () => {
    const idx = (projectIndex + 1) % projects.length
    navigate(`/proyecto/${projects[idx].slug}`)
  }

  // Swipe support
  const touchStartX = useRef(null)
  const onTouchStart = e => { touchStartX.current = e.touches[0].clientX }
  const onTouchEnd   = e => {
    if (touchStartX.current === null) return
    const dx = e.changedTouches[0].clientX - touchStartX.current
    if (Math.abs(dx) > 40) { dx < 0 ? next() : prev() }
    touchStartX.current = null
  }

  // Slide sizes (responsive)
  const [vw, setVw] = useState(window.innerWidth)
  useEffect(() => {
    const onResize = () => setVw(window.innerWidth)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])
  const isMobile  = vw < 768
  const centerW   = Math.round(vw * (isMobile ? 0.84 : CENTER_W_RATIO))
  const sideW     = Math.round(vw * (isMobile ? 0.06 : SIDE_W_RATIO))
  const slideH    = Math.round(centerW * 0.64)

  const prevIdx = (renderIdx - 1 + total) % total
  const nextIdx = (renderIdx + 1) % total

  return (
    <div className={`project-page${visible ? ' visible' : ''}`}>

      {/* Header */}
      <header className="project-header">
        <a className="project-home-link" href="/" onClick={e => { e.preventDefault(); navigate('/') }}>
          Giulia
        </a>
        <span className="project-tag">xx2026</span>
      </header>

      {/* Main */}
      <main className="project-main">

        {/* Description + arrows */}
        <div className="project-meta">
          <div className="project-description">
            <strong>{project.title}</strong>
            {project.description}
          </div>
          <div className="project-nav-arrows">
            <button onClick={prevProject} title="Proyecto anterior">←</button>
            <span className="project-counter">
              {String(projectIndex + 1).padStart(2, '0')} / {String(projects.length).padStart(2, '0')}
            </span>
            <button onClick={nextProject} title="Proyecto siguiente">→</button>
          </div>
        </div>

        {/* Carousel */}
        <div
          className={`carousel-track-wrap${zoomed ? ' zoomed' : ''}`}
          onMouseEnter={() => setZoomed(true)}
          onMouseLeave={() => setZoomed(false)}
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
        >
          <div className="carousel-track">

            {/* Left ear */}
            <div
              className="carousel-slide side"
              style={{ width: sideW, height: slideH }}
              onClick={prev}
            >
              <img src={project.renders[prevIdx]} alt="" draggable="false" />
            </div>

            {/* Center */}
            <div
              className={`carousel-slide center${zoomed ? ' zoomed' : ''}`}
              style={{ width: centerW, height: slideH }}
              onClick={next}
            >
              <img
                src={project.renders[renderIdx]}
                alt={`${project.title} render ${renderIdx + 1}`}
                draggable="false"
              />
            </div>

            {/* Right ear */}
            <div
              className="carousel-slide side"
              style={{ width: sideW, height: slideH }}
              onClick={next}
            >
              <img src={project.renders[nextIdx]} alt="" draggable="false" />
            </div>

          </div>
        </div>

        {/* Indicators */}
        <div className="project-indicators">
          {project.renders.map((_, i) => (
            <span
              key={i}
              className={i === renderIdx ? 'active' : ''}
              onClick={() => setRenderIdx(i)}
              style={{ cursor: 'pointer' }}
            />
          ))}
        </div>

      </main>

      {/* Footer */}
      <footer className="project-footer">
        <a className="project-contact-link" href="#contact">Contact me</a>
      </footer>

    </div>
  )
}
