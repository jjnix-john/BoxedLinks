import React, { useState, useCallback } from 'react'
import toast from 'react-hot-toast'
import { supabase, BUCKET, getPublicUrl } from '../../lib/services/supabase'
import { validateFile, allowedExtensionsList, MAX_FILE_SIZE_BYTES } from '../../lib/security/fileValidator'
import { createShortLink } from '../../lib/services/shortLinks'
import Icon from '../../components/ui/Icon'

function extIcon(name) {
  const ext = name.split('.').pop()?.toLowerCase() ?? ''
  if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp', 'svg', 'ico'].includes(ext)) return 'image'
  if (['mp4', 'webm', 'ogv', 'mov'].includes(ext)) return 'video_file'
  if (['mp3', 'wav', 'ogg', 'flac', 'm4a'].includes(ext)) return 'audio_file'
  if (ext === 'pdf') return 'picture_as_pdf'
  if (['zip', 'tar', 'gz', 'rar'].includes(ext)) return 'folder_zip'
  if (['json', 'xml', 'yaml', 'yml', 'toml'].includes(ext)) return 'data_object'
  if (['html', 'htm', 'css', 'js', 'ts', 'jsx', 'tsx'].includes(ext)) return 'code'
  return 'draft'
}

function formatBytes(b) {
  if (b < 1024) return `${b} B`
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`
  return `${(b / (1024 * 1024)).toFixed(1)} MB`
}

export default function UploadZone({ user, onUploadSuccess }) {
  const [isDragging, setIsDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [scanning, setScanning] = useState(false)
  const [selectedFile, setSelectedFile] = useState(null)
  const [error, setError] = useState(null)
  const [showAllowed, setShowAllowed] = useState(false)

  const processFile = useCallback(async (file) => {
    setError(null)
    setSelectedFile(null)
    setScanning(true)
    const result = await validateFile(file)
    setScanning(false)
    if (!result.valid) {
      setError(result.error ?? 'File rejected')
      toast.error(result.error ?? 'File rejected')
      return
    }
    setSelectedFile(file)
    toast.success('File checked — ready to upload')
  }, [])

  const onDragOver = (e) => { e.preventDefault(); setIsDragging(true) }
  const onDragLeave = () => setIsDragging(false)
  const onDrop = (e) => {
    e.preventDefault(); setIsDragging(false)
    const file = e.dataTransfer.files[0]; if (file) processFile(file)
  }
  const onInputChange = (e) => {
    const file = e.target.files?.[0]; if (file) processFile(file); e.target.value = ''
  }

  const handleUpload = async () => {
    if (!selectedFile || !user) return
    setUploading(true); setError(null)
    try {
      const safeName = selectedFile.name.replace(/[^a-zA-Z0-9._-]/g, '_')
      const filePath = `${user.id}/${Date.now()}-${safeName}`
      const mimeType = selectedFile.type || 'application/octet-stream'

      const { error: uploadError } = await supabase.storage
        .from(BUCKET)
        .upload(filePath, selectedFile, { contentType: mimeType, cacheControl: '3600', upsert: false })
      if (uploadError) throw uploadError

      const publicUrl = getPublicUrl(filePath)
      const shortLink = await createShortLink(filePath)
      await navigator.clipboard.writeText(shortLink)
      toast.success('Link copied to clipboard!')
      onUploadSuccess({ name: selectedFile.name, path: filePath, publicUrl, size: selectedFile.size, createdAt: new Date().toISOString() })
      setSelectedFile(null)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Upload failed'
      setError(msg); toast.error(msg)
    } finally { setUploading(false) }
  }

  if (!user) {
    return (
      <section className="neu-raised p-10 text-center flex flex-col items-center gap-4">
        <div className="neu-well w-20 h-20 text-ink-faint"><Icon name="lock" fill className="text-4xl" /></div>
        <div>
          <h3 className="text-xl font-bold text-ink">Sign in required</h3>
          <p className="text-sm text-ink-soft mt-1">Please sign in to drop files to BoxedLinks.</p>
        </div>
      </section>
    )
  }

  const state = scanning ? 'scanning' : isDragging ? 'dragging' : selectedFile ? 'selected' : 'idle'
  const stateIconColor = { scanning: 'text-violet', dragging: 'text-aqua', selected: 'text-accent', idle: 'text-accent' }[state]

  return (
    <section className="neu-raised">
      <div className="neu-card-header">
        <h2 className="text-lg font-bold text-ink flex items-center gap-2.5">
          <div className="neu-well w-9 h-9 text-accent"><Icon name="cloud_upload" fill className="text-xl" /></div>
          Upload a file
        </h2>
        <div className="flex items-center gap-3">
          <span className="neu-pill text-aqua"><Icon name="shield" fill className="text-sm" />Scan enabled</span>
          {(selectedFile || error) && (
            <button id="upload-reset" onClick={() => { setSelectedFile(null); setError(null) }} className="neu-icon-btn w-9 h-9" aria-label="Clear selection">
              <Icon name="close" className="text-lg" />
            </button>
          )}
        </div>
      </div>

      <div className="p-6 flex flex-col gap-5">
        {/* Drop zone with minimal corners (6px) */}
        <label
          htmlFor="upload-input"
          onDragOver={onDragOver} onDragLeave={onDragLeave} onDrop={onDrop}
          className={`group relative rounded-[6px] border border-purple-200/50 px-6 py-12 flex flex-col items-center justify-center cursor-pointer select-none transition-all duration-300 bg-base ${
            state === 'dragging' ? 'shadow-[var(--neu-inset)] ring-2 ring-purple-500/50' : state === 'idle' ? 'shadow-[var(--neu-inset)] hover:shadow-[var(--neu-inset-sm)]' : 'shadow-[var(--neu-inset)]'
          }`}
        >
          <input id="upload-input" type="file" onChange={onInputChange} className="hidden" />

          <div className={`neu-well w-24 h-24 mb-5 !rounded-[6px] transition-transform duration-300 ${state === 'dragging' ? 'scale-110' : 'group-hover:-translate-y-1'}`}>
            <Icon
              name={scanning ? 'radar' : selectedFile ? extIcon(selectedFile.name) : 'upload_file'}
              fill
              className={`text-5xl ${stateIconColor} ${scanning ? 'animate-spin' : ''}`}
            />
          </div>

          {scanning ? (
            <>
              <span className="text-lg font-bold text-ink font-[family-name:var(--font-display)]">Scanning for threats…</span>
              <span className="text-sm text-ink-soft mt-1">Running security checks</span>
            </>
          ) : (
            <>
              <span className="text-lg font-bold text-ink text-center break-all font-[family-name:var(--font-display)]">
                {selectedFile ? selectedFile.name : isDragging ? 'Release to drop' : 'Drag a file here or click to browse'}
              </span>
              <span className="text-sm text-ink-soft mt-1 text-center">
                {selectedFile
                  ? `${formatBytes(selectedFile.size)} · click to replace`
                  : `Up to ${MAX_FILE_SIZE_BYTES / (1024 * 1024)}MB — all common formats accepted`}
              </span>
            </>
          )}
        </label>

        {/* Allowed types toggle */}
        <div>
          <button
            id="upload-toggle-allowed"
            onClick={() => setShowAllowed((v) => !v)}
            className="text-sm font-medium text-ink-faint hover:text-accent transition-colors flex items-center gap-1"
          >
            <Icon name={showAllowed ? 'expand_less' : 'expand_more'} className="text-lg" />
            {showAllowed ? 'Hide' : 'View'} allowed file types
          </button>
          {showAllowed && (
            <div className="neu-inset-sm mt-3 p-4 font-mono text-[11px] text-ink-soft leading-5 animate-fade-in">
              {allowedExtensionsList()}
            </div>
          )}
        </div>

        {/* Error message */}
        {error && (
          <div className="neu-notice" role="alert">
            <Icon name="gpp_bad" fill className="text-lg text-rose shrink-0" />
            <span className="flex-1 text-ink-soft">{error}</span>
            <button onClick={() => setError(null)} className="text-ink-faint hover:text-rose" aria-label="Dismiss error">
              <Icon name="close" className="text-lg" />
            </button>
          </div>
        )}

        {/* Upload button */}
        {selectedFile && !scanning && (
          <button id="upload-submit" onClick={handleUpload} disabled={uploading} className="neu-btn-accent w-full py-3.5 text-base animate-rise">
            {uploading ? (
              <><Icon name="progress_activity" className="animate-spin text-xl" />Uploading…</>
            ) : (
              <><Icon name="send" fill className="text-xl" />Upload & copy link</>
            )}
          </button>
        )}
      </div>
    </section>
  )
}
