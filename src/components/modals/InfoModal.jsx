import Icon from '../ui/Icon'

export default function InfoModal({ title, icon = 'info', children, onClose }) {
  return (
    <div className="neu-backdrop" onClick={onClose}>
      <div className="neu-modal neu-raised-lg w-full max-w-md p-7 relative" onClick={(event) => event.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="info-title">
        <div className="flex items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="neu-well w-12 h-12 text-accent"><Icon name={icon} fill className="text-2xl" /></div>
            <h2 id="info-title" className="text-xl font-bold text-ink">{title}</h2>
          </div>
          <button id="info-close" onClick={onClose} className="neu-icon-btn" aria-label="Close">
            <Icon name="close" className="text-xl" />
          </button>
        </div>
        <div className="text-sm text-ink-soft leading-relaxed">{children}</div>
      </div>
    </div>
  )
}
