import { useState } from 'react'
import toast from 'react-hot-toast'
import { supabase, BUCKET } from '../lib/supabase'

export interface FileRecord {
  name: string; path: string; publicUrl: string; size: number; createdAt: string
}
interface FileDashboardProps { files: FileRecord[]; onDelete: (path: string) => void }

function formatBytes(b: number) {
  if (b < 1024) return `${b} B`
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`
  return `${(b / (1024 * 1024)).toFixed(1)} MB`
}
function formatDate(iso: string) {
  try { return new Date(iso).toISOString().split('T')[0] } catch { return iso }
}

function getExt(name: string) { return name.split('.').pop()?.toLowerCase() ?? '' }

function ExtBadge({ name }: { name: string }) {
  const ext = getExt(name)
  const isImage = ['png','jpg','jpeg','gif','webp','bmp','svg','ico'].includes(ext)
  const isAudio = ['mp3','wav','ogg','flac','m4a'].includes(ext)
  const isVideo = ['mp4','webm','ogv'].includes(ext)
  const isCode  = ['html','htm','css','js','ts','jsx','tsx','json','xml','yaml','yml'].includes(ext)
  const isDoc   = ['pdf'].includes(ext)
  const isArch  = ['zip','tar','gz','rar'].includes(ext)

  const cls =
    isImage ? 'bg-tertiary/20 border-tertiary/60 text-tertiary' :
    isAudio ? 'bg-secondary/20 border-secondary/60 text-secondary' :
    isVideo ? 'bg-primary-container/20 border-primary-container/60 text-primary-container' :
    isCode  ? 'bg-secondary/20 border-secondary/60 text-secondary' :
    isDoc   ? 'bg-error/20 border-error/60 text-error' :
    isArch  ? 'bg-tertiary-container/20 border-tertiary-container/60 text-tertiary-container' :
              'bg-on-surface-variant/10 border-outline-variant text-on-surface-variant'

  return (
    <span className={`border text-[10px] font-bold px-1.5 py-0.5 uppercase shrink-0 ${cls}`}>
      .{ext || '???'}
    </span>
  )
}

function fileIcon(name: string) {
  const ext = getExt(name)
  if (['png','jpg','jpeg','gif','webp','bmp','svg','ico'].includes(ext)) return 'image'
  if (['mp4','webm','ogv'].includes(ext)) return 'video_file'
  if (['mp3','wav','ogg','flac','m4a'].includes(ext)) return 'audio_file'
  if (ext === 'pdf') return 'picture_as_pdf'
  if (['zip','tar','gz','rar'].includes(ext)) return 'folder_zip'
  if (['json','xml','yaml','yml','toml'].includes(ext)) return 'data_object'
  if (['html','htm','css','js','ts','jsx','tsx'].includes(ext)) return 'code'
  return 'draft'
}

export default function FileDashboard({ files, onDelete }: FileDashboardProps) {
  const [deletingPath, setDeletingPath] = useState<string | null>(null)

  const copyLink = (path: string) => {
    navigator.clipboard.writeText(`${window.location.origin}/view?path=${encodeURIComponent(path)}`)
    toast.success('DROP LINK COPIED!')
  }
  const handleDelete = async (path: string) => {
    if (!confirm('CONFIRM DELETE: THIS BYTE STREAM CANNOT BE RECOVERED.')) return
    setDeletingPath(path)
    try {
      const { error } = await supabase.storage.from(BUCKET).remove([path])
      if (error) throw error
      onDelete(path); toast.success('DROP DELETED')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'DELETE FAILED')
    } finally { setDeletingPath(null) }
  }

  return (
    <div className="bg-surface-container border-2 border-outline-variant shadow-[6px_6px_0px_0px_rgba(45,52,73,1)]">
      <div className="bg-surface-container-high border-b-2 border-outline-variant px-4 py-3 flex items-center justify-between">
        <h3 className="font-headline-md font-bold text-label-md text-secondary uppercase tracking-wider flex items-center gap-2">
          <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>folder_open</span>
          MY DROPS
        </h3>
        <span className="font-label-sm text-label-sm text-on-surface-variant/60">TOTAL: {files.length}</span>
      </div>

      {files.length === 0 ? (
        <div className="py-12 text-center flex flex-col items-center gap-3">
          <span className="material-symbols-outlined text-5xl text-outline-variant">inventory_2</span>
          <p className="font-label-sm text-label-sm text-on-surface-variant/60 uppercase">NO TRANSMISSIONS LOGGED YET.</p>
        </div>
      ) : (
        <div className="overflow-x-auto scrollbar-retro">
          <table className="w-full text-left font-label-sm text-label-sm text-on-surface">
            <thead>
              <tr className="border-b border-outline-variant text-on-surface-variant/60 uppercase text-[11px]">
                <th className="py-2.5 px-4 font-headline-md">FILE NAME</th>
                <th className="py-2.5 px-3 font-headline-md">SIZE</th>
                <th className="py-2.5 px-3 font-headline-md hidden md:table-cell">DATE</th>
                <th className="py-2.5 px-3 font-headline-md text-right">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/40">
              {files.map((file) => (
                <tr key={file.path} className="hover:bg-surface-container-high transition-colors group">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2.5">
                      <ExtBadge name={file.name} />
                      <span className="material-symbols-outlined text-sm text-on-surface-variant group-hover:text-primary transition-colors" style={{ fontVariationSettings: "'FILL' 1" }}>
                        {fileIcon(file.name)}
                      </span>
                      <a href={file.publicUrl} target="_blank" rel="noreferrer"
                        className="font-semibold text-on-surface hover:text-secondary truncate max-w-[160px] md:max-w-[240px] inline-block transition-colors">
                        {file.name}
                      </a>
                    </div>
                  </td>
                  <td className="py-3 px-3 text-on-surface-variant whitespace-nowrap">{formatBytes(file.size)}</td>
                  <td className="py-3 px-3 text-on-surface-variant/70 whitespace-nowrap hidden md:table-cell">{formatDate(file.createdAt)}</td>
                  <td className="py-3 px-3 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => copyLink(file.path)}
                        className="retro-button border-2 border-secondary bg-surface text-secondary hover:bg-secondary hover:text-on-secondary shadow-[2px_2px_0px_0px_var(--color-secondary)] text-[10px] px-2.5 py-1 font-label-sm">
                        GET LINK
                      </button>
                      <button onClick={() => handleDelete(file.path)} disabled={deletingPath === file.path}
                        className="retro-button border-2 border-error bg-surface text-error hover:bg-error hover:text-on-error shadow-[2px_2px_0px_0px_var(--color-error)] text-[10px] px-2 py-1 font-label-sm">
                        {deletingPath === file.path ? '...' : 'DEL'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
