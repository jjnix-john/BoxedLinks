export default function AmbientBackground() {
  return (
    <div className="floating-bg" aria-hidden="true">
      <span className="material-symbols-outlined absolute top-[15%] left-[10%] text-primary/20 text-6xl animate-float-slow" style={{ fontVariationSettings: "'FILL' 1" }}>save</span>
      <span className="material-symbols-outlined absolute top-[40%] right-[15%] text-secondary/20 text-5xl animate-float-medium" style={{ fontVariationSettings: "'FILL' 1" }}>folder</span>
      <span className="material-symbols-outlined absolute bottom-[20%] left-[20%] text-tertiary/20 text-7xl animate-float-delayed" style={{ fontVariationSettings: "'FILL' 1" }}>cloud</span>
      <span className="material-symbols-outlined absolute top-[60%] left-[5%] text-secondary/15 text-4xl animate-float-fast" style={{ fontVariationSettings: "'FILL' 1" }}>mouse</span>
      <span className="material-symbols-outlined absolute bottom-[30%] right-[10%] text-primary/15 text-5xl animate-spin-slow" style={{ fontVariationSettings: "'FILL' 1" }}>cd</span>
      <span className="material-symbols-outlined absolute top-[25%] right-[25%] text-tertiary-container/20 text-4xl animate-float-slow" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
      <div className="absolute top-[75%] right-[40%] w-16 h-16 border-4 border-secondary/10 animate-float-medium rotate-45" />
      <div className="absolute top-[10%] left-[40%] w-12 h-12 border-4 border-primary/10 rounded-full animate-float-delayed" />
    </div>
  )
}
