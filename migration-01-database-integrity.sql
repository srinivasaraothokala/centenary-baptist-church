-- Migration: Add updated_at timestamps to existing tables for database integrity

-- 1. Sermons
ALTER TABLE public.sermons 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE;

-- 2. Ministries
ALTER TABLE public.ministries 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE;

-- 3. Leadership
ALTER TABLE public.leadership 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE;

-- 4. Campus
ALTER TABLE public.campus 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE;

-- 5. Events (if exists)
DO $$ 
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'events') THEN
    ALTER TABLE public.events ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE;
  END IF;
END $$;

-- 6. Gallery (if exists)
DO $$ 
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'gallery') THEN
    ALTER TABLE public.gallery ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE;
  END IF;
END $$;

-- 7. Donations (if exists)
DO $$ 
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'donations') THEN
    ALTER TABLE public.donations ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE;
  END IF;
END $$;

-- 8. Indexes for sorting/filtering
CREATE INDEX IF NOT EXISTS idx_sermons_date ON public.sermons(date DESC);
CREATE INDEX IF NOT EXISTS idx_gallery_created_at ON public.gallery(created_at DESC);

-- Note: We are not adding triggers because the current application architecture handles timestamp updates manually or relies on created_at for simple CMS sorting. If automatic tracking is required, a trigger function must be created and attached to each table.
