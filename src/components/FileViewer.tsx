import { useEffect, useState } from 'react'
import { FileText, ArrowLeft, Copy, AlertCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import { getPublicUrl } from '../lib/supabase'

/**
 * Public file viewer — renders at /view?path=<filePath>
 * No authentication required.
 */
export default function FileViewer() {
  const params = new URLSearchParams(window.location.search)
  const filePath = params.get('path') ?? ''

  const [content, setContent] = useState<string | null>(null)
  const [fileName, setFileName] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!filePath) {
      setError('No file path provided.')
      setLoading(false)
      return
    }

    const parts = filePath.split('/')
    setFileName(parts[parts.length - 1].replace(/^\d+-/, '')) // strip timestamp prefix

    const publicUrl = getPublicUrl(filePath)
    fetch(publicUrl)
      .then((res) => {
        if (!res.ok) throw new Error(`File not found (${res.status})`)
        return res.text()
      })
      .then((text) => {
        setContent(text)
        setLoading(false)
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : 'Could not load file.')
        setLoading(false)
      })
  }, [filePath])

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href)
    toast.success('Link copied!')
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        background: '#09090b',
        padding: '1.5rem',
      }}
    >
      {/* Top bar */}
      <div
        style={{
          maxWidth: 780,
          margin: '0 auto',
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          marginBottom: '1.5rem',
        }}
      >
        <button
          id="viewer-back"
          className="btn-ghost"
          onClick={() => (window.location.href = '/')}
          style={{ padding: '0.5rem 0.875rem' }}
        >
          <ArrowLeft size={15} />
          Home
        </button>

        {!loading && !error && (
          <button
            id="viewer-copy"
            className="btn-primary"
            onClick={copyLink}
            style={{ marginLeft: 'auto' }}
          >
            <Copy size={15} />
            Copy Link
          </button>
        )}
      </div>

      {/* Content card */}
      <div
        style={{ maxWidth: 780, margin: '0 auto', width: '100%', flex: 1 }}
      >
        {loading && (
          <div
            className="glass animate-fade-in"
            style={{ borderRadius: '16px', padding: '4rem', textAlign: 'center' }}
          >
            <svg
              className="animate-spin-slow"
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#6366f1"
              strokeWidth="2"
              style={{ margin: '0 auto 1rem' }}
            >
              <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
            </svg>
            <p style={{ color: '#52525b', fontSize: '0.9rem' }}>Loading file…</p>
          </div>
        )}

        {error && (
          <div
            className="glass animate-fade-in"
            style={{
              borderRadius: '16px',
              padding: '3rem 2rem',
              textAlign: 'center',
            }}
          >
            <AlertCircle size={40} color="#ef4444" style={{ margin: '0 auto 1rem' }} />
            <h2 style={{ fontWeight: 700, color: '#f4f4f5', marginBottom: '0.5rem' }}>File Not Found</h2>
            <p style={{ color: '#71717a', fontSize: '0.9rem' }}>{error}</p>
            <button
              className="btn-primary"
              onClick={() => (window.location.href = '/')}
              style={{ marginTop: '1.5rem' }}
            >
              Back to BoxedLinks
            </button>
          </div>
        )}

        {!loading && !error && content !== null && (
          <div className="glass animate-fade-in-up" style={{ borderRadius: '16px', overflow: 'hidden' }}>
            {/* File header */}
            <div
              style={{
                padding: '1rem 1.5rem',
                borderBottom: '1px solid rgba(255,255,255,0.06)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                background: 'rgba(255,255,255,0.02)',
              }}
            >
              <FileText size={18} color="#818cf8" />
              <span style={{ fontWeight: 600, color: '#f4f4f5', fontSize: '0.95rem' }}>{fileName}</span>
              <span style={{ marginLeft: 'auto', color: '#52525b', fontSize: '0.75rem' }}>
                {content.split('\n').length} lines · {new Blob([content]).size} bytes
              </span>
            </div>

            {/* File body */}
            <pre
              className="scrollbar-thin"
              style={{
                margin: 0,
                padding: '1.5rem',
                fontFamily: '"JetBrains Mono", "Fira Code", "Cascadia Code", monospace',
                fontSize: '0.85rem',
                lineHeight: 1.7,
                color: '#d4d4d8',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                overflowX: 'auto',
                maxHeight: '75vh',
                overflowY: 'auto',
              }}
            >
              {content}
            </pre>
          </div>
        )}
      </div>
    </div>
  )
}
