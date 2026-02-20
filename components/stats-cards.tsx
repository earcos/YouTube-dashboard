"use client";

import { formatNumber, formatMinutes } from "@/lib/utils";
import { Eye, ThumbsUp, MessageSquare, Clock, Film, Zap } from "lucide-react";

interface OverviewStats {
  totalVideos: number;
  longformCount: number;
  shortsCount: number;
  totalViews: number;
  totalLikes: number;
  totalComments: number;
  totalWatchTimeMinutes: number;
}

export function StatsCards({ stats }: { stats: OverviewStats }) {
  const cards = [
    {
      label: "Total Views",
      value: formatNumber(stats.totalViews),
      icon: Eye,
      color: "text-primary",
    },
    {
      label: "Watch Time",
      value: formatMinutes(stats.totalWatchTimeMinutes),
      icon: Clock,
      color: "text-emerald-400",
    },
    {
      label: "Total Videos",
      value: stats.totalVideos.toString(),
      icon: Film,
      color: "text-amber-400",
    },
    {
      label: "Longform",
      value: stats.longformCount.toString(),
      icon: Film,
      color: "text-sky-400",
    },
    {
      label: "Shorts",
      value: stats.shortsCount.toString(),
      icon: Zap,
      color: "text-rose-400",
    },
    {
      label: "Total Likes",
      value: formatNumber(stats.totalLikes),
      icon: ThumbsUp,
      color: "text-pink-400",
    },
    {
      label: "Comments",
      value: formatNumber(stats.totalComments),
      icon: MessageSquare,
      color: "text-violet-400",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-7">
      {cards.map((card) => (
        <div
          key={card.label}
          className="flex flex-col gap-1 rounded-lg border border-border bg-card p-3"
        >
          <div className="flex items-center gap-2">
            <card.icon className={`h-4 w-4 ${card.color}`} />
            <span className="text-xs text-muted-foreground">{card.label}</span>
          </div>
          <span className="text-lg font-semibold text-card-foreground font-mono">
            {card.value}
          </span>
        </div>
      ))}
    </div>
  );
}
