import { useState } from 'react'
import { Mail, Lock, Eye, EyeOff, Zap, ArrowRight } from 'lucide-react'
import toast from 'react-hot-toast'
import { supabase } from '../lib/supabase'

interface AuthModalProps {
  onClose: () => void
}

type Mode = 'signin' | 'signup' | 'magic'

export default function AuthModal({ onClose }: AuthModalProps) {
  const [mode, setMode] = useState<Mode>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      if (mode === 'magic') {
        const { error } = await supabase.auth.signInWithOtp({
          email,
          options: { emailRedirectTo: window.location.origin },
        })
        if (error) throw error
        toast.success('Magic link sent! Check your email.')
        onClose()
        return
      }

      if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({ email, password })
        if (error) throw error
        toast.success('Account created! Check your email to confirm.')
        onClose()
        return
      }

      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error
      toast.success('Welcome back!')
      onClose()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Authentication failed.'
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    /*
      Full-screen flex overlay — backdrop + centering in one element.
      Using flexbox centering instead of fixed+transform avoids the
      "modal cut off / need to zoom out" bug caused by transform conflicts.
      overflowY: auto means the overlay scrolls if the modal is taller than the screen.
    */
    <div
      className="animate-fade-in"
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 40,
        background: 'rgba(0,0,0,0.65)',
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
        overflowY: 'auto',
      }}
    >
      {/* Modal card */}
      <div
        className="glass animate-fade-in-up"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: 420,
          borderRadius: '20px',
          padding: '2rem',
          flexShrink: 0,
        }}
      >
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 48,
              height: 48,
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              marginBottom: '0.75rem',
            }}
          >
            <Zap size={24} color="white" fill="white" />
          </div>
          <h2 style={{ fontWeight: 700, fontSize: '1.25rem', color: '#f4f4f5' }}>
            {mode === 'signup' ? 'Create Account' : mode === 'magic' ? 'Magic Link' : 'Welcome Back'}
          </h2>
          <p style={{ color: '#71717a', fontSize: '0.85rem', marginTop: '0.25rem' }}>
            {mode === 'magic' ? "We'll email you a sign-in link" : 'Sign in to upload files'}
          </p>
        </div>

        {/* Tab switcher */}
        <div
          style={{
            display: 'flex',
            gap: '0.25rem',
            background: 'rgba(255,255,255,0.04)',
            borderRadius: '10px',
            padding: '0.25rem',
            marginBottom: '1.5rem',
          }}
        >
          {(['signin', 'signup', 'magic'] as Mode[]).map((m) => (
            <button
              key={m}
              id={`auth-tab-${m}`}
              onClick={() => setMode(m)}
              style={{
                flex: 1,
                padding: '0.4rem 0.5rem',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                fontFamily: 'Inter, sans-serif',
                fontSize: '0.8rem',
                fontWeight: 500,
                transition: 'all 0.2s ease',
                background: mode === m ? 'rgba(99,102,241,0.2)' : 'transparent',
                color: mode === m ? '#818cf8' : '#71717a',
              }}
            >
              {m === 'signin' ? 'Sign In' : m === 'signup' ? 'Sign Up' : '✨ Magic'}
            </button>
          ))}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Email */}
          <div style={{ position: 'relative' }}>
            <Mail
              size={16}
              color="#52525b"
              style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)' }}
            />
            <input
              id="auth-email"
              className="input-field"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{ paddingLeft: '2.5rem' }}
            />
          </div>

          {/* Password — hidden for magic link */}
          {mode !== 'magic' && (
            <div style={{ position: 'relative' }}>
              <Lock
                size={16}
                color="#52525b"
                style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)' }}
              />
              <input
                id="auth-password"
                className="input-field"
                type={showPw ? 'text' : 'password'}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                style={{ paddingLeft: '2.5rem', paddingRight: '2.75rem' }}
              />
              <button
                type="button"
                onClick={() => setShowPw(!showPw)}
                style={{
                  position: 'absolute',
                  right: '0.75rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#52525b',
                }}
              >
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          )}

          <button
            id="auth-submit"
            className="btn-primary"
            type="submit"
            disabled={loading}
            style={{ justifyContent: 'center', padding: '0.75rem' }}
          >
            {loading ? (
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
            ) : (
              <>
                {mode === 'magic' ? 'Send Magic Link' : mode === 'signup' ? 'Create Account' : 'Sign In'}
                <ArrowRight size={15} />
              </>
            )}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '1.25rem', fontSize: '0.8rem', color: '#52525b' }}>
          By continuing you agree to our Terms &amp; Privacy Policy.
        </p>
      </div>
    </div>
  )
}
