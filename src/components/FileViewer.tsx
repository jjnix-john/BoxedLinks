import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { getPublicUrl } from '../lib/supabase'

type ContentMode = 'text' | 'image' | 'audio' | 'video' | 'binary'

function getContentMode(name: string): ContentMode {
  const ext = name.split('.').pop()?.toLowerCase() ?? ''
  if (['png','jpg','jpeg','gif','webp','bmp','svg','ico'].includes(ext)) return 'image'
  if (['mp3','wav','ogg','flac','m4a'].includes(ext)) return 'audio'
  if (['mp4','webm','ogv'].includes(ext)) return 'video'
  if (['txt','md','markdown','csv','log','json','xml','yaml','yml','toml','ini','cfg','html','htm','css','js','ts','jsx','tsx','rtf'].includes(ext)) return 'text'
  return 'binary'
}

function formatBytes(b: number) {
  if (b < 1024) return `${b} B`
  if (b < 1048576) return `${(b / 1024).toFixed(1)} KB`
  return `${(b / 1048576).toFixed(1)} MB`
}

export default function FileViewer() {
  const params = new URLSearchParams(window.location.search)
  const filePath = params.get('path') ?? ''

  const [content, setContent] = useState<string | null>(null)
  const [fileName, setFileName] = useState('')
  const [fileSize, setFileSize] = useState(0)
  const [publicUrl, setPublicUrl] = useState('')
  const [mode, setMode] = useState<ContentMode>('binary')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!filePath) { setError('NO TRANSMISSION PATH SPECIFIED.'); setLoading(false); return }
    const parts = filePath.split('/')
    const name = parts[parts.length - 1].replace(/^\d+-/, '')
    setFileName(name)
    const url = getPublicUrl(filePath)
    setPublicUrl(url)
    const contentMode = getContentMode(name)
    setMode(contentMode)

    if (contentMode === 'text') {
      fetch(url)
        .then((res) => {
          if (!res.ok) throw new Error(`TRANSMISSION NOT FOUND (${res.status})`)
          return res.text()
        })
        .then((text) => { setContent(text); setFileSize(new Blob([text]).size); setLoading(false) })
        .catch((err: unknown) => { setError(err instanceof Error ? err.message : 'FAILED TO EXTRACT.'); setLoading(false) })
    } else {
      // For binary/image/audio/video just HEAD to get size
      fetch(url, { method: 'HEAD' })
        .then((res) => {
          if (!res.ok) throw new Error(`TRANSMISSION NOT FOUND (${res.status})`)
          const len = res.headers.get('content-length')
          if (len) setFileSize(parseInt(len, 10))
          setLoading(false)
        })
        .catch((err: unknown) => { setError(err instanceof Error ? err.message : 'FAILED TO LOCATE FILE.'); setLoading(false) })
    }
  }, [filePath])

  const copyLink = () => { navigator.clipboard.writeText(window.location.href); toast.success('TRANSMISSION LINK COPIED!') }

  const downloadFile = async () => {
    try {
      const res = await fetch(publicUrl)
      if (!res.ok) throw new Error('Download failed')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = Object.assign(document.createElement('a'), { href: url, download: fileName })
      document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url)
      toast.success('DOWNLOAD STARTED!')
    } catch { toast.error('DOWNLOAD FAILED') }
  }

  function ContentPreview() {
    if (mode === 'image') return (
      <img src={publicUrl} alt={fileName} className="max-w-full max-h-64 border border-outline-variant object-contain" />
    )
    if (mode === 'audio') return (
      <audio controls src={publicUrl} className="w-full mt-2" style={{ filter: 'invert(1) hue-rotate(180deg)' }} />
    )
    if (mode === 'video') return (
      <video controls src={publicUrl} className="w-full max-h-48 border border-outline-variant" />
    )
    if (mode === 'text' && content !== null) return (
      <pre className="w-full max-h-48 overflow-y-auto text-left font-label-sm text-label-sm bg-surface-container-lowest border border-outline-variant p-3 text-on-surface whitespace-pre-wrap break-all scrollbar-retro mt-1">
        {content}
      </pre>
    )
    // binary — no preview
    return (
      <div className="flex flex-col items-center gap-2 py-4 text-on-surface-variant/60">
        <span className="material-symbols-outlined text-4xl">folder_zip</span>
        <span className="font-label-sm text-label-sm">PREVIEW NOT AVAILABLE — DOWNLOAD TO OPEN</span>
      </div>
    )
  }

  return (
    <div className="bg-background text-on-background min-h-screen flex flex-col items-center justify-center p-4 relative font-body-md overflow-x-hidden">
      <div className="scanlines" />
      {/* Ambient bg */}
      <div className="floating-bg" aria-hidden="true">
        <span className="material-symbols-outlined absolute top-[15%] left-[10%] text-primary/20 text-6xl animate-float-slow" style={{ fontVariationSettings: "'FILL' 1" }}>save</span>
        <span className="material-symbols-outlined absolute bottom-[20%] right-[15%] text-secondary/20 text-5xl animate-float-medium" style={{ fontVariationSettings: "'FILL' 1" }}>cloud</span>
        <span className="material-symbols-outlined absolute top-[40%] left-[5%] text-tertiary/15 text-4xl animate-float-fast" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
      </div>

      {/* Main window */}
      <div className="w-full max-w-xl bg-surface-container border-2 border-primary shadow-[12px_12px_0px_0px_rgba(221,183,255,0.4)] relative z-10">
        {/* Title bar */}
        <div className="bg-surface-container-high border-b-2 border-primary px-4 py-2 flex items-center justify-between font-label-sm text-label-sm text-primary">
          <span className="flex items-center gap-2 tracking-wider">
            <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>download</span>
            SYSTEM.TRANSFER
          </span>
          <button onClick={() => (window.location.href = '/')}
            className="retro-button w-5 h-5 bg-primary text-on-primary flex items-center justify-center font-bold text-xs hover:bg-secondary hover:text-on-secondary transition-colors">✕</button>
        </div>

        <div className="p-6 md:p-8 flex flex-col items-center text-center gap-6">
          {loading ? (
            <div className="py-12 flex flex-col items-center gap-4">
              <span className="material-symbols-outlined text-5xl text-primary animate-spin">sync</span>
              <p className="font-headline-md font-bold text-label-md text-primary">DECODING TRANSMISSION...</p>
            </div>
          ) : error ? (
            <div className="py-8 flex flex-col items-center gap-4 w-full">
              <span className="material-symbols-outlined text-5xl text-error">warning</span>
              <h2 className="font-headline-md font-bold text-headline-md text-error">TRANSMISSION ERROR</h2>
              <p className="font-label-sm text-label-sm text-on-surface-variant">{error}</p>
              <button onClick={() => (window.location.href = '/')}
                className="retro-button border-2 border-primary bg-surface text-primary hover:bg-primary hover:text-on-primary shadow-[4px_4px_0px_0px_rgba(221,183,255,1)] py-2 px-6 font-label-sm text-label-sm mt-2">
                RETURN TO TERMINAL
              </button>
            </div>
          ) : (
            <>
              <div>
                <h1 className="font-headline-md text-headline-md md:text-headline-lg font-bold text-tertiary tracking-wider uppercase drop-shadow-[2px_2px_0px_rgba(78,21,93,1)]">
                  YOU RECEIVED A DROP !
                </h1>
                <p className="font-label-sm text-label-sm text-on-surface-variant mt-2">A secure transmission is ready for extraction.</p>
              </div>

              {/* File preview box */}
              <div className="w-full bg-surface border-2 border-outline-variant p-4 flex flex-col items-center gap-3">
                {/* File info badge */}
                <div className="inline-flex items-center gap-2 border border-primary/40 bg-surface-container px-3 py-1 font-label-sm text-label-sm text-primary">
                  <span className="material-symbols-outlined text-sm">lock</span>
                  <span className="font-bold">{fileName}</span>
                  {fileSize > 0 && <span className="text-on-surface-variant/60">({formatBytes(fileSize)})</span>}
                </div>
                <ContentPreview />
              </div>

              {/* Action buttons */}
              <div className="grid grid-cols-2 gap-4 w-full">
                <button onClick={downloadFile}
                  className="retro-button border-2 border-primary bg-surface text-primary hover:bg-primary hover:text-on-primary shadow-[4px_4px_0px_0px_rgba(221,183,255,1)] py-3 px-4 font-label-md text-label-md flex items-center justify-center gap-2 uppercase">
                  DOWNLOAD<span className="material-symbols-outlined text-base">download</span>
                </button>
                <button onClick={copyLink}
                  className="retro-button border-2 border-secondary bg-surface text-secondary hover:bg-secondary hover:text-on-secondary shadow-[4px_4px_0px_0px_var(--color-secondary)] py-3 px-4 font-label-md text-label-md flex items-center justify-center gap-2 uppercase">
                  COPY LINK<span className="material-symbols-outlined text-base">link</span>
                </button>
              </div>

              <div className="font-label-sm text-label-sm text-on-surface-variant/60 tracking-widest uppercase flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">shield</span>
                SECURE TRANSMISSION — NO LOGIN REQUIRED
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
