export default function InfoModal({ title, children, onClose }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto" onClick={onClose}>
      <div className="w-full max-w-md bg-surface-container border-2 border-secondary shadow-[10px_10px_0px_0px_var(--color-secondary)]" onClick={(event) => event.stopPropagation()}>
        <div className="bg-surface-container-high border-b-2 border-secondary px-4 py-2 flex items-center justify-between font-label-md text-label-sm text-secondary">
          <span>{title}</span>
          <button onClick={onClose} className="retro-button w-5 h-5 bg-secondary text-on-secondary flex items-center justify-center font-bold text-xs hover:bg-primary hover:text-on-primary transition-colors">✕</button>
        </div>
        <div className="p-6 font-label-sm text-label-sm text-on-surface-variant leading-relaxed">{children}</div>
      </div>
    </div>
  )
}
