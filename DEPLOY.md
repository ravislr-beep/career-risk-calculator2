# Deployment & Setup Guide (Windows, No Local Deploy) — Junior Developer Friendly (Phase-2)

This guide assumes you will deploy directly from a GitHub repository to Vercel and use Supabase for Auth + Postgres.
Everything below can be done on a Windows machine via browser and GitHub without running the project locally.

## Overview of free services used
- **Supabase (Free tier)** — Auth, Postgres, Storage
- **Vercel (Hobby / Free)** — host Next.js app and serverless functions
No paid services are required. Google OAuth setup is free (Google Cloud Console).

## Pre-steps (accounts)
1. Create accounts (use a browser on Windows):
   - GitHub: https://github.com
   - Supabase: https://supabase.com (create a new project)
   - Vercel: https://vercel.com (login with GitHub is easiest)
   - Google Cloud Console: https://console.cloud.google.com (to create OAuth credentials)

## Step 1 — Push repo to GitHub from Windows (no local code run required)
1. Download the ZIP provided and extract it on your Windows machine (Explorer).
2. Create a new GitHub repository (private or public) via the GitHub website.
3. In the repo page on GitHub, click "Upload files" → drag & drop the extracted project files → Commit changes.
   - Note: Large repos may prefer using Git CLI — but browser upload is fine for this project.

## Step 2 — Create Supabase project & configure Google OAuth
1. Go to https://app.supabase.com and create a new project (choose free tier).
2. In Supabase dashboard -> Settings -> API: copy the **Project URL** and **anon/public** key.
3. In Supabase dashboard -> Authentication -> Providers -> Google: you'll need a Google OAuth Client ID and secret. Follow below to create them in Google Cloud Console:
   - Open https://console.cloud.google.com/apis/credentials
   - Create a new project or use an existing one.
   - Under "OAuth consent screen" configure an External app (provide app name; for testing add your email).
   - Create Credentials -> OAuth client ID -> Web application.
   - For "Authorized redirect URIs" add: `https://<your-project-ref>.supabase.co/auth/v1/callback`
     (replace `<your-project-ref>.supabase.co` with the Supabase project URL host)
   - Copy the Client ID and Client Secret into Supabase Auth -> Providers -> Google.
4. In Supabase -> Authentication -> Settings -> Redirect URLs: add the Vercel domain later after deploy, and also add `http://localhost:3000` if you ever run locally for dev (optional).

## Step 3 — Create DB schema (via Supabase SQL Editor)
1. In Supabase dashboard -> SQL Editor -> New query.
2. Paste contents of `supabase/schema.sql` from the project and Run it. This creates tables: `app_users`, `profiles`, and `weights` with default weights inserted.

## Step 4 — Configure Vercel project (deploy from GitHub)
1. On Vercel dashboard click "New Project" -> Import Git Repository -> choose your uploaded GitHub repo.
2. In Vercel project settings -> Environment Variables, add the following keys (use values from Supabase and your Google setup):
   - `NEXT_PUBLIC_SUPABASE_URL` = Supabase Project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = Supabase anon/public key
   - `SUPABASE_SERVICE_ROLE_KEY` = Supabase service_role key (Supabase -> Settings -> API -> Service Key)
   - `ADMIN_EMAILS` = comma-separated admin email(s) (e.g., your.email@example.com)
3. Deploy the project by clicking "Deploy". Vercel will build the Next.js app using their cloud build; no local Node install required for deployment.
4. After deploy completes, note the Vercel URL (e.g., https://my-app.vercel.app). Add this domain to Supabase -> Authentication -> Settings -> Redirect URLs (for production callback).

## Step 5 — Test Google Login & admin flows
1. Visit your Vercel app URL in browser.
2. Click "Sign in with Google" (top-right). This will redirect to Supabase's OAuth flow and back to your app.
3. After sign-in, the app calls `/api/users` which upserts the user into `app_users` table using the server service role key.
4. To make an account admin: either set your email in `ADMIN_EMAILS` env var in Vercel, or edit the `app_users` row in Supabase dashboard and set `is_admin=true` manually.
5. Visit **Weights** admin page. If you're admin, change weights and press Save — this writes a new row into `weights` and affects subsequent scoring calculations.
6. Create a new profile; the server-side `score` API requires Authentication and will save `user_id` linking to your app user.

## Security notes
- `SUPABASE_SERVICE_ROLE_KEY` is powerful. Only add it to Vercel's Environment Variables (not committed in code).
- Anonymous access is limited; all profile creation requires user to be signed in via Google (server-side token verification is performed).
- For production-grade apps, add RLS policies to protect tables further. For MVP Phase-2, simplicity and zero-cost deployment are prioritized.

## Troubleshooting (Windows common issues)
- If OAuth complains about redirect URI mismatch, ensure the redirect URI configured in Google Cloud exactly matches the Supabase callback URI (`https://<proj>.supabase.co/auth/v1/callback`).
- If sign-in fails, check Supabase project logs (Authentication -> Logs) and Vercel function logs for errors.
- If Vercel build fails due to Node version, set `engines` in `package.json` to `"node": "18.x"` in Vercel project settings or package.json engines field.

## Summary
- No local server run is required on Windows; deploy entirely through GitHub + Vercel UI and configure Supabase + Google OAuth via dashboards.
- The app records signed-in users, supports admin-editable weights, and preserves the Phase-1 explainability and PDF reporting features.



## Phase-2 LLM (Deepseek) configuration

1. In Vercel project settings -> Environment Variables, add:
   - `DEEPSEEK_API_KEY` = (your Deepseek API key) **server-side only**
   - `DEEPSEEK_API_URL` = (Deepseek API URL; e.g., https://api.deepseek.example/v1/generate)

2. Ensure `DEEPSEEK_API_KEY` is marked as "Environment Variable" and **do not** expose it to the browser. Only serverless functions should use it (we call it inside Next.js API routes).

3. The app stores LLM outputs in the `llm_outputs` table for audit and content-retention. This helps with traceability, ability to regenerate narratives, and moderating content later.

4. Cost note: Use Deepseek's free tier or test key if available. If Deepseek charges, ensure you have a free or trial plan — otherwise disable LLM by unsetting `DEEPSEEK_API_KEY` to avoid calls.
