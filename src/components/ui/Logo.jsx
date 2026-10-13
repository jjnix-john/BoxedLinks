import Icon from './Icon'

/** Purple-to-white wordmark with minimal-corner icon well. */
export default function Logo({ className = '' }) {
  return (
    <span className={`inline-flex items-center gap-3 ${className}`}>
      <span className="neu-well w-10 h-10 !rounded-[6px] border border-purple-200/60 bg-white">
        <span className="w-7 h-7 rounded-[4px] bg-accent-grad flex items-center justify-center text-white shadow-sm">
          <Icon name="all_inclusive" className="text-[18px]" style={{ fontVariationSettings: "'wght' 700" }} />
        </span>
      </span>
      <span className="font-[family-name:var(--font-display)] text-xl font-extrabold tracking-tight text-ink">
        Boxed<span className="text-gradient">Links</span>
      </span>
    </span>
  )
}
