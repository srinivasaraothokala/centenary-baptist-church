-- ============================================================
-- MIGRATION: Performance Indexes
-- Adds indexes to heavily queried and sorted columns
-- to improve public API performance.
-- ============================================================

-- Events are sorted by date
CREATE INDEX IF NOT EXISTS idx_events_date ON public.events (date DESC);

-- Sermons are sorted by date
CREATE INDEX IF NOT EXISTS idx_sermons_date ON public.sermons (date DESC);

-- Gallery is sorted by created_at and often filtered by category
CREATE INDEX IF NOT EXISTS idx_gallery_created_at ON public.gallery (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_gallery_category ON public.gallery (category);

-- Ministries, Campus, Leadership are sorted by sort_order
CREATE INDEX IF NOT EXISTS idx_ministries_sort_order ON public.ministries (sort_order ASC);
CREATE INDEX IF NOT EXISTS idx_campus_sort_order ON public.campus (sort_order ASC);
CREATE INDEX IF NOT EXISTS idx_leadership_order_index ON public.leadership (order_index ASC);
CREATE INDEX IF NOT EXISTS idx_leadership_category ON public.leadership (category);
