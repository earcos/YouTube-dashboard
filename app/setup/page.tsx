import { Film, ExternalLink, AlertCircle } from "lucide-react";
import Link from "next/link";

export default async function SetupPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="flex w-full max-w-md flex-col items-center gap-6 rounded-xl border border-border bg-card p-8">
        <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary">
          <Film className="h-7 w-7 text-primary-foreground" />
        </div>

        <div className="text-center">
          <h1 className="text-xl font-semibold text-card-foreground">
            Connect YouTube Channel
          </h1>
          <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
            Authorize access to your YouTube account to fetch video analytics, view counts,
            watch time, and more.
          </p>
        </div>

        {error && (
          <div className="flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            {error === "no_code"
              ? "Authorization was cancelled. Please try again."
              : "Authentication failed. Please try again."}
          </div>
        )}

        <div className="flex w-full flex-col gap-3">
          <a
            href="/api/auth/connect"
            className="flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Connect YouTube Account
            <ExternalLink className="h-4 w-4" />
          </a>
          <Link
            href="/"
            className="flex items-center justify-center rounded-md border border-border px-4 py-2.5 text-sm font-medium text-card-foreground hover:bg-accent transition-colors"
          >
            Back to Dashboard
          </Link>
        </div>

        <div className="rounded-md bg-muted p-3 text-xs text-muted-foreground leading-relaxed">
          <p className="font-medium text-foreground mb-1">Required scopes:</p>
          <ul className="list-inside list-disc space-y-0.5">
            <li>YouTube Data API (read-only) - video metadata & statistics</li>
            <li>YouTube Analytics API (read-only) - watch time & performance data</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
