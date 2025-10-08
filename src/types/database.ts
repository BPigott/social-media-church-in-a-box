// Database types for Church Social Media Generator

export type AppRole = 'owner' | 'admin' | 'editor' | 'viewer';

export interface Church {
  id: string;
  owner_id: string;
  name: string;
  email: string;
  website_url: string | null;
  location: string;
  denomination: string | null;
  vision_statement: string;
  service_times: ServiceTime[];
  contact_email: string;
  social_handles: SocialHandles;
  key_ministries: string[];
  created_at: string;
  updated_at: string;
}

export interface ServiceTime {
  day: string;
  time: string;
  service_type?: string;
}

export interface SocialHandles {
  facebook?: string;
  instagram?: string;
  twitter?: string;
  tiktok?: string;
  youtube?: string;
}

export interface UserRole {
  id: string;
  user_id: string;
  church_id: string;
  role: AppRole;
  created_at: string;
}

export interface StyleGuide {
  id: string;
  church_id: string;
  guide_content: string;
  sermon_documents: SermonDocument[];
  generated_at: string;
  updated_at: string;
}

export interface SermonDocument {
  file_name: string;
  file_path: string;
  uploaded_at: string;
}

export interface SermonTranscript {
  id: string;
  church_id: string;
  uploaded_by: string | null;
  file_name: string;
  file_path: string;
  transcript_text: string;
  uploaded_at: string;
}

export interface GeneratedContent {
  id: string;
  church_id: string;
  sermon_transcript_id: string;
  platforms: Platform[];
  custom_cta: string | null;
  facebook_post: string[] | null;
  instagram_post: string[] | null;
  tiktok_post: string[] | null;
  twitter_post: string[] | null;
  executive_summary: string;
  generated_at: string;
  posts_per_platform?: number | null;
}

export type Platform = 'facebook' | 'instagram' | 'tiktok' | 'twitter';

// Database function response types
export interface UserChurch {
  church_id: string;
  role: AppRole;
}
