import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './ContactPage.css'

export default function ContactPage() {
  const navigate = useNavigate()
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 60)
    return () => clearTimeout(t)
  }, [])

  return (
    <div className={visible ? 'contact-page visible' : 'contact-page'}>
      <header className="contact-header">
        <a
          className="contact-home-link"
          href="/"
          onClick={(e) => { e.preventDefault(); navigate('/') }}
        >
          Giulia
        </a>
      </header>

      <div className="watermark-layer">
        <span className="watermark">Giulia</span>
      </div>

      <div className="contact-info">
        <div className="info-row">
          <span>GA.GA</span>
          <span>Interior designer</span>
        </div>
        <div className="info-row">
          <span>Based in Ccs, Venezuela</span>
          <span>2026</span>
        </div>
      </div>

      <div className="contact-block">
        <p className="contact-label">Contact</p>
        <p className="contact-value">Giulianaagazzillodesign.com</p>
      </div>
    </div>
  )
}
