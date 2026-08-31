import React, { useState, useCallback } from 'react'
import toast from 'react-hot-toast'
import { supabase, BUCKET, getPublicUrl } from '../lib/supabase'
import { validateFile, allowedExtensionsList, MAX_FILE_SIZE_BYTES } from '../lib/fileValidator'
import type { User } from '@supabase/supabase-js'

interface UploadZoneProps {
  user: User | null
  onUploadSuccess: (file: { name: string; path: string; publicUrl: string; size: number; createdAt: string }) => void
}

function extIcon(name: string): string {
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

function formatBytes(b: number) {
  if (b < 1024) return `${b} B`
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`
  return `${(b / (1024 * 1024)).toFixed(1)} MB`
}

export default function UploadZone({ user, onUploadSuccess }: UploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [scanning, setScanning] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [showAllowed, setShowAllowed] = useState(false)

  const processFile = useCallback(async (file: File) => {
    setError(null)
    setSelectedFile(null)
    setScanning(true)
    const result = await validateFile(file)
    setScanning(false)
    if (!result.valid) {
      setError(result.error ?? 'FILE REJECTED')
      toast.error(result.error ?? 'FILE REJECTED')
      return
    }
    setSelectedFile(file)
    toast.success('FILE CLEARED — READY TO TRANSMIT')
  }, [])

  const onDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true) }
  const onDragLeave = () => setIsDragging(false)
  const onDrop = (e: React.DragEvent) => {
    e.preventDefault(); setIsDragging(false)
    const file = e.dataTransfer.files[0]; if (file) processFile(file)
  }
  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
      const shareLink = `${window.location.origin}/view?path=${encodeURIComponent(filePath)}`
      await navigator.clipboard.writeText(shareLink)
      toast.success('DROP LINK COPIED TO CLIPBOARD!')
      onUploadSuccess({ name: selectedFile.name, path: filePath, publicUrl, size: selectedFile.size, createdAt: new Date().toISOString() })
      setSelectedFile(null)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'TRANSMISSION FAILED'
      setError(msg); toast.error(msg)
    } finally { setUploading(false) }
  }

  if (!user) {
    return (
      <div className="bg-surface-container border-2 border-primary shadow-[8px_8px_0px_0px_rgba(221,183,255,0.3)]">
        <div className="bg-surface-container-high border-b-2 border-primary px-4 py-2 flex items-center justify-between font-label-sm text-label-sm text-primary">
          <span className="flex items-center gap-2"><span className="material-symbols-outlined text-sm">terminal</span>UPLOAD_TERMINAL.EXE</span>
          <span className="text-on-surface-variant">SYSTEM_LOCKED</span>
        </div>
        <div className="p-8 text-center flex flex-col items-center gap-4">
          <div className="w-16 h-16 border-2 border-primary bg-surface flex items-center justify-center text-primary">
            <span className="material-symbols-outlined text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>lock</span>
          </div>
          <div>
            <h3 className="font-headline-md text-headline-md font-bold text-primary uppercase">AUTHENTICATION REQUIRED</h3>
            <p className="font-label-sm text-label-sm text-on-surface-variant mt-1">PLEASE SIGN IN TO DROP FILES TO BOXEDLINKS.</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-surface-container border-2 border-primary shadow-[8px_8px_0px_0px_rgba(221,183,255,0.3)]">
      {/* Window title bar */}
      <div className="bg-surface-container-high border-b-2 border-primary px-4 py-2 flex items-center justify-between font-label-sm text-label-sm text-primary">
        <span className="flex items-center gap-2 tracking-wider">
          <span className="material-symbols-outlined text-sm">terminal</span>
          UPLOAD_TERMINAL.EXE
        </span>
        <div className="flex items-center gap-3">
          {/* Security badge */}
          <span className="flex items-center gap-1 text-secondary text-[10px] font-label-sm border border-secondary/40 px-2 py-0.5">
            <span className="material-symbols-outlined text-sm">shield</span>SCAN ENABLED
          </span>
          <button onClick={() => { setSelectedFile(null); setError(null) }} className="hover:text-secondary transition-colors">✕</button>
        </div>
      </div>

      <div className="p-6 flex flex-col gap-4 bg-surface-container-low">
        {/* Drop zone */}
        <label
          htmlFor="upload-input"
          onDragOver={onDragOver} onDragLeave={onDragLeave} onDrop={onDrop}
          className={`border-2 border-dashed p-10 flex flex-col items-center justify-center cursor-pointer transition-all duration-150 select-none ${
            scanning   ? 'border-tertiary bg-tertiary/10 text-tertiary'
            : isDragging ? 'border-secondary bg-secondary/10 text-secondary'
            : selectedFile ? 'border-primary bg-primary/10 text-primary'
            : 'border-primary/60 bg-surface hover:border-primary text-primary'
          }`}
        >
          <input id="upload-input" type="file" onChange={onInputChange} className="hidden" />

          {scanning ? (
            <>
              <span className="material-symbols-outlined text-6xl mb-3 animate-spin" style={{ fontVariationSettings: "'FILL' 1" }}>radar</span>
              <span className="font-headline-md font-bold text-headline-md uppercase">SCANNING FOR THREATS...</span>
              <span className="font-label-sm text-label-sm text-on-surface-variant mt-2">RUNNING SECURITY CHECKS</span>
            </>
          ) : (
            <>
              <span className="material-symbols-outlined text-6xl mb-3" style={{ fontVariationSettings: "'FILL' 1" }}>
                {selectedFile ? extIcon(selectedFile.name) : 'upload_file'}
              </span>
              <span className="font-headline-md font-bold text-headline-md uppercase tracking-wider text-center">
                {selectedFile ? selectedFile.name : 'DRAG FILES HERE TO DROP'}
              </span>
              <span className="font-label-sm text-label-sm text-on-surface-variant mt-2 text-center">
                {selectedFile
                  ? `${formatBytes(selectedFile.size)} — CLICK TO REPLACE`
                  : `Drop any file up to ${MAX_FILE_SIZE_BYTES / (1024 * 1024)}MB — all common formats accepted`}
              </span>
            </>
          )}
        </label>

        {/* Allowed types toggle */}
        <div>
          <button
            onClick={() => setShowAllowed((v) => !v)}
            className="font-label-sm text-label-sm text-on-surface-variant/60 hover:text-secondary transition-colors flex items-center gap-1"
          >
            <span className="material-symbols-outlined text-sm">{showAllowed ? 'expand_less' : 'expand_more'}</span>
            {showAllowed ? 'HIDE' : 'VIEW'} ALLOWED FILE TYPES
          </button>
          {showAllowed && (
            <div className="mt-2 p-3 bg-surface border border-outline-variant font-label-sm text-[10px] text-on-surface-variant/70 leading-5">
              {allowedExtensionsList()}
            </div>
          )}
        </div>

        {/* Error message */}
        {error && (
          <div className="border-2 border-error bg-error-container/40 text-error p-3 font-label-sm text-label-sm flex items-start justify-between gap-3">
            <div className="flex items-start gap-2">
              <span className="material-symbols-outlined text-base shrink-0 mt-0.5">gpp_bad</span>
              <span>{error}</span>
            </div>
            <button onClick={() => setError(null)} className="shrink-0 hover:text-on-error">✕</button>
          </div>
        )}

        {/* Upload button */}
        {selectedFile && !scanning && (
          <button onClick={handleUpload} disabled={uploading}
            className="retro-button border-2 border-secondary bg-surface text-secondary hover:bg-secondary hover:text-on-secondary shadow-[4px_4px_0px_0px_var(--color-secondary)] py-3 px-6 font-label-md text-label-md flex items-center justify-center gap-2 w-full mt-2">
            {uploading ? (
              <><span className="material-symbols-outlined animate-spin text-base">sync</span>TRANSMITTING...</>
            ) : (
              <><span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1" }}>send</span>TRANSMIT DROP & COPY LINK</>
            )}
          </button>
        )}
      </div>
    </div>
  )
}
