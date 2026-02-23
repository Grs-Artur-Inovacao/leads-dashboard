-- Migration: Add theme_color to updates_feed
-- Description: Adds a customizable theme color for cards in the Novidades section
ALTER TABLE dashboard_config.updates_feed
ADD COLUMN IF NOT EXISTS theme_color TEXT DEFAULT 'blue';
-- Add check constraint for supported colors
ALTER TABLE dashboard_config.updates_feed
ADD CONSTRAINT check_theme_color CHECK (
        theme_color IN ('blue', 'orange', 'green', 'purple')
    );
-- Comment on column
COMMENT ON COLUMN dashboard_config.updates_feed.theme_color IS 'Cores suportadas: blue, orange, green, purple';