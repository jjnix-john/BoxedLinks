import AuthModal from '../../features/auth/AuthModal'
import InfoModal from './InfoModal'
import ProfilePanel from '../../features/auth/ProfilePanel'
import Icon from '../ui/Icon'
import { MAX_FILE_SIZE_BYTES } from '../../lib/security/fileValidator'

const MAX_MB = MAX_FILE_SIZE_BYTES / (1024 * 1024)

export default function AppModals({ showAuth, setShowAuth, showProfile, user, handleSignOut, setShowProfile, infoModal, setInfoModal }) {
  return (
    <>
      {showAuth && (
        <AuthModal
          initialMode={typeof showAuth === 'string' ? showAuth : 'signin'}
          onClose={() => setShowAuth(false)}
        />
      )}
      {showProfile && user && <ProfilePanel user={user} onSignOut={handleSignOut} onClose={() => setShowProfile(false)} />}

      {infoModal === 'howItWorks' && (
        <InfoModal title="How it works" icon="auto_awesome" onClose={() => setInfoModal(null)}>
          <ol className="flex flex-col gap-3">
            {[
              ['person_add', 'Sign up', 'Create a free account with your email.'],
              ['upload_file', 'Drop', `Drag & drop any supported file up to ${MAX_MB}MB.`],
              ['link', 'Copy link', 'Get a short, shareable link instantly.'],
              ['download', 'Receive', 'Anyone can open and download — no login needed.'],
              ['tune', 'Manage', 'Delete your drops from the dashboard any time.'],
            ].map(([icon, title, text], i) => (
              <li key={title} className="neu-raised-sm flex items-center gap-4 p-3 !rounded-[6px]">
                <div className="neu-well-inset w-10 h-10 !rounded-[4px] text-accent"><Icon name={icon} className="text-xl" /></div>
                <div>
                  <div className="font-semibold text-ink font-[family-name:var(--font-display)]">{i + 1}. {title}</div>
                  <div className="text-ink-soft text-[13px]">{text}</div>
                </div>
              </li>
            ))}
          </ol>
          {!user && (
            <button id="info-get-started" onClick={() => { setInfoModal(null); setShowAuth(true) }} className="neu-btn-accent w-full py-3 mt-6 text-sm">
              <Icon name="rocket_launch" className="text-lg" />Get started now
            </button>
          )}
        </InfoModal>
      )}

      {infoModal === 'credits' && (
        <InfoModal title="Credits" icon="favorite" onClose={() => setInfoModal(null)}>
          <ul className="neu-inset p-2 flex flex-col">
            {[
              ['Built with', 'React + Vite'],
              ['Styling', 'Tailwind CSS v4'],
              ['Backend', 'Supabase Storage + Auth'],
              ['Icons', 'Material Symbols Rounded'],
              ['Design', 'Fresh neumorphism'],
            ].map(([k, v]) => (
              <li key={k} className="flex justify-between px-3 py-2.5">
                <span className="text-ink-faint">{k}</span><span className="font-semibold text-ink">{v}</span>
              </li>
            ))}
          </ul>
          <p className="mt-5 text-center text-xs text-ink-faint">© {new Date().getFullYear()} BoxedLinks</p>
        </InfoModal>
      )}

      {infoModal === 'terms' && (
        <InfoModal title="Terms of service" icon="gavel" onClose={() => setInfoModal(null)}>
          <ul className="flex flex-col gap-3">
            {[
              'Upload only files you own or have rights to share.',
              'BoxedLinks is not responsible for uploaded content.',
              'We may remove files that violate these terms.',
              'Files may be deleted after 90 days of account inactivity.',
              'Do not use for illegal or harmful content.',
              'Free tier is limited to 512MB total storage.',
            ].map((text) => (
              <li key={text} className="flex gap-3 items-start">
                <Icon name="check_circle" fill className="text-aqua text-lg shrink-0" />
                <span>{text}</span>
              </li>
            ))}
          </ul>
        </InfoModal>
      )}

      {infoModal === 'support' && (
        <InfoModal title="Support" icon="support_agent" onClose={() => setInfoModal(null)}>
          <p className="mb-4">Reach us any time — we usually reply within a day.</p>
          <a href="mailto:support@boxedlinks.net" className="neu-btn w-full py-3 text-sm mb-5">
            <Icon name="mail" className="text-lg" />support@boxedlinks.net
          </a>
          <div className="neu-inset p-4">
            <div className="font-semibold text-ink mb-2 font-[family-name:var(--font-display)]">Common issues</div>
            <ul className="flex flex-col gap-1.5 text-[13px]">
              <li>• Can't sign up → the project's email (SMTP) service must be configured.</li>
              <li>• RLS policy error → set your Supabase bucket policies.</li>
              <li>• Upload failing → ensure the file type is allowed and under {MAX_MB}MB.</li>
              <li>• File not loading → check your internet connection.</li>
            </ul>
          </div>
        </InfoModal>
      )}
    </>
  )
}
