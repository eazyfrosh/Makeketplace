import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center gap-2 rounded-2xl border border-dashed border-black/15 p-12 text-center dark:border-white/20",
        className
      )}
    >
      {icon && (
        <span className="mb-1 flex h-12 w-12 items-center justify-center rounded-full bg-black/5 text-foreground/40 dark:bg-white/10">
          {icon}
        </span>
      )}
      <p className="font-medium text-foreground/70">{title}</p>
      {description && <p className="max-w-sm text-sm text-foreground/50">{description}</p>}
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}
