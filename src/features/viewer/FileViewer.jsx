import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { getPublicUrl } from '../../lib/services/supabase'
import { resolveShortLink } from '../../lib/services/shortLinks'
import AmbientBackground from '../../components/layout/AmbientBackground'
import Icon from '../../components/ui/Icon'
import Logo from '../../components/ui/Logo'

function getContentMode(name) {
  const ext = name.split('.').pop()?.toLowerCase() ?? ''
  if (['png','jpg','jpeg','gif','webp','bmp','svg','ico'].includes(ext)) return 'image'
  if (['mp3','wav','ogg','flac','m4a'].includes(ext)) return 'audio'
  if (['mp4','webm','ogv'].includes(ext)) return 'video'
  if (['txt','md','markdown','csv','log','json','xml','yaml','yml','toml','ini','cfg','html','htm','css','js','ts','jsx','tsx','rtf'].includes(ext)) return 'text'
  return 'binary'
}

function formatBytes(b) {
  if (b < 1024) return `${b} B`
  if (b < 1048576) return `${(b / 1024).toFixed(1)} KB`
  return `${(b / 1048576).toFixed(1)} MB`
}

export default function FileViewer() {
  const params = new URLSearchParams(window.location.search)
  let shortCode = params.get('s')
  const directPath = params.get('path')
  
  // Extract short code from pathname if using /s/code format
  if (!shortCode && window.location.pathname.startsWith('/s/')) {
    shortCode = window.location.pathname.slice(3)
  }
  
  let filePath = directPath ?? ''

  const [content, setContent] = useState(null)
  const [fileName, setFileName] = useState('')
  const [fileSize, setFileSize] = useState(0)
  const [publicUrl, setPublicUrl] = useState('')
  const [mode, setMode] = useState('binary')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    // If short code is provided, resolve it first
    if (shortCode && !filePath) {
      resolveShortLink(shortCode)
        .then((resolved) => {
          if (!resolved) {
            setError('This short link could not be found.')
            setLoading(false)
            return
          }
          filePath = resolved
          loadFile(resolved)
        })
        .catch(() => {
          setError('Failed to resolve this short link.')
          setLoading(false)
        })
    } else if (filePath) {
      loadFile(filePath)
    } else {
      setError('No file was specified in this link.')
      setLoading(false)
    }
  }, [shortCode, directPath])

  function loadFile(path) {
    if (!path) return
    const parts = path.split('/')
    const name = parts[parts.length - 1].replace(/^\d+-/, '')
    setFileName(name)
    const url = getPublicUrl(path)
    setPublicUrl(url)
    const contentMode = getContentMode(name)
    setMode(contentMode)

    if (contentMode === 'text') {
      fetch(url)
        .then((res) => {
          if (!res.ok) throw new Error(`File not found (${res.status})`)
          return res.text()
        })
        .then((text) => { setContent(text); setFileSize(new Blob([text]).size); setLoading(false) })
        .catch((err) => { setError(err instanceof Error ? err.message : 'Failed to load file.'); setLoading(false) })
    } else {
      // For binary/image/audio/video just HEAD to get size
      fetch(url, { method: 'HEAD' })
        .then((res) => {
          if (!res.ok) throw new Error(`File not found (${res.status})`)
          const len = res.headers.get('content-length')
          if (len) setFileSize(parseInt(len, 10))
          setLoading(false)
        })
        .catch((err) => { setError(err instanceof Error ? err.message : 'Failed to locate file.'); setLoading(false) })
    }
  }

  const copyLink = () => { navigator.clipboard.writeText(window.location.href); toast.success('Link copied!') }

  const downloadFile = async () => {
    try {
      const res = await fetch(publicUrl)
      if (!res.ok) throw new Error('Download failed')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = Object.assign(document.createElement('a'), { href: url, download: fileName })
      document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url)
      toast.success('Download started!')
    } catch { toast.error('Download failed') }
  }

  function ContentPreview() {
    if (mode === 'image') return (
      <img src={publicUrl} alt={fileName} className="max-w-full max-h-72 rounded-xl object-contain" />
    )
    if (mode === 'audio') return (
      <audio controls src={publicUrl} className="w-full" />
    )
    if (mode === 'video') return (
      <video controls src={publicUrl} className="w-full max-h-64 rounded-xl" />
    )
    if (mode === 'text' && content !== null) return (
      <pre className="w-full max-h-56 overflow-y-auto text-left font-mono text-xs text-ink-soft whitespace-pre-wrap break-all neu-scroll">
        {content}
      </pre>
    )
    // binary — no preview
    return (
      <div className="flex flex-col items-center gap-3 py-6 text-ink-faint">
        <div className="neu-well w-14 h-14"><Icon name="folder_zip" className="text-3xl" /></div>
        <span className="text-sm">Preview not available — download to open</span>
      </div>
    )
  }

  return (
    <div className="bg-base text-ink min-h-screen flex flex-col items-center justify-center p-4 relative overflow-x-hidden">
      <AmbientBackground />

      <a href="/" className="relative z-10 mb-8" aria-label="BoxedLinks home">
        <Logo />
      </a>

      <main className="neu-raised-lg w-full max-w-xl relative z-10 p-7 md:p-10 animate-rise">
        <button id="viewer-close" onClick={() => (window.location.href = '/')} className="neu-icon-btn absolute top-5 right-5" aria-label="Back to home">
          <Icon name="close" className="text-xl" />
        </button>

        <div className="flex flex-col items-center text-center gap-7">
          {loading ? (
            <div className="py-12 flex flex-col items-center gap-5">
              <div className="neu-well w-20 h-20 text-accent"><Icon name="progress_activity" className="text-4xl animate-spin" /></div>
              <p className="font-semibold text-ink-soft">Fetching your file…</p>
            </div>
          ) : error ? (
            <div className="py-8 flex flex-col items-center gap-4 w-full">
              <div className="neu-well w-20 h-20 text-rose"><Icon name="link_off" className="text-4xl" /></div>
              <h1 className="text-2xl font-bold text-ink">Link unavailable</h1>
              <p className="text-sm text-ink-soft">{error}</p>
              <button id="viewer-home" onClick={() => (window.location.href = '/')} className="neu-btn-accent py-3 px-6 text-sm mt-2">
                <Icon name="home" className="text-lg" />Back to BoxedLinks
              </button>
            </div>
          ) : (
            <>
              <div className="flex flex-col items-center gap-4">
                <div className="neu-well w-20 h-20 !rounded-[8px]">
                  <div className="w-14 h-14 rounded-[6px] bg-accent-grad text-white flex items-center justify-center shadow-[0_8px_20px_-6px_rgba(124,58,237,0.6)]">
                    <Icon name="redeem" fill className="text-3xl" />
                  </div>
                </div>
                <div>
                  <h1 className="text-2xl md:text-3xl font-extrabold text-ink">Someone sent you a file</h1>
                  <p className="text-sm text-ink-soft mt-1.5">It's ready to preview and download.</p>
                </div>
              </div>

              {/* File preview */}
              <div className="neu-inset w-full p-5 flex flex-col items-center gap-4">
                <div className="neu-pill max-w-full">
                  <Icon name="lock" fill className="text-sm text-aqua" />
                  <span className="font-semibold text-ink truncate">{fileName}</span>
                  {fileSize > 0 && <span className="text-ink-faint shrink-0">· {formatBytes(fileSize)}</span>}
                </div>
                <ContentPreview />
              </div>

              {/* Actions */}
              <div className="grid grid-cols-2 gap-4 w-full">
                <button id="viewer-download" onClick={downloadFile} className="neu-btn-accent py-3.5 px-4 text-sm">
                  <Icon name="download" className="text-lg" />Download
                </button>
                <button id="viewer-copy" onClick={copyLink} className="neu-btn py-3.5 px-4 text-sm">
                  <Icon name="link" className="text-lg" />Copy link
                </button>
              </div>

              <div className="text-xs text-ink-faint flex items-center gap-1.5">
                <Icon name="verified_user" fill className="text-sm text-aqua" />
                Secure transfer — no login required
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  )
}
