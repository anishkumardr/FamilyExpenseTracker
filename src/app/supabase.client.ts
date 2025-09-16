import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://dtjrthjmwkhxrjlydjkt.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR0anJ0aGptd2toeHJqbHlkamt0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc3NjUwODksImV4cCI6MjA3MzM0MTA4OX0.cSv3rwNGE8LDtYQUZF6VIMFscTgAgGipk9C-DrA7rD0';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
