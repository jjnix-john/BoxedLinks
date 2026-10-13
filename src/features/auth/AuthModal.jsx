import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import { supabase } from '../../lib/services/supabase'
import Icon from '../../components/ui/Icon'

/**
 * Translate raw Supabase auth errors into actionable messages.
 */
function describeAuthError(err) {
  const raw = (err && typeof err === 'object' && 'message' in err ? String(err.message) : String(err ?? '')).trim()
  const m = raw.toLowerCase()

  if (m.includes('error sending confirmation email') || m.includes('error sending magic link') || m.includes('sending email')) {
    return {
      kind: 'smtp',
      message:
        "We couldn't send the email right now. The project's email service is either not configured or rate-limited in Supabase (Authentication → Emails / SMTP).",
    }
  }
  if (m.includes('email not confirmed')) {
    return { kind: 'unconfirmed', message: 'Your email is not confirmed yet. Check your inbox for the confirmation link, or resend it below.' }
  }
  if (m.includes('invalid login credentials')) {
    return { kind: 'credentials', message: 'Incorrect email or password. If you just registered, please verify your email first.' }
  }
  if (m.includes('user already registered') || m.includes('already been registered')) {
    return { kind: 'exists', message: 'An account with this email already exists. Try signing in instead.' }
  }
  if (m.includes('rate limit') || m.includes('too many') || m.includes('security purposes')) {
    return { kind: 'rate', message: 'Too many attempts. Please wait a minute and try again.' }
  }
  if (m.includes('signups not allowed') || m.includes('signup is disabled')) {
    return { kind: 'disabled', message: 'New sign-ups are currently disabled for this project.' }
  }
  if (m.includes('failed to fetch') || m.includes('networkerror') || m.includes('load failed')) {
    return { kind: 'network', message: 'Could not reach the server. Check your connection and VITE_SUPABASE_URL in .env.' }
  }
  if (m.includes('invalid api key') || m.includes('no api key')) {
    return { kind: 'config', message: 'Invalid Supabase API key. Check VITE_SUPABASE_ANON_KEY in your .env and restart the dev server.' }
  }
  return { kind: 'unknown', message: raw || 'Authentication failed. Please try again.' }
}

export default function AuthModal({ initialMode = 'signin', onClose }) {
  const [mode, setMode] = useState(initialMode) // 'signin' | 'signup' | 'forgot' | 'reset'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)
  const [notice, setNotice] = useState(null)
  const [awaitingConfirm, setAwaitingConfirm] = useState(false)
  const [resetSent, setResetSent] = useState(false)

  useEffect(() => {
    if (initialMode) setMode(initialMode)
  }, [initialMode])

  const redirectTo = typeof window !== 'undefined' ? window.location.origin : undefined

  const switchMode = (m) => {
    setMode(m)
    setNotice(null)
    setResetSent(false)
    setAwaitingConfirm(false)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setNotice(null)

    try {
      if (mode === 'signup') {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: { emailRedirectTo: redirectTo },
        })
        if (error) throw error

        if (data.session) {
          toast.success('Account created — welcome!')
          onClose()
          return
        }
        if (data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
          setNotice({ tone: 'error', kind: 'exists', message: 'An account with this email already exists. Try signing in instead.' })
          return
        }
        setAwaitingConfirm(true)
        return
      }

      if (mode === 'forgot') {
        const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
          redirectTo: redirectTo,
        })
        if (error) throw error
        setResetSent(true)
        toast.success('Password reset link sent!')
        return
      }

      if (mode === 'reset') {
        if (password !== confirmPassword) {
          setNotice({ tone: 'error', message: 'Passwords do not match. Please verify both fields.' })
          return
        }
        const { error } = await supabase.auth.updateUser({ password })
        if (error) throw error
        toast.success('Password updated successfully!')
        onClose()
        return
      }

      // Default: 'signin'
      const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
      if (error) throw error
      toast.success('Welcome back!')
      onClose()
    } catch (err) {
      console.error('[BoxedLinks] auth error:', err)
      const { message, kind } = describeAuthError(err)
      setNotice({ tone: 'error', message, kind })
    } finally {
      setLoading(false)
    }
  }

  const handleResendSignup = async () => {
    if (!email) return
    setResending(true)
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email.trim(),
        options: { emailRedirectTo: redirectTo },
      })
      if (error) throw error
      setNotice({ tone: 'success', message: `Confirmation email re-sent to ${email.trim()}.` })
    } catch (err) {
      const { message, kind } = describeAuthError(err)
      setNotice({ tone: 'error', message, kind })
    } finally {
      setResending(false)
    }
  }

  const handleResendReset = async () => {
    if (!email) return
    setResending(true)
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: redirectTo,
      })
      if (error) throw error
      setNotice({ tone: 'success', message: `Password reset link re-sent to ${email.trim()}.` })
    } catch (err) {
      const { message, kind } = describeAuthError(err)
      setNotice({ tone: 'error', message, kind })
    } finally {
      setResending(false)
    }
  }

  const toneStyles = {
    error:   { icon: 'error',        color: 'text-rose-600' },
    info:    { icon: 'info',         color: 'text-blue-600' },
    success: { icon: 'check_circle', color: 'text-teal-600' },
  }

  return (
    <div className="neu-backdrop" onClick={onClose}>
      <div
        className="neu-modal neu-raised-lg w-full max-w-md p-7 md:p-9 relative !rounded-[8px] border border-purple-200/60"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-title"
      >
        <button id="auth-close" onClick={onClose} className="neu-icon-btn absolute top-5 right-5" aria-label="Close">
          <Icon name="close" className="text-xl" />
        </button>

        {/* ── Screen: Awaiting Email Confirmation (Sign Up) ── */}
        {awaitingConfirm ? (
          <div className="flex flex-col items-center text-center gap-5 pt-2">
            <div className="neu-well w-20 h-20 !rounded-[8px] border border-purple-200">
              <div className="neu-well-inset w-14 h-14 !rounded-[6px] text-teal-600">
                <Icon name="mark_email_unread" fill className="text-3xl" />
              </div>
            </div>
            <div>
              <h2 id="auth-title" className="text-2xl font-bold text-purple-950 font-[family-name:var(--font-display)]">Check your inbox</h2>
              <p className="text-sm text-purple-900/80 mt-2 leading-relaxed font-medium">
                We sent a confirmation link to <span className="font-bold text-purple-950">{email}</span>.<br />
                Click it to activate your account, then sign in.
              </p>
            </div>
            {notice && (
              <div className="neu-notice w-full text-left !rounded-[6px]">
                <Icon name={toneStyles[notice.tone].icon} fill className={`text-lg ${toneStyles[notice.tone].color}`} />
                <span className="text-purple-950 font-medium">{notice.message}</span>
              </div>
            )}
            <div className="grid grid-cols-2 gap-4 w-full mt-2">
              <button id="auth-resend" onClick={handleResendSignup} disabled={resending} className="neu-btn py-3 text-sm !rounded-xl font-bold">
                <Icon name={resending ? 'progress_activity' : 'forward_to_inbox'} className={`text-lg ${resending ? 'animate-spin' : ''}`} />
                Resend
              </button>
              <button id="auth-goto-signin" onClick={() => { setAwaitingConfirm(false); switchMode('signin') }} className="neu-btn-accent py-3 text-sm !rounded-xl">
                <Icon name="login" className="text-lg" />Sign in
              </button>
            </div>
          </div>
        ) : resetSent ? (
          /* ── Screen: Password Reset Dispatched ── */
          <div className="flex flex-col items-center text-center gap-5 pt-2">
            <div className="neu-well w-20 h-20 !rounded-[8px] border border-purple-200">
              <div className="neu-well-inset w-14 h-14 !rounded-[6px] text-purple-600">
                <Icon name="mark_email_read" fill className="text-3xl" />
              </div>
            </div>
            <div>
              <h2 id="auth-title" className="text-2xl font-bold text-purple-950 font-[family-name:var(--font-display)]">Reset link sent</h2>
              <p className="text-sm text-purple-900/80 mt-2 leading-relaxed font-medium">
                We dispatched a password recovery link to <span className="font-bold text-purple-950">{email}</span>.<br />
                Follow the link in your email to choose a new password.
              </p>
            </div>
            {notice && (
              <div className="neu-notice w-full text-left !rounded-[6px]">
                <Icon name={toneStyles[notice.tone].icon} fill className={`text-lg ${toneStyles[notice.tone].color}`} />
                <span className="text-purple-950 font-medium">{notice.message}</span>
              </div>
            )}
            <div className="grid grid-cols-2 gap-4 w-full mt-2">
              <button id="auth-resend-reset" onClick={handleResendReset} disabled={resending} className="neu-btn py-3 text-sm !rounded-xl font-bold">
                <Icon name={resending ? 'progress_activity' : 'forward_to_inbox'} className={`text-lg ${resending ? 'animate-spin' : ''}`} />
                Resend
              </button>
              <button id="auth-back-signin" onClick={() => switchMode('signin')} className="neu-btn-accent py-3 text-sm !rounded-xl">
                <Icon name="login" className="text-lg" />Sign in
              </button>
            </div>
          </div>
        ) : mode === 'reset' ? (
          /* ── Screen: Set New Password ── */
          <div className="flex flex-col gap-6">
            <div className="text-center flex flex-col items-center pt-2">
              <div className="neu-well w-20 h-20 mb-4 !rounded-[8px] border border-purple-200">
                <div className="w-14 h-14 rounded-[6px] bg-accent-grad flex items-center justify-center text-white shadow-md">
                  <Icon name="key" fill className="text-3xl" />
                </div>
              </div>
              <h2 id="auth-title" className="text-2xl font-bold text-purple-950 font-[family-name:var(--font-display)]">
                Create new password
              </h2>
              <p className="text-sm text-purple-900/70 font-medium mt-1">
                Enter and confirm your new secure password.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              <div>
                <label htmlFor="auth-new-password" className="neu-label">New Password</label>
                <div className="relative">
                  <Icon name="lock" className="absolute left-4 top-1/2 -translate-y-1/2 text-purple-400 text-xl pointer-events-none" />
                  <input
                    id="auth-new-password"
                    type={showPw ? 'text' : 'password'}
                    required
                    minLength={6}
                    autoComplete="new-password"
                    placeholder="At least 6 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="neu-input pl-12 pr-12 !rounded-[6px]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(!showPw)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-purple-400 hover:text-purple-700 transition-colors p-1"
                  >
                    <Icon name={showPw ? 'visibility_off' : 'visibility'} className="text-xl" />
                  </button>
                </div>
              </div>

              <div>
                <label htmlFor="auth-confirm-password" className="neu-label">Confirm Password</label>
                <div className="relative">
                  <Icon name="lock_reset" className="absolute left-4 top-1/2 -translate-y-1/2 text-purple-400 text-xl pointer-events-none" />
                  <input
                    id="auth-confirm-password"
                    type={showPw ? 'text' : 'password'}
                    required
                    minLength={6}
                    autoComplete="new-password"
                    placeholder="Repeat your password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="neu-input pl-12 !rounded-[6px]"
                  />
                </div>
              </div>

              {notice && (
                <div className="neu-notice !rounded-[6px]" role="alert">
                  <Icon name={toneStyles[notice.tone].icon} fill className={`text-lg mt-px ${toneStyles[notice.tone].color}`} />
                  <span className="flex-1 text-purple-950 font-medium">{notice.message}</span>
                </div>
              )}

              <button id="auth-submit-reset" type="submit" disabled={loading} className="neu-btn-accent py-3.5 text-base w-full mt-1 !rounded-xl">
                {loading ? (
                  <><Icon name="progress_activity" className="animate-spin text-xl" />Updating password…</>
                ) : (
                  <><Icon name="check" className="text-xl" />Update Password</>
                )}
              </button>
            </form>
          </div>
        ) : mode === 'forgot' ? (
          /* ── Screen: Forgot Password Request ── */
          <div className="flex flex-col gap-6">
            <div className="text-center flex flex-col items-center pt-2">
              <div className="neu-well w-20 h-20 mb-4 !rounded-[8px] border border-purple-200">
                <div className="w-14 h-14 rounded-[6px] bg-accent-grad flex items-center justify-center text-white shadow-md">
                  <Icon name="lock_reset" fill className="text-3xl" />
                </div>
              </div>
              <h2 id="auth-title" className="text-2xl font-bold text-purple-950 font-[family-name:var(--font-display)]">
                Reset your password
              </h2>
              <p className="text-sm text-purple-900/70 font-medium mt-1">
                Enter your account email to receive a recovery link.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              <div>
                <label htmlFor="auth-email-forgot" className="neu-label">Account Email</label>
                <div className="relative">
                  <Icon name="mail" className="absolute left-4 top-1/2 -translate-y-1/2 text-purple-400 text-xl pointer-events-none" />
                  <input
                    id="auth-email-forgot"
                    type="email"
                    required
                    autoComplete="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="neu-input pl-12 !rounded-[6px]"
                  />
                </div>
              </div>

              {notice && (
                <div className="neu-notice !rounded-[6px]" role="alert">
                  <Icon name={toneStyles[notice.tone].icon} fill className={`text-lg mt-px ${toneStyles[notice.tone].color}`} />
                  <span className="flex-1 text-purple-950 font-medium">{notice.message}</span>
                </div>
              )}

              <button id="auth-submit-forgot" type="submit" disabled={loading} className="neu-btn-accent py-3.5 text-base w-full mt-1 !rounded-xl">
                {loading ? (
                  <><Icon name="progress_activity" className="animate-spin text-xl" />Sending reset link…</>
                ) : (
                  <><Icon name="forward_to_inbox" className="text-xl" />Send Reset Link</>
                )}
              </button>

              <div className="text-center mt-2">
                <button
                  type="button"
                  id="auth-back-to-signin-btn"
                  onClick={() => switchMode('signin')}
                  className="text-xs font-bold text-purple-700 hover:text-purple-950 transition-colors inline-flex items-center gap-1"
                >
                  <Icon name="arrow_back" className="text-sm" />Back to Sign in
                </button>
              </div>
            </form>
          </div>
        ) : (
          /* ── Standard Sign In / Sign Up Screen ── */
          <div className="flex flex-col gap-6">
            <div className="text-center flex flex-col items-center pt-2">
              <div className="neu-well w-20 h-20 mb-4 !rounded-[8px] border border-purple-200">
                <div className="w-14 h-14 rounded-[6px] bg-accent-grad flex items-center justify-center text-white shadow-md">
                  <Icon name={mode === 'signup' ? 'person_add' : 'lock_open'} fill className="text-3xl" />
                </div>
              </div>
              <h2 id="auth-title" className="text-2xl font-bold text-purple-950 font-[family-name:var(--font-display)]">
                {mode === 'signup' ? 'Create your account' : 'Welcome back'}
              </h2>
              <p className="text-sm text-purple-900/70 font-medium mt-1">
                {mode === 'signup' ? 'Start dropping files in seconds.' : 'Sign in to manage your drops.'}
              </p>
            </div>

            {/* Mode tabs */}
            <div className="neu-segment grid-cols-2 !rounded-[6px]" role="tablist">
              {['signin', 'signup'].map((m) => (
                <button
                  key={m}
                  id={`auth-tab-${m}`}
                  type="button"
                  role="tab"
                  aria-selected={mode === m}
                  onClick={() => switchMode(m)}
                  className={`neu-segment-item !rounded-[4px] ${mode === m ? 'is-active' : ''}`}
                >
                  {m === 'signin' ? 'Sign in' : 'Sign up'}
                </button>
              ))}
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              <div>
                <label htmlFor="auth-email" className="neu-label">Email</label>
                <div className="relative">
                  <Icon name="mail" className="absolute left-4 top-1/2 -translate-y-1/2 text-purple-400 text-xl pointer-events-none" />
                  <input
                    id="auth-email"
                    type="email"
                    required
                    autoComplete="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="neu-input pl-12 !rounded-[6px]"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="auth-password" className="neu-label">Password</label>
                <div className="relative">
                  <Icon name="key" className="absolute left-4 top-1/2 -translate-y-1/2 text-purple-400 text-xl pointer-events-none" />
                  <input
                    id="auth-password"
                    type={showPw ? 'text' : 'password'}
                    required
                    minLength={6}
                    autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                    placeholder="At least 6 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="neu-input pl-12 pr-12 !rounded-[6px]"
                  />
                  <button
                    type="button"
                    id="auth-toggle-pw"
                    onClick={() => setShowPw(!showPw)}
                    aria-label={showPw ? 'Hide password' : 'Show password'}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-purple-400 hover:text-purple-700 transition-colors p-1"
                  >
                    <Icon name={showPw ? 'visibility_off' : 'visibility'} className="text-xl" />
                  </button>
                </div>
              </div>

              {/* Forgot password link on signin tab */}
              {mode === 'signin' && (
                <div className="flex justify-end -mt-2">
                  <button
                    type="button"
                    id="auth-forgot-link"
                    onClick={() => switchMode('forgot')}
                    className="text-xs font-bold text-purple-700 hover:text-purple-950 hover:underline transition-colors"
                  >
                    Forgot password?
                  </button>
                </div>
              )}

              {notice && (
                <div className="neu-notice !rounded-[6px]" role="alert">
                  <Icon name={toneStyles[notice.tone].icon} fill className={`text-lg mt-px ${toneStyles[notice.tone].color}`} />
                  <div className="flex-1 text-purple-950 font-medium">
                    {notice.message}
                    {notice.kind === 'unconfirmed' && (
                      <button
                        type="button"
                        id="auth-resend-inline"
                        onClick={handleResendSignup}
                        disabled={resending}
                        className="block mt-2 font-bold text-purple-700 hover:underline"
                      >
                        {resending ? 'Sending…' : 'Resend confirmation email'}
                      </button>
                    )}
                    {notice.kind === 'exists' && (
                      <button
                        type="button"
                        onClick={() => switchMode('signin')}
                        className="block mt-2 font-bold text-purple-700 hover:underline"
                      >
                        Go to sign in
                      </button>
                    )}
                  </div>
                </div>
              )}

              <button id="auth-submit" type="submit" disabled={loading} className="neu-btn-accent py-3.5 text-base w-full mt-1 !rounded-xl">
                {loading ? (
                  <><Icon name="progress_activity" className="animate-spin text-xl" />{mode === 'signup' ? 'Creating account…' : 'Signing in…'}</>
                ) : (
                  <><Icon name={mode === 'signup' ? 'rocket_launch' : 'login'} className="text-xl" />{mode === 'signup' ? 'Create account' : 'Sign in'}</>
                )}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  )
}
