# Restaurant & Activity Tracker

A collaborative web app for tracking restaurants and activities you want to explore together. Built with Next.js and Supabase.

## Features

- ✨ Add restaurants, cafes, bars, and activities
- 🎯 Log detailed visit information
- 🍽️ Track multiple items ordered with ratings
- ⭐ Rate overall experiences
- 📝 Take notes on atmosphere, recommendations, and more
- 👥 Shared tracker synced in real-time between you both

## Quick Start

### Step 1: Set Up Supabase (Database)

1. Go to [supabase.com](https://supabase.com) and sign up (it's free)
2. Click "New Project" and create a project (keep defaults)
3. Wait for it to be created (takes ~2 min)
4. Go to SQL Editor (left sidebar) and paste this code:

```sql
CREATE TABLE entries (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  location TEXT,
  notes TEXT,
  cuisine TEXT,
  highlights TEXT,
  tips TEXT,
  visits JSONB DEFAULT '[]'::jsonb,
  last_visited TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_entries_created ON entries(created_at);

ALTER TABLE entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all users" ON entries
  FOR SELECT USING (true);

CREATE POLICY "Enable insert for all users" ON entries
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update for all users" ON entries
  FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "Enable delete for all users" ON entries
  FOR DELETE USING (true);
```

Click "Run" to create the table.

5. Go to Settings (bottom left) → API → Copy your:
   - **Project URL** (paste somewhere safe)
   - **Anon Public Key** (paste somewhere safe)

### Step 2: Create GitHub Repository

1. Create a new repository on GitHub (name it `restaurant-tracker`)
2. Clone or download this project folder
3. Open terminal in the project folder and run:

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/restaurant-tracker.git
git push -u origin main
```

### Step 3: Deploy to Vercel

1. Go to [vercel.com](https://vercel.com) and sign up with GitHub
2. Click "New Project"
3. Import your `restaurant-tracker` repository
4. Click through to configure
5. Add Environment Variables:
   - `NEXT_PUBLIC_SUPABASE_URL` = your Supabase URL (from Step 1)
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = your Supabase Anon Key (from Step 1)
6. Click "Deploy"

Done! You'll get a URL like `restaurant-tracker-xyz.vercel.app`

### Step 4: Share with Your Partner

Send them the URL from Step 3. They can visit anytime and see your shared tracker!

## Local Development

To run locally:

```bash
npm install
cp .env.local.example .env.local
# Add your Supabase credentials to .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## How to Use

### Add a Spot
1. Fill in the "Add a new spot" form
2. Choose type (restaurant, café, activity, etc.)
3. Add location and any initial notes
4. Click "Add to list"

### Log a Visit
1. Click "Log a visit" on any card
2. Fill in:
   - **When** you went
   - **Who** you went with
   - **What** you ordered (add multiple items)
   - **Rate** each dish individually
   - **Overall rating** for the experience
   - **Atmosphere notes** (lighting, music, service, etc.)
   - **Price point** estimate
   - **Best part** of the experience
   - **Next time** recommendations
3. Click "Save visit"

### Filter & Sort
- Use category buttons to filter by type
- Sort by newest, most visited, or alphabetically
- Your visit history is shown on each card

## Architecture

```
restaurant-tracker/
├── app/
│   ├── api/              # API routes (if needed)
│   ├── lib/
│   │   └── supabase.ts  # Database client
│   ├── page.tsx         # Main tracker UI
│   ├── page.module.css  # Styling
│   ├── layout.tsx       # Root layout
│   └── globals.css      # Global styles
├── public/              # Static files
├── package.json         # Dependencies
├── next.config.js       # Next.js config
├── tsconfig.json        # TypeScript config
└── README.md           # This file
```

## Data Structure

Each entry has:
- `id` - unique identifier
- `name` - restaurant/activity name
- `type` - category (restaurant, café, bar, activity, other)
- `location` - address or neighborhood
- `notes` - initial thoughts
- `visits` - array of visit logs, each containing:
  - `visitDate` - when you went
  - `items` - what you ordered (name, rating, notes)
  - `overallRating` - experience rating (1-5)
  - `company` - who you went with
  - `atmosphere` - ambiance notes
  - `pricePoint` - $ to $$$$
  - `wouldReturn` - true/false
  - `highlights` - best part
  - `nextTime` - recommendations for next visit

## Troubleshooting

### "Missing Supabase environment variables"
- Check that `.env.local` has your credentials
- Restart your dev server: `npm run dev`

### Data not syncing
- Check that Supabase URL and key are correct
- Verify Row Level Security policies are set (should have been in the SQL)
- Check browser console for errors

### Deployment fails
- Make sure environment variables are set in Vercel settings
- Check Vercel deployment logs
- Verify GitHub repo has all files

## Future Enhancements

- Photo uploads for dishes
- Map integration to show locations
- Sharing visits on social media
- Restaurant recommendations based on ratings
- Monthly statistics and insights
- Mobile app version

## Support

For issues, check:
1. Browser console (F12) for error messages
2. Vercel deployment logs
3. Supabase console for data validation

---

**Happy exploring! 🍽️✨**
