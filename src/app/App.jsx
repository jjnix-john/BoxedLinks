import { useEffect, useState, useCallback } from 'react'
import toast from 'react-hot-toast'
import { supabase, BUCKET, getPublicUrl } from '../lib/services/supabase'
import UploadZone from '../features/upload/UploadZone'
import FileDashboard from '../features/files/FileDashboard'
import FileViewer from '../features/viewer/FileViewer'
import AmbientBackground from '../components/layout/AmbientBackground'
import AppModals from '../components/modals/AppModals'
import { isViewRoute } from '../lib/routing/routes'

export default function App() {
  const [user, setUser] = useState(null)
  const [showAuth, setShowAuth] = useState(false)
  const [showProfile, setShowProfile] = useState(false)
  const [infoModal, setInfoModal] = useState(null)
  const [files, setFiles] = useState([])
  const [loadingFiles, setLoadingFiles] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setUser(session?.user ?? null))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => setUser(session?.user ?? null))
    return () => subscription.unsubscribe()
  }, [])

  const fetchFiles = useCallback(async (uid) => {
    setLoadingFiles(true)
    try {
      const { data, error } = await supabase.storage.from(BUCKET).list(`${uid}/`, { sortBy: { column: 'created_at', order: 'desc' } })
      if (error) throw error
      setFiles((data ?? []).map((obj) => {
        const filePath = `${uid}/${obj.name}`
        return { name: obj.name.replace(/^\d+-/, ''), path: filePath, publicUrl: getPublicUrl(filePath), size: obj.metadata?.size ?? 0, createdAt: obj.created_at ?? new Date().toISOString() }
      }))
    } catch { toast.error('COULD NOT FETCH DROPS FROM CLOUD.') }
    finally { setLoadingFiles(false) }
  }, [])

  useEffect(() => { if (user) fetchFiles(user.id); else setFiles([]) }, [user, fetchFiles])

  const handleSignOut = async () => { await supabase.auth.signOut(); toast.success('SIGNED OUT') }
  const handleUploadSuccess = (file) => setFiles((prev) => [file, ...prev])
  const handleDelete = (path) => setFiles((prev) => prev.filter((f) => f.path !== path))

  const totalBytes = files.reduce((s, f) => s + f.size, 0)
  const usedMB = (totalBytes / (1024 * 1024)).toFixed(1)
  const maxMB = 512
  const progress = Math.min(100, (totalBytes / (maxMB * 1024 * 1024)) * 100)

  if (isViewRoute()) return <FileViewer />

  return (
    <div className="bg-background text-on-background min-h-screen flex flex-col relative font-body-md overflow-x-hidden">
      <div className="scanlines" />
      <AmbientBackground />

      {/* ── Nav Bar ── */}
      <nav className="fixed top-0 left-0 w-full z-50 flex justify-between items-center px-6 h-16 bg-surface border-b-2 border-primary shadow-[4px_4px_0px_0px_rgba(221,183,255,0.3)]">
        <a href="/" className="flex items-center gap-3">
          <img src="/logo.png" alt="BoxedLinks" className="h-9 w-auto" />
        </a>

        <div className="hidden md:flex items-center gap-6">
          <button onClick={() => setInfoModal('howItWorks')} className="text-primary border-b-2 border-primary pb-0.5 font-label-md text-label-md hover:text-secondary hover:border-secondary transition-colors duration-0">
            How it Works
          </button>
          <button onClick={() => { if (!user) setShowAuth(true); else document.getElementById('dashboard')?.scrollIntoView({ behavior: 'smooth' }) }} className="text-on-surface-variant hover:text-primary transition-colors duration-0 font-label-md text-label-md">
            My Drops
          </button>
          <button onClick={() => { if (!user) setShowAuth(true); else setShowProfile(true) }} className="text-on-surface-variant hover:text-primary transition-colors duration-0 font-label-md text-label-md">
            Profile
          </button>
        </div>

        {user ? (
          <div className="flex items-center gap-3">
            <button onClick={() => setShowProfile(true)} className="hidden sm:flex items-center gap-1.5 font-label-sm text-label-sm text-primary truncate max-w-[160px] hover:text-secondary transition-colors">
              <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>account_circle</span>
              {user.email}
            </button>
            <button onClick={handleSignOut} className="retro-button border-2 border-error bg-surface text-error px-4 py-2 font-label-md text-label-sm hover:bg-error hover:text-on-error shadow-[4px_4px_0px_0px_var(--color-error)] flex items-center gap-1.5">
              <span className="material-symbols-outlined text-sm">logout</span>EXIT
            </button>
          </div>
        ) : (
          <button onClick={() => setShowAuth(true)} className="retro-button border-2 border-primary bg-surface text-primary px-4 py-2 font-label-md text-label-md shadow-[4px_4px_0px_0px_rgba(221,183,255,1)] hover:bg-primary hover:text-on-primary">
            Start Dropping
          </button>
        )}
      </nav>

      {/* ── Modals ── */}
      <AppModals
        showAuth={showAuth}
        setShowAuth={setShowAuth}
        showProfile={showProfile}
        user={user}
        handleSignOut={handleSignOut}
        setShowProfile={setShowProfile}
        infoModal={infoModal}
        setInfoModal={setInfoModal}
      />

      {/* ── Main Content ── */}
      <main className="flex-grow pt-24 px-4 md:px-margin max-w-7xl mx-auto w-full flex flex-col gap-12 relative z-10 pb-20">
        {!user ? (
          <>
            {/* Hero */}
            <section className="flex flex-col items-center justify-center min-h-[60vh] text-center gap-8 mt-12">
              <div className="relative group cursor-pointer" onClick={() => setShowAuth(true)}>
                <div className="w-48 h-48 md:w-64 md:h-64 border-4 border-primary bg-surface-container-high flex items-center justify-center shadow-[16px_16px_0px_0px_rgba(221,183,255,0.4)] retro-button transition-transform duration-200 group-hover:-translate-y-2 group-hover:-translate-x-2 group-hover:shadow-[24px_24px_0px_0px_rgba(221,183,255,0.6)]">
                  <span className="material-symbols-outlined text-[100px] md:text-[140px] text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>cloud_upload</span>
                  <div className="absolute bottom-4 right-4 bg-secondary border-2 border-on-secondary px-2 py-1 shadow-[4px_4px_0px_0px_rgba(0,54,64,1)] animate-bounce">
                    <span className="material-symbols-outlined text-on-secondary" style={{ fontVariationSettings: "'FILL' 1" }}>save</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-4 max-w-3xl">
                <h1 className="font-headline-xl text-headline-xl md:text-headline-xl font-bold text-primary drop-shadow-[4px_4px_0px_rgba(104,47,118,0.8)] text-3xl md:text-5xl">
                  DROP YOUR BYTES INTO THE CLOUD.
                </h1>
                <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl mx-auto">
                  The most nostalgic way to share files. Secure, fast, and 100% retro. Experience the web like it's 1999, but with the speeds of today.
                </p>
              </div>

              <div className="flex flex-wrap gap-4 justify-center mt-4">
                <button onClick={() => setShowAuth(true)} className="retro-button border-4 border-secondary bg-surface text-secondary px-10 py-4 font-headline-md text-headline-md font-bold shadow-[8px_8px_0px_0px_rgba(76,215,246,0.6)] hover:bg-secondary hover:text-on-secondary uppercase tracking-widest flex items-center gap-3">
                  <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>rocket_launch</span>GET STARTED
                </button>
                <button onClick={() => setInfoModal('howItWorks')} className="retro-button border-2 border-primary/60 bg-surface text-primary px-6 py-4 font-headline-md font-bold shadow-[4px_4px_0px_0px_rgba(221,183,255,0.4)] hover:bg-primary hover:text-on-primary uppercase tracking-wide flex items-center gap-2">
                  <span className="material-symbols-outlined text-xl">help</span>HOW IT WORKS
                </button>
              </div>
            </section>

            {/* Recent Drops */}
            <section className="mt-16 bg-surface-container border-2 border-outline-variant p-6 shadow-[8px_8px_0px_0px_rgba(45,52,73,1)]">
              <div className="flex items-center justify-between border-b-2 border-outline-variant pb-4 mb-6">
                <h2 className="font-headline-lg text-headline-lg font-bold text-secondary flex items-center gap-3">
                  <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>public</span>Recent Drops
                </h2>
                <div className="font-label-sm text-label-sm text-on-surface-variant px-3 py-1 border-2 border-outline-variant bg-surface-container-high">LIVE FEED _</div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {[
                  { name: 'notes.txt',   size: '2.4KB',  icon: 'description', border: 'border-tertiary',          text: 'text-tertiary',           hover: 'hover:bg-tertiary',          hText: 'group-hover:text-on-tertiary' },
                  { name: 'readme.txt',  size: '12KB',   icon: 'description', border: 'border-secondary',         text: 'text-secondary',          hover: 'hover:bg-secondary',         hText: 'group-hover:text-on-secondary' },
                  { name: 'log.txt',     size: '45KB',   icon: 'description', border: 'border-primary',           text: 'text-primary',            hover: 'hover:bg-primary',           hText: 'group-hover:text-on-primary' },
                  { name: 'poem.txt',    size: '4.2KB',  icon: 'description', border: 'border-tertiary-container',text: 'text-tertiary-container', hover: 'hover:bg-tertiary-container',hText: 'group-hover:text-on-tertiary-container' },
                  { name: 'words.txt',   size: '8KB',    icon: 'description', border: 'border-secondary',         text: 'text-secondary',          hover: 'hover:bg-secondary',         hText: 'group-hover:text-on-secondary' },
                  { name: 'story.txt',   size: '1.1KB',  icon: 'description', border: 'border-primary',           text: 'text-primary',            hover: 'hover:bg-primary',           hText: 'group-hover:text-on-primary' },
                ].map((chip) => (
                  <div key={chip.name} onClick={() => setShowAuth(true)}
                    className={`retro-button bg-surface border-2 ${chip.border} p-4 flex flex-col items-center gap-2 shadow-[4px_4px_0px_0px_rgba(221,183,255,0.2)] ${chip.hover} group cursor-pointer`}>
                    <span className={`material-symbols-outlined ${chip.text} text-4xl ${chip.hText}`} style={{ fontVariationSettings: "'FILL' 1" }}>{chip.icon}</span>
                    <span className={`font-label-sm text-label-sm text-on-surface ${chip.hText} truncate w-full text-center`}>{chip.name}</span>
                    <div className={`${chip.text.replace('text-', 'bg-')} text-on-surface font-label-sm px-2 py-0.5 text-[10px] w-full text-center mt-1`}>{chip.size}</div>
                  </div>
                ))}
              </div>
              <p className="mt-6 text-center font-label-sm text-label-sm text-on-surface-variant/50">
                SIGN IN TO VIEW AND DOWNLOAD THESE FILES →{' '}
                <button onClick={() => setShowAuth(true)} className="text-secondary hover:underline">SIGN IN NOW</button>
              </p>
            </section>
          </>
        ) : (
          /* ── LOGGED IN DASHBOARD ── */
          <div id="dashboard" className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-8 flex flex-col gap-8">
              <UploadZone 
                user={user} 
                onUploadSuccess={handleUploadSuccess} 
              />
              {loadingFiles ? (
                <div className="bg-surface-container border-2 border-primary p-8 text-center font-headline-md text-label-md text-primary">LOADING DROPS...</div>
              ) : (
                <FileDashboard 
                  files={files}
                  onDelete={handleDelete} 
                />
              )}
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-4 flex flex-col gap-6">
              {/* Storage Status */}
              <div className="bg-surface-container border-2 border-primary shadow-[6px_6px_0px_0px_rgba(221,183,255,0.3)]">
                <div className="bg-surface-container-high border-b-2 border-primary px-4 py-2 font-headline-md text-label-sm text-primary uppercase tracking-wider">STORAGE STATUS</div>
                <div className="p-5 flex flex-col gap-4">
                  <div className="flex items-baseline justify-between">
                    <span className="font-label-sm text-label-sm text-on-surface-variant/70 uppercase">USED</span>
                    <span className="font-headline-md text-headline-md font-bold text-tertiary">{usedMB}MB</span>
                  </div>
                  <div className="text-right font-label-sm text-label-sm text-on-surface-variant/60 border-b border-outline-variant pb-3">/ {maxMB}MB TOTAL</div>
                  <div className="w-full bg-surface border-2 border-outline-variant h-6 p-0.5">
                    <div className="bg-gradient-to-r from-inverse-primary via-primary-container to-tertiary h-full transition-all duration-300" style={{ width: `${Math.max(4, progress)}%` }} />
                  </div>
                  <p className="font-label-sm text-[10px] text-on-surface-variant/50">{files.length} FILE{files.length !== 1 ? 'S' : ''} · {(100 - progress).toFixed(1)}% FREE</p>
                  <button onClick={() => setInfoModal('support')} className="retro-button border-2 border-secondary bg-surface text-secondary hover:bg-secondary hover:text-on-secondary shadow-[4px_4px_0px_0px_var(--color-secondary)] py-3 text-label-sm font-label-md flex items-center justify-center gap-2 mt-2">
                    <span className="material-symbols-outlined text-sm">upgrade</span>UPGRADE STORAGE
                  </button>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-surface-container border-2 border-outline-variant">
                <div className="bg-surface-container-high border-b-2 border-outline-variant px-4 py-2 font-headline-md text-label-sm text-on-surface-variant uppercase tracking-wider">QUICK ACTIONS</div>
                <div className="p-4 flex flex-col gap-2">
                  <button onClick={() => setShowProfile(true)} className="retro-button border-2 border-primary bg-surface text-primary hover:bg-primary hover:text-on-primary shadow-[4px_4px_0px_0px_rgba(221,183,255,0.6)] py-2.5 text-label-sm font-label-sm flex items-center gap-2 px-3">
                    <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>person</span>VIEW PROFILE
                  </button>
                  <button onClick={() => fetchFiles(user.id)} className="retro-button border-2 border-outline-variant bg-surface text-on-surface-variant hover:border-primary hover:text-primary py-2.5 text-label-sm font-label-sm flex items-center gap-2 px-3 transition-colors">
                    <span className="material-symbols-outlined text-sm">refresh</span>REFRESH DROPS
                  </button>
                  <button onClick={() => setInfoModal('howItWorks')} className="retro-button border-2 border-outline-variant bg-surface text-on-surface-variant hover:border-primary hover:text-primary py-2.5 text-label-sm font-label-sm flex items-center gap-2 px-3 transition-colors">
                    <span className="material-symbols-outlined text-sm">help</span>HOW IT WORKS
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ── Footer ── */}
      <footer className="w-full py-8 px-6 flex flex-col md:flex-row justify-between items-center gap-4 bg-surface-container border-t-2 border-outline z-10 relative mt-auto">
        <div className="font-label-md text-label-md text-secondary">© 199X BOXEDLINKS V1.0.4 - ALL BYTES RESERVED</div>
        <div className="flex items-center gap-6">
          <button onClick={() => setInfoModal('credits')} className="text-on-surface-variant hover:text-secondary transition-colors font-label-sm text-label-sm">Credits</button>
          <button onClick={() => setInfoModal('terms')} className="text-on-surface-variant hover:text-secondary transition-colors font-label-sm text-label-sm">Terms</button>
          <button onClick={() => setInfoModal('support')} className="text-on-surface-variant hover:text-secondary transition-colors font-label-sm text-label-sm">Support</button>
        </div>
      </footer>
    </div>
  )
}
