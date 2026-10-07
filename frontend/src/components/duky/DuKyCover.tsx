// The cover of the reader's own notebook: plain cloth in the colour they chose, a paper label with their name.
// Drawn in CSS (no image), so the colour and the name change instantly. Fills its parent.

export function DuKyCover({ name, color }: { name: string; color: string }) {
  return (
    <div className="duky-cloth absolute inset-0 [container-type:inline-size]" style={{ ["--cloth" as string]: color }}>
      <div className="duky-stitch absolute inset-[4.5%]" />
      <div className="duky-label absolute left-[17%] right-[17%] top-[24%] flex flex-col items-center justify-center py-[5cqw] text-center">
        <p className="m-0 text-[max(12px,2.4cqw)] tracking-[min(0.4em,1cqw)] text-[#8a4b2a]/80">SỔ TAY</p>
        <p className="font-display m-0 text-[max(16px,10cqw)] leading-none text-[#27354f]">Du Ký</p>
        <p className="font-hand m-0 mt-[1.5cqw] max-w-[90%] truncate text-[max(12px,5cqw)] leading-tight text-[#1f3a78]">
          {name ? `của ${name}` : "của con"}
        </p>
      </div>
      {/* a small embroidered knot, the thread Bà handed on */}
      <svg viewBox="0 0 40 40" className="absolute bottom-[12%] left-1/2 w-[12%] -translate-x-1/2 opacity-80" aria-hidden>
        <circle cx="20" cy="20" r="11" fill="none" stroke="#D9A43B" strokeWidth="1.6" strokeDasharray="3 2" />
        <path d="M9 20 C 15 12, 25 28, 31 20" fill="none" stroke="#D9A43B" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
      {/* the spine: cloth folding round the boards */}
      <div className="absolute inset-y-0 left-0 w-[5%] bg-gradient-to-r from-black/35 to-transparent" />
    </div>
  );
}
