import { useState } from 'react'
import toast from 'react-hot-toast'
import { supabase, BUCKET } from '../../lib/services/supabase'
import { createShortLink } from '../../lib/services/shortLinks'
import Icon from '../../components/ui/Icon'

function getExt(name) { return name.split('.').pop()?.toLowerCase() ?? '' }

function getFileType(name) {
  const ext = getExt(name)
  if (['png','jpg','jpeg','gif','webp','bmp','svg','ico'].includes(ext)) return 'img'
  if (ext === 'pdf') return 'pdf'
  if (ext === 'txt') return 'txt'
  if (['doc','docx','odt'].includes(ext)) return 'doc'
  return 'all'
}

function formatBytes(b) {
  if (b < 1024) return `${b} B`
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`
  return `${(b / (1024 * 1024)).toFixed(1)} MB`
}

function formatDate(iso) {
  try { return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) } catch { return iso }
}

/** Icon + accent colour per file family. */
function fileVisual(name) {
  const ext = getExt(name)
  if (['png','jpg','jpeg','gif','webp','bmp','svg','ico'].includes(ext)) return { icon: 'image', color: 'text-violet' }
  if (['mp4','webm','ogv'].includes(ext))                              return { icon: 'video_file', color: 'text-accent' }
  if (['mp3','wav','ogg','flac','m4a'].includes(ext))                  return { icon: 'audio_file', color: 'text-sky' }
  if (ext === 'pdf')                                                   return { icon: 'picture_as_pdf', color: 'text-rose' }
  if (['zip','tar','gz','rar'].includes(ext))                          return { icon: 'folder_zip', color: 'text-sun' }
  if (['json','xml','yaml','yml','toml'].includes(ext))                return { icon: 'data_object', color: 'text-aqua' }
  if (['html','htm','css','js','ts','jsx','tsx'].includes(ext))        return { icon: 'code', color: 'text-aqua' }
  return { icon: 'description', color: 'text-ink-soft' }
}

export default function FileDashboard({ files, onDelete }) {
  const [deletingPath, setDeletingPath] = useState(null)
  const [filterType, setFilterType] = useState('all')

  const filteredFiles = filterType === 'all'
    ? files
    : files.filter(f => getFileType(f.name) === filterType)

  const copyLink = async (path) => {
    try {
      const shortLink = await createShortLink(path)
      navigator.clipboard.writeText(shortLink)
      toast.success('Link copied!')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to generate link')
    }
  }

  const handleDelete = async (path) => {
    if (!confirm('Delete this file? This cannot be undone.')) return
    setDeletingPath(path)
    try {
      const { error } = await supabase.storage.from(BUCKET).remove([path])
      if (error) throw error
      onDelete(path); toast.success('File deleted')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Delete failed')
    } finally { setDeletingPath(null) }
  }

  const filterButtons = [
    { type: 'all', label: 'All', icon: 'inventory_2' },
    { type: 'img', label: 'Images', icon: 'image' },
    { type: 'pdf', label: 'PDF', icon: 'picture_as_pdf' },
    { type: 'txt', label: 'Text', icon: 'description' },
    { type: 'doc', label: 'Docs', icon: 'draft' },
  ]

  return (
    <section className="neu-raised">
      <div className="neu-card-header">
        <h2 className="text-lg font-bold text-ink flex items-center gap-2.5">
          <div className="neu-well w-9 h-9 text-aqua"><Icon name="folder_open" fill className="text-xl" /></div>
          My drops
        </h2>
        <span className="neu-pill neu-pill-inset">{files.length} total</span>
      </div>

      {/* Filters */}
      <div className="px-6 pt-5 flex gap-3 flex-wrap">
        {filterButtons.map(btn => (
          <button
            key={btn.type}
            id={`filter-${btn.type}`}
            onClick={() => setFilterType(btn.type)}
            className={`neu-btn px-3.5 py-2 text-xs ${filterType === btn.type ? 'is-active' : ''}`}
          >
            <Icon name={btn.icon} className="text-base" />
            {btn.label}
          </button>
        ))}
      </div>

      <div className="p-6">
        {filteredFiles.length === 0 ? (
          <div className="neu-inset py-12 text-center flex flex-col items-center gap-3">
            <div className="neu-well w-16 h-16 text-ink-faint"><Icon name="inventory_2" className="text-3xl" /></div>
            <p className="text-sm text-ink-soft">
              {files.length === 0 ? 'No files yet — drop your first one above.' : 'No files match this filter.'}
            </p>
          </div>
        ) : (
          <ul className="flex flex-col gap-4">
            {filteredFiles.map((file) => {
              const v = fileVisual(file.name)
              const ext = getExt(file.name)
              return (
                <li key={file.path} className="neu-raised-sm group flex items-center gap-4 p-3 pr-4 transition-shadow hover:shadow-[var(--neu-raised)]">
                  <div className={`neu-well-inset w-12 h-12 ${v.color}`}>
                    <Icon name={v.icon} fill className="text-2xl" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <a href={file.publicUrl} target="_blank" rel="noreferrer"
                      className="block font-semibold text-ink hover:text-accent truncate transition-colors font-[family-name:var(--font-display)]">
                      {file.name}
                    </a>
                    <div className="flex items-center gap-2 text-xs text-ink-faint mt-0.5">
                      <span className="uppercase font-mono font-medium">{ext || '—'}</span>
                      <span>·</span>
                      <span>{formatBytes(file.size)}</span>
                      <span className="hidden sm:inline">·</span>
                      <span className="hidden sm:inline">{formatDate(file.createdAt)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5 shrink-0">
                    <button onClick={() => copyLink(file.path)} className="neu-btn px-3 py-2 text-xs" aria-label={`Copy link for ${file.name}`}>
                      <Icon name="link" className="text-base" /><span className="hidden sm:inline">Copy link</span>
                    </button>
                    <button onClick={() => handleDelete(file.path)} disabled={deletingPath === file.path}
                      className="neu-btn neu-btn-danger w-9 h-9 !p-0" aria-label={`Delete ${file.name}`}>
                      <Icon name={deletingPath === file.path ? 'progress_activity' : 'delete'} className={`text-lg ${deletingPath === file.path ? 'animate-spin' : ''}`} />
                    </button>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </section>
  )
}
