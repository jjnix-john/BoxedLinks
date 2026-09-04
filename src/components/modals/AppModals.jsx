import AuthModal from '../../features/auth/AuthModal'
import InfoModal from './InfoModal'
import ProfilePanel from '../../features/auth/ProfilePanel'

export default function AppModals({ showAuth, setShowAuth, showProfile, user, handleSignOut, setShowProfile, infoModal, setInfoModal }) {
  return (
    <>
      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
      {showProfile && user && <ProfilePanel user={user} onSignOut={handleSignOut} onClose={() => setShowProfile(false)} />}

      {infoModal === 'howItWorks' && (
        <InfoModal title="HOW_IT_WORKS.TXT" onClose={() => setInfoModal(null)}>
          <ol className="flex flex-col gap-3">
            {[['1.', 'SIGN UP — Create a free account using email or magic link.'], ['2.', 'DROP — Drag & drop any .TXT file into the upload terminal.'], ['3.', 'COPY LINK — Instantly get a shareable link to send to anyone.'], ['4.', 'RECEIVE — Anyone can open and download — no login needed.'], ['5.', 'MANAGE — Delete your drops from the dashboard any time.']].map(([number, text]) => (
              <li key={number} className="flex gap-3"><span className="text-secondary font-bold shrink-0">{number}</span><span>{text}</span></li>
            ))}
          </ol>
          <button onClick={() => { setInfoModal(null); setShowAuth(true) }} className="retro-button border-2 border-secondary bg-surface text-secondary hover:bg-secondary hover:text-on-secondary shadow-[4px_4px_0px_0px_var(--color-secondary)] mt-6 py-2.5 text-label-sm font-label-sm w-full flex items-center justify-center gap-2">
            <span className="material-symbols-outlined text-sm">rocket_launch</span>GET STARTED NOW
          </button>
        </InfoModal>
      )}
      {infoModal === 'credits' && (
        <InfoModal title="CREDITS.TXT" onClose={() => setInfoModal(null)}>
          <ul className="flex flex-col gap-2">
            <li><span className="text-primary">BUILT WITH:</span> React + Vite + JavaScript</li>
            <li><span className="text-primary">STYLING:</span> Tailwind CSS v4 + Space Mono + JetBrains Mono</li>
            <li><span className="text-primary">BACKEND:</span> Supabase Storage + Auth</li>
            <li><span className="text-primary">ICONS:</span> Material Symbols Outlined</li>
            <li><span className="text-primary">DESIGN:</span> 1999-era retro terminal aesthetic</li>
          </ul>
          <p className="mt-4 text-on-surface-variant/40 text-[10px]">© 199X BOXEDLINKS — ALL BYTES RESERVED</p>
        </InfoModal>
      )}
      {infoModal === 'terms' && (
        <InfoModal title="TERMS_OF_SERVICE.TXT" onClose={() => setInfoModal(null)}>
          <ul className="flex flex-col gap-3 text-on-surface-variant/80">
            {['Upload only files you own or have rights to share.', 'BoxedLinks is not responsible for uploaded content.', 'We may remove files that violate these terms.', 'Files may be deleted after 90 days of account inactivity.', 'Do not use for illegal or harmful content.', 'Free tier is limited to 512MB total storage.'].map((text) => <li key={text}>✦ {text}</li>)}
          </ul>
        </InfoModal>
      )}
      {infoModal === 'support' && (
        <InfoModal title="SUPPORT_TERMINAL.EXE" onClose={() => setInfoModal(null)}>
          <p className="mb-4">Reach us through one of the following channels:</p>
          <ul className="flex flex-col gap-3">
            <li><span className="text-secondary">EMAIL:</span><a href="mailto:support@boxedlinks.net" className="ml-2 text-primary hover:underline">support@boxedlinks.net</a></li>
            <li><span className="text-secondary">COMMON ISSUES:</span>
              <ul className="ml-4 mt-2 flex flex-col gap-1 text-on-surface-variant/80">
                <li>• RLS policy error → Set Supabase bucket policies.</li>
                <li>• Upload failing → Ensure file is .TXT under 5MB.</li>
                <li>• File not loading → Check your internet connection.</li>
              </ul>
            </li>
          </ul>
        </InfoModal>
      )}
    </>
  )
}
