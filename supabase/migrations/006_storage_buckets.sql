-- Create the storage bucket for listing photos if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('listing-photos', 'listing-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Storage Policies for listing-photos
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
CREATE POLICY "Public Access" ON storage.objects
  FOR SELECT USING (bucket_id = 'listing-photos');

DROP POLICY IF EXISTS "Allow Public Uploads" ON storage.objects;
CREATE POLICY "Allow Public Uploads" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'listing-photos');
