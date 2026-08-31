import React, { useState, useCallback } from 'react'
import { Upload, FileText, X, AlertCircle } from 'lucide-react'
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
    if (!file.name.endsWith('.txt')) return 'Only .txt files are supported.'
    if (file.size > 5 * 1024 * 1024) return 'File must be under 5 MB.'
    return null
  }

  const handleFile = useCallback((file: File) => {
    const err = validate(file)
    if (err) {
      setError(err)
      setSelectedFile(null)
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
      // Create a unique path: userId/timestamp-filename
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
      toast.success('Link copied to clipboard!')

      onUploadSuccess({
        name: selectedFile.name,
        path: filePath,
        publicUrl,
        size: selectedFile.size,
        createdAt: new Date().toISOString(),
      })
      setSelectedFile(null)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Upload failed. Please try again.'
      setError(message)
      toast.error(message)
    } finally {
      setUploading(false)
    }
  }

  // --- Not logged in ---
  if (!user) {
    return (
      <div className="glass rounded-2xl p-8 text-center space-y-4 animate-fade-in-up">
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: '50%',
            background: 'rgba(99,102,241,0.12)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto',
          }}
        >
          <Upload size={28} color="#818cf8" />
        </div>
        <h3 style={{ fontWeight: 600, fontSize: '1.125rem', color: '#f4f4f5' }}>Upload a .txt File</h3>
        <p style={{ color: '#71717a', fontSize: '0.9rem', lineHeight: 1.6 }}>
          Please <strong style={{ color: '#818cf8' }}>sign in</strong> to upload files to BoxedLinks.
          <br />
          Anyone with a link can view your files — no account needed to read.
        </p>
      </div>
    )
  }

  return (
    <div className="animate-fade-in-up" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* Drop zone */}
      <label
        htmlFor="file-input"
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.75rem',
          borderRadius: '16px',
          border: `2px dashed ${isDragging ? '#6366f1' : selectedFile ? '#22c55e' : 'rgba(255,255,255,0.12)'}`,
          background: isDragging
            ? 'rgba(99,102,241,0.08)'
            : selectedFile
            ? 'rgba(34,197,94,0.06)'
            : 'rgba(255,255,255,0.02)',
          padding: '2.5rem 1.5rem',
          cursor: 'pointer',
          transition: 'all 0.25s ease',
          boxShadow: isDragging ? '0 0 30px rgba(99,102,241,0.15)' : 'none',
        }}
      >
        <input
          id="file-input"
          type="file"
          accept=".txt"
          onChange={onInputChange}
          style={{ display: 'none' }}
        />
        {selectedFile ? (
          <>
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: '50%',
                background: 'rgba(34,197,94,0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <FileText size={26} color="#22c55e" />
            </div>
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontWeight: 600, color: '#f4f4f5', fontSize: '0.95rem' }}>{selectedFile.name}</p>
              <p style={{ color: '#71717a', fontSize: '0.8rem', marginTop: '0.25rem' }}>
                {(selectedFile.size / 1024).toFixed(1)} KB — click or drag to replace
              </p>
            </div>
          </>
        ) : (
          <>
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: '50%',
                background: 'rgba(99,102,241,0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'transform 0.2s ease',
                transform: isDragging ? 'scale(1.1)' : 'scale(1)',
              }}
            >
              <Upload size={26} color="#818cf8" />
            </div>
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontWeight: 600, color: '#f4f4f5', fontSize: '0.95rem' }}>
                {isDragging ? 'Drop it!' : 'Drag & drop or click to select'}
              </p>
              <p style={{ color: '#71717a', fontSize: '0.8rem', marginTop: '0.25rem' }}>
                Only .txt files · Max 5 MB
              </p>
            </div>
          </>
        )}
      </label>

      {/* Error */}
      {error && (
        <div
          className="animate-fade-in"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.625rem 0.875rem',
            borderRadius: '10px',
            background: 'rgba(239,68,68,0.1)',
            border: '1px solid rgba(239,68,68,0.25)',
            color: '#f87171',
            fontSize: '0.875rem',
          }}
        >
          <AlertCircle size={16} />
          {error}
          <button
            onClick={() => setError(null)}
            style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: '#f87171' }}
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Upload button */}
      {selectedFile && (
        <button
          id="upload-btn"
          className="btn-primary animate-fade-in"
          onClick={handleUpload}
          disabled={uploading}
          style={{ justifyContent: 'center', padding: '0.75rem' }}
        >
          {uploading ? (
            <>
              <svg
                className="animate-spin-slow"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
              </svg>
              Uploading…
            </>
          ) : (
            <>
              <Upload size={16} />
              Upload &amp; Copy Link
            </>
          )}
        </button>
      )}
    </div>
  )
}
