import { createClient } from '@supabase/supabase-js'

// Ganti teks di bawah ini dengan URL dan Anon Key dari dashboard Supabase kamu
const supabaseUrl = 'https://kmcwxocpvsogusidbajj.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImttY3d4b2NwdnNvZ3VzaWRiYWpqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg4NTk5MjgsImV4cCI6MjA5NDQzNTkyOH0.HTBVfvEjx1mg2enXtcAWbl4PXU4bCI0snwT0nUoS24A'

export const supabase = createClient(supabaseUrl, supabaseKey)