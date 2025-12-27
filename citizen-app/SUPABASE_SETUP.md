# EnvironmentTech - Supabase Setup Guide

## 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a free account
2. Create a new project
3. Wait for it to be ready (takes ~2 minutes)

## 2. Get Your API Keys

From your Supabase Dashboard:
- Go to **Settings** → **API**
- Copy the **Project URL** and **anon public** key

## 3. Create .env.local File

Create a `.env.local` file in the `citizen-app` folder:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

# Optional: Google Gemini for AI waste detection
NEXT_PUBLIC_GEMINI_API_KEY=your-gemini-key
```

## 4. Run Database Schema

1. Go to **SQL Editor** in Supabase Dashboard
2. Copy the contents of `supabase/schema.sql`
3. Paste and run it

## 5. Create Storage Bucket

1. Go to **Storage** in Supabase Dashboard
2. Create a new bucket called `report-images`
3. Make it **Public**
4. Add policy: Allow public SELECT, INSERT for authenticated users

## 6. Enable Email Auth

1. Go to **Authentication** → **Providers**
2. Enable **Email** provider
3. (Optional) Disable email confirmation for testing

## 7. Restart Dev Server

```bash
cd citizen-app
npm run dev
```

## Files Created

```
citizen-app/
├── src/
│   ├── lib/
│   │   ├── supabase.ts         # Browser client
│   │   └── supabase-server.ts  # Server client
│   ├── types/
│   │   └── database.ts         # TypeScript types
│   ├── contexts/
│   │   └── AuthContext.tsx     # Auth provider
│   ├── hooks/
│   │   └── useSupabase.ts      # Data hooks
│   └── components/
│       └── Providers.tsx       # App providers
└── supabase/
    └── schema.sql              # Database schema
```
