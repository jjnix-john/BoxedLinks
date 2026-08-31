import { useEffect, useState, useCallback } from 'react'
import type { User } from '@supabase/supabase-js'
import toast from 'react-hot-toast'
import { supabase, BUCKET, getPublicUrl } from './lib/supabase'
import AuthModal from './components/AuthModal'
import UploadZone from './components/UploadZone'
import FileDashboard, { type FileRecord } from './components/FileDashboard'
import FileViewer from './components/FileViewer'

function isViewRoute() {
  return window.location.pathname === '/view'
}

export default function App() {
  const [user, setUser] = useState<User | null>(null)
  const [showAuth, setShowAuth] = useState(false)
  const [files, setFiles] = useState<FileRecord[]>([])
  const [loadingFiles, setLoadingFiles] = useState(false)

  // ── Auth Listener ──
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  // ── Fetch Files ──
  const fetchFiles = useCallback(async (uid: string) => {
    setLoadingFiles(true)
    try {
      const { data, error } = await supabase.storage.from(BUCKET).list(uid, {
        sortBy: { column: 'created_at', order: 'desc' },
      })
      if (error) throw error

      const records: FileRecord[] = (data ?? []).map((obj) => {
        const filePath = `${uid}/${obj.name}`
        return {
          name: obj.name.replace(/^\d+-/, ''),
          path: filePath,
          publicUrl: getPublicUrl(filePath),
          size: obj.metadata?.size ?? 0,
          createdAt: obj.created_at ?? new Date().toISOString(),
        }
      })
      setFiles(records)
    } catch {
      toast.error('COULD NOT FETCH DROPS FROM CLOUD.')
    } finally {
      setLoadingFiles(false)
    }
  }, [])

  useEffect(() => {
    if (user) {
      fetchFiles(user.id)
    } else {
      setFiles([])
    }
  }, [user, fetchFiles])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    toast.success('SIGNED OUT')
  }

  const handleUploadSuccess = (file: FileRecord) => {
    setFiles((prev) => [file, ...prev])
  }

  const handleDelete = (path: string) => {
    setFiles((prev) => prev.filter((f) => f.path !== path))
  }

  // Calculate total used bytes
  const totalUsedBytes = files.reduce((sum, f) => sum + f.size, 0)
  const usedMB = (totalUsedBytes / (1024 * 1024)).toFixed(1)
  const maxMB = 512
  const progressPercent = Math.min(100, (totalUsedBytes / (maxMB * 1024 * 1024)) * 100)

  // ── View Route ──
  if (isViewRoute()) {
    return <FileViewer />
  }

  return (
    <div className="bg-[#0b1326] text-[#dae2fd] min-h-screen flex flex-col relative font-body-md overflow-x-hidden">
      {/* Retro Scanline Overlay */}
      <div className="scanlines"></div>

      {/* Top Nav Bar */}
      <nav className="fixed top-0 left-0 w-full z-50 flex justify-between items-center px-6 h-16 bg-[#0b1326] border-b-2 border-[#ddb7ff] shadow-[4px_4px_0px_0px_rgba(221,183,255,0.3)]">
        <a href="/" className="flex items-center gap-3 text-[#ddb7ff] font-headline text-lg md:text-xl font-bold uppercase tracking-wider">
          <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>
            cloud
          </span>
          BoxedLinks
        </a>

        <div className="hidden md:flex items-center gap-6 font-mono-code text-xs uppercase tracking-wider">
          <a href="#how-it-works" className="text-[#ddb7ff] border-b-2 border-[#ddb7ff] pb-0.5">
            How it Works
          </a>
          <a href={user ? "#dashboard" : "#"} onClick={() => !user && setShowAuth(true)} className="text-[#cfc2d6] hover:text-[#ddb7ff] transition-colors">
            My Drops
          </a>
          <button onClick={() => !user && setShowAuth(true)} className="text-[#cfc2d6] hover:text-[#ddb7ff] transition-colors">
            Profile
          </button>
        </div>

        {user ? (
          <div className="flex items-center gap-3">
            <span className="hidden sm:inline-block font-mono-code text-xs text-[#ddb7ff] truncate max-w-[150px]">
              {user.email}
            </span>
            <button
              onClick={handleSignOut}
              className="retro-button retro-btn-danger px-3 py-1.5 font-headline text-xs flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-sm">logout</span>
              EXIT
            </button>
          </div>
        ) : (
          <button
            onClick={() => setShowAuth(true)}
            className="retro-button retro-btn-primary px-4 py-2 font-headline text-xs flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>
              rocket_launch
            </span>
            START DROPPING
          </button>
        )}
      </nav>

      {/* Auth Modal */}
      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}

      {/* Main Content Area */}
      <main className="flex-grow pt-24 px-4 md:px-8 max-w-7xl mx-auto w-full flex flex-col gap-12 relative z-10 pb-20">
        {!user ? (
          /* LOGGED OUT HERO LANDING */
          <>
            <section className="flex flex-col items-center justify-center min-h-[60vh] text-center gap-8 mt-6">
              {/* Massive Retro Floppy/Cloud Icon Composition */}
              <div
                onClick={() => setShowAuth(true)}
                className="relative group cursor-pointer"
              >
                <div className="w-48 h-48 md:w-64 md:h-64 border-4 border-[#ddb7ff] bg-[#222a3d] flex items-center justify-center shadow-[16px_16px_0px_0px_rgba(221,183,255,0.4)] retro-button transition-transform duration-200 group-hover:-translate-y-2 group-hover:-translate-x-2 group-hover:shadow-[24px_24px_0px_0px_rgba(221,183,255,0.6)]">
                  <span
                    className="material-symbols-outlined text-[100px] md:text-[140px] text-[#ddb7ff]"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    cloud_upload
                  </span>

                  {/* Floppy overlay */}
                  <div className="absolute bottom-4 right-4 bg-[#4cd7f6] border-2 border-[#003640] px-2 py-1 shadow-[4px_4px_0px_0px_rgba(0,54,64,1)] animate-bounce">
                    <span
                      className="material-symbols-outlined text-[#003640] text-xl"
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      save
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-4 max-w-3xl">
                <h1 className="font-headline text-3xl md:text-5xl font-bold text-[#ddb7ff] drop-shadow-[4px_4px_0px_rgba(104,47,118,0.8)] tracking-tight leading-tight uppercase">
                  DROP YOUR BYTES INTO THE CLOUD.
                </h1>
                <p className="font-body-lg text-base md:text-lg text-[#cfc2d6] max-w-2xl mx-auto leading-relaxed">
                  The most nostalgic way to share files. Secure, fast, and 100% retro. Experience the web like it's 1999, but with the speeds of today.
                </p>
              </div>

              <button
                onClick={() => setShowAuth(true)}
                className="retro-button border-4 border-[#4cd7f6] bg-[#0b1326] text-[#4cd7f6] px-8 md:px-12 py-4 font-headline text-lg md:text-2xl shadow-[8px_8px_0px_0px_rgba(76,215,246,0.6)] hover:bg-[#4cd7f6] hover:text-[#003640] uppercase tracking-widest flex items-center gap-3 mt-2"
              >
                <span className="material-symbols-outlined text-2xl md:text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                  rocket_launch
                </span>
                GET STARTED
              </button>
            </section>

            {/* Community Drops / How it works section */}
            <section id="how-it-works" className="mt-8 bg-[#171f33] border-2 border-[#4d4354] p-6 shadow-[8px_8px_0px_0px_rgba(45,52,73,1)]">
              <div className="flex items-center justify-between border-b-2 border-[#4d4354] pb-4 mb-6">
                <h2 className="font-headline text-xl text-[#4cd7f6] font-bold uppercase flex items-center gap-3">
                  <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
                    public
                  </span>
                  Recent Drops
                </h2>
                <div className="font-mono-code text-xs text-[#cfc2d6] px-3 py-1 border-2 border-[#4d4354] bg-[#222a3d]">
                  LIVE FEED _
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {[
                  { name: 'sunset.png', size: '2.4MB', ext: 'PNG', color: 'border-[#f3aeff] text-[#f3aeff] hover:bg-[#f3aeff]' },
                  { name: 'readme.txt', size: '12KB', ext: 'TXT', color: 'border-[#4cd7f6] text-[#4cd7f6] hover:bg-[#4cd7f6]' },
                  { name: 'mixtape.zip', size: '145MB', ext: 'ZIP', color: 'border-[#ddb7ff] text-[#ddb7ff] hover:bg-[#ddb7ff]' },
                  { name: 'track_01.mp3', size: '4.2MB', ext: 'MP3', color: 'border-[#b979c6] text-[#b979c6] hover:bg-[#b979c6]' },
                  { name: 'index.html', size: '8KB', ext: 'HTML', color: 'border-[#4cd7f6] text-[#4cd7f6] hover:bg-[#4cd7f6]' },
                  { name: 'dancing_baby.gif', size: '1.1MB', ext: 'GIF', color: 'border-[#ddb7ff] text-[#ddb7ff] hover:bg-[#ddb7ff]' },
                ].map((chip) => (
                  <div
                    key={chip.name}
                    onClick={() => setShowAuth(true)}
                    className={`retro-button bg-[#0b1326] border-2 ${chip.color.split(' ')[0]} p-4 flex flex-col items-center gap-2 shadow-[4px_4px_0px_0px_rgba(221,183,255,0.2)] group cursor-pointer`}
                  >
                    <span className={`material-symbols-outlined text-4xl ${chip.color.split(' ')[1]} group-hover:text-[#0b1326]`} style={{ fontVariationSettings: "'FILL' 1" }}>
                      description
                    </span>
                    <span className="font-mono-code text-xs text-[#dae2fd] group-hover:text-[#0b1326] truncate w-full text-center">
                      {chip.name}
                    </span>
                    <div className="bg-[#171f33] text-[#cfc2d6] font-mono-code text-[10px] px-2 py-0.5 w-full text-center mt-1 border border-[#4d4354]">
                      {chip.size}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </>
        ) : (
          /* LOGGED IN DASHBOARD VIEW (MATCHING USER SCREENSHOT 1) */
          <div id="dashboard" className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Main Terminal Column (Upload + Drops Table) */}
            <div className="lg:col-span-8 flex flex-col gap-8">
              {/* Upload Terminal */}
              <UploadZone user={user} onUploadSuccess={handleUploadSuccess} />

              {/* My Drops Table */}
              {loadingFiles ? (
                <div className="bg-[#171f33] border-2 border-[#ddb7ff] p-8 text-center font-headline text-xs text-[#ddb7ff]">
                  LOADING DROPS...
                </div>
              ) : (
                <FileDashboard files={files} onDelete={handleDelete} />
              )}
            </div>

            {/* Right Side Panel: Storage Status */}
            <div className="lg:col-span-4 flex flex-col gap-6">
              <div className="bg-[#171f33] border-2 border-[#ddb7ff]/60 p-6 shadow-[6px_6px_0px_0px_rgba(221,183,255,0.3)]">
                <div className="font-headline font-bold text-xs text-[#ddb7ff] uppercase tracking-wider mb-6 border-b border-[#4d4354] pb-2">
                  STORAGE STATUS
                </div>

                <div className="flex flex-col gap-4">
                  <div className="flex items-baseline justify-between">
                    <span className="font-mono-code text-xs text-[#cfc2d6]/70 uppercase">USED</span>
                    <span className="font-headline text-3xl font-bold text-[#f3aeff]">
                      {usedMB}MB
                    </span>
                  </div>

                  <div className="text-right font-mono-code text-xs text-[#cfc2d6]/70 border-b border-[#4d4354] pb-4">
                    / {maxMB}MB TOTAL
                  </div>

                  {/* Retro Progress Bar Container */}
                  <div className="w-full bg-[#0b1326] border-2 border-[#4d4354] h-6 p-0.5 relative">
                    <div
                      className="bg-gradient-to-r from-[#842bd2] via-[#b76dff] to-[#f3aeff] h-full transition-all duration-300"
                      style={{ width: `${Math.max(5, progressPercent)}%` }}
                    ></div>
                  </div>

                  <button
                    onClick={() => toast.success('STORAGE EXPANSION PROTOCOL REQUESTED')}
                    className="retro-button retro-btn-cyan text-xs py-3 mt-4 text-center font-bold"
                  >
                    UPGRADE STORAGE
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Retro Footer */}
      <footer className="w-full py-8 px-6 flex flex-col md:flex-row justify-between items-center gap-4 bg-[#171f33] border-t-2 border-[#4d4354] z-10 relative mt-auto font-mono-code text-xs">
        <div className="text-[#4cd7f6]">
          © 199X BOXEDLINKS V1.0.4 - ALL BYTES RESERVED
        </div>
        <div className="flex items-center gap-6">
          <a href="#" className="text-[#cfc2d6] hover:text-[#4cd7f6] transition-colors">Credits</a>
          <a href="#" className="text-[#cfc2d6] hover:text-[#4cd7f6] transition-colors">Terms</a>
          <a href="#" className="text-[#cfc2d6] hover:text-[#4cd7f6] transition-colors">Support</a>
        </div>
      </footer>
    </div>
  )
}
