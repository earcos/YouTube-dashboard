-- YouTube Analytics Dashboard - Database Schema

CREATE TABLE IF NOT EXISTS videos (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  published_at TIMESTAMP WITH TIME ZONE,
  thumbnail_url TEXT,
  duration_seconds INTEGER DEFAULT 0,
  is_short BOOLEAN DEFAULT false,
  view_count INTEGER DEFAULT 0,
  like_count INTEGER DEFAULT 0,
  comment_count INTEGER DEFAULT 0,
  estimated_minutes_watched REAL DEFAULT 0,
  average_view_duration REAL DEFAULT 0,
  topic TEXT,
  brand TEXT,
  topic_auto BOOLEAN DEFAULT true,
  brand_auto BOOLEAN DEFAULT true,
  evergreen_score REAL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sync_log (
  id SERIAL PRIMARY KEY,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  finished_at TIMESTAMP WITH TIME ZONE,
  videos_synced INTEGER DEFAULT 0,
  status TEXT DEFAULT 'running',
  error_message TEXT
);

CREATE TABLE IF NOT EXISTS oauth_tokens (
  id INTEGER PRIMARY KEY DEFAULT 1,
  access_token TEXT,
  refresh_token TEXT,
  expiry_date BIGINT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_videos_view_count ON videos(view_count DESC);
CREATE INDEX IF NOT EXISTS idx_videos_evergreen_score ON videos(evergreen_score DESC);
CREATE INDEX IF NOT EXISTS idx_videos_published_at ON videos(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_videos_is_short ON videos(is_short);
CREATE INDEX IF NOT EXISTS idx_videos_topic ON videos(topic);
CREATE INDEX IF NOT EXISTS idx_videos_brand ON videos(brand);
