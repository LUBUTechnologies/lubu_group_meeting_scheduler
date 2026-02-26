-- Run this in the Supabase SQL Editor for your project

CREATE TABLE meetings (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  title       text        NOT NULL,
  description text,
  meeting_url text,
  dates       date[]      NOT NULL,
  start_time  time        NOT NULL,
  end_time    time        NOT NULL,
  created_at  timestamptz DEFAULT now()
);

CREATE TABLE availability (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id       uuid        NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
  participant_name text        NOT NULL,
  slots            jsonb       NOT NULL DEFAULT '[]'::jsonb,
  created_at       timestamptz DEFAULT now(),
  CONSTRAINT uq_meeting_participant UNIQUE (meeting_id, participant_name)
);

CREATE INDEX idx_availability_meeting_id ON availability(meeting_id);

-- Row Level Security
ALTER TABLE meetings     ENABLE ROW LEVEL SECURITY;
ALTER TABLE availability ENABLE ROW LEVEL SECURITY;

CREATE POLICY "meetings_select_public"      ON meetings     FOR SELECT USING (true);
CREATE POLICY "meetings_insert_public"      ON meetings     FOR INSERT WITH CHECK (true);
CREATE POLICY "availability_select_public"  ON availability FOR SELECT USING (true);
CREATE POLICY "availability_insert_public"  ON availability FOR INSERT WITH CHECK (true);
CREATE POLICY "availability_update_public"  ON availability FOR UPDATE USING (true) WITH CHECK (true);
