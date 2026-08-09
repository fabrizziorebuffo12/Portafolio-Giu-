import React from 'react'
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
  const [cursorLeft, setCursorLeft] = useState(false)
  const [arrowLeft, setArrowLeft] = useState('50%')
  const timerRef = useRef(null)
  const touchStartX = useRef(null)
  const centerRef = useRef(null)
  const fadingRef = useRef(false)

  useEffect(() => {
    setVisible(false)
    setRenderIdx(0)
    setPrevRenderIdx(null)
    fadingRef.current = false
    const t = setTimeout(() => setVisible(true), 60)
    return () => clearTimeout(t)
  }, [slug])

  const total = project.renders.length
  const prevIdx = (renderIdx - 1 + total) % total
  const nextIdx = (renderIdx + 1) % total

  useEffect(() => {
    const update = () => {
      const rect = centerRef.current.getBoundingClientRect()
      setArrowLeft((rect.left + rect.width / 2) + 'px')
    }
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])

  const goTo = useCallback((nextI) => {
    if (fadingRef.current || nextI === renderIdx) return
    fadingRef.current = true
    setPrevRenderIdx(renderIdx)
    setRenderIdx(nextI)
    setTimeout(() => { setPrevRenderIdx(null); fadingRef.current = false }, 450)
  }, [renderIdx])

  const nextRender = useCallback(() => goTo((renderIdx + 1) % total), [goTo, renderIdx, total])
  const prevRender = useCallback(() => goTo((renderIdx - 1 + total) % total), [goTo, renderIdx, total])

  useEffect(() => {
    clearInterval(timerRef.current)
    return () => clearInterval(timerRef.current)
  }, [hovered, nextRender])

  const goProject = useCallback((idx) => {
    setVisible(false)
    setTimeout(() => navigate('/proyecto/' + projects[idx].slug), 200)
  }, [navigate])
  const goPrevProject = () => goProject((projectIndex - 1 + projects.length) % projects.length)
  const goNextProject = () => goProject((projectIndex + 1) % projects.length)

  const onTouchStart = e => { touchStartX.current = e.touches[0].clientX }
  const onTouchEnd = e => {
    if (touchStartX.current === null) return
    const dx = e.changedTouches[0].clientX - touchStartX.current
    if (Math.abs(dx) > 40) dx < 0 ? nextRender() : prevRender()
    touchStartX.current = null
  }
  const onMouseMove = e => {
    const rect = e.currentTarget.getBoundingClientRect()
    setCursorLeft(e.clientX - rect.left < rect.width / 2)
  }
  const handleCenterClick = () => cursorLeft ? prevRender() : nextRender()

  const [vw, setVw] = useState(window.innerWidth)
  const [vh, setVh] = useState(window.innerHeight)
  useEffect(() => {
    const onResize = () => { setVw(window.innerWidth); setVh(window.innerHeight) }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])
  const isMobile = vw < 768
  const centerW = Math.round(vw * (isMobile ? 0.84 : 0.64))
  const earW = Math.round(vw * (isMobile ? 0.05 : 0.08))
  const centerH = Math.round(Math.min(centerW * 0.66, vh * 0.58))
  const earH = Math.round(centerH * 0.85)
  const counter = String(projectIndex + 1).padStart(2, '0') + ' / ' + String(projects.length).padStart(2, '0')
  const pageC = visible ? 'project-page visible' : 'project-page'
  const stageC = hovered ? 'carousel-stage hovered' : 'carousel-stage'
  const centerC = 'carousel-slide center-slide' + (cursorLeft ? ' cursor-left' : '')

  return React.createElement('div', {className: pageC},
    React.createElement('header', {className: 'project-header'},
      React.createElement('a', {className: 'project-home-link', href: '/', onClick: e => {e.preventDefault(); navigate('/')}}, 'Giulia'),
      React.createElement('div', {className: 'project-header-right'},
        React.createElement('span', {className: 'project-tag'}, 'xx2026'),
        React.createElement('span', {className: 'project-counter'}, counter)
      )
    ),
    React.createElement('div', {className: 'project-description-block'},
      React.createElement('p', {className: 'project-title'}, project.title),
      React.createElement('p', {className: 'project-description'}, project.description)
    ),
    React.createElement('div', {className: 'carousel-outer', onMouseEnter: () => setHovered(true), onMouseLeave: () => setHovered(false), onTouchStart, onTouchEnd},
      React.createElement('div', {className: stageC},
        React.createElement('div', {className: 'carousel-slide left-ear', style: {width: earW, height: earH}, onClick: prevRender},
          React.createElement('img', {className: 'img-fade entering', src: project.renders[prevIdx], alt: '', draggable: 'false'})
        ),
        React.createElement('div', {ref: centerRef, className: centerC, style: {width: centerW, height: centerH}, onClick: handleCenterClick, onMouseMove},
          React.createElement('img', {key: renderIdx, className: 'img-fade entering', src: project.renders[renderIdx], alt: project.title, draggable: 'false'}),
          prevRenderIdx !== null && React.createElement('img', {key: 'prev-' + prevRenderIdx, className: 'img-fade leaving', src: project.renders[prevRenderIdx], alt: '', draggable: 'false'})
        ),
        React.createElement('div', {className: 'carousel-slide right-ear', style: {width: earW, height: earH}, onClick: nextRender},
          React.createElement('img', {className: 'img-fade entering', src: project.renders[nextIdx], alt: '', draggable: 'false'})
        )
      )
    ),
    React.createElement('div', {className: 'project-bottom'},
      React.createElement('div', {className: 'project-indicators'},
        project.renders.map((_, i) => React.createElement('span', {key: i, className: i === renderIdx ? 'active' : '', onClick: () => goTo(i)}))
      ),
      React.createElement('a', {className: 'project-contact-link', href: '#contact'}, 'Contact me')
    ),
    React.createElement('button', {className: 'project-nav-left', style: {left: arrowLeft, marginLeft: '-32px'}, onClick: goPrevProject}, String.fromCharCode(8592)),
    React.createElement('button', {className: 'project-nav-right', style: {left: arrowLeft, marginLeft: '12px'}, onClick: goNextProject}, String.fromCharCode(8594))
  )
}
