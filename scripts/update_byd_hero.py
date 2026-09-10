from pathlib import Path

path = Path("src/components/support-sites/support-site-preview.tsx")
text = path.read_text()
old = '<section className="relative overflow-hidden bg-[#111827] px-6 py-24 text-white lg:px-16"><div className="absolute inset-0 bg-[radial-gradient(circle_at_75%_30%,#e6001240,transparent_45%)]" /><div className="relative max-w-3xl"><p className="text-sm font-semibold uppercase tracking-[0.25em] text-red-400">EazyTool Global</p><h1 className="mt-5 text-5xl font-semibold tracking-tight md:text-7xl">{site.heroTitle}</h1><p className="mt-6 max-w-xl text-lg text-white/70">{site.heroSubtitle}</p></div></section>'
new = '<section className="relative isolate overflow-hidden px-6 py-28 text-white lg:px-16 lg:py-40"><img src="/support-templates/byd-showroom.webp" alt="BYD showroom" className="absolute inset-0 -z-20 size-full object-cover object-center" /><div className="absolute inset-0 -z-10 bg-black/55" /><div className="relative mx-auto max-w-6xl"><p className="text-sm font-semibold uppercase tracking-[0.25em] text-red-300">EazyTool Global</p><h1 className="mt-5 text-5xl font-semibold uppercase tracking-tight md:text-7xl">CONTACT US</h1><p className="mt-6 max-w-2xl text-lg font-medium uppercase tracking-[0.12em] text-white/85">CONNECT WITH US, YOUR SATISFACTION STARTS HERE</p></div></section>'
if old not in text:
    raise SystemExit("BYD hero section not found")
path.write_text(text.replace(old, new, 1))
