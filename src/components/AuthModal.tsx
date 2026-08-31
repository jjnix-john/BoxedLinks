import { useState } from 'react'
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
        toast.success('MAGIC LINK SENT! CHECK INBOX.')
        onClose()
        return
      }

      if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({ email, password })
        if (error) throw error
        toast.success('ACCOUNT CREATED! CHECK EMAIL.')
        onClose()
        return
      }

      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error
      toast.success('WELCOME BACK OPERATOR!')
      onClose()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'AUTHENTICATION FAILED.'
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-[#171f33] border-2 border-[#ddb7ff] shadow-[10px_10px_0px_0px_rgba(221,183,255,0.4)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Window title header */}
        <div className="bg-[#222a3d] border-b-2 border-[#ddb7ff] px-4 py-2 flex items-center justify-between font-headline text-xs text-[#ddb7ff]">
          <span className="flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">key</span>
            AUTH_TERMINAL.EXE
          </span>
          <button
            onClick={onClose}
            className="w-5 h-5 bg-[#ddb7ff] text-[#2c0051] flex items-center justify-center font-bold font-mono-code text-xs hover:bg-[#4cd7f6] hover:text-[#001f26] transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="p-6 md:p-8 flex flex-col gap-6">
          <div className="text-center flex flex-col items-center">
            <div className="w-14 h-14 bg-[#b76dff]/20 border-2 border-[#ddb7ff] flex items-center justify-center text-[#ddb7ff] mb-3">
              <span className="material-symbols-outlined text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                cloud
              </span>
            </div>
            <h2 className="font-headline font-bold text-xl text-[#ddb7ff] uppercase tracking-wider">
              {mode === 'signup' ? 'CREATE ACCOUNT' : mode === 'magic' ? 'MAGIC LINK' : 'WELCOME BACK'}
            </h2>
            <p className="font-mono-code text-xs text-[#cfc2d6] mt-1">
              {mode === 'magic' ? 'TRANSMIT ONE-TIME ACCESS LINK' : 'ACCESS FILE DROP SYSTEM'}
            </p>
          </div>

          {/* Mode Switcher */}
          <div className="grid grid-cols-3 gap-1 bg-[#0b1326] p-1 border border-[#4d4354]">
            {(['signin', 'signup', 'magic'] as Mode[]).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMode(m)}
                className={`py-2 text-center font-headline text-[11px] uppercase tracking-wider transition-colors ${
                  mode === m
                    ? 'bg-[#ddb7ff] text-[#2c0051] font-bold'
                    : 'text-[#cfc2d6] hover:text-[#ddb7ff]'
                }`}
              >
                {m === 'signin' ? 'SIGN IN' : m === 'signup' ? 'SIGN UP' : '✨ MAGIC'}
              </button>
            ))}
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-4 font-mono-code text-xs">
            <div>
              <label className="block text-[#cfc2d6] mb-1 font-headline uppercase text-[11px]">
                USER EMAIL:
              </label>
              <input
                type="email"
                required
                placeholder="operator@boxedlinks.net"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="retro-input w-full"
              />
            </div>

            {mode !== 'magic' && (
              <div>
                <label className="block text-[#cfc2d6] mb-1 font-headline uppercase text-[11px]">
                  PASSWORD:
                </label>
                <div className="relative">
                  <input
                    type={showPw ? 'text' : 'password'}
                    required
                    minLength={6}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="retro-input w-full pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(!showPw)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#cfc2d6] hover:text-[#ddb7ff]"
                  >
                    <span className="material-symbols-outlined text-base">
                      {showPw ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="retro-button retro-btn-primary py-3 text-xs flex items-center justify-center gap-2 mt-2 w-full"
            >
              {loading ? (
                <>
                  <span className="material-symbols-outlined animate-spin text-base">sync</span>
                  AUTHENTICATING...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-base">login</span>
                  {mode === 'magic' ? 'SEND MAGIC LINK' : mode === 'signup' ? 'CREATE ACCOUNT' : 'SIGN IN'}
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
