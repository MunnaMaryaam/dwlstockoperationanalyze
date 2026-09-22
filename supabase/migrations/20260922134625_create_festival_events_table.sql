/*
# Festival & Exhibition Events Tracking Table

## Purpose
Allows the ERP to track festivals, exhibitions, and seasonal events that cause
spikes in sales. When calculating "average monthly sales" for redistribution
analysis, festival-month sales are separated out so the average reflects
*normal* demand — not inflated by Eid, Durga Puja, or exhibition periods.

## 1. New Table

### festival_events
Stores user-defined festival/exhibition periods.
- `id` (uuid, primary key, default gen_random_uuid())
- `name` (text, not null) — e.g. "Eid ul Fitr", "Durga Puja", "Winter Exhibition"
- `event_type` (text, not null) — 'festival' | 'exhibition' | 'seasonal' | 'promotion'
- `start_date` (date, not null) — first day of the event period
- `end_date` (date, not null) — last day of the event period
- `description` (text) — optional notes about the event
- `sales_impact` (text, not null, default 'high') — 'high' | 'medium' | 'low' — how much this event boosts sales
- `affected_branches` (text[]) — optional list of branch codes; null = all branches
- `created_at` (timestamptz, default now())

## 2. Security
- RLS enabled, `TO anon, authenticated` with full CRUD — data is shared among all ERP users.
- Access control is enforced by the server-side auth middleware before the frontend loads.

## 3. Indexes
- Index on `start_date` and `end_date` for querying which events overlap a given period.
- Index on `event_type` for filtering by category.

## 4. Important Notes
1. The analysis engine will check if any festival_events overlap with the uploaded
   data's date range. If they do, the sales for those months are flagged as
   "festival sales" and excluded from the normal monthly average calculation.
2. Safe to re-run (IF NOT EXISTS / DROP POLICY IF EXISTS).
*/

CREATE TABLE IF NOT EXISTS festival_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  event_type text NOT NULL DEFAULT 'festival',
  start_date date NOT NULL,
  end_date date NOT NULL,
  description text,
  sales_impact text NOT NULL DEFAULT 'high',
  affected_branches text[],
  created_at timestamptz DEFAULT now()
);

ALTER TABLE festival_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_festivals" ON festival_events;
CREATE POLICY "anon_select_festivals"
  ON festival_events FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "anon_insert_festivals" ON festival_events;
CREATE POLICY "anon_insert_festivals"
  ON festival_events FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_festivals" ON festival_events;
CREATE POLICY "anon_update_festivals"
  ON festival_events FOR UPDATE
  TO anon, authenticated
  USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_festivals" ON festival_events;
CREATE POLICY "anon_delete_festivals"
  ON festival_events FOR DELETE
  TO anon, authenticated
  USING (true);

CREATE INDEX IF NOT EXISTS idx_festival_start_date ON festival_events(start_date);
CREATE INDEX IF NOT EXISTS idx_festival_end_date ON festival_events(end_date);
CREATE INDEX IF NOT EXISTS idx_festival_type ON festival_events(event_type);
