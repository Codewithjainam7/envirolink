-- Function to safely increment points and report counts
-- Run this in Supabase SQL Editor

CREATE OR REPLACE FUNCTION increment_points(
  row_id uuid,
  points_to_add int
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE profiles
  SET 
    points = COALESCE(points, 0) + points_to_add,
    reports_submitted = COALESCE(reports_submitted, 0) + 1
  WHERE id = row_id;
END;
$$;
