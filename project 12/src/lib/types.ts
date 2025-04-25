export interface Profile {
  id: string;
  email: string;
  access_level_id: string;
  created_at: string;
  updated_at: string;
}

export interface AccessLevel {
  id: string;
  name: string;
  description: string;
  created_at: string;
}