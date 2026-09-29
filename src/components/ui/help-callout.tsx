import type { ReactNode } from "react";
import { CircleHelp, Info, TriangleAlert } from "lucide-react";

import { cn } from "@/lib/utils";

const icons = { info: Info, help: CircleHelp, warning: TriangleAlert };

export function HelpCallout({
  title,
  children,
  tone = "info",
  className,
}: {
  title: string;
  children: ReactNode;
  tone?: keyof typeof icons;
  className?: string;
}) {
  const Icon = icons[tone];
  return (
    <aside
      className={cn(
        "flex gap-3 rounded-2xl border bg-card/70 p-4 text-sm shadow-sm",
        tone === "warning" && "border-amber-500/30 bg-amber-500/[0.07]",
        className,
      )}
    >
      <Icon
        className={cn(
          "mt-0.5 size-5 shrink-0 text-primary",
          tone === "warning" && "text-amber-600 dark:text-amber-400",
        )}
        aria-hidden="true"
      />
      <div>
        <p className="font-semibold text-foreground">{title}</p>
        <div className="mt-1 leading-6 text-muted-foreground">{children}</div>
      </div>
    </aside>
  );
}
