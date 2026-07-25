import { useEffect, useRef, useState } from 'react'

// Placeholder projects — swap `poster`/`video` for Giulia's real interior
// design photography and clips as soon as she sends them.
//
// slot: which cell of the invisible layout grid the card starts in.
// amp*/freq*/phase*: small ambient wander while resting.
// depth*: the "closer / farther" pulse (scale + slight blur).
// rot*: continuous gentle spin while floating.
const projects = [
  {
    id: 1, size: 'lg', title: 'Sala minimalista', slot: 0,
    ampX: 32, ampY: 24, freqX: 0.055, freqY: 0.07, phaseX: 0, phaseY: 1.4,
    depthAmp: 0.12, freqDepth: 0.04, phaseDepth: 0,
    rotAmp: 3, freqRot: 0.05, phaseRot: 0.6,
    color: '#c9c2ea',
    poster: 'https://picsum.photos/seed/giulia-living/900/700',
    video: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
  },
  {
    id: 2, size: 'sm', title: 'Cocina contemporánea', slot: 1,
    ampX: 26, ampY: 30, freqX: 0.07, freqY: 0.05, phaseX: 2.1, phaseY: 0.3,
    depthAmp: 0.14, freqDepth: 0.045, phaseDepth: 2.2,
    rotAmp: 4, freqRot: 0.06, phaseRot: 1.8,
    color: '#f0c9c9',
    poster: 'https://picsum.photos/seed/giulia-kitchen/700/600',
    video: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
  },
  {
    id: 3, size: 'md', title: 'Habitación principal', slot: 2,
    ampX: 22, ampY: 28, freqX: 0.06, freqY: 0.065, phaseX: 0.8, phaseY: 3.0,
    depthAmp: 0.1, freqDepth: 0.05, phaseDepth: 1.1,
    rotAmp: 3, freqRot: 0.045, phaseRot: 2.6,
    color: '#cfe8f2',
    poster: 'https://picsum.photos/seed/giulia-bedroom/700/600',
    video: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
  },
  {
    id: 4, size: 'md', title: 'Comedor', slot: 3,
    ampX: 28, ampY: 20, freqX: 0.05, freqY: 0.06, phaseX: 3.6, phaseY: 0.9,
    depthAmp: 0.13, freqDepth: 0.038, phaseDepth: 3.4,
    rotAmp: 3.5, freqRot: 0.055, phaseRot: 0.2,
    color: '#f5e8ad',
    poster: 'https://picsum.photos/seed/giulia-dining/900/700',
    video: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
  },
  {
    id: 5, size: 'lg', title: 'Oficina en casa', slot: 4,
    ampX: 24, ampY: 26, freqX: 0.065, freqY: 0.05, phaseX: 1.6, phaseY: 2.4,
    depthAmp: 0.11, freqDepth: 0.042, phaseDepth: 0.5,
    rotAmp: 3, freqRot: 0.05, phaseRot: 3.1,
    color: '#a9d2c4',
    poster: 'https://picsum.photos/seed/giulia-office/700/600',
    video: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
  },
  {
    id: 6, size: 'sm', title: 'Terraza', slot: 5,
    ampX: 20, ampY: 22, freqX: 0.075, freqY: 0.055, phaseX: 2.8, phaseY: 1.1,
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

// --- Layout: an invisible 3x2 grid of slots. Cards always rest inside a
// slot (jittered a bit) instead of anywhere at random, so they can never
// all pile up on one side of the screen. ---
const GRID_COLS = 3
const GRID_ROWS = 2
const SLOT_JITTER = 0.16 // how far (fraction of a cell) a card can sit off-center
const MIN_GAP = 40 // px of breathing room enforced between resting cards

// --- Wave pattern: how many cards leave the screen together, in order.
// It loops, so all 6 leave at once only once per full cycle. ---
const WAVE_PATTERN = [2, 3, 2, 4, 6, 3]
const WAVE_GAP_MIN = 5000
const WAVE_GAP_MAX = 9000

const EDGE_MARGIN = 140
const HIDDEN_MIN = 1800
const HIDDEN_MAX = 4200
const EXIT_MS = 1400
const ENTER_MS = 1500

// --- Depth: each time a card (re)enters, it's assigned a random base
// scale so near (big) and far (small) cards coexist on screen at once —
// this is the automatic "zoom" that replaces the reference's scroll. ---
const DEPTH_MIN = 0.5   // farthest / smallest
const DEPTH_MAX = 1.7   // nearest / biggest
const HOVER_TARGET_SCALE = 1.5 // hovered card settles to this readable size

const POS_LERP = 0.055
const SCALE_LERP = 0.09
const OPACITY_LERP = 0.1

const rand = (min, max) => min + Math.random() * (max - min)
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)]

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

    // Center point of a given grid slot, with a little random offset so
    // the composition never looks like a rigid table.
    const slotPoint = (slotIndex, r) => {
      const col = slotIndex % GRID_COLS
      const row = Math.floor(slotIndex / GRID_COLS) % GRID_ROWS
      const cellW = r.width / GRID_COLS
      const cellH = r.height / GRID_ROWS
      return {
        x: cellW * (col + 0.5) + rand(-1, 1) * cellW * SLOT_JITTER,
        y: cellH * (row + 0.5) + rand(-1, 1) * cellH * SLOT_JITTER,
      }
    }

    // Pick a slot that isn't currently claimed by another card, and make
    // sure the resulting point keeps a minimum gap from every other card.
    const claimRestPoint = (id, r) => {
      const taken = new Set(
        Object.entries(cardState.current)
          .filter(([otherId]) => Number(otherId) !== id)
          .map(([, s]) => s.slot)
      )
      const free = []
      for (let i = 0; i < GRID_COLS * GRID_ROWS; i++) {
        if (!taken.has(i)) free.push(i)
      }
      const slot = free.length ? pick(free) : Math.floor(rand(0, GRID_COLS * GRID_ROWS))

      let point = slotPoint(slot, r)
      // Nudge away if it still landed too close to someone else.
      for (let attempt = 0; attempt < 12; attempt++) {
        const tooClose = Object.entries(cardState.current).some(([otherId, s]) => {
          if (Number(otherId) === id) return false
          const dx = s.restX - point.x
          const dy = s.restY - point.y
          return Math.hypot(dx, dy) < MIN_GAP + 160
        })
        if (!tooClose) break
        point = slotPoint(slot, r)
      }
      return { slot, ...point }
    }

    const offscreenPoint = (dir, size, r) => {
      const half = { x: size.w / 2, y: size.h / 2 }
      switch (dir) {
        case 'left':
          return { x: -half.x - EDGE_MARGIN, y: rand(half.y, r.height - half.y) }
        case 'right':
          return { x: r.width + half.x + EDGE_MARGIN, y: rand(half.y, r.height - half.y) }
        case 'top':
          return { x: rand(half.x, r.width - half.x), y: -half.y - EDGE_MARGIN }
        default:
          return { x: rand(half.x, r.width - half.x), y: r.height + half.y + EDGE_MARGIN }
      }
    }

    // Initial placement: one card per slot, as authored, each with a
    // distinct starting depth so the first frame already shows variety.
    const r0 = rect()
    const initialDepths = [1.6, 0.6, 1.15, 0.85, 1.4, 0.55]
    projects.forEach((p, i) => {
      const pt = slotPoint(p.slot, r0)
      cardState.current[p.id] = {
        phase: 'float',
        slot: p.slot,
        x: pt.x,
        y: pt.y,
        restX: pt.x,
        restY: pt.y,
        baseDepth: initialDepths[i] ?? rand(DEPTH_MIN, DEPTH_MAX),
        scale: initialDepths[i] ?? 1,
        rot: 0,
        opacity: 1,
        phaseStart: performance.now(),
      }
    })

    // --- Wave scheduler: every few seconds, send N cards off-screen
    // together, following WAVE_PATTERN. ---
    let waveIndex = 0
    let waveTimer

    const runWave = () => {
      const count = WAVE_PATTERN[waveIndex % WAVE_PATTERN.length]
      waveIndex++

      const r = rect()
      const eligible = projects.filter(
        (p) =>
          cardState.current[p.id]?.phase === 'float' &&
          hoveredIdRef.current !== p.id
      )
      // Shuffle so the same cards don't always lead the wave.
      const shuffled = [...eligible].sort(() => Math.random() - 0.5)
      shuffled.slice(0, count).forEach((p, i) => {
        const s = cardState.current[p.id]
        const size = SIZE_PX[p.size]
        const dir = pick(['left', 'right', 'top', 'bottom'])
        const target = offscreenPoint(dir, size, r)
        // Slight stagger inside a wave so they don't move as one block.
        setTimeout(() => {
          if (s.phase !== 'float' || hoveredIdRef.current === p.id) return
          s.phase = 'exit'
          s.phaseStart = performance.now()
          s.exitTargetX = target.x
          s.exitTargetY = target.y
        }, i * rand(120, 380))
      })

      waveTimer = setTimeout(runWave, rand(WAVE_GAP_MIN, WAVE_GAP_MAX))
    }
    waveTimer = setTimeout(runWave, 4000)

    let raf
    const start = performance.now()

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

        let targetX = s.restX
        let targetY = s.restY
        let targetScale = 1
        let targetOpacity = 1
        let targetRot = 0

        if (s.phase === 'float') {
          const t = elapsed / 1000
          // Small ambient breathing around this card's assigned base depth,
          // so near cards stay near and far cards stay far, but nothing is
          // perfectly static.
          const breathe = p.depthAmp * Math.sin(t * p.freqDepth * 6.28 + p.phaseDepth)
          if (isHovered) {
            // Freeze drift + settle to a comfortable readable size so it's
            // easy to point at and watch the video, regardless of how big
            // or small the card was floating.
            targetX = s.restX
            targetY = s.restY
            targetScale = HOVER_TARGET_SCALE
            targetRot = 0
          } else {
            targetX = s.restX + p.ampX * Math.sin(t * p.freqX * 6.28 + p.phaseX)
            targetY = s.restY + p.ampY * Math.sin(t * p.freqY * 6.28 + p.phaseY)
            targetScale = s.baseDepth + breathe
            targetRot = p.rotAmp * Math.sin(t * p.freqRot * 6.28 + p.phaseRot)
          }
        } else if (s.phase === 'exit') {
          targetX = s.exitTargetX
          targetY = s.exitTargetY
          targetScale = Math.min(s.baseDepth, 0.72)
          targetOpacity = 0
          targetRot = p.rotAmp * 1.6

          // Only move on once it is genuinely invisible, so the teleport
          // to the entry edge can never be seen as a "cut".
          if (inPhaseFor > EXIT_MS && s.opacity < 0.02) {
            s.phase = 'hidden'
            s.phaseStart = now
            s.hiddenDuration = rand(HIDDEN_MIN, HIDDEN_MAX)
          }
        } else if (s.phase === 'hidden') {
          targetX = s.exitTargetX
          targetY = s.exitTargetY
          targetScale = s.scale
          targetOpacity = 0

          if (inPhaseFor > s.hiddenDuration) {
            const entryDir = pick(['left', 'right', 'top', 'bottom'])
            const entry = offscreenPoint(entryDir, size, r)
            const rest = claimRestPoint(p.id, r)
            // Assign a fresh random depth for this next appearance, so the
            // near/far mix keeps reshuffling over time.
            s.baseDepth = rand(DEPTH_MIN, DEPTH_MAX)
            // Hard-set: the card is fully transparent here, so snapping
            // position/scale is invisible to the viewer.
            s.x = entry.x
            s.y = entry.y
            s.scale = s.baseDepth * 0.85
            s.opacity = 0
            s.slot = rest.slot
            s.restX = rest.x
            s.restY = rest.y
            s.phase = 'enter'
            s.phaseStart = now
          }
        } else if (s.phase === 'enter') {
          targetX = s.restX
          targetY = s.restY
          targetScale = s.baseDepth
          targetOpacity = 1

          if (inPhaseFor > ENTER_MS) {
            s.phase = 'float'
            s.phaseStart = now
          }
        }

        s.x += (targetX - s.x) * POS_LERP
        s.y += (targetY - s.y) * POS_LERP
        s.scale += (targetScale - s.scale) * SCALE_LERP
        s.opacity += (targetOpacity - s.opacity) * OPACITY_LERP
        s.rot += (targetRot - s.rot) * POS_LERP

        el.style.transform =
          `translate3d(${(s.x - size.w / 2).toFixed(1)}px, ${(s.y - size.h / 2).toFixed(1)}px, 0) ` +
          `rotate(${s.rot.toFixed(2)}deg) scale(${s.scale.toFixed(3)})`
        el.style.opacity = s.opacity.toFixed(3)
        // Far (small) cards get a soft focus; near (big) cards stay crisp.
        const blurPx = isHovered ? 0 : Math.max(0, (1 - s.scale) * 5)
        el.style.filter = `blur(${blurPx.toFixed(2)}px)`
        el.style.zIndex = isHovered ? 999 : Math.round(s.scale * 100)
        el.style.pointerEvents = s.phase === 'float' ? 'auto' : 'none'
      })

      raf = requestAnimationFrame(tick)
    }

    raf = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(raf)
      clearTimeout(waveTimer)
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
      {/* Stretched edge-to-edge wordmark. SVG lets the text fill the full
          width regardless of the font's natural proportions. */}
      <div className="watermark-layer">
        <svg
          className="watermark-svg"
          viewBox="0 0 1000 260"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <text x="500" y="200" textAnchor="middle">Giulia</text>
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
              <div className="card-overlay">
                <span>{p.title}</span>
              </div>
            </div>
          </div>
        ))}
      </main>

      <a className="contact-link" href="#contact">Contact me</a>
    </div>
  )
}

export default App
