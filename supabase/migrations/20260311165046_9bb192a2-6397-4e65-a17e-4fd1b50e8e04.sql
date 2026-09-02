
-- Create floorplans storage bucket (public)
INSERT INTO storage.buckets (id, name, public)
VALUES ('floorplans', 'floorplans', true);

-- Allow public read access
CREATE POLICY "Public read access for floorplans"
ON storage.objects
FOR SELECT
TO anon, authenticated
USING (bucket_id = 'floorplans');
