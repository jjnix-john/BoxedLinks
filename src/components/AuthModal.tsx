import { useState } from 'react'
import toast from 'react-hot-toast'
import { supabase } from '../lib/supabase'

interface AuthModalProps { onClose: () => void }
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
        const { error } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: window.location.origin } })
        if (error) throw error
        toast.success('MAGIC LINK SENT! CHECK INBOX.')
        onClose(); return
      }
      if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({ email, password })
        if (error) throw error
        toast.success('ACCOUNT CREATED! CHECK EMAIL.')
        onClose(); return
      }
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error
      toast.success('WELCOME BACK OPERATOR!')
      onClose()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'AUTHENTICATION FAILED.')
    } finally { setLoading(false) }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto" onClick={onClose}>
      <div className="w-full max-w-md bg-surface-container border-2 border-primary shadow-[10px_10px_0px_0px_rgba(221,183,255,0.4)]" onClick={(e) => e.stopPropagation()}>
        {/* Title bar */}
        <div className="bg-surface-container-high border-b-2 border-primary px-4 py-2 flex items-center justify-between font-label-sm text-label-sm text-primary">
          <span className="flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">key</span>
            AUTH_TERMINAL.EXE
          </span>
          <button onClick={onClose} className="retro-button w-5 h-5 bg-primary text-on-primary flex items-center justify-center font-bold text-xs hover:bg-secondary hover:text-on-secondary transition-colors">✕</button>
        </div>

        <div className="p-6 md:p-8 flex flex-col gap-6">
          {/* Logo + heading */}
          <div className="text-center flex flex-col items-center">
            <div className="w-14 h-14 bg-primary-container/20 border-2 border-primary flex items-center justify-center text-primary mb-3">
              <span className="material-symbols-outlined text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>cloud</span>
            </div>
            <h2 className="font-headline-md text-headline-md font-bold text-primary uppercase tracking-wider">
              {mode === 'signup' ? 'CREATE ACCOUNT' : mode === 'magic' ? 'MAGIC LINK' : 'WELCOME BACK'}
            </h2>
            <p className="font-label-sm text-label-sm text-on-surface-variant mt-1">
              {mode === 'magic' ? 'TRANSMIT ONE-TIME ACCESS LINK' : 'ACCESS FILE DROP SYSTEM'}
            </p>
          </div>

          {/* Mode tabs */}
          <div className="grid grid-cols-3 gap-1 bg-surface p-1 border border-outline-variant">
            {(['signin', 'signup', 'magic'] as Mode[]).map((m) => (
              <button key={m} type="button" onClick={() => setMode(m)}
                className={`py-2 font-label-sm text-label-sm uppercase tracking-wider transition-colors ${mode === m ? 'bg-primary text-on-primary font-bold' : 'text-on-surface-variant hover:text-primary'}`}>
                {m === 'signin' ? 'SIGN IN' : m === 'signup' ? 'SIGN UP' : '✨ MAGIC'}
              </button>
            ))}
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="block text-on-surface-variant font-label-sm text-label-sm mb-1 uppercase">USER EMAIL:</label>
              <input type="email" required placeholder="operator@boxedlinks.net" value={email} onChange={(e) => setEmail(e.target.value)} className="retro-input" />
            </div>
            {mode !== 'magic' && (
              <div>
                <label className="block text-on-surface-variant font-label-sm text-label-sm mb-1 uppercase">PASSWORD:</label>
                <div className="relative">
                  <input type={showPw ? 'text' : 'password'} required minLength={6} placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} className="retro-input pr-10" />
                  <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-primary">
                    <span className="material-symbols-outlined text-base">{showPw ? 'visibility_off' : 'visibility'}</span>
                  </button>
                </div>
              </div>
            )}
            <button type="submit" disabled={loading}
              className="retro-button border-2 border-primary bg-surface text-primary hover:bg-primary hover:text-on-primary shadow-[4px_4px_0px_0px_rgba(221,183,255,1)] py-3 font-label-md text-label-md flex items-center justify-center gap-2 mt-2 w-full uppercase">
              {loading ? (
                <><span className="material-symbols-outlined animate-spin text-base">sync</span>AUTHENTICATING...</>
              ) : (
                <><span className="material-symbols-outlined text-base">login</span>
                {mode === 'magic' ? 'SEND MAGIC LINK' : mode === 'signup' ? 'CREATE ACCOUNT' : 'SIGN IN'}</>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
