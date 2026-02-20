-- View snapshots table for tracking view counts over time
-- Used to calculate true evergreen scores based on actual view velocity

CREATE TABLE IF NOT EXISTS view_snapshots (
  id SERIAL PRIMARY KEY,
  video_id TEXT NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
  view_count INTEGER NOT NULL DEFAULT 0,
  snapshot_date DATE NOT NULL DEFAULT CURRENT_DATE,
  UNIQUE(video_id, snapshot_date)
);

CREATE INDEX IF NOT EXISTS idx_snapshots_video_date ON view_snapshots(video_id, snapshot_date DESC);
CREATE INDEX IF NOT EXISTS idx_snapshots_date ON view_snapshots(snapshot_date);
