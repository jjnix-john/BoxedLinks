/**
 * Material Symbols Rounded icon helper.
 * Rounded glyphs pair naturally with the soft neumorphic shapes.
 */
export default function Icon({ name, fill = false, className = '', style, ...rest }) {
  return (
    <span
      aria-hidden="true"
      className={`material-symbols-rounded select-none leading-none ${className}`}
      style={{ fontVariationSettings: `'FILL' ${fill ? 1 : 0}, 'wght' 500`, ...style }}
      {...rest}
    >
      {name}
    </span>
  )
}
