import Icon from '../../components/ui/Icon'

export default function ProfilePanel({ user, onSignOut, onClose }) {
  const joined = new Date(user.created_at ?? '').toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
  const handle = user.email?.split('@')[0] ?? 'user'

  const rows = [
    { label: 'User ID', value: `${user.id.slice(0, 12)}…`, icon: 'fingerprint', mono: true },
    { label: 'Provider', value: user.app_metadata?.provider ?? 'email', icon: 'verified_user', capitalize: true },
    { label: 'Status', value: 'Online', icon: 'radio_button_checked', tone: 'text-aqua' },
  ]

  return (
    <div className="neu-backdrop" onClick={onClose}>
      <div className="neu-modal neu-raised-lg w-full max-w-sm p-7 relative" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="profile-title">
        <button id="profile-close" onClick={onClose} className="neu-icon-btn absolute top-5 right-5" aria-label="Close">
          <Icon name="close" className="text-xl" />
        </button>

        <div className="flex flex-col items-center text-center gap-3 pt-2">
          <div className="neu-well w-24 h-24 !rounded-[8px]">
            <div className="w-[4.5rem] h-[4.5rem] rounded-[6px] bg-accent-grad flex items-center justify-center text-white text-3xl font-bold font-[family-name:var(--font-display)] uppercase shadow-md">
              {handle.charAt(0)}
            </div>
          </div>
          <div>
            <h2 id="profile-title" className="text-xl font-bold text-ink capitalize">{handle}</h2>
            <p className="text-sm text-ink-soft">{user.email}</p>
            <span className="neu-pill neu-pill-inset mt-3">
              <Icon name="calendar_today" className="text-sm" />Joined {joined}
            </span>
          </div>
        </div>

        <div className="neu-inset p-2 mt-6 flex flex-col">
          {rows.map((r) => (
            <div key={r.label} className="flex items-center justify-between px-3 py-3 text-sm">
              <span className="flex items-center gap-2 text-ink-faint"><Icon name={r.icon} className="text-lg" />{r.label}</span>
              <span className={`font-semibold ${r.tone ?? 'text-ink'} ${r.mono ? 'font-mono text-xs' : ''} ${r.capitalize ? 'capitalize' : ''}`}>{r.value}</span>
            </div>
          ))}
        </div>

        <button id="profile-signout" onClick={() => { onSignOut(); onClose() }} className="neu-btn neu-btn-danger w-full py-3 mt-6 text-sm">
          <Icon name="logout" className="text-lg" />Sign out
        </button>
      </div>
    </div>
  )
}
