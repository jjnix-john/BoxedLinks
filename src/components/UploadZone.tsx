import React, { useState, useCallback } from 'react'
import toast from 'react-hot-toast'
import { supabase, BUCKET, getPublicUrl } from '../lib/supabase'
import type { User } from '@supabase/supabase-js'

interface UploadZoneProps {
  user: User | null
  onUploadSuccess: (file: { name: string; path: string; publicUrl: string; size: number; createdAt: string }) => void
}

export default function UploadZone({ user, onUploadSuccess }: UploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [error, setError] = useState<string | null>(null)

  const validate = (file: File): string | null => {
    if (!file.name.endsWith('.txt')) return 'ONLY .TXT TRANSMISSIONS ALLOWED'
    if (file.size > 5 * 1024 * 1024) return 'PAYLOAD EXCEEDS 5MB LIMIT'
    return null
  }

  const handleFile = useCallback((file: File) => {
    const err = validate(file)
    if (err) {
      setError(err)
      setSelectedFile(null)
      toast.error(err)
      return
    }
    setError(null)
    setSelectedFile(file)
  }, [])

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const onDragLeave = () => setIsDragging(false)

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
    e.target.value = ''
  }

  const handleUpload = async () => {
    if (!selectedFile || !user) return
    setUploading(true)
    setError(null)

    try {
      const safeName = selectedFile.name.replace(/[^a-zA-Z0-9._-]/g, '_')
      const filePath = `${user.id}/${Date.now()}-${safeName}`

      const { error: uploadError } = await supabase.storage
        .from(BUCKET)
        .upload(filePath, selectedFile, {
          contentType: 'text/plain',
          cacheControl: '3600',
        })

      if (uploadError) throw uploadError

      const publicUrl = getPublicUrl(filePath)
      const shareLink = `${window.location.origin}/view?path=${encodeURIComponent(filePath)}`

      await navigator.clipboard.writeText(shareLink)
      toast.success('DROP LINK COPIED TO CLIPBOARD!')

      onUploadSuccess({
        name: selectedFile.name,
        path: filePath,
        publicUrl,
        size: selectedFile.size,
        createdAt: new Date().toISOString(),
      })
      setSelectedFile(null)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'TRANSMISSION FAILED'
      setError(message)
      toast.error(message)
    } finally {
      setUploading(false)
    }
  }

  if (!user) {
    return (
      <div className="bg-[#171f33] border-2 border-[#ddb7ff] shadow-[8px_8px_0px_0px_rgba(221,183,255,0.3)]">
        {/* Terminal Header Bar */}
        <div className="bg-[#222a3d] border-b-2 border-[#ddb7ff] px-4 py-2 flex items-center justify-between font-headline text-xs text-[#ddb7ff]">
          <span className="flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">terminal</span>
            UPLOAD_TERMINAL.EXE
          </span>
          <span className="text-[#988d9f]">SYSTEM_LOCKED</span>
        </div>

        <div className="p-8 text-center flex flex-col items-center gap-4">
          <div className="w-16 h-16 border-2 border-[#ddb7ff] bg-[#0b1326] flex items-center justify-center text-[#ddb7ff]">
            <span className="material-symbols-outlined text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>
              lock
            </span>
          </div>
          <div>
            <h3 className="font-headline font-bold text-lg text-[#ddb7ff] uppercase">AUTHENTICATION REQUIRED</h3>
            <p className="font-mono-code text-sm text-[#cfc2d6] mt-1">
              PLEASE SIGN IN TO DROP FILES TO BOXEDLINKS.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-[#171f33] border-2 border-[#ddb7ff] shadow-[8px_8px_0px_0px_rgba(221,183,255,0.3)] flex flex-col">
      {/* Window Title Bar */}
      <div className="bg-[#222a3d] border-b-2 border-[#ddb7ff] px-4 py-2 flex items-center justify-between font-headline text-xs text-[#ddb7ff]">
        <span className="flex items-center gap-2 tracking-wider">
          <span className="material-symbols-outlined text-sm">terminal</span>
          UPLOAD_TERMINAL.EXE
        </span>
        <button
          onClick={() => setSelectedFile(null)}
          className="hover:text-white transition-colors text-[#ddb7ff] font-mono-code"
        >
          ✕
        </button>
      </div>

      {/* Terminal Content Area */}
      <div className="p-6 flex flex-col gap-4 bg-[#0d162b]">
        <label
          htmlFor="retro-file-input"
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          className={`border-2 border-dashed p-10 flex flex-col items-center justify-center cursor-pointer transition-all duration-150 relative ${
            isDragging
              ? 'border-[#4cd7f6] bg-[#4cd7f6]/10 text-[#4cd7f6]'
              : selectedFile
              ? 'border-[#ddb7ff] bg-[#ddb7ff]/10 text-[#ddb7ff]'
              : 'border-[#ddb7ff]/60 bg-[#131b2e] hover:border-[#ddb7ff] text-[#ddb7ff]'
          }`}
        >
          <input
            id="retro-file-input"
            type="file"
            accept=".txt"
            onChange={onInputChange}
            className="hidden"
          />

          <span
            className="material-symbols-outlined text-6xl mb-3"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            {selectedFile ? 'draft' : 'upload_file'}
          </span>

          <span className="font-headline font-bold text-lg md:text-xl tracking-wider text-center uppercase">
            {selectedFile ? selectedFile.name : 'DRAG FILES HERE TO DROP'}
          </span>

          <span className="font-mono-code text-xs text-[#cfc2d6]/70 mt-2 uppercase tracking-wide">
            {selectedFile
              ? `${(selectedFile.size / 1024).toFixed(1)} KB — CLICK TO REPLACE`
              : 'or click to browse (.txt files only, max 5MB)'}
          </span>
        </label>

        {error && (
          <div className="border-2 border-[#ffb4ab] bg-[#690005]/40 text-[#ffb4ab] p-3 font-mono-code text-xs flex items-center justify-between">
            <span>⚠ ERROR: {error}</span>
            <button onClick={() => setError(null)}>✕</button>
          </div>
        )}

        {selectedFile && (
          <button
            onClick={handleUpload}
            disabled={uploading}
            className="retro-button retro-btn-cyan py-3 px-6 text-sm flex items-center justify-center gap-2 w-full mt-2"
          >
            {uploading ? (
              <>
                <span className="material-symbols-outlined animate-spin text-base">sync</span>
                TRANSMITTING BYTES...
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1" }}>
                  send
                </span>
                TRANSMIT DROP & COPY LINK
              </>
            )}
          </button>
        )}
      </div>
    </div>
  )
}
