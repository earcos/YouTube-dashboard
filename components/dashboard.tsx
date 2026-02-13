"use client";

import { useState, useCallback } from "react";
import useSWR, { mutate } from "swr";
import { Search, Film, Zap, TrendingUp, Tag, Building2, LayoutGrid } from "lucide-react";
import { StatsCards } from "./stats-cards";
import { SyncStatus } from "./sync-status";
import { VideosTable, type VideoRow } from "./videos-table";
import { AggregationTable, type AggRow } from "./aggregation-table";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

type TabValue = "all" | "longform" | "shorts" | "evergreen" | "topics" | "brands";

const tabs: { value: TabValue; label: string; icon: React.ElementType }[] = [
  { value: "all", label: "All Videos", icon: LayoutGrid },
  { value: "longform", label: "Longform", icon: Film },
  { value: "shorts", label: "Shorts", icon: Zap },
  { value: "evergreen", label: "Evergreen", icon: TrendingUp },
  { value: "topics", label: "Topics", icon: Tag },
  { value: "brands", label: "Brands", icon: Building2 },
];

export function Dashboard() {
  const [activeTab, setActiveTab] = useState<TabValue>("all");
  const [search, setSearch] = useState("");
  const [drillDown, setDrillDown] = useState<{ type: "topic" | "brand"; value: string } | null>(null);

  // Fetch stats
  const { data: statsData, isLoading: statsLoading } = useSWR("/api/stats", fetcher, {
    revalidateOnFocus: false,
  });

  // Build videos URL based on active tab and filters
  const videosUrl = buildVideosUrl(activeTab, search, drillDown);
  const { data: videosData, isLoading: videosLoading } = useSWR(videosUrl, fetcher, {
    revalidateOnFocus: false,
  });

  function buildVideosUrl(
    tab: TabValue,
    searchQuery: string,
    drill: typeof drillDown
  ): string | null {
    if (tab === "topics" && !drill) return null;
    if (tab === "brands" && !drill) return null;

    const params = new URLSearchParams();
    if (tab === "longform") params.set("type", "longform");
    if (tab === "shorts") params.set("type", "short");
    if (tab === "evergreen") params.set("evergreen", "true");
    if (searchQuery) params.set("search", searchQuery);
    if (drill?.type === "topic") params.set("topic", drill.value);
    if (drill?.type === "brand") params.set("brand", drill.value);
    params.set("limit", "200");

    return `/api/videos?${params.toString()}`;
  }

  const handleUpdateField = useCallback(
    async (videoId: string, field: "topic" | "brand", value: string) => {
      await fetch(`/api/videos/${videoId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: value }),
      });
      mutate(videosUrl);
      mutate("/api/stats");
    },
    [videosUrl]
  );

  function handleSyncComplete() {
    mutate("/api/stats");
    mutate(videosUrl);
  }

  function handleTopicClick(value: string) {
    setDrillDown({ type: "topic", value });
    setActiveTab("topics");
  }

  function handleBrandClick(value: string) {
    setDrillDown({ type: "brand", value });
    setActiveTab("brands");
  }

  function handleTabChange(tab: TabValue) {
    setActiveTab(tab);
    setDrillDown(null);
    setSearch("");
  }

  const videos: VideoRow[] = videosData?.videos || [];
  const topics: AggRow[] = statsData?.topics || [];
  const brands: AggRow[] = statsData?.brands || [];

  const topicSuggestions = topics.map((t: AggRow) => t.topic!).filter(Boolean);
  const brandSuggestions = brands.map((b: AggRow) => b.brand!).filter(Boolean);

  const isConnected = statsData?.isConnected || false;
  const overview = statsData?.overview;
  const lastSync = statsData?.lastSync;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-screen-2xl items-center justify-between px-4 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary">
              <Film className="h-4 w-4 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-base font-semibold text-card-foreground leading-tight">
                YouTube Analytics
              </h1>
              <p className="text-xs text-muted-foreground">Channel Dashboard</p>
            </div>
          </div>
          <SyncStatus
            lastSync={lastSync}
            isConnected={isConnected}
            onSyncComplete={handleSyncComplete}
          />
        </div>
      </header>

      <main className="mx-auto max-w-screen-2xl px-4 py-6 sm:px-6">
        <div className="flex flex-col gap-6">
          {/* Stats Cards */}
          {overview && !statsLoading && <StatsCards stats={overview} />}

          {/* Tabs */}
          <div className="flex flex-col gap-4">
            <nav className="flex gap-1 overflow-x-auto border-b border-border pb-px">
              {tabs.map((tab) => (
                <button
                  key={tab.value}
                  onClick={() => handleTabChange(tab.value)}
                  className={`flex items-center gap-1.5 whitespace-nowrap border-b-2 px-3 py-2 text-sm font-medium transition-colors ${
                    activeTab === tab.value
                      ? "border-primary text-primary"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <tab.icon className="h-4 w-4" />
                  {tab.label}
                  {tab.value === "longform" && overview && (
                    <span className="ml-1 rounded-full bg-muted px-1.5 py-px text-[10px] font-normal text-muted-foreground">
                      {overview.longformCount}
                    </span>
                  )}
                  {tab.value === "shorts" && overview && (
                    <span className="ml-1 rounded-full bg-muted px-1.5 py-px text-[10px] font-normal text-muted-foreground">
                      {overview.shortsCount}
                    </span>
                  )}
                </button>
              ))}
            </nav>

            {/* Search (for video tabs) */}
            {(activeTab === "all" || activeTab === "longform" || activeTab === "shorts") && (
              <div className="relative max-w-sm">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search videos..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="h-9 w-full rounded-md border border-input bg-card pl-9 pr-3 text-sm text-card-foreground placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-ring"
                />
              </div>
            )}

            {/* Drill-down breadcrumb */}
            {drillDown && (
              <div className="flex items-center gap-2 text-sm">
                <button
                  onClick={() => setDrillDown(null)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  {drillDown.type === "topic" ? "Topics" : "Brands"}
                </button>
                <span className="text-muted-foreground">/</span>
                <span className="font-medium text-foreground">{drillDown.value}</span>
                <button
                  onClick={() => setDrillDown(null)}
                  className="ml-1 rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground hover:bg-accent"
                >
                  Back
                </button>
              </div>
            )}

            {/* Content */}
            {videosLoading || statsLoading ? (
              <div className="flex items-center justify-center py-20">
                <div className="flex flex-col items-center gap-3">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                  <span className="text-sm text-muted-foreground">Loading data...</span>
                </div>
              </div>
            ) : (
              <>
                {/* Video tables */}
                {(activeTab === "all" ||
                  activeTab === "longform" ||
                  activeTab === "shorts" ||
                  activeTab === "evergreen" ||
                  drillDown) && (
                  <VideosTable
                    videos={videos}
                    onUpdateField={handleUpdateField}
                    topicSuggestions={topicSuggestions}
                    brandSuggestions={brandSuggestions}
                    showEvergreen={activeTab === "evergreen"}
                  />
                )}

                {/* Aggregation tables */}
                {activeTab === "topics" && !drillDown && (
                  <AggregationTable
                    data={topics}
                    labelKey="topic"
                    labelHeader="Topic"
                    onRowClick={handleTopicClick}
                  />
                )}

                {activeTab === "brands" && !drillDown && (
                  <AggregationTable
                    data={brands}
                    labelKey="brand"
                    labelHeader="Brand"
                    onRowClick={handleBrandClick}
                  />
                )}
              </>
            )}

            {/* Empty state when not connected */}
            {!isConnected && !statsLoading && (
              <div className="flex flex-col items-center justify-center gap-4 rounded-lg border border-dashed border-border bg-card py-20">
                <Film className="h-12 w-12 text-muted-foreground" />
                <div className="text-center">
                  <h2 className="text-lg font-semibold text-card-foreground">
                    Connect Your YouTube Channel
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground max-w-md">
                    Click the &quot;Connect YouTube&quot; button above to authorize access to your
                    channel data. We&apos;ll fetch all your videos, analytics, and calculate
                    evergreen scores.
                  </p>
                </div>
                <a
                  href="/api/auth/connect"
                  className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
                >
                  Connect YouTube Account
                </a>
              </div>
            )}

            {/* Video count */}
            {videos.length > 0 && (
              <p className="text-xs text-muted-foreground">
                Showing {videos.length} video{videos.length !== 1 ? "s" : ""}
              </p>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
