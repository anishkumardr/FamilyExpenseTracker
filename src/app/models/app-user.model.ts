export interface AppUser {
  id: string;           // UUID
  email: string;
  full_name: string;
  family_id: string;
  role: string;         // e.g., admin, member
  username?: string | null;
  status: string;       // e.g., online, offline
  created_at?: string;
  last_updated?: string;
}
