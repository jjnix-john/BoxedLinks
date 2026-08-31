import { useState } from 'react'
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
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function formatDate(iso: string): string {
  try {
    const d = new Date(iso)
    return d.toISOString().split('T')[0]
  } catch {
    return iso
  }
}

export default function FileDashboard({ files, onDelete }: FileDashboardProps) {
  const [deletingPath, setDeletingPath] = useState<string | null>(null)

  const copyLink = (path: string) => {
    const shareLink = `${window.location.origin}/view?path=${encodeURIComponent(path)}`
    navigator.clipboard.writeText(shareLink)
    toast.success('DROP LINK COPIED!')
  }

  const handleDelete = async (path: string) => {
    if (!confirm('CONFIRM DELETE: THIS BYTE STREAM CANNOT BE RECOVERED.')) return
    setDeletingPath(path)
    try {
      const { error } = await supabase.storage.from(BUCKET).remove([path])
      if (error) throw error
      onDelete(path)
      toast.success('DROP DELETED')
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'DELETE FAILED'
      toast.error(message)
    } finally {
      setDeletingPath(null)
    }
  }

  return (
    <div className="bg-[#171f33] border-2 border-[#ddb7ff]/40 p-5 shadow-[6px_6px_0px_0px_rgba(221,183,255,0.2)]">
      <div className="flex items-center justify-between border-b-2 border-[#4d4354] pb-3 mb-4">
        <h3 className="font-headline font-bold text-base text-[#ddb7ff] uppercase tracking-wider flex items-center gap-2">
          <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>
            folder_open
          </span>
          MY DROPS
        </h3>
        <span className="font-mono-code text-xs text-[#cfc2d6]/70">
          TOTAL FILES: {files.length}
        </span>
      </div>

      {files.length === 0 ? (
        <div className="py-10 text-center flex flex-col items-center gap-2">
          <span className="material-symbols-outlined text-4xl text-[#4d4354]">inventory_2</span>
          <p className="font-mono-code text-sm text-[#cfc2d6]/60 uppercase">NO TRANSMISSIONS LOGGED YET.</p>
        </div>
      ) : (
        <div className="overflow-x-auto scrollbar-retro">
          <table className="w-full text-left font-mono-code text-xs text-[#dae2fd]">
            <thead>
              <tr className="border-b border-[#4d4354] text-[#cfc2d6]/60 uppercase text-[11px]">
                <th className="py-2.5 px-3 font-headline">FILE NAME</th>
                <th className="py-2.5 px-3 font-headline">SIZE</th>
                <th className="py-2.5 px-3 font-headline">DATE</th>
                <th className="py-2.5 px-3 font-headline text-right">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#4d4354]/40">
              {files.map((file) => (
                <tr key={file.path} className="hover:bg-[#222a3d]/60 transition-colors group">
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-2.5">
                      <span className="bg-[#ffb4ab]/20 border border-[#ffb4ab]/60 text-[#ffb4ab] text-[10px] font-bold px-1.5 py-0.5 rounded-none uppercase">
                        .TXT
                      </span>
                      <a
                        href={file.publicUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="font-semibold text-[#dae2fd] hover:text-[#4cd7f6] truncate max-w-[200px] md:max-w-[260px] inline-block transition-colors"
                      >
                        {file.name}
                      </a>
                    </div>
                  </td>
                  <td className="py-3 px-3 text-[#cfc2d6] whitespace-nowrap">
                    {formatBytes(file.size)}
                  </td>
                  <td className="py-3 px-3 text-[#cfc2d6]/80 whitespace-nowrap">
                    {formatDate(file.createdAt)}
                  </td>
                  <td className="py-3 px-3 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => copyLink(file.path)}
                        className="retro-button retro-btn-cyan text-[10px] px-2.5 py-1"
                        title="Copy Share Link"
                      >
                        GET LINK
                      </button>
                      <button
                        onClick={() => handleDelete(file.path)}
                        disabled={deletingPath === file.path}
                        className="retro-button retro-btn-danger text-[10px] px-2 py-1"
                        title="Delete File"
                      >
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
