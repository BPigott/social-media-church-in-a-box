-- Migration to optimize RLS policies and add missing indexes
-- Based on Supabase advisor recommendations

-- ============================================================================
-- 1. Add missing foreign key indexes for better query performance
-- ============================================================================

-- Index for churches.owner_id foreign key
CREATE INDEX IF NOT EXISTS idx_churches_owner_id ON public.churches(owner_id);

-- Index for sermon_transcripts.uploaded_by foreign key
CREATE INDEX IF NOT EXISTS idx_sermon_transcripts_uploaded_by ON public.sermon_transcripts(uploaded_by);

-- ============================================================================
-- 2. Drop existing RLS policies (we'll recreate them optimized)
-- ============================================================================

-- Drop churches policies
DROP POLICY IF EXISTS "Users can view churches they belong to" ON public.churches;
DROP POLICY IF EXISTS "Church owners can update their churches" ON public.churches;
DROP POLICY IF EXISTS "Authenticated users can create churches" ON public.churches;
DROP POLICY IF EXISTS "Church owners can delete their churches" ON public.churches;

-- Drop user_roles policies
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Church owners can manage user roles" ON public.user_roles;

-- Drop style_guides policies
DROP POLICY IF EXISTS "Users can view style guides for their churches" ON public.style_guides;
DROP POLICY IF EXISTS "Admins and owners can manage style guides" ON public.style_guides;

-- Drop sermon_transcripts policies
DROP POLICY IF EXISTS "Users can view sermon transcripts for their churches" ON public.sermon_transcripts;
DROP POLICY IF EXISTS "Editors and above can create sermon transcripts" ON public.sermon_transcripts;
DROP POLICY IF EXISTS "Admins and owners can delete sermon transcripts" ON public.sermon_transcripts;

-- Drop generated_content policies
DROP POLICY IF EXISTS "Users can view generated content for their churches" ON public.generated_content;
DROP POLICY IF EXISTS "Editors and above can create generated content" ON public.generated_content;
DROP POLICY IF EXISTS "Admins and owners can delete generated content" ON public.generated_content;

-- ============================================================================
-- 3. Recreate RLS policies with optimized auth.uid() calls
--    Using (select auth.uid()) instead of auth.uid() for better performance
-- ============================================================================

-- Churches table policies
CREATE POLICY "Users can view churches they belong to"
  ON public.churches FOR SELECT
  TO authenticated
  USING (
    id IN (SELECT church_id FROM public.user_roles WHERE user_id = (select auth.uid()))
    OR owner_id = (select auth.uid())
  );

CREATE POLICY "Church owners can update their churches"
  ON public.churches FOR UPDATE
  TO authenticated
  USING (owner_id = (select auth.uid()))
  WITH CHECK (owner_id = (select auth.uid()));

CREATE POLICY "Authenticated users can create churches"
  ON public.churches FOR INSERT
  TO authenticated
  WITH CHECK (owner_id = (select auth.uid()));

CREATE POLICY "Church owners can delete their churches"
  ON public.churches FOR DELETE
  TO authenticated
  USING (owner_id = (select auth.uid()));

-- User_roles table policies (combined for better performance)
-- Combined SELECT policy: Users can view their own roles OR church owners can view all roles for their churches
CREATE POLICY "Users can view their roles or manage church roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (
    user_id = (select auth.uid())
    OR public.user_owns_church((select auth.uid()), church_id)
  );

-- Church owners can manage (INSERT, UPDATE, DELETE) user roles
-- Note: SELECT is already covered by the combined policy above
CREATE POLICY "Church owners can insert user roles"
  ON public.user_roles FOR INSERT
  TO authenticated
  WITH CHECK (
    public.user_owns_church((select auth.uid()), church_id)
  );

CREATE POLICY "Church owners can update user roles"
  ON public.user_roles FOR UPDATE
  TO authenticated
  USING (
    public.user_owns_church((select auth.uid()), church_id)
  )
  WITH CHECK (
    public.user_owns_church((select auth.uid()), church_id)
  );

CREATE POLICY "Church owners can delete user roles"
  ON public.user_roles FOR DELETE
  TO authenticated
  USING (
    public.user_owns_church((select auth.uid()), church_id)
  );

-- Style_guides table policies (combined for better performance)
-- Combined SELECT policy: Users can view if they belong to church OR are admin/owner
CREATE POLICY "Users can view style guides for their churches or manage as admin/owner"
  ON public.style_guides FOR SELECT
  TO authenticated
  USING (
    church_id IN (SELECT church_id FROM public.user_roles WHERE user_id = (select auth.uid()))
    OR public.has_role((select auth.uid()), church_id, 'owner')
    OR public.has_role((select auth.uid()), church_id, 'admin')
  );

CREATE POLICY "Admins and owners can manage style guides"
  ON public.style_guides FOR ALL
  TO authenticated
  USING (
    public.has_role((select auth.uid()), church_id, 'owner')
    OR public.has_role((select auth.uid()), church_id, 'admin')
  )
  WITH CHECK (
    public.has_role((select auth.uid()), church_id, 'owner')
    OR public.has_role((select auth.uid()), church_id, 'admin')
  );

-- Sermon_transcripts table policies
CREATE POLICY "Users can view sermon transcripts for their churches"
  ON public.sermon_transcripts FOR SELECT
  TO authenticated
  USING (
    church_id IN (SELECT church_id FROM public.user_roles WHERE user_id = (select auth.uid()))
  );

CREATE POLICY "Editors and above can create sermon transcripts"
  ON public.sermon_transcripts FOR INSERT
  TO authenticated
  WITH CHECK (
    public.has_role((select auth.uid()), church_id, 'owner')
    OR public.has_role((select auth.uid()), church_id, 'admin')
    OR public.has_role((select auth.uid()), church_id, 'editor')
  );

CREATE POLICY "Admins and owners can delete sermon transcripts"
  ON public.sermon_transcripts FOR DELETE
  TO authenticated
  USING (
    public.has_role((select auth.uid()), church_id, 'owner')
    OR public.has_role((select auth.uid()), church_id, 'admin')
  );

-- Generated_content table policies
CREATE POLICY "Users can view generated content for their churches"
  ON public.generated_content FOR SELECT
  TO authenticated
  USING (
    church_id IN (SELECT church_id FROM public.user_roles WHERE user_id = (select auth.uid()))
  );

CREATE POLICY "Editors and above can create generated content"
  ON public.generated_content FOR INSERT
  TO authenticated
  WITH CHECK (
    public.has_role((select auth.uid()), church_id, 'owner')
    OR public.has_role((select auth.uid()), church_id, 'admin')
    OR public.has_role((select auth.uid()), church_id, 'editor')
  );

CREATE POLICY "Admins and owners can delete generated content"
  ON public.generated_content FOR DELETE
  TO authenticated
  USING (
    public.has_role((select auth.uid()), church_id, 'owner')
    OR public.has_role((select auth.uid()), church_id, 'admin')
  );

