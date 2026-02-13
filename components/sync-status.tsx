"use client";

import { useState } from "react";
import { RefreshCw, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";

interface SyncStatusProps {
  lastSync: {
    started_at: string;
    finished_at: string | null;
    videos_synced: number;
    status: string;
    error_message: string | null;
  } | null;
  isConnected: boolean;
  onSyncComplete: () => void;
}

export function SyncStatus({ lastSync, isConnected, onSyncComplete }: SyncStatusProps) {
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSync() {
    if (!isConnected) {
      window.location.href = "/api/auth/connect";
      return;
    }

    setSyncing(true);
    setError(null);

    try {
      const res = await fetch("/api/sync", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      onSyncComplete();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sync failed");
    } finally {
      setSyncing(false);
    }
  }

  return (
    <div className="flex items-center gap-3">
      {lastSync && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {lastSync.status === "success" ? (
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
          ) : lastSync.status === "error" ? (
            <AlertCircle className="h-3.5 w-3.5 text-destructive" />
          ) : null}
          <span>
            Last sync:{" "}
            {new Date(lastSync.started_at).toLocaleString("es-ES", {
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
            {lastSync.videos_synced > 0 && ` (${lastSync.videos_synced} videos)`}
          </span>
        </div>
      )}

      {error && (
        <span className="text-xs text-destructive">{error}</span>
      )}

      <button
        onClick={handleSync}
        disabled={syncing}
        className="flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-1.5 text-xs font-medium text-card-foreground transition-colors hover:bg-accent disabled:opacity-50"
      >
        {syncing ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <RefreshCw className="h-3.5 w-3.5" />
        )}
        {!isConnected ? "Connect YouTube" : syncing ? "Syncing..." : "Sync Now"}
      </button>
    </div>
  );
}
