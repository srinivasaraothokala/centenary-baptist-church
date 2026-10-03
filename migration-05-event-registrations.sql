-- Migration 05: Event Registrations
-- 1. Add registration_enabled to events table
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS registration_enabled BOOLEAN NOT NULL DEFAULT FALSE;

-- 2. Create event_registrations table
CREATE TABLE IF NOT EXISTS public.event_registrations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id TEXT NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT NOT NULL,
    attendee_count INTEGER NOT NULL DEFAULT 1 CHECK (attendee_count > 0),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Enable RLS on event_registrations
ALTER TABLE public.event_registrations ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies for event_registrations
-- Anyone can insert (register)
CREATE POLICY "Enable insert access for all users on event_registrations" ON public.event_registrations
    FOR INSERT WITH CHECK (true);

-- Only authenticated users (admins) can view
CREATE POLICY "Enable select access for authenticated users on event_registrations" ON public.event_registrations
    FOR SELECT USING (auth.role() = 'authenticated');

-- Only authenticated users (admins) can update/delete
CREATE POLICY "Enable update access for authenticated users on event_registrations" ON public.event_registrations
    FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Enable delete access for authenticated users on event_registrations" ON public.event_registrations
    FOR DELETE USING (auth.role() = 'authenticated');

-- Create an index for faster queries on event_id
CREATE INDEX IF NOT EXISTS idx_event_registrations_event_id ON public.event_registrations(event_id);
