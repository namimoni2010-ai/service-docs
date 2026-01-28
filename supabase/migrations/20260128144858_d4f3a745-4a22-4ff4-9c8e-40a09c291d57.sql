-- Allow authenticated users to insert their own role (for initial admin setup)
-- This is necessary for bootstrapping the first admin
CREATE POLICY "Users can insert their own role"
  ON public.user_roles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);