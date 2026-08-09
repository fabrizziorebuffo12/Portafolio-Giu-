import { useEffect, useRef, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { projects } from './data/projects.js'
import './ProjectPage.css'

const SLIDE_INTERVAL = 4500

export default function ProjectPage() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const projectIndex = projects.findIndex(p => p.slug === slug)
  const project = projects[projectIndex] ?? projects[0]

  const [renderIdx, setRenderIdx] = useState(0)
  const [prevRenderIdx, setPrevRenderIdx] = useState(null)
  const [visible, setVisible] = useState(false)
  const [hovered, setHovered] = useState(false)
  const [vw, setVw] = useState(window.innerWidth)
  const [vh, setVh] = useState(window.innerHeight)

  const fadingRef = useRef(false)

  useEffect(() => {
    setVisible(false)
    setRenderIdx(0)
    setPrevRenderIdx(null)
    fadingRef.current = false
    const t = setTimeout(() => setVisible(true), 60)
    return () => clearTimeout(t)
  }, [slug])

  useEffect(() => {
    const onResize = () => { setVw(window.innerWidth); setVh(window.innerHeight) }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  const total = project.renders.length
  const prevIdx = (renderIdx - 1 + total) % total
  const nextIdx = (renderIdx + 1) % total

  const goTo = useCallback((nextI) => {
    if (fadingRef.current || nextI === renderIdx) return
    fadingRef.current = true
    setPrevRenderIdx(renderIdx)
    setRenderIdx(nextI)
    setTimeout(() => {
      setPrevRenderIdx(null)
      fadingRef.current = false
    }, 450)
  }, [renderIdx])

  const nextRender = useCallback(() => goTo((renderIdx + 1) % total), [goTo, renderIdx, total])

  useEffect(() => {
    if (hovered || total <= 1) return
    const id = setInterval(nextRender, SLIDE_INTERVAL)
    return () => clearInterval(id)
  }, [hovered, nextRender, total])

  const isMobile = vw < 768
  const centerW = Math.round(vw * (isMobile ? 0.72 : 0.46))
  const earW = Math.round(vw * (isMobile ? 0.04 : 0.07))
  const centerH = Math.round(Math.min(centerW * 0.66, vh * 0.5))
  const earH = Math.round(centerH * 0.85)

  const pageC = visible ? 'project-page visible' : 'project-page'
  const stageC = hovered ? 'carousel-stage hovered' : 'carousel-stage'

  return (
    <div className={pageC}>
      <header className="project-header">
        <a
          className="project-home-link"
          href="/"
          onClick={(e) => { e.preventDefault(); navigate('/') }}
        >
          Giulia
        </a>
        <span className="project-tag">xx2026</span>
      </header>

      <div className="project-description-block">
        <p className="project-title">{project.title}</p>
        <p className="project-description">{project.description}</p>
      </div>

      <div
        className="carousel-outer"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <div className={stageC}>
          <div className="carousel-slide left-ear" style={{ width: earW, height: earH }}>
            <img className="img-fade entering" src={project.renders[prevIdx]} alt="" draggable="false" />
          </div>

          <div className="carousel-slide center-slide" style={{ width: centerW, height: centerH }}>
            <img key={renderIdx} className="img-fade entering" src={project.renders[renderIdx]} alt={project.title} draggable="false" />
            {prevRenderIdx !== null && (
              <img key={'prev-' + prevRenderIdx} className="img-fade leaving" src={project.renders[prevRenderIdx]} alt="" draggable="false" />
            )}
          </div>

          <div className="carousel-slide right-ear" style={{ width: earW, height: earH }}>
            <img className="img-fade entering" src={project.renders[nextIdx]} alt="" draggable="false" />
          </div>
        </div>
      </div>

      <div className="project-bottom">
        <a className="project-contact-link" href="#contact">Contact me</a>
      </div>
    </div>
  )
}
