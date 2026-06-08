import Link from "next/link";

export default function Footer() {
  const moonPhases = ["🌑", "🌒", "🌓", "🌔", "🌕", "🌖", "🌗", "🌘", "🌑"];

  return (
    <footer className="w-full bg-[#080808] border-t border-[#F0EFE7]/5 pt-16 pb-8 px-6 mt-auto">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-10 md:gap-6 mb-12">
        {/* Brand Column */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <div className="flex flex-col items-center justify-center leading-none text-[8px] text-[#B8A98F]">
              <span>🌕</span>
              <span>🌗</span>
              <span>🌑</span>
            </div>
            <span className="font-gothic text-lg font-bold tracking-[0.2em] text-[#F0EFE7]">
              MOONZTHRIFT
            </span>
          </div>
          <p className="text-xs text-[#F0EFE7]/60 leading-relaxed max-w-xs mt-2">
            Mystical minimalism meeting raw vintage streetwear couture. Archival clothing curated for high-end Gen-Z thrift culture.
          </p>
          <div className="flex gap-2 mt-2">
            {moonPhases.slice(0, 5).map((moon, index) => (
              <span key={index} className="text-xs text-[#B8A98F]/50 select-none">
                {moon}
              </span>
            ))}
          </div>
        </div>

        {/* Categories Column */}
        <div className="flex flex-col gap-3">
          <h4 className="text-xs font-semibold uppercase tracking-[0.2em] text-[#B8A98F]">Collections</h4>
          <ul className="flex flex-col gap-2 text-xs text-[#F0EFE7]/60">
            <li><Link href="/shop?category=vintage" className="hover:text-[#B8A98F] transition-colors">Vintage Streetwear</Link></li>
            <li><Link href="/shop?category=y2k" className="hover:text-[#B8A98F] transition-colors">Y2K Grunge</Link></li>
            <li><Link href="/shop?category=oversized" className="hover:text-[#B8A98F] transition-colors font-sans">Oversized Fits</Link></li>
            <li><Link href="/shop?category=rare-finds" className="hover:text-[#B8A98F] transition-colors">Rare Archives</Link></li>
          </ul>
        </div>

        {/* Company Column */}
        <div className="flex flex-col gap-3">
          <h4 className="text-xs font-semibold uppercase tracking-[0.2em] text-[#B8A98F]">Brand</h4>
          <ul className="flex flex-col gap-2 text-xs text-[#F0EFE7]/60">
            <li><Link href="/#brand-story" className="hover:text-[#B8A98F] transition-colors">Our Philosophy</Link></li>
            <li><a href="#" className="hover:text-[#B8A98F] transition-colors">Sustainability Care</a></li>
            <li><a href="#" className="hover:text-[#B8A98F] transition-colors">Sizing Guide</a></li>
            <li><a href="#" className="hover:text-[#B8A98F] transition-colors">Shipping & Returns</a></li>
          </ul>
        </div>

        {/* Instagram/Social Column */}
        <div className="flex flex-col gap-3">
          <h4 className="text-xs font-semibold uppercase tracking-[0.2em] text-[#B8A98F]">Connect</h4>
          <ul className="flex flex-col gap-2 text-xs text-[#F0EFE7]/60">
            <li><a href="#" className="hover:text-[#B8A98F] transition-colors">Instagram</a></li>
            <li><a href="#" className="hover:text-[#B8A98F] transition-colors">TikTok</a></li>
            <li><a href="#" className="hover:text-[#B8A98F] transition-colors">Discord Archive</a></li>
            <li><a href="#" className="hover:text-[#B8A98F] transition-colors">Contact Support</a></li>
          </ul>
        </div>
      </div>

      <div className="max-w-7xl mx-auto border-t border-[#F0EFE7]/5 pt-6 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex flex-col gap-2 text-center md:text-left">
          <p className="text-[10px] uppercase tracking-widest text-[#F0EFE7]/40">
            &copy; {new Date().getFullYear()} MOONZTHRIFT. ALL RIGHT RESERVED // DESIGNED FOR THE CELESTIAL
          </p>
          {/* Security Trust Badges */}
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mt-1 opacity-50 hover:opacity-80 transition-opacity">
            <div className="flex items-center gap-1 border border-[#F0EFE7]/10 px-2 py-0.5 rounded text-[8px] uppercase tracking-widest text-[#B8A98F] bg-[#121212] select-none font-mono">
              <span className="text-red-400 font-bold">🛡️</span> McAfee Secure
            </div>
            <div className="flex items-center gap-1 border border-[#F0EFE7]/10 px-2 py-0.5 rounded text-[8px] uppercase tracking-widest text-[#B8A98F] bg-[#121212] select-none font-mono">
              <span className="text-blue-400 font-bold">✓</span> TRUSTe Certified
            </div>
            <div className="flex items-center gap-1 border border-[#F0EFE7]/10 px-2 py-0.5 rounded text-[8px] uppercase tracking-widest text-[#B8A98F] bg-[#121212] select-none font-mono">
              <span className="text-green-400 font-bold">🔒</span> SSL Encrypted
            </div>
            <div className="flex items-center gap-1 border border-[#F0EFE7]/10 px-2 py-0.5 rounded text-[8px] uppercase tracking-widest text-[#B8A98F] bg-[#121212] select-none font-mono">
              <span className="text-indigo-400 font-bold">💳</span> Stripe Partner
            </div>
          </div>
        </div>
        <div className="flex gap-4 text-[10px] uppercase tracking-widest text-[#F0EFE7]/40">
          <a href="#" className="hover:text-[#B8A98F]">Terms</a>
          <a href="#" className="hover:text-[#B8A98F]">Privacy</a>
          <a href="#" className="hover:text-[#B8A98F]">License</a>
        </div>
      </div>
    </footer>
  );
}
