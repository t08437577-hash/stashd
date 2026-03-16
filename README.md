# STASHD v2 — Full Stack Collector Platform

> Track your stash. Show the world.

---

## What's included

| Layer | Tech |
|-------|------|
| Frontend | React 18 + Vite |
| Backend / Database | Supabase (Postgres) |
| Auth | Supabase Auth (email) |
| File Storage | Supabase Storage |
| Deploy | Vercel (recommended) |

---

## Step 1 — Create a Supabase project (free)

1. Go to **https://supabase.com** and sign up (free)
2. Click **New project**
3. Give it a name (e.g. `stashd`), pick a region close to you, set a database password
4. Wait ~2 minutes for it to set up

---

## Step 2 — Run the database schema

1. In your Supabase project, click **SQL Editor** in the left sidebar
2. Click **New query**
3. Open the file `supabase/schema.sql` from this folder
4. Copy the entire contents and paste it into the SQL editor
5. Click **Run** (green button)
6. You should see "Success" — your tables, security rules, and seed data are now set up

---

## Step 3 — Create storage buckets

Still in Supabase:

1. Click **Storage** in the left sidebar
2. Click **New bucket** and create these three buckets:

| Bucket name | Public |
|-------------|--------|
| `item-photos` | ✅ Yes |
| `user-photos` | ✅ Yes |
| `collection-covers` | ✅ Yes |

Make sure each one is set to **Public**.

---

## Step 4 — Get your API keys

1. In Supabase, click **Settings** → **API**
2. Copy:
   - **Project URL** (looks like `https://abcdefgh.supabase.co`)
   - **anon / public key** (long string starting with `eyJ...`)

---

## Step 5 — Set up your environment file

1. In the `stashd` folder, find the file called `.env.example`
2. Make a copy of it and rename the copy to `.env`
3. Open `.env` and fill in your values:

```
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=eyJyour-anon-key-here
```

Save the file.

---

## Step 6 — Deploy to Vercel (easiest, free)

### Option A: Deploy via GitHub (recommended)

1. Create a free account at **https://github.com**
2. Create a new repository (call it `stashd`)
3. Upload all the files in this folder to that repository
4. Go to **https://vercel.com** and sign up (free, use your GitHub account)
5. Click **Add New Project** → select your `stashd` repository
6. Vercel will detect it's a Vite project automatically
7. Before clicking Deploy, click **Environment Variables** and add:
   - `VITE_SUPABASE_URL` → your Supabase project URL
   - `VITE_SUPABASE_ANON_KEY` → your Supabase anon key
8. Click **Deploy**
9. In ~1 minute you get a live URL like `https://stashd-yourname.vercel.app`

### Option B: Deploy via Vercel CLI (if you have Node installed)

```bash
npm install -g vercel
cd stashd
vercel
```

Follow the prompts, add your env vars when asked.

---

## Step 7 — Make yourself an admin

After you sign up in the app for the first time:

1. Go to Supabase → **Table Editor** → `profiles`
2. Find your row (your email will be linked to a user ID)
3. Click the row and set `is_admin` to `true`
4. Save — refresh the app and you'll see the **ADMIN** button

---

## What you can do as admin

### Collections tab
- Create new collections (title, slug, abbreviation, year, description, total items, sort order)
- Edit any existing collection
- Upload a cover photo for each collection
- Toggle published/draft (draft = hidden from users)
- Delete collections

### Items tab
- Select a collection
- Add new items (number + name)
- Edit item name/description
- Upload **multiple photos** per item — Front, Back, Extra
- Delete individual photos
- Delete items

### Users tab
- See all registered users
- Grant or remove admin privileges

### Posts tab (Community Board moderation)
- See every post ever made
- Hide posts (they disappear for users instantly)
- Show hidden posts again

---

## Local development (optional, requires Node.js)

```bash
cd stashd
cp .env.example .env
# fill in .env with your Supabase keys
npm install
npm run dev
```

Open http://localhost:5173

---

## Project structure

```
stashd/
├── index.html
├── vite.config.js
├── package.json
├── .env.example          ← copy to .env and fill in your keys
├── supabase/
│   └── schema.sql        ← run this in Supabase SQL editor
└── src/
    ├── main.jsx           ← entry point
    ├── App.jsx            ← routing, auth, shell
    ├── index.css          ← design tokens + global styles
    ├── lib/
    │   ├── supabase.js    ← Supabase client
    │   └── api.js         ← all database calls
    ├── components/
    │   ├── UI.jsx         ← shared design system components
    │   ├── Icons.jsx      ← SVG icons
    │   ├── AuthScreen.jsx ← sign in / sign up
    │   ├── Onboarding.jsx ← first-time setup
    │   └── QRModal.jsx    ← share QR code
    ├── screens/
    │   ├── HomeScreen.jsx
    │   ├── CollectionScreen.jsx  ← includes ItemModal
    │   ├── TradeScreen.jsx
    │   └── ShowcaseScreen.jsx
    └── admin/
        └── AdminPanel.jsx ← full CMS (collections, items, users, posts)
```

---

## Design system

| Token | Value | Use |
|-------|-------|-----|
| `--bg` | `#0F0E0C` | App background |
| `--bg2` | `#161410` | Card background |
| `--bg3` | `#1E1B17` | Input background |
| `--gold` | `#D4A847` | Primary accent |
| `--rust` | `#C4522A` | Trade / danger |
| `--sage` | `#4E7A62` | Wishlist / success |
| `--font-d` | Playfair Display | Display headings |
| `--font-b` | DM Sans | Body copy |
| `--font-m` | DM Mono | Numbers, codes |

---

## Roadmap

- [ ] Email confirmation redirect URL (set in Supabase Auth → URL Configuration)
- [ ] Real-time trade messaging (Supabase Realtime)
- [ ] Push notifications for new trade matches
- [ ] Custom collections (user-defined sets)
- [ ] iOS/Android shell (Capacitor)
- [ ] Social sharing per item
- [ ] Regional rarity data
