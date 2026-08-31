import { useState } from 'react'
import { Copy, Trash2, FileText, ExternalLink, Clock, HardDrive } from 'lucide-react'
import toast from 'react-hot-toast'
import { supabase, BUCKET } from '../lib/supabase'

export interface FileRecord {
  name: string
  path: string
  publicUrl: string
  size: number
  createdAt: string
}

interface FileDashboardProps {
  files: FileRecord[]
  onDelete: (path: string) => void
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

export default function FileDashboard({ files, onDelete }: FileDashboardProps) {
  const [deletingPath, setDeletingPath] = useState<string | null>(null)

  const copyLink = (path: string) => {
    const shareLink = `${window.location.origin}/view?path=${encodeURIComponent(path)}`
    navigator.clipboard.writeText(shareLink)
    toast.success('Link copied!')
  }

  const handleDelete = async (path: string) => {
    if (!confirm('Delete this file? This cannot be undone.')) return
    setDeletingPath(path)
    try {
      const { error } = await supabase.storage.from(BUCKET).remove([path])
      if (error) throw error
      onDelete(path)
      toast.success('File deleted.')
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Delete failed.'
      toast.error(message)
    } finally {
      setDeletingPath(null)
    }
  }

  if (files.length === 0) {
    return (
      <div
        className="glass animate-fade-in"
        style={{
          borderRadius: '16px',
          padding: '3rem 2rem',
          textAlign: 'center',
        }}
      >
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: '50%',
            background: 'rgba(99,102,241,0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1rem',
          }}
        >
          <FileText size={24} color="#52525b" />
        </div>
        <p style={{ color: '#52525b', fontSize: '0.9rem' }}>No files uploaded yet.</p>
        <p style={{ color: '#3f3f46', fontSize: '0.8rem', marginTop: '0.25rem' }}>
          Upload a .txt file above to share it instantly.
        </p>
      </div>
    )
  }

  return (
    <div className="animate-fade-in-up" style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
      {files.map((file, i) => (
        <div
          key={file.path}
          className="glass glass-hover"
          style={{
            borderRadius: '14px',
            padding: '1rem 1.25rem',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            animationDelay: `${i * 0.05}s`,
          }}
        >
          {/* Icon */}
          <div
            style={{
              flexShrink: 0,
              width: 40,
              height: 40,
              borderRadius: '10px',
              background: 'rgba(99,102,241,0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <FileText size={18} color="#818cf8" />
          </div>

          {/* Info */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <p
              style={{
                fontWeight: 600,
                fontSize: '0.9rem',
                color: '#f4f4f5',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {file.name}
            </p>
            <div
              style={{
                display: 'flex',
                gap: '0.75rem',
                marginTop: '0.2rem',
                flexWrap: 'wrap',
              }}
            >
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.3rem',
                  fontSize: '0.75rem',
                  color: '#52525b',
                }}
              >
                <HardDrive size={11} />
                {formatBytes(file.size)}
              </span>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.3rem',
                  fontSize: '0.75rem',
                  color: '#52525b',
                }}
              >
                <Clock size={11} />
                {timeAgo(file.createdAt)}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
            <button
              id={`view-${i}`}
              className="btn-ghost"
              title="Open file"
              onClick={() => window.open(file.publicUrl, '_blank')}
              style={{ padding: '0.4rem 0.6rem' }}
            >
              <ExternalLink size={14} />
            </button>
            <button
              id={`copy-${i}`}
              className="btn-ghost"
              title="Copy share link"
              onClick={() => copyLink(file.path)}
              style={{ padding: '0.4rem 0.6rem' }}
            >
              <Copy size={14} />
            </button>
            <button
              id={`delete-${i}`}
              className="btn-danger"
              title="Delete file"
              onClick={() => handleDelete(file.path)}
              disabled={deletingPath === file.path}
              style={{ padding: '0.4rem 0.6rem' }}
            >
              {deletingPath === file.path ? (
                <svg className="animate-spin-slow" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                </svg>
              ) : (
                <Trash2 size={14} />
              )}
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
