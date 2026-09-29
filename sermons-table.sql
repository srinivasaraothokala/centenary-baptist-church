-- SQL snippet to create the 'sermons' table in Supabase

CREATE TABLE public.sermons (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    speaker TEXT NOT NULL,
    date DATE NOT NULL,
    category TEXT NOT NULL,
    video_url TEXT NOT NULL,
    thumbnail_url TEXT,
    duration TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- If you have Row Level Security (RLS) enabled on your Supabase instance, you might want to allow public read access:
ALTER TABLE public.sermons ENABLE ROW LEVEL SECURITY;

-- Allow public read access (for your frontend website to display sermons)
CREATE POLICY "Allow public read access" ON public.sermons FOR SELECT USING (true);

-- Allow public insert/update/delete (if your admin panel is unprotected or using standard anon key, adjust as per your security model)
CREATE POLICY "Allow anon insert" ON public.sermons FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anon update" ON public.sermons FOR UPDATE USING (true);
CREATE POLICY "Allow anon delete" ON public.sermons FOR DELETE USING (true);
