# Environment Setup Guide

## Required Environment Variables

Your authentication is failing because the Supabase environment variables are not configured. Follow these steps to fix it:

### 1. Create a `.env` file in the root directory

Create a new file called `.env` in the root of your project (same level as `package.json`) with the following content:

```env
# Supabase Configuration
# Get these values from your Supabase project settings -> API
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# React App Configuration (for backward compatibility)
REACT_APP_SUPABASE_URL=https://your-project-id.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# Google Cloud Vision API (Optional)
VITE_GOOGLE_CLOUD_VISION_ENABLED=false
VITE_GOOGLE_CLOUD_VISION_API_KEY=your_google_cloud_vision_api_key_here

# React App Google Vision (for backward compatibility)
REACT_APP_GOOGLE_CLOUD_VISION_ENABLED=false
REACT_APP_GOOGLE_CLOUD_VISION_API_KEY=your_google_cloud_vision_api_key_here
```

### 2. Get Your Supabase Credentials

1. Go to your Supabase dashboard: https://supabase.com/dashboard
2. Select your project
3. Go to **Settings** → **API**
4. Copy the following values:
   - **Project URL** (replace `https://your-project-id.supabase.co`)
   - **Anon public** key (replace `your_supabase_anon_key_here`)

### 3. Update the .env file

Replace the placeholder values in your `.env` file with your actual Supabase credentials:

```env
VITE_SUPABASE_URL=https://xyzabc123.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
REACT_APP_SUPABASE_URL=https://xyzabc123.supabase.co
REACT_APP_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 4. Restart the Development Server

After creating the `.env` file:

```bash
npm run dev
```

### 5. Verify Connection

Check the browser console for messages like:
- ✅ "Supabase connection successful"
- Instead of: "Using MOCK client because config is missing"

## Troubleshooting

### Authentication Settings in Supabase

Make sure your Supabase project has authentication enabled:

1. Go to **Authentication** → **Settings**
2. Ensure **Enable email confirmations** is set appropriately for your needs
3. Check **Site URL** is set to your local development URL (e.g., `http://localhost:5173`)
4. For production, add your production URL to **Redirect URLs**

### Common Issues

1. **Wrong URL format**: Make sure the URL starts with `https://` and ends with `.supabase.co`
2. **Wrong key**: Make sure you're using the **anon public** key, not the service role key
3. **Typos**: Double-check for any extra spaces or typos in the environment variables
4. **File location**: The `.env` file must be in the root directory, not in the `src` folder

## Security Note

- Never commit your `.env` file to version control
- The `.env` file is already included in `.gitignore`
- Only use the **anon public** key in client-side code, never the service role key 