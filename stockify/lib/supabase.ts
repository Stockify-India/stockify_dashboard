import { createClient } from "@supabase/supabase-js"

// This is Supabase's publishable anon key: safe to ship in the client bundle,
// read access is enforced by the row-level security policies on each table.
const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://lxvfjsqwtckfhduexwrv.supabase.co"
const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx4dmZqc3F3dGNrZmhkdWV4d3J2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkwOTg5NjgsImV4cCI6MjEwNDY3NDk2OH0.WG3DzOa_hL7pJPGBINKbC6Ar6LmF9vr-6BtsSt-jF5Q"

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
