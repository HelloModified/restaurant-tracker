# Discovery & Discovered

A shared adventure tracker for exploring new restaurants and activities together. Built with Next.js and Supabase.

## Features

✨ **Discovery** (Wishlist)
- Add places you want to visit
- Optional Yelp/Google URLs for research
- Search and share recommendations

🎯 **Discovered** (Visited Places)
- Log detailed visits with who went
- Track what you ordered with prices and ratings
- Rate vibe (1-10), service (1-10), and taste (auto-averaged)
- View all visits and items in a detailed breakdown
- Support for Food (meals) and Fun (activities)

## Quick Start

### Step 1: Set Up Supabase (Database)

1. Go to [supabase.com](https://supabase.com) and sign up (it's free)
2. Click "New Project" and create a project (keep defaults)
3. Wait for it to be created (takes ~2 min)
4. Go to **SQL Editor** (left sidebar) and paste this code:

```sql
CREATE TABLE discovery (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  name TEXT NOT NULL,
  location TEXT,
  type TEXT NOT NULL,
  notes TEXT,
  source TEXT,
  yelp_url TEXT,
  google_url TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE discovered (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  name TEXT NOT NULL,
  location TEXT,
  type TEXT NOT NULL,
  visits JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_discovery_created ON discovery(created_at);
CREATE INDEX idx_discovered_created ON discovered(created_at);

ALTER TABLE discovery ENABLE ROW LEVEL SECURITY;
ALTER TABLE discovered ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all users" ON discovery
  FOR SELECT USING (true);
CREATE POLICY "Enable insert for all users" ON discovery
  FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for all users" ON discovery
  FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Enable delete for all users" ON discovery
  FOR DELETE USING (true);

CREATE POLICY "Enable read access for all users" ON discovered
  FOR SELECT USING (true);
CREATE POLICY "Enable insert for all users" ON discovered
  FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for all users" ON discovered
  FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Enable delete for all users" ON discovered
  FOR DELETE USING (true);
```

Click **"Run"** to create the tables.

5. Go to **Settings** (bottom left) → **API** → Copy your:
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

## How to Use

### Discovery Tab (Wishlist)

1. **Find a new spot**
   - Name and location
   - Type: Food or Fun
   - Why interested?
   - Optional: Paste Yelp or Google URL
2. **Once you visit** — click "Been there!" to move to Discovered
3. **Or delete** if you change your mind

### Discovered Tab (Visited Places)

1. **Click a place** to see detailed breakdown
2. **Log a Visit**
   - When: Date
   - Who: Dan, Nick, Dan & Nick, A Party
   - What Meal: Breakfast, Lunch, Happy Hour, Dinner, Brunch (Food only)
   - What Activity: Text description (Fun only)
   - Price Tier: Cheap, Fair, Expensive
   - Vibe: 1-10 rating
   - Service: 1-10 rating
   - Items Ordered:
     - Name
     - Tag: Food, Drink, Dessert, Activity
     - Price
     - Taste: 1-10 rating (averaged across all items)

### Detailed View

**Left Column: Visits**
- Date, attendees, meal type, price tier
- Aggregated ratings (Vibe, Service)

**Right Column: Items**
- All items ordered across all visits
- Price and taste rating for each
- Item type tags

## Data Structure

### Discovery (Wishlist)
```
{
  id: number,
  name: string,
  location: string,
  type: "Food" | "Fun",
  notes: string,
  source: string (URL),
  created_at: timestamp
}
```

### Discovered (Visited)
```
{
  id: number,
  name: string,
  location: string,
  type: "Food" | "Fun",
  visits: [
    {
      id: string,
      date: string,
      attendees: "Dan" | "Nick" | "Dan & Nick" | "A Party",
      mealType: string,
      priceTier: "Cheap" | "Fair" | "Expensive",
      vibe: number (1-10),
      service: number (1-10),
      items: [
        {
          id: string,
          name: string,
          tag: "Food" | "Drink" | "Dessert" | "Activity",
          price: number,
          tasteRating: number (1-10),
          visitDate: string
        }
      ]
    }
  ],
  created_at: timestamp
}
```

## Local Development

```bash
npm install
cp .env.local.example .env.local
# Add your Supabase credentials to .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Troubleshooting

### "Failed to run sql query"
- If you get "relation already exists" — the table is already created. Skip the SQL step.

### "Missing Supabase environment variables"
- Check that `.env.local` has your credentials
- Restart your dev server: `npm run dev`

### Data not syncing
- Verify Row Level Security policies are enabled (should be in the SQL)
- Check browser console for errors
- Verify Supabase URL and key are correct

## Future Ideas

- Photo uploads for dishes
- Map integration
- Monthly insights and stats
- Recommendation algorithm
- Share specific visits
- Mobile app optimization

---

**Happy exploring! 🎯**
