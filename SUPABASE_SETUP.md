# Supabase Setup Guide

## Step 1: Environment Variables

Create a `.env.local` file in your project root:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

## Step 2: Create Database Tables

Drop any existing configuration if it exists:
```sql

/* ------------------------------------------------------------------
   1. Drop objects that depend on profiles
------------------------------------------------------------------ */
-- Triggers on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Triggers on profiles
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;

-- Policies
DROP POLICY IF EXISTS "Users can view own profile"   ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON profiles;

-- Functions
DROP FUNCTION IF EXISTS public.handle_new_user ();
DROP FUNCTION IF EXISTS public.update_updated_at_column ();  -- same name as below

/* ------------------------------------------------------------------
   2. Drop the table itself
------------------------------------------------------------------ */
DROP TABLE IF EXISTS profiles CASCADE;  -- CASCADE removes leftover deps

```

Run this SQL in your Supabase SQL Editor:

```sql
-- Create profiles table
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT,
  email TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- More permissive insert policy for profile creation
CREATE POLICY "Enable insert for authenticated users" ON profiles
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc'::text, NOW());
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_profiles_updated_at 
  BEFORE UPDATE ON profiles 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Optional: Function to handle new user profile creation automatically
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Optional: Trigger to automatically create profile on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

## Step 3: Configure Google OAuth

### 3.1: Create Google Cloud Project
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable the **Google+ API** (if not already enabled)

### 3.2: Create OAuth Credentials
1. Go to **APIs & Services > Credentials**
2. Click **Create Credentials > OAuth 2.0 Client IDs**
3. Select **Web application**
4. Add these **Authorized redirect URIs**:
   - Development: `https://your-project-ref.supabase.co/auth/v1/callback`
   - Production: `https://your-production-domain.com/auth/v1/callback`

### 3.3: Configure in Supabase
1. Go to **Authentication > Providers** in Supabase
2. Enable **Google**
3. Add your **Client ID** and **Client Secret** from Google Cloud Console

## Step 4: Configure Auth Settings

1. Go to **Authentication > Settings** in Supabase
2. Configure these settings:
   - **Site URL**: `http://localhost:3000` (for development)
   - **Redirect URLs**: Add your production domain when ready
     - Development: `http://localhost:3000/auth/callback`
     - Production: `https://your-domain.com/auth/callback`
   - **Email confirmations**: Enable if desired
   - **Sign up**: Enable

## Step 5: Test the Setup

1. Start your development server: `npm run dev`
2. Try the different authentication methods:
   - Email/password signup
   - Google OAuth
3. Check the **Authentication > Users** tab in Supabase
4. Verify the profile was created in **Table Editor > profiles**

## Fixing RLS Policy Issues

If you're getting "row-level security policy" errors, run this SQL to fix it:

```sql
-- Drop the old restrictive policy
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;

-- Create the new permissive policy
CREATE POLICY "Enable insert for authenticated users" ON profiles
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- Optional: Add the automatic profile creation trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

## Google OAuth Notes

### Setup Requirements:
- Google Cloud Console project
- OAuth 2.0 credentials configured
- Proper redirect URLs in both Google and Supabase

### User Experience:
1. User clicks "Continue with Google"
2. Redirects to Google for consent
3. Returns to your app automatically
4. Profile created with Google data

### Development vs Production:
- **Development**: Use `localhost:3000` URLs
- **Production**: Update all URLs to your domain
- **Redirect URLs**: Must match exactly in all configs