# Authentication System Setup Guide

This is a complete authentication system with registration and login built with Next.js and Supabase.

## Features
✅ User registration with roll number
✅ Password setting after registration
✅ Secure login with bcrypt password hashing
✅ Supabase database integration
✅ Beautiful UI with Tailwind CSS

## Setup Instructions

### 1. Create a Supabase Account
- Go to [supabase.com](https://supabase.com)
- Sign up or login
- Create a new project

### 2. Create Database Table
Once your Supabase project is created:

1. Go to the **SQL Editor** section
2. Click "New Query"
3. Copy and paste this SQL:

```sql
CREATE TABLE users (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  roll_number VARCHAR(50) UNIQUE NOT NULL,
  password VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_users_roll_number ON users(roll_number);
```

4. Click "Run" to execute

### 3. Get Your Supabase Credentials
- Go to **Settings** → **API** in your Supabase project
- Copy your:
  - **Project URL** (NEXT_PUBLIC_SUPABASE_URL)
  - **Anon Key** (from "anon public" section - NEXT_PUBLIC_SUPABASE_ANON_KEY)

### 4. Update Environment Variables
Update the `.env.local` file in your project root:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Replace with your actual credentials from step 3.

### 5. Run the Project
```bash
npm run dev
```

The app will be available at `http://localhost:3000`

## User Flow

### Registration
1. Click "Register" on the home page
2. Enter your roll number
3. Click "Create Account"
4. Set a password for your account
5. Click "Set Password"
6. Redirected to login page

### Login
1. Click "Login" on the home page
2. Enter your roll number
3. Enter your password
4. Click "Login"
5. Access the dashboard after successful login

## Project Structure

```
app/
  ├── (auth)/
  │   ├── layout.tsx          # Auth pages layout
  │   ├── page.tsx            # Home page with Register/Login options
  │   ├── register/
  │   │   └── page.tsx        # Registration page
  │   └── login/
  │       └── page.tsx        # Login page
  ├── dashboard/
  │   └── page.tsx            # Dashboard after login
  ├── actions/
  │   └── auth.ts             # Server actions for auth
  └── page.tsx                # Main home page
lib/
  └── supabase.ts             # Supabase client configuration
```

## Security Notes
- Passwords are hashed using bcryptjs before storing
- Server actions are used for secure authentication
- Environment variables are properly configured
- Password validation (minimum 6 characters)

## Troubleshooting

### "User not found" error during login
- Make sure you registered the account first
- Check your roll number is spelled correctly

### "Password not set" error
- Complete the password setup step after registration
- You don't need to login again after setting password automatically redirects

### Supabase connection errors
- Verify your .env.local file has correct credentials
- Check your Project URL and Anon Key are from the same Supabase project
- Ensure public access is enabled in Row Level Security (RLS)

## Next Steps
You can enhance this system by adding:
- Email verification
- Password reset functionality
- Session management with tokens
- User profile pages
- Rate limiting
