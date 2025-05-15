from supabase import create_client

SUPABASE_URL = "https://mfcoewmpgxaocqsxiguk.supabase.co/storage/v1/s3"
SUPABASE_KEY = "67de8eb193ff0358b6dd44f13f83f1a022c55bccd47289f264640cd9230dd5a6"

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
