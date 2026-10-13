import { useEffect, useState, useCallback } from 'react'
import toast from 'react-hot-toast'
import { supabase, BUCKET, getPublicUrl } from '../lib/services/supabase'
import UploadZone from '../features/upload/UploadZone'
import FileDashboard from '../features/files/FileDashboard'
import FileViewer from '../features/viewer/FileViewer'
import AmbientBackground from '../components/layout/AmbientBackground'
import AppModals from '../components/modals/AppModals'
import Icon from '../components/ui/Icon'
import Logo from '../components/ui/Logo'
import { isViewRoute } from '../lib/routing/routes'

const SAMPLE_DROPS = [
  { name: 'notes.txt',  size: '2.4 KB', icon: 'description',    color: 'text-purple-600' },
  { name: 'photo.png',  size: '640 KB', icon: 'image',          color: 'text-violet-600' },
  { name: 'report.pdf', size: '1.2 MB', icon: 'picture_as_pdf', color: 'text-rose-600' },
  { name: 'data.json',  size: '8 KB',   icon: 'data_object',    color: 'text-teal-600' },
  { name: 'song.mp3',   size: '2.9 MB', icon: 'audio_file',     color: 'text-blue-600' },
  { name: 'site.zip',   size: '1.1 MB', icon: 'folder_zip',     color: 'text-amber-600' },
]

const FEATURES = [
  { icon: 'bolt',          title: 'Instant links', text: 'Drop a file and a short link lands on your clipboard instantly.', color: 'text-amber-600' },
  { icon: 'verified_user', title: 'Scanned & safe', text: 'Every upload is checked before it safely reaches the cloud.', color: 'text-teal-600' },
  { icon: 'public',        title: 'No login to open', text: 'Recipients preview and download in one tap — zero hassle.', color: 'text-purple-600' },
]

export default function App() {
  const [user, setUser] = useState(null)
  const [showAuth, setShowAuth] = useState(false)
  const [showProfile, setShowProfile] = useState(false)
  const [infoModal, setInfoModal] = useState(null)
  const [files, setFiles] = useState([])
  const [loadingFiles, setLoadingFiles] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setUser(session?.user ?? null))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null)
      if (event === 'PASSWORD_RECOVERY') {
        setShowAuth('reset')
      }
    })

    if (typeof window !== 'undefined') {
      const hash = window.location.hash || ''
      const search = window.location.search || ''
      if (hash.includes('type=recovery') || search.includes('type=recovery')) {
        setShowAuth('reset')
      }
    }

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
    } catch { toast.error('Could not fetch your files.') }
    finally { setLoadingFiles(false) }
  }, [])

  useEffect(() => { if (user) fetchFiles(user.id); else setFiles([]) }, [user, fetchFiles])

  const handleSignOut = async () => { await supabase.auth.signOut(); toast.success('Signed out') }
  const handleUploadSuccess = (file) => setFiles((prev) => [file, ...prev])
  const handleDelete = (path) => setFiles((prev) => prev.filter((f) => f.path !== path))

  const totalBytes = files.reduce((s, f) => s + f.size, 0)
  const usedMB = (totalBytes / (1024 * 1024)).toFixed(1)
  const maxMB = 512
  const progress = Math.min(100, (totalBytes / (maxMB * 1024 * 1024)) * 100)

  if (isViewRoute()) return <FileViewer />

  const navLink = 'px-4 py-2 rounded-lg text-sm font-bold text-purple-950 hover:text-purple-600 transition-colors font-[family-name:var(--font-display)]'

  return (
    <div className="bg-base text-ink min-h-screen flex flex-col relative overflow-x-hidden">
      <AmbientBackground />

      {/* ── Nav Bar: Minimal rounded corners (8px) ── */}
      <header className="fixed top-0 inset-x-0 z-50 px-4 pt-4">
        <nav className="neu-raised max-w-7xl mx-auto flex justify-between items-center px-4 md:px-6 h-16 !rounded-[8px] border border-purple-200/60">
          <a href="/" aria-label="BoxedLinks home"><Logo /></a>

          <div className="hidden md:flex items-center gap-1">
            <button id="nav-how" onClick={() => setInfoModal('howItWorks')} className={navLink}>How it works</button>
            <button id="nav-drops" onClick={() => { if (!user) setShowAuth(true); else document.getElementById('dashboard')?.scrollIntoView({ behavior: 'smooth' }) }} className={navLink}>My drops</button>
            <button id="nav-profile" onClick={() => { if (!user) setShowAuth(true); else setShowProfile(true) }} className={navLink}>Profile</button>
          </div>

          {user ? (
            <div className="flex items-center gap-3">
              <button id="nav-account" onClick={() => setShowProfile(true)} className="hidden sm:flex neu-pill neu-pill-inset !py-2 !rounded-[6px] max-w-[200px] text-purple-950 font-bold hover:text-purple-600 transition-colors">
                <Icon name="account_circle" fill className="text-base text-purple-600" />
                <span className="truncate">{user.email}</span>
              </button>
              <button id="nav-signout" onClick={handleSignOut} className="neu-btn neu-btn-danger px-4 py-2 text-sm !rounded-xl">
                <Icon name="logout" className="text-lg" /><span className="hidden sm:inline">Sign out</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <button id="nav-signin" onClick={() => setShowAuth(true)} className="hidden sm:inline-flex neu-btn px-4 py-2 text-sm !rounded-xl font-bold">Sign in</button>
              <button id="nav-start" onClick={() => setShowAuth(true)} className="neu-btn-accent px-5 py-2.5 text-sm !rounded-xl">
                Start dropping<Icon name="arrow_forward" className="text-lg" />
              </button>
            </div>
          )}
        </nav>
      </header>

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
      <main className="flex-grow pt-32 px-4 md:px-8 max-w-7xl mx-auto w-full flex flex-col gap-16 relative z-10 pb-20">
        {!user ? (
          <>
            {/* Hero Section */}
            <section className="grid lg:grid-cols-12 gap-12 items-center min-h-[60vh]">
              <div className="lg:col-span-7 flex flex-col gap-6 text-center lg:text-left items-center lg:items-start animate-rise">
                <span className="neu-pill !rounded-[4px] text-purple-900 border border-purple-200 bg-white">
                  <Icon name="auto_awesome" fill className="text-sm text-purple-600" />Free file drops · 512MB storage
                </span>
                <h1 className="text-4xl md:text-6xl font-extrabold leading-[1.08] text-purple-950">
                  Drop a file.<br />
                  <span className="text-gradient">Share a link.</span>
                </h1>
                <p className="text-lg text-purple-900/80 max-w-xl font-medium leading-relaxed">
                  The clean purple-to-white way to share files. Upload in a tap, get a short link instantly, and let anyone download with zero friction.
                </p>
                <div className="flex flex-wrap gap-4 justify-center lg:justify-start mt-2">
                  <button id="hero-get-started" onClick={() => setShowAuth(true)} className="neu-btn-accent px-8 py-4 text-base !rounded-xl">
                    <Icon name="rocket_launch" fill className="text-xl" />Get started
                  </button>
                  <button id="hero-how" onClick={() => setInfoModal('howItWorks')} className="neu-btn px-7 py-4 text-base !rounded-xl font-bold">
                    <Icon name="play_circle" className="text-xl text-purple-600" />How it works
                  </button>
                </div>
              </div>

              {/* ── Hero Console Visual (Minimal rounded edges on card, smooth trigger button) ── */}
              <div className="lg:col-span-5 flex justify-center animate-rise [animation-delay:120ms]">
                <div className="w-full max-w-md neu-raised-lg !rounded-[8px] p-6 border border-purple-200/60 relative">
                  {/* Floating minimal-edge badge */}
                  <div className="absolute -top-3 right-6 neu-raised-sm !rounded-[4px] px-3 py-1 flex items-center gap-1.5 text-xs font-bold text-purple-900 border border-purple-200/50 bg-white">
                    <Icon name="link" className="text-sm text-purple-600" />bxd.link/a7k2
                  </div>

                  <div className="neu-inset !rounded-[6px] p-6 flex flex-col items-center text-center gap-5 bg-gradient-to-b from-white to-purple-50/50">
                    <div className="neu-well w-16 h-16 !rounded-[6px] border border-purple-200/60 text-purple-600 shadow-sm">
                      <Icon name="cloud_upload" fill className="text-3xl text-purple-600" />
                    </div>

                    <div>
                      <h3 className="text-xl font-bold text-purple-950 font-[family-name:var(--font-display)]">Fast Cloud Vault</h3>
                      <p className="text-xs text-purple-900/70 font-medium mt-1">Ready to transmit files securely across the web</p>
                    </div>

                    <button
                      id="hero-orb"
                      onClick={() => setShowAuth(true)}
                      className="neu-btn-accent w-full py-3.5 px-5 !rounded-xl text-sm font-bold flex items-center justify-center gap-2 shadow-md hover:scale-[1.02] transition-transform"
                    >
                      <Icon name="upload" className="text-lg" />Drop a file here to share
                    </button>

                    <div className="flex items-center justify-between w-full pt-2 border-t border-purple-100 text-[11px] text-purple-900/70 font-semibold">
                      <span className="flex items-center gap-1"><Icon name="verified_user" fill className="text-xs text-teal-600" />Encrypted</span>
                      <span className="flex items-center gap-1"><Icon name="bolt" className="text-xs text-amber-600" />Instant URL</span>
                      <span className="flex items-center gap-1"><Icon name="schedule" className="text-xs text-purple-600" />90-Day Cloud</span>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Features (Minimal 8px edges) */}
            <section className="grid md:grid-cols-3 gap-8">
              {FEATURES.map((f) => (
                <article key={f.title} className="neu-raised p-7 !rounded-[8px] flex flex-col gap-4 transition-transform duration-300 hover:-translate-y-1 border border-purple-200/50">
                  <div className={`neu-well-inset w-14 h-14 !rounded-[6px] ${f.color}`}><Icon name={f.icon} fill className="text-3xl" /></div>
                  <h3 className="text-lg font-bold text-purple-950">{f.title}</h3>
                  <p className="text-sm text-purple-900/80 leading-relaxed font-medium">{f.text}</p>
                </article>
              ))}
            </section>

            {/* Sample Drops (Minimal 8px card, minimal 6px item chips) */}
            <section className="neu-raised p-6 md:p-8 !rounded-[8px] border border-purple-200/50">
              <div className="flex items-center justify-between gap-4 mb-8">
                <h2 className="text-2xl font-bold text-purple-950 flex items-center gap-3">
                  <div className="neu-well w-11 h-11 !rounded-[6px] text-purple-600"><Icon name="grid_view" fill className="text-2xl" /></div>
                  Drop anything
                </h2>
                <span className="neu-pill neu-pill-inset !rounded-[4px] text-purple-900 font-bold"><span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />Live</span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
                {SAMPLE_DROPS.map((chip) => (
                  <button key={chip.name} onClick={() => setShowAuth(true)}
                    className="neu-raised-sm group p-5 flex flex-col items-center gap-3 !rounded-[6px] transition-all duration-300 hover:-translate-y-1 hover:shadow-[var(--neu-raised)] active:shadow-[var(--neu-inset-sm)] active:translate-y-0 border border-purple-200/40">
                    <div className={`neu-well-inset w-14 h-14 !rounded-[6px] ${chip.color} transition-transform group-hover:scale-110`}>
                      <Icon name={chip.icon} fill className="text-3xl" />
                    </div>
                    <span className="text-sm font-bold text-purple-950 truncate w-full text-center">{chip.name}</span>
                    <span className="text-[11px] font-semibold text-purple-700/70">{chip.size}</span>
                  </button>
                ))}
              </div>
              <p className="mt-8 text-center text-sm text-purple-900/80 font-medium">
                Sign in to upload and share your own files —{' '}
                <button id="sample-signin" onClick={() => setShowAuth(true)} className="font-bold text-purple-700 hover:text-purple-950 underline underline-offset-4">sign in now</button>
              </p>
            </section>
          </>
        ) : (
          /* ── LOGGED IN DASHBOARD ── */
          <div id="dashboard" className="flex flex-col gap-10 animate-rise">
            <div>
              <h1 className="text-3xl md:text-4xl font-extrabold text-purple-950">
                Hey, <span className="text-gradient capitalize">{user.email?.split('@')[0]}</span> 👋
              </h1>
              <p className="text-purple-900/80 font-medium mt-1">Drop a file below — the share link is copied for you automatically.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
              <div className="lg:col-span-8 flex flex-col gap-10">
                <UploadZone 
                  user={user} 
                  onUploadSuccess={handleUploadSuccess} 
                />
                {loadingFiles ? (
                  <div className="neu-raised p-12 !rounded-[8px] flex flex-col items-center gap-4 text-purple-900">
                    <div className="neu-well w-16 h-16 !rounded-[6px] text-purple-600"><Icon name="progress_activity" className="text-3xl animate-spin" /></div>
                    <span className="font-bold">Loading your drops…</span>
                  </div>
                ) : (
                  <FileDashboard 
                    files={files}
                    onDelete={handleDelete} 
                  />
                )}
              </div>

              {/* Sidebar: Minimal corners (8px) */}
              <aside className="lg:col-span-4 flex flex-col gap-10">
                {/* Storage Status */}
                <section className="neu-raised p-6 flex flex-col gap-5 !rounded-[8px] border border-purple-200/50">
                  <h2 className="text-lg font-bold text-purple-950 flex items-center gap-2.5">
                    <div className="neu-well w-9 h-9 !rounded-[6px] text-purple-600"><Icon name="database" fill className="text-xl" /></div>
                    Storage
                  </h2>

                  <div className="flex items-center gap-5">
                    {/* Gauge with minimal rounded badge */}
                    <div className="relative w-24 h-24 shrink-0 neu-raised-sm !rounded-[8px] flex items-center justify-center border border-purple-200/40">
                      <svg viewBox="0 0 36 36" className="absolute inset-0 w-full h-full -rotate-90">
                        <defs>
                          <linearGradient id="gauge-grad" x1="0" y1="0" x2="1" y2="1">
                            <stop offset="0%" stopColor="#7c3aed" /><stop offset="100%" stopColor="#c084fc" />
                          </linearGradient>
                        </defs>
                        <circle cx="18" cy="18" r="14" fill="none" stroke="rgba(124, 58, 237, 0.12)" strokeWidth="3" />
                        <circle cx="18" cy="18" r="14" fill="none" stroke="url(#gauge-grad)" strokeWidth="3" strokeLinecap="round"
                          strokeDasharray={`${Math.max(2, progress) * 0.88} 88`} className="transition-all duration-500" />
                      </svg>
                      <span className="text-sm font-extrabold text-purple-950">{progress.toFixed(0)}%</span>
                    </div>
                    <div>
                      <div className="text-3xl font-extrabold text-purple-950 font-[family-name:var(--font-display)]">{usedMB}<span className="text-base text-purple-600 font-bold"> MB</span></div>
                      <div className="text-sm text-purple-900/70 font-semibold">of {maxMB} MB used</div>
                    </div>
                  </div>

                  <div className="neu-track !rounded-[4px]"><div className="neu-fill !rounded-[2px]" style={{ width: `${Math.max(3, progress)}%` }} /></div>
                  <p className="text-xs text-purple-900/60 font-semibold -mt-2">{files.length} file{files.length !== 1 ? 's' : ''} · {(100 - progress).toFixed(1)}% free</p>

                  <button id="storage-upgrade" onClick={() => setInfoModal('support')} className="neu-btn w-full py-3 text-sm !rounded-xl font-bold">
                    <Icon name="upgrade" className="text-lg text-purple-600" />Upgrade storage
                  </button>
                </section>

                {/* Quick Actions */}
                <section className="neu-raised p-6 flex flex-col gap-4 !rounded-[8px] border border-purple-200/50">
                  <h2 className="text-lg font-bold text-purple-950 flex items-center gap-2.5">
                    <div className="neu-well w-9 h-9 !rounded-[6px] text-amber-600"><Icon name="bolt" fill className="text-xl" /></div>
                    Quick actions
                  </h2>
                  {[
                    { id: 'qa-profile', icon: 'person', label: 'View profile', onClick: () => setShowProfile(true) },
                    { id: 'qa-refresh', icon: 'refresh', label: 'Refresh drops', onClick: () => fetchFiles(user.id) },
                    { id: 'qa-help', icon: 'help', label: 'How it works', onClick: () => setInfoModal('howItWorks') },
                  ].map((a) => (
                    <button key={a.id} id={a.id} onClick={a.onClick} className="neu-btn w-full py-3 px-4 text-sm !justify-start !rounded-xl font-bold">
                      <Icon name={a.icon} className="text-lg text-purple-600" />{a.label}
                      <Icon name="chevron_right" className="text-lg ml-auto text-purple-400" />
                    </button>
                  ))}
                </section>
              </aside>
            </div>
          </div>
        )}
      </main>

      {/* ── Footer: Minimal rounded corners (8px) ── */}
      <footer className="relative z-10 px-4 pb-6 mt-auto">
        <div className="neu-inset max-w-7xl mx-auto px-6 py-5 flex flex-col md:flex-row justify-between items-center gap-4 !rounded-[8px] border border-purple-200/50">
          <div className="text-sm font-semibold text-purple-900/70">© {new Date().getFullYear()} BoxedLinks · All rights reserved</div>
          <div className="flex items-center gap-2">
            {[['credits', 'Credits'], ['terms', 'Terms'], ['support', 'Support']].map(([key, label]) => (
              <button key={key} id={`footer-${key}`} onClick={() => setInfoModal(key)} className="px-3 py-1.5 rounded-lg text-sm font-bold text-purple-950 hover:text-purple-600 transition-colors">{label}</button>
            ))}
          </div>
        </div>
      </footer>
    </div>
  )
}
