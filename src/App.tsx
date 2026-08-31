import { useEffect, useState, useCallback } from 'react'
import { Zap, LogOut, User as UserIcon, Files, ChevronDown, Shield } from 'lucide-react'
import type { User } from '@supabase/supabase-js'
import toast from 'react-hot-toast'
import { supabase, BUCKET, getPublicUrl } from './lib/supabase'
import AuthModal from './components/AuthModal'
import UploadZone from './components/UploadZone'
import FileDashboard, { type FileRecord } from './components/FileDashboard'
import FileViewer from './components/FileViewer'

// ────────────────────────────────────────────────────────────
// Simple client-side router: if path is /view, show FileViewer
// ────────────────────────────────────────────────────────────
function isViewRoute() {
  return window.location.pathname === '/view'
}

// ────────────────────────────────────────────────────────────
// Header
// ────────────────────────────────────────────────────────────
interface HeaderProps {
  user: User | null
  onSignIn: () => void
  onSignOut: () => void
}

function Header({ user, onSignIn, onSignOut }: HeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 30,
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        background: 'rgba(9,9,11,0.85)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
      }}
    >
      <div
        style={{
          maxWidth: 1100,
          margin: '0 auto',
          padding: '0 1.5rem',
          height: 64,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        {/* Logo */}
        <a
          href="/"
          style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', textDecoration: 'none' }}
        >
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: '9px',
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 14px rgba(99,102,241,0.35)',
            }}
          >
            <Zap size={18} color="white" fill="white" />
          </div>
          <span
            style={{
              fontWeight: 800,
              fontSize: '1.125rem',
              background: 'linear-gradient(135deg, #818cf8 0%, #c084fc 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              letterSpacing: '-0.02em',
            }}
          >
            BoxedLinks
          </span>
        </a>

        {/* Right side */}
        {user ? (
          <div style={{ position: 'relative' }}>
            <button
              id="user-menu-btn"
              onClick={() => setMenuOpen(!menuOpen)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '10px',
                padding: '0.4rem 0.75rem',
                cursor: 'pointer',
                color: '#d4d4d8',
                fontFamily: 'Inter, sans-serif',
                fontSize: '0.85rem',
                fontWeight: 500,
                transition: 'all 0.2s ease',
              }}
            >
              <div
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <UserIcon size={13} color="white" />
              </div>
              <span
                style={{
                  maxWidth: 160,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  display: 'none',
                }}
                className="sm:block"
              >
                {user.email}
              </span>
              <ChevronDown
                size={14}
                style={{
                  transition: 'transform 0.2s ease',
                  transform: menuOpen ? 'rotate(180deg)' : 'none',
                }}
              />
            </button>

            {menuOpen && (
              <>
                <div
                  style={{ position: 'fixed', inset: 0, zIndex: 20 }}
                  onClick={() => setMenuOpen(false)}
                />
                <div
                  className="glass animate-fade-in"
                  style={{
                    position: 'absolute',
                    right: 0,
                    top: 'calc(100% + 8px)',
                    width: 220,
                    borderRadius: '12px',
                    padding: '0.5rem',
                    zIndex: 30,
                    boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
                  }}
                >
                  <div
                    style={{
                      padding: '0.625rem 0.75rem',
                      borderBottom: '1px solid rgba(255,255,255,0.06)',
                      marginBottom: '0.25rem',
                    }}
                  >
                    <p style={{ fontSize: '0.7rem', color: '#52525b', marginBottom: '0.15rem' }}>Signed in as</p>
                    <p
                      style={{
                        fontSize: '0.85rem',
                        color: '#f4f4f5',
                        fontWeight: 500,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {user.email}
                    </p>
                  </div>
                  <button
                    id="sign-out-btn"
                    onClick={() => {
                      setMenuOpen(false)
                      onSignOut()
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      width: '100%',
                      padding: '0.5rem 0.75rem',
                      borderRadius: '8px',
                      border: 'none',
                      background: 'none',
                      cursor: 'pointer',
                      color: '#f87171',
                      fontFamily: 'Inter, sans-serif',
                      fontSize: '0.875rem',
                      fontWeight: 500,
                      transition: 'background 0.15s ease',
                    }}
                    onMouseEnter={(e) => {
                      ;(e.currentTarget as HTMLButtonElement).style.background = 'rgba(239,68,68,0.1)'
                    }}
                    onMouseLeave={(e) => {
                      ;(e.currentTarget as HTMLButtonElement).style.background = 'none'
                    }}
                  >
                    <LogOut size={15} />
                    Sign Out
                  </button>
                </div>
              </>
            )}
          </div>
        ) : (
          <button
            id="sign-in-header-btn"
            className="btn-primary"
            onClick={onSignIn}
          >
            Sign In
          </button>
        )}
      </div>
    </header>
  )
}

// ────────────────────────────────────────────────────────────
// Hero section (logged out)
// ────────────────────────────────────────────────────────────
function Hero({ onSignIn }: { onSignIn: () => void }) {
  return (
    <section style={{ textAlign: 'center', padding: '5rem 1.5rem 3rem' }}>
      <div
        className="animate-fade-in-up"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.375rem 0.875rem',
          borderRadius: '99px',
          background: 'rgba(99,102,241,0.1)',
          border: '1px solid rgba(99,102,241,0.2)',
          color: '#818cf8',
          fontSize: '0.8rem',
          fontWeight: 500,
          marginBottom: '1.5rem',
        }}
      >
        <Shield size={13} />
        Free · Instant · No account needed to view
      </div>

      <h1
        className="animate-fade-in-up"
        style={{
          fontWeight: 800,
          fontSize: 'clamp(2rem, 6vw, 3.5rem)',
          lineHeight: 1.15,
          letterSpacing: '-0.04em',
          marginBottom: '1rem',
          animationDelay: '0.05s',
        }}
      >
        Share{' '}
        <span
          style={{
            background: 'linear-gradient(135deg, #818cf8 0%, #c084fc 50%, #f472b6 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          plain text
        </span>
        <br />
        in one click.
      </h1>

      <p
        className="animate-fade-in-up"
        style={{
          color: '#71717a',
          fontSize: 'clamp(0.95rem, 2.5vw, 1.125rem)',
          maxWidth: 480,
          margin: '0 auto 2rem',
          lineHeight: 1.65,
          animationDelay: '0.1s',
        }}
      >
        Upload a <code style={{ color: '#818cf8', fontFamily: 'monospace' }}>.txt</code> file and get a shareable
        link instantly. No sign-up needed to view — just paste and go.
      </p>

      <div
        className="animate-fade-in-up"
        style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem', flexWrap: 'wrap', animationDelay: '0.15s' }}
      >
        <button id="hero-signin-btn" className="btn-primary" onClick={onSignIn} style={{ fontSize: '0.95rem', padding: '0.75rem 1.5rem' }}>
          <Zap size={17} />
          Start Uploading Free
        </button>
        <a
          href="#how-it-works"
          className="btn-ghost"
          style={{ fontSize: '0.95rem', padding: '0.75rem 1.5rem', textDecoration: 'none' }}
        >
          How it works
        </a>
      </div>
    </section>
  )
}

// ────────────────────────────────────────────────────────────
// How it works strip
// ────────────────────────────────────────────────────────────
function HowItWorks() {
  const steps = [
    { emoji: '🔐', title: 'Sign In', desc: 'Create a free account or use magic link.' },
    { emoji: '📄', title: 'Upload .txt', desc: 'Drag & drop any plain-text file.' },
    { emoji: '🔗', title: 'Get a Link', desc: 'Share the link — no login needed to view.' },
  ]

  return (
    <section
      id="how-it-works"
      style={{ padding: '2rem 1.5rem 4rem', maxWidth: 900, margin: '0 auto' }}
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '1rem',
        }}
      >
        {steps.map((s, i) => (
          <div
            key={s.title}
            className="glass animate-fade-in-up"
            style={{
              borderRadius: '16px',
              padding: '1.5rem',
              textAlign: 'center',
              animationDelay: `${i * 0.08}s`,
            }}
          >
            <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>{s.emoji}</div>
            <h3 style={{ fontWeight: 700, fontSize: '1rem', color: '#f4f4f5', marginBottom: '0.375rem' }}>
              {s.title}
            </h3>
            <p style={{ color: '#71717a', fontSize: '0.875rem', lineHeight: 1.55 }}>{s.desc}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

// ────────────────────────────────────────────────────────────
// Main App
// ────────────────────────────────────────────────────────────
export default function App() {
  const [user, setUser] = useState<User | null>(null)
  const [showAuth, setShowAuth] = useState(false)
  const [files, setFiles] = useState<FileRecord[]>([])
  const [loadingFiles, setLoadingFiles] = useState(false)

  // ── Auth listener ──
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

  // ── Fetch user files ──
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
      toast.error('Could not load your files.')
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
    toast.success('Signed out.')
  }

  const handleUploadSuccess = (file: FileRecord) => {
    setFiles((prev) => [file, ...prev])
  }

  const handleDelete = (path: string) => {
    setFiles((prev) => prev.filter((f) => f.path !== path))
  }

  // ── File viewer route ──
  if (isViewRoute()) {
    return <FileViewer />
  }

  // ── Main app ──
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header user={user} onSignIn={() => setShowAuth(true)} onSignOut={handleSignOut} />

      {/* Auth modal */}
      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}

      <main style={{ flex: 1 }}>
        {/* Hero (logged out) */}
        {!user && (
          <>
            <Hero onSignIn={() => setShowAuth(true)} />
            <HowItWorks />
          </>
        )}

        {/* Dashboard (logged in) */}
        {user && (
          <div style={{ maxWidth: 780, margin: '0 auto', padding: '2.5rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {/* Welcome banner */}
            <div className="animate-fade-in-up">
              <h2
                style={{
                  fontWeight: 800,
                  fontSize: 'clamp(1.5rem, 4vw, 2rem)',
                  letterSpacing: '-0.03em',
                  color: '#f4f4f5',
                  marginBottom: '0.25rem',
                }}
              >
                Upload a File
              </h2>
              <p style={{ color: '#71717a', fontSize: '0.9rem' }}>
                Drop a <code style={{ color: '#818cf8' }}>.txt</code> file below — a shareable link is copied automatically.
              </p>
            </div>

            {/* Upload zone */}
            <UploadZone user={user} onUploadSuccess={handleUploadSuccess} />

            {/* File list */}
            <div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.625rem',
                  marginBottom: '1rem',
                }}
              >
                <Files size={18} color="#818cf8" />
                <h3
                  style={{
                    fontWeight: 700,
                    fontSize: '1rem',
                    color: '#f4f4f5',
                  }}
                >
                  Your Files
                </h3>
                {files.length > 0 && (
                  <span
                    style={{
                      background: 'rgba(99,102,241,0.15)',
                      color: '#818cf8',
                      fontWeight: 600,
                      fontSize: '0.75rem',
                      padding: '0.125rem 0.5rem',
                      borderRadius: '99px',
                    }}
                  >
                    {files.length}
                  </span>
                )}
              </div>

              {loadingFiles ? (
                <div
                  className="glass animate-pulse"
                  style={{ borderRadius: '16px', height: 100 }}
                />
              ) : (
                <FileDashboard files={files} onDelete={handleDelete} />
              )}
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer
        style={{
          borderTop: '1px solid rgba(255,255,255,0.05)',
          padding: '1.25rem 1.5rem',
          textAlign: 'center',
          color: '#3f3f46',
          fontSize: '0.8rem',
        }}
      >
        BoxedLinks &mdash; Built with React &amp; Supabase
      </footer>
    </div>
  )
}
