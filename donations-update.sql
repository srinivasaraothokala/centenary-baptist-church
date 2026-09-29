-- SQL snippet to update the 'donations' table with the new fields for the Give page

ALTER TABLE public.donations
ADD COLUMN IF NOT EXISTS email TEXT,
ADD COLUMN IF NOT EXISTS purpose TEXT DEFAULT 'General Fund';
