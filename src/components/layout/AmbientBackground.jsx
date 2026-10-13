export default function AmbientBackground() {
  return (
    <div className="floating-bg" aria-hidden="true">
      {/* Soft purple-to-white radial glows */}
      <div className="absolute -top-32 -left-32 w-[38rem] h-[38rem] rounded-full bg-purple-300/25 blur-3xl animate-float-slow" />
      <div className="absolute top-1/4 -right-36 w-[32rem] h-[32rem] rounded-full bg-violet-400/20 blur-3xl animate-float-delayed" />
      <div className="absolute -bottom-40 left-1/3 w-[36rem] h-[36rem] rounded-full bg-fuchsia-300/15 blur-3xl animate-float-medium" />

      {/* Sleek minimal-edge floating geometric surfaces (crisp 6px radius) */}
      <div className="hidden md:block absolute top-[16%] left-[5%] w-16 h-16 neu-raised-sm !rounded-[6px] rotate-6 animate-float-slow" />
      <div className="hidden md:block absolute top-[65%] left-[3%] w-12 h-12 neu-inset !rounded-[6px] -rotate-12 animate-float-medium" />
      <div className="hidden md:block absolute top-[22%] right-[6%] w-14 h-14 neu-raised-sm !rounded-[6px] rotate-12 animate-float-delayed" />
      <div className="hidden md:block absolute bottom-[18%] right-[8%] w-20 h-20 neu-inset !rounded-[6px] -rotate-6 animate-float-slow" />
    </div>
  )
}
