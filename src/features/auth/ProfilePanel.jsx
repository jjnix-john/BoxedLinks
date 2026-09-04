export default function ProfilePanel({ user, onSignOut, onClose }) {
  const joined = new Date(user.created_at ?? '').toLocaleDateString()

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto" onClick={onClose}>
      <div className="w-full max-w-sm bg-surface-container border-2 border-primary shadow-[10px_10px_0px_0px_var(--color-primary)]" onClick={(event) => event.stopPropagation()}>
        <div className="bg-surface-container-high border-b-2 border-primary px-4 py-2 flex items-center justify-between font-label-sm text-label-sm text-primary">
          <span className="flex items-center gap-2">
            <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>person</span>
            OPERATOR_PROFILE.DAT
          </span>
          <button onClick={onClose} className="retro-button w-5 h-5 bg-primary text-on-primary flex items-center justify-center font-bold text-xs hover:bg-secondary hover:text-on-secondary transition-colors">✕</button>
        </div>
        <div className="p-6 flex flex-col gap-5">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-primary-container/20 border-2 border-primary flex items-center justify-center text-primary">
              <span className="material-symbols-outlined text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>account_circle</span>
            </div>
            <div>
              <div className="font-headline-md text-sm text-primary font-bold uppercase">{user.email?.split('@')[0]}</div>
              <div className="font-label-sm text-label-sm text-on-surface-variant">{user.email}</div>
              <div className="font-label-sm text-[10px] text-on-surface-variant/50 mt-1">JOINED: {joined}</div>
            </div>
          </div>
          <div className="border border-outline-variant divide-y divide-outline-variant font-label-sm text-label-sm">
            <div className="flex justify-between px-3 py-2"><span className="text-on-surface-variant/60">USER ID</span><span className="text-primary font-bold truncate max-w-[180px]">{user.id.slice(0, 16)}…</span></div>
            <div className="flex justify-between px-3 py-2"><span className="text-on-surface-variant/60">PROVIDER</span><span className="text-primary font-bold uppercase">{user.app_metadata?.provider ?? 'EMAIL'}</span></div>
            <div className="flex justify-between px-3 py-2"><span className="text-on-surface-variant/60">STATUS</span><span className="text-secondary font-bold">● ONLINE</span></div>
          </div>
          <button onClick={() => { onSignOut(); onClose() }} className="retro-button border-2 border-error bg-surface text-error hover:bg-error hover:text-on-error shadow-[4px_4px_0px_0px_var(--color-error)] py-2.5 text-label-sm font-label-sm flex items-center justify-center gap-2 w-full">
            <span className="material-symbols-outlined text-sm">logout</span>SIGN OUT
          </button>
        </div>
      </div>
    </div>
  )
}
