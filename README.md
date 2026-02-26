# Group Meeting Scheduler

A When2Meet-style tool — create a meeting, share a link, everyone drags their available time slots, and you see a heatmap of when everyone can meet.

---

## Before you start — what you need

- [Node.js](https://nodejs.org) installed (v18 or newer — download the LTS version)
- A free [Supabase](https://supabase.com) account (this is your database, it's free)
- A terminal / command line (Terminal on Mac, or Windows Terminal)

---

## Step 1 — Set up your database (Supabase)

Supabase is a free hosted database. You only need to do this once.

1. Go to **https://supabase.com** and click **Start for free**
2. Sign up with GitHub or email
3. Click **New project**
   - Give it any name (e.g. `meeting-scheduler`)
   - Choose a region close to you
   - Set a database password (save it somewhere, you might need it later)
   - Click **Create new project** and wait ~1 minute for it to provision
4. Once your project is ready, go to the **SQL Editor** tab on the left sidebar
5. Click **New query**
6. Open the file `supabase_schema.sql` from this project folder, copy everything in it, paste it into the SQL editor, and click **Run**
   - You should see "Success. No rows returned" — that means it worked

---

## Step 2 — Get your Supabase credentials

You need two values from your Supabase project:

1. In your Supabase project, click the **Settings** gear icon (bottom of left sidebar)
2. Click **API** under Configuration
3. You'll see two things you need:
   - **Project URL** — looks like `https://abcdefghijk.supabase.co`
   - **anon / public key** — a long string starting with `eyJ...`

Keep this tab open, you'll paste these in the next step.

---

## Step 3 — Connect the app to your database

1. In your project folder, find the file called `.env.example`
2. Make a copy of it and name the copy **`.env.local`** (note the dot at the start)
   - On Mac you can do this in Terminal: `cp .env.example .env.local`
3. Open `.env.local` in any text editor (TextEdit, VS Code, Notepad, etc.)
4. Replace the placeholder values with your real values from Step 2:

```
VITE_SUPABASE_URL=https://abcdefghijk.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6...
```

Save the file. Do not share this file — it contains your database key.

---

## Step 4 — Install dependencies

Open Terminal, navigate to this project folder, and run:

```
npm install
```

This downloads all the packages the app needs. It only takes a minute.

---

## Step 5 — Run it locally

```
npm run dev
```

Open your browser and go to **http://localhost:5173**

You should see the app. Create a meeting, copy the link, open it in another tab — it works fully locally.

To stop the server, press `Ctrl + C` in the terminal.

---

## How to use the app

1. **Create a meeting** — fill in a title, pick dates on the calendar, set a time range (e.g. 9 AM – 5 PM), click Create
2. **Share the link** — copy the URL from the meeting page and send it to everyone who needs to respond
3. **Everyone fills in their availability** — each person enters their name and drags over the time slots they're free
4. **See the results** — click "View results" to see the heatmap. Green = everyone available, amber = some people available

---

## Optional — Host it online (free)

If you want a real public URL so you can share the link with anyone, deploy to Vercel. It's free.

### Step A — Push your code to GitHub

1. Go to **https://github.com** and create a new repository (click the + button → New repository)
2. Name it anything, set it to Private if you prefer, and click Create
3. Follow the instructions GitHub shows you to push your existing code (it'll be something like):
   ```
   git init
   git add .
   git commit -m "initial commit"
   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
   git push -u origin main
   ```

### Step B — Deploy on Vercel

1. Go to **https://vercel.com** and sign up with GitHub
2. Click **Add New Project**
3. Click **Import** next to your GitHub repo
4. On the configuration screen, expand **Environment Variables** and add:
   - `VITE_SUPABASE_URL` → your Supabase project URL
   - `VITE_SUPABASE_ANON_KEY` → your Supabase anon key
5. Click **Deploy**

After ~30 seconds you'll get a free URL like `https://your-app.vercel.app` — that's your live app. Share that URL with anyone and it just works.

Whenever you push changes to GitHub, Vercel automatically redeploys.

---

## Troubleshooting

**"Meeting not found" or blank screen after creating a meeting**
→ Your Supabase credentials in `.env.local` are probably wrong. Double-check Step 2–3. Make sure there are no extra spaces.

**App loads but saving availability shows an error**
→ The SQL from Step 1 might not have run correctly. Go back to Supabase SQL Editor, run the schema again (it's safe to run twice — errors on lines like "already exists" are fine).

**`npm install` fails**
→ Make sure Node.js is installed: run `node --version` in terminal. If nothing shows up, download Node.js from https://nodejs.org (LTS version).

**Can't find `.env.local` in Finder on Mac**
→ Files starting with a dot are hidden by default. Press `Cmd + Shift + .` in Finder to show hidden files.
