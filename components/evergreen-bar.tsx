"use client";

import { cn } from "@/lib/utils";

export function EvergreenBar({ score }: { score: number }) {
  const clampedScore = Math.max(0, Math.min(100, Math.round(score)));

  let color = "bg-red-500";
  if (clampedScore >= 80) color = "bg-emerald-500";
  else if (clampedScore >= 60) color = "bg-emerald-400";
  else if (clampedScore >= 40) color = "bg-amber-400";
  else if (clampedScore >= 20) color = "bg-orange-400";

  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-16 overflow-hidden rounded-full bg-muted">
        <div
          className={cn("h-full rounded-full transition-all", color)}
          style={{ width: `${clampedScore}%` }}
        />
      </div>
      <span className="text-xs font-mono text-muted-foreground w-7 text-right">
        {clampedScore}
      </span>
    </div>
  );
}
