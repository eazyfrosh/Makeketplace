import {
  Landmark,
  Plane,
  Truck,
  LayoutTemplate,
  Sparkles,
  Palette,
  LayoutGrid,
  Code2,
  type LucideIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";

const ICONS: Record<string, LucideIcon> = {
  banking: Landmark,
  airline: Plane,
  logistics: Truck,
  website: LayoutTemplate,
  ai: Sparkles,
  graphic: Palette,
  templates: LayoutGrid,
  custom: Code2,
};

const GRADIENTS: Record<string, string> = {
  banking: "from-emerald-400/30 via-teal-400/20 to-cyan-500/30",
  airline: "from-sky-400/30 via-blue-500/20 to-indigo-500/30",
  logistics: "from-amber-400/30 via-orange-500/20 to-rose-500/30",
  website: "from-violet-400/30 via-fuchsia-500/20 to-pink-500/30",
  ai: "from-indigo-400/30 via-purple-500/20 to-cyan-400/30",
  graphic: "from-pink-400/30 via-rose-500/20 to-orange-400/30",
  templates: "from-cyan-400/30 via-sky-500/20 to-blue-500/30",
  custom: "from-slate-400/30 via-indigo-500/20 to-violet-500/30",
};

interface ServiceVisualProps {
  variant: string;
  className?: string;
  chrome?: boolean;
  label?: string;
}

export function ServiceVisual({ variant, className, chrome = true, label }: ServiceVisualProps) {
  const key = variant.split("-")[0];
  const Icon = ICONS[key] ?? Sparkles;
  const gradient = GRADIENTS[key] ?? GRADIENTS.ai;

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border border-white/10 bg-[#0c0c14]",
        className,
      )}
    >
      <div className={cn("absolute inset-0 bg-gradient-to-br", gradient)} />
      <div
        className="absolute inset-0 opacity-[0.15] [background-size:24px_24px]"
        style={{
          backgroundImage:
            "linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)",
        }}
      />
      <div className="absolute -top-16 -right-16 size-56 rounded-full bg-white/10 blur-3xl animate-glow" />
      <div className="absolute -bottom-20 -left-10 size-64 rounded-full bg-white/5 blur-3xl" />

      {chrome && (
        <div className="relative flex items-center gap-1.5 border-b border-white/10 bg-black/20 px-4 py-2.5 backdrop-blur-sm">
          <span className="size-2.5 rounded-full bg-red-400/70" />
          <span className="size-2.5 rounded-full bg-yellow-400/70" />
          <span className="size-2.5 rounded-full bg-green-400/70" />
          {label && (
            <span className="ml-3 truncate text-[11px] text-white/40">{label}</span>
          )}
        </div>
      )}

      <div className="relative flex flex-1 items-center justify-center p-10">
        <div className="flex size-20 items-center justify-center rounded-2xl bg-white/10 shadow-2xl backdrop-blur-md ring-1 ring-white/20">
          <Icon className="size-10 text-white" strokeWidth={1.5} />
        </div>
      </div>
    </div>
  );
}
