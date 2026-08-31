import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { getPublicUrl } from '../lib/supabase'

export default function FileViewer() {
  const params = new URLSearchParams(window.location.search)
  const filePath = params.get('path') ?? ''

  const [content, setContent] = useState<string | null>(null)
  const [fileName, setFileName] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [fileSize, setFileSize] = useState<number>(0)

  useEffect(() => {
    if (!filePath) {
      setError('NO TRANSMISSION PATH SPECIFIED.')
      setLoading(false)
      return
    }

    const parts = filePath.split('/')
    setFileName(parts[parts.length - 1].replace(/^\d+-/, ''))

    const publicUrl = getPublicUrl(filePath)
    fetch(publicUrl)
      .then((res) => {
        if (!res.ok) throw new Error(`TRANSMISSION NOT FOUND (${res.status})`)
        return res.text()
      })
      .then((text) => {
        setContent(text)
        setFileSize(new Blob([text]).size)
        setLoading(false)
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : 'FAILED TO EXTRACT TRANSMISSION.')
        setLoading(false)
      })
  }, [filePath])

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href)
    toast.success('TRANSMISSION LINK COPIED!')
  }

  const downloadFile = () => {
    if (!content) return
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = fileName || 'drop.txt'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    toast.success('DOWNLOAD STARTED!')
  }

  function formatBytes(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  return (
    <div className="min-h-screen bg-[#0b1326] text-[#dae2fd] flex flex-col items-center justify-center p-4 relative font-body-md">
      <div className="scanlines"></div>

      {/* Main retro window */}
      <div className="w-full max-w-xl bg-[#171f33] border-2 border-[#ddb7ff] shadow-[12px_12px_0px_0px_rgba(221,183,255,0.4)] relative z-10">
        {/* Title bar */}
        <div className="bg-[#222a3d] border-b-2 border-[#ddb7ff] px-4 py-2 flex items-center justify-between font-headline text-xs text-[#ddb7ff]">
          <span className="flex items-center gap-2 tracking-wider">
            <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>
              download
            </span>
            SYSTEM.TRANSFER
          </span>
          <button
            onClick={() => (window.location.href = '/')}
            className="w-5 h-5 bg-[#ddb7ff] text-[#2c0051] flex items-center justify-center font-bold font-mono-code text-xs hover:bg-[#4cd7f6] hover:text-[#001f26] transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-6 md:p-8 flex flex-col items-center text-center gap-6">
          {loading ? (
            <div className="py-12 flex flex-col items-center gap-4">
              <span className="material-symbols-outlined text-5xl text-[#ddb7ff] animate-spin">
                sync
              </span>
              <p className="font-headline font-bold text-sm text-[#ddb7ff]">
                DECODING TRANSMISSION...
              </p>
            </div>
          ) : error ? (
            <div className="py-8 flex flex-col items-center gap-4 w-full">
              <span className="material-symbols-outlined text-5xl text-[#ffb4ab]">
                warning
              </span>
              <h2 className="font-headline font-bold text-lg text-[#ffb4ab]">TRANSMISSION ERROR</h2>
              <p className="font-mono-code text-xs text-[#cfc2d6]">{error}</p>
              <button
                onClick={() => (window.location.href = '/')}
                className="retro-button retro-btn-primary py-2 px-6 text-xs mt-2"
              >
                RETURN TO TERMINAL
              </button>
            </div>
          ) : (
            <>
              <div>
                <h1 className="font-headline font-bold text-2xl md:text-3xl text-[#f3aeff] tracking-wider uppercase drop-shadow-[2px_2px_0px_rgba(78,21,93,1)]">
                  YOU RECEIVED A DROP !
                </h1>
                <p className="font-mono-code text-xs md:text-sm text-[#cfc2d6] mt-2">
                  A secure transmission is ready for extraction.
                </p>
              </div>

              {/* Inner preview box */}
              <div className="w-full bg-[#0d162b] border-2 border-[#4d4354] p-4 flex flex-col items-center gap-3">
                <div className="w-16 h-16 bg-[#b979c6]/20 border border-[#f3aeff] flex items-center justify-center text-[#f3aeff]">
                  <span className="material-symbols-outlined text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                    description
                  </span>
                </div>
                <div className="inline-flex items-center gap-2 border border-[#ddb7ff]/40 bg-[#171f33] px-3 py-1 font-mono-code text-xs text-[#ddb7ff]">
                  <span className="material-symbols-outlined text-sm">lock</span>
                  <span className="font-bold">{fileName}</span>
                  <span className="text-[#cfc2d6]/60">({formatBytes(fileSize)})</span>
                </div>

                {/* Text snippet view */}
                {content !== null && (
                  <pre className="w-full max-h-48 overflow-y-auto text-left font-mono-code text-xs bg-[#060e20] border border-[#4d4354] p-3 text-[#dae2fd] whitespace-pre-wrap word-break scrollbar-retro mt-1">
                    {content}
                  </pre>
                )}
              </div>

              {/* Action buttons */}
              <div className="grid grid-cols-2 gap-4 w-full">
                <button
                  onClick={downloadFile}
                  className="retro-button retro-btn-primary py-3 px-4 text-xs md:text-sm flex items-center justify-center gap-2"
                >
                  DOWNLOAD
                  <span className="material-symbols-outlined text-base">download</span>
                </button>
                <button
                  onClick={copyLink}
                  className="retro-button retro-btn-cyan py-3 px-4 text-xs md:text-sm flex items-center justify-center gap-2"
                >
                  COPY LINK
                  <span className="material-symbols-outlined text-base">link</span>
                </button>
              </div>

              {/* Footer expiration tag */}
              <div className="font-mono-code text-[11px] text-[#cfc2d6]/60 tracking-widest uppercase">
                LINK EXPIRES IN: <span className="text-[#4cd7f6] font-bold">23:59:59</span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
