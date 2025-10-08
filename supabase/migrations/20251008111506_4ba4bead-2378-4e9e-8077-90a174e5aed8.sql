-- Create app_role enum
CREATE TYPE public.app_role AS ENUM ('owner', 'admin', 'editor', 'viewer');

-- Churches table
CREATE TABLE public.churches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  website_url TEXT,
  location TEXT NOT NULL,
  denomination TEXT,
  vision_statement TEXT NOT NULL,
  service_times JSONB DEFAULT '[]'::jsonb,
  contact_email TEXT NOT NULL,
  social_handles JSONB DEFAULT '{}'::jsonb,
  key_ministries JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- User_roles table (separate from users for security)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  church_id UUID REFERENCES public.churches(id) ON DELETE CASCADE NOT NULL,
  role public.app_role NOT NULL DEFAULT 'viewer',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, church_id)
);

-- Style_guides table (1:1 with churches)
CREATE TABLE public.style_guides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id UUID REFERENCES public.churches(id) ON DELETE CASCADE NOT NULL UNIQUE,
  guide_content TEXT NOT NULL,
  sermon_documents JSONB DEFAULT '[]'::jsonb,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Sermon_transcripts table
CREATE TABLE public.sermon_transcripts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id UUID REFERENCES public.churches(id) ON DELETE CASCADE NOT NULL,
  uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  transcript_text TEXT NOT NULL,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Generated_content table
CREATE TABLE public.generated_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id UUID REFERENCES public.churches(id) ON DELETE CASCADE NOT NULL,
  sermon_transcript_id UUID REFERENCES public.sermon_transcripts(id) ON DELETE CASCADE NOT NULL,
  platforms JSONB NOT NULL DEFAULT '[]'::jsonb,
  custom_cta TEXT,
  facebook_post TEXT,
  instagram_post TEXT,
  tiktok_post TEXT,
  twitter_post TEXT,
  executive_summary TEXT NOT NULL,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for performance
CREATE INDEX idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX idx_user_roles_church_id ON public.user_roles(church_id);
CREATE INDEX idx_sermon_transcripts_church_id ON public.sermon_transcripts(church_id);
CREATE INDEX idx_generated_content_church_id ON public.generated_content(church_id);
CREATE INDEX idx_generated_content_sermon_id ON public.generated_content(sermon_transcript_id);

-- Enable RLS on all tables
ALTER TABLE public.churches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.style_guides ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sermon_transcripts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.generated_content ENABLE ROW LEVEL SECURITY;

-- Security definer function: Check if user has a specific role in a church
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _church_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND church_id = _church_id
      AND role = _role
  );
$$;

-- Security definer function: Get all churches for a user
CREATE OR REPLACE FUNCTION public.get_user_churches(_user_id UUID)
RETURNS TABLE(church_id UUID, role public.app_role)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT church_id, role
  FROM public.user_roles
  WHERE user_id = _user_id;
$$;

-- Security definer function: Check if user owns a church
CREATE OR REPLACE FUNCTION public.user_owns_church(_user_id UUID, _church_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.churches
    WHERE id = _church_id
      AND owner_id = _user_id
  );
$$;

-- RLS Policies for churches table
CREATE POLICY "Users can view churches they belong to"
  ON public.churches FOR SELECT
  TO authenticated
  USING (
    id IN (SELECT church_id FROM public.user_roles WHERE user_id = auth.uid())
    OR owner_id = auth.uid()
  );

CREATE POLICY "Church owners can update their churches"
  ON public.churches FOR UPDATE
  TO authenticated
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Authenticated users can create churches"
  ON public.churches FOR INSERT
  TO authenticated
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Church owners can delete their churches"
  ON public.churches FOR DELETE
  TO authenticated
  USING (owner_id = auth.uid());

-- RLS Policies for user_roles table
CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Church owners can manage user roles"
  ON public.user_roles FOR ALL
  TO authenticated
  USING (
    public.user_owns_church(auth.uid(), church_id)
  )
  WITH CHECK (
    public.user_owns_church(auth.uid(), church_id)
  );

-- RLS Policies for style_guides table
CREATE POLICY "Users can view style guides for their churches"
  ON public.style_guides FOR SELECT
  TO authenticated
  USING (
    church_id IN (SELECT church_id FROM public.user_roles WHERE user_id = auth.uid())
  );

CREATE POLICY "Admins and owners can manage style guides"
  ON public.style_guides FOR ALL
  TO authenticated
  USING (
    public.has_role(auth.uid(), church_id, 'owner')
    OR public.has_role(auth.uid(), church_id, 'admin')
  )
  WITH CHECK (
    public.has_role(auth.uid(), church_id, 'owner')
    OR public.has_role(auth.uid(), church_id, 'admin')
  );

-- RLS Policies for sermon_transcripts table
CREATE POLICY "Users can view sermon transcripts for their churches"
  ON public.sermon_transcripts FOR SELECT
  TO authenticated
  USING (
    church_id IN (SELECT church_id FROM public.user_roles WHERE user_id = auth.uid())
  );

CREATE POLICY "Editors and above can create sermon transcripts"
  ON public.sermon_transcripts FOR INSERT
  TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), church_id, 'owner')
    OR public.has_role(auth.uid(), church_id, 'admin')
    OR public.has_role(auth.uid(), church_id, 'editor')
  );

CREATE POLICY "Admins and owners can delete sermon transcripts"
  ON public.sermon_transcripts FOR DELETE
  TO authenticated
  USING (
    public.has_role(auth.uid(), church_id, 'owner')
    OR public.has_role(auth.uid(), church_id, 'admin')
  );

-- RLS Policies for generated_content table
CREATE POLICY "Users can view generated content for their churches"
  ON public.generated_content FOR SELECT
  TO authenticated
  USING (
    church_id IN (SELECT church_id FROM public.user_roles WHERE user_id = auth.uid())
  );

CREATE POLICY "Editors and above can create generated content"
  ON public.generated_content FOR INSERT
  TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), church_id, 'owner')
    OR public.has_role(auth.uid(), church_id, 'admin')
    OR public.has_role(auth.uid(), church_id, 'editor')
  );

CREATE POLICY "Admins and owners can delete generated content"
  ON public.generated_content FOR DELETE
  TO authenticated
  USING (
    public.has_role(auth.uid(), church_id, 'owner')
    OR public.has_role(auth.uid(), church_id, 'admin')
  );

-- Trigger function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Triggers for updated_at columns
CREATE TRIGGER update_churches_updated_at
  BEFORE UPDATE ON public.churches
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_style_guides_updated_at
  BEFORE UPDATE ON public.style_guides
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();