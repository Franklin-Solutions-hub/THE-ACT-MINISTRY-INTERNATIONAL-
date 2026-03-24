-- =============================================
-- ACT Church International — Supabase Setup SQL
-- Run this in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/ihridinvohqdrhcnvisy/sql/new
-- =============================================

-- Users table (Admin login)
CREATE TABLE IF NOT EXISTS users (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL
);

-- Settings table (Key-value store for site text)
CREATE TABLE IF NOT EXISTS settings (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  key TEXT UNIQUE NOT NULL,
  value TEXT
);

-- Events table
CREATE TABLE IF NOT EXISTS events (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  title TEXT,
  time TEXT,
  location TEXT,
  icon TEXT,
  description TEXT
);

-- Ministries table
CREATE TABLE IF NOT EXISTS ministries (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  title TEXT,
  description TEXT,
  icon TEXT
);

-- Gallery table
CREATE TABLE IF NOT EXISTS gallery (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  image_url TEXT,
  caption TEXT
);

-- Sermons table
CREATE TABLE IF NOT EXISTS sermons (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  title TEXT,
  description TEXT,
  video_url TEXT
);

-- Messages table (Contact form)
CREATE TABLE IF NOT EXISTS messages (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name TEXT,
  email TEXT,
  message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- IMPORTANT: Disable Row Level Security (RLS) 
-- so the app can read/write without auth tokens.
-- =============================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE ministries ENABLE ROW LEVEL SECURITY;
ALTER TABLE gallery ENABLE ROW LEVEL SECURITY;
ALTER TABLE sermons ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Create policies to allow full access via the anon key
CREATE POLICY "Allow all on users" ON users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on settings" ON settings FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on events" ON events FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on ministries" ON ministries FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on gallery" ON gallery FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on sermons" ON sermons FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on messages" ON messages FOR ALL USING (true) WITH CHECK (true);
