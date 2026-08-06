-- Product photos live in a private bucket; the storefront reads them through
-- signed URLs generated server-side, so no public bucket is required.
CREATE POLICY "Admins manage product images"
ON storage.objects FOR ALL TO authenticated
USING (bucket_id = 'product-images' AND public.has_role(auth.uid(), 'admin'))
WITH CHECK (bucket_id = 'product-images' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Signed-in users can read product images"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'product-images');