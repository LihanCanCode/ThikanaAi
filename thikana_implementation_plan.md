# 🏠 Thikana — Implementation Plan
### AI-Native Bilingual Rental Marketplace for Bangladesh
**Team:** IUT_TwinCoder | **Hackathon:** Mindsparks 2026 | CodeFront Challenge

---

## 📌 Executive Summary

Thikana solves a real, documented problem (84% of students use Facebook for housing, 71% encounter fake listings) with a production-grade tech stack. The hackathon judges will evaluate on: **innovation, feasibility, real-world impact, and effective AI use**. Our strategy is to build a visually polished, fully functional MVP that demonstrates all four pillars live — not a mockup.

---

## 🎯 MVP Scope (Hackathon Submission Target)

> The MVP must be deployable, demonstrable, and impressive in a live demo. We ship a narrower but **fully working** product over a wide but broken one.

### ✅ MVP Features (Build These First)

| Priority | Feature | Category | Why MVP |
|---|---|---|---|
| 🔴 P0 | User Auth (Student / Landlord roles) | Foundation | Gates everything |
| 🔴 P0 | Landlord: Post listing with structured form | Landlord Tools | Core supply side |
| 🔴 P0 | AI Bilingual Listing Generator | AI Core | WOW factor #1 |
| 🔴 P0 | Listing browse/search (standard filters) | Discovery | Core demand side |
| 🔴 P0 | Natural Language Search (NL → filters) | AI Core | WOW factor #2 |
| 🔴 P0 | Map View with university distance | Discovery | Differentiator |
| 🟠 P1 | AI Trust Score (0–100) per listing | Discovery | Trust signal |
| 🟠 P1 | Student Finance Toolkit (rent split, bill split, budget) | Smart Finance | Student-specific |
| 🟠 P1 | Landlord Payment Ledger (paid/unpaid) | Landlord Tools | Supply-side value |
| 🟠 P1 | Neighborhood Q&A (Gemini RAG) | AI Core | WOW factor #3 |
| 🟡 P2 | Smart Match Alerts | Discovery | Nice to have |
| 🟡 P2 | Flatmate Matchmaking | Discovery | Nice to have |
| 🟡 P2 | Photo Quality Scorer | AI Core | Nice to have |
| 🟡 P2 | Earnings Report / Tenant Roster | Landlord Tools | Nice to have |

### ❌ Post-Hackathon Only
- bKash/Nagad payment processing
- SMS reminder automation
- Market trend analytics (needs real data)
- Student ID verification

---

## 🛠️ Tech Stack

```
┌─────────────────────────────────────────────────────────┐
│                    FRONTEND                              │
│  Next.js 14 (App Router) + TypeScript                   │
│  Tailwind CSS (mobile-first)                            │
│  Shadcn/ui components                                   │
│  Leaflet.js (maps, lightweight)                         │
│  Mapbox GL JS (geocoding + distance API)                │
└─────────────────────────────────────────────────────────┘
           │ API Routes / Server Actions / Edge Functions
┌─────────────────────────────────────────────────────────┐
│                  BACKEND / AI                           │
│  Supabase (Auth + PostgreSQL + Storage + Edge Fn)       │
│  Google Gemini API (gemini-1.5-flash for speed)         │
│  Mapbox Geocoding API                                   │
└─────────────────────────────────────────────────────────┘
           │
┌─────────────────────────────────────────────────────────┐
│                  DEPLOYMENT                             │
│  Vercel (Frontend + API Routes — free tier OK)          │
│  Supabase Cloud (free tier: 500MB DB, 1GB storage)      │
│  Domain: thikana.vercel.app or custom domain            │
└─────────────────────────────────────────────────────────┘
```

---

## 🗄️ Database Schema (Supabase PostgreSQL)

### Tables

```sql
-- User profiles (extends Supabase auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  role TEXT CHECK (role IN ('student', 'landlord', 'professional')) NOT NULL,
  full_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  university TEXT,           -- for students
  monthly_budget INTEGER,    -- for students (BDT)
  verified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Listings (core table)
CREATE TABLE listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  landlord_id UUID REFERENCES profiles(id),
  title_en TEXT NOT NULL,
  title_bn TEXT,
  description_en TEXT,
  description_bn TEXT,       -- AI generated
  area TEXT NOT NULL,        -- e.g. "Mirpur-2"
  address TEXT,
  lat NUMERIC(10,7),
  lng NUMERIC(10,7),
  rent_bdt INTEGER NOT NULL,
  rooms INTEGER DEFAULT 1,
  bathrooms INTEGER DEFAULT 1,
  floor INTEGER,
  furnishing TEXT CHECK (furnishing IN ('unfurnished','semi','fully')),
  type TEXT CHECK (type IN ('student','family','professional')),
  for_gender TEXT CHECK (for_gender IN ('male','female','any')),
  utilities_included BOOLEAN DEFAULT false,
  photos TEXT[],             -- Supabase storage URLs
  is_available BOOLEAN DEFAULT true,
  trust_score INTEGER,       -- 0-100, computed by AI layer
  trust_score_breakdown JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- University reference table (for distance calculation)
CREATE TABLE universities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  short_name TEXT,           -- IUT, DUET, DIU
  lat NUMERIC(10,7) NOT NULL,
  lng NUMERIC(10,7) NOT NULL
);

-- Tenant-Listing interest/bookmarks
CREATE TABLE saved_listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  listing_id UUID REFERENCES listings(id),
  saved_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, listing_id)
);

-- Landlord payment ledger
CREATE TABLE tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  landlord_id UUID REFERENCES profiles(id),
  listing_id UUID REFERENCES listings(id),
  tenant_name TEXT NOT NULL,
  tenant_phone TEXT,
  room_label TEXT,           -- e.g. "Room 2B"
  monthly_rent INTEGER NOT NULL,
  move_in_date DATE,
  is_active BOOLEAN DEFAULT true
);

CREATE TABLE rent_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id),
  month DATE NOT NULL,       -- first day of month
  amount INTEGER NOT NULL,
  paid_on DATE,
  status TEXT CHECK (status IN ('paid','due','overdue')) DEFAULT 'due',
  notes TEXT
);

-- Smart match alerts (saved search criteria)
CREATE TABLE search_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  area TEXT,
  max_rent INTEGER,
  min_rooms INTEGER,
  type TEXT,
  notified_listing_ids UUID[],
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Flatmate matching profiles
CREATE TABLE flatmate_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) UNIQUE,
  university TEXT,
  budget_min INTEGER,
  budget_max INTEGER,
  preferred_area TEXT,
  lifestyle JSONB,           -- {sleepTime, studyHabits, smoking, pets}
  looking_from DATE,
  is_active BOOLEAN DEFAULT true
);
```

### Row Level Security (RLS) Policies
- Landlords can only CRUD their own listings
- Tenants can only read available listings
- Payment records only visible to the landlord who owns them

---

## 📁 Project File Structure

```
thikana/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   └── signup/page.tsx
│   ├── (main)/
│   │   ├── layout.tsx           # Shell with navbar
│   │   ├── page.tsx             # Landing / Hero
│   │   ├── listings/
│   │   │   ├── page.tsx         # Browse listings (search + map)
│   │   │   └── [id]/page.tsx    # Listing detail page
│   │   ├── landlord/
│   │   │   ├── dashboard/page.tsx
│   │   │   ├── new-listing/page.tsx
│   │   │   └── payments/page.tsx
│   │   ├── student/
│   │   │   ├── dashboard/page.tsx
│   │   │   └── finance/page.tsx # Finance toolkit
│   │   └── neighborhood/page.tsx # Q&A chatbot
│   ├── api/
│   │   ├── ai/
│   │   │   ├── generate-listing/route.ts   # Gemini: bilingual copy
│   │   │   ├── parse-query/route.ts        # Gemini: NL → filters
│   │   │   ├── trust-score/route.ts        # Fraud + anomaly check
│   │   │   ├── neighborhood-qa/route.ts    # Gemini RAG
│   │   │   └── rent-estimate/route.ts      # Fair price suggestion
│   │   └── listings/
│   │       └── route.ts
│   └── layout.tsx               # Root layout with fonts
├── components/
│   ├── ui/                      # Shadcn components
│   ├── listings/
│   │   ├── ListingCard.tsx
│   │   ├── ListingGrid.tsx
│   │   ├── ListingMap.tsx       # Leaflet map
│   │   ├── TrustScoreBadge.tsx
│   │   └── NLSearchBar.tsx
│   ├── landlord/
│   │   ├── ListingForm.tsx
│   │   ├── PaymentTable.tsx
│   │   └── TenantCard.tsx
│   ├── student/
│   │   ├── RentSplitter.tsx
│   │   ├── BillSplitter.tsx
│   │   └── BudgetForecast.tsx
│   └── shared/
│       ├── Navbar.tsx
│       ├── LanguageToggle.tsx   # EN/BN switch
│       └── MapPicker.tsx
├── lib/
│   ├── supabase/
│   │   ├── client.ts
│   │   └── server.ts
│   ├── gemini.ts               # Gemini API client
│   ├── mapbox.ts               # Geocoding utils
│   └── trust-score.ts          # Scoring algorithm
├── types/
│   └── index.ts                # Shared TypeScript types
└── public/
    └── universities.json        # Seeded university coordinates
```

---

## 🤖 AI Integration Details (Gemini API)

### 1. Natural Language Search Parser
**Endpoint:** `POST /api/ai/parse-query`

```typescript
// Input: "Mirpure 2 room 12k er niche"
// Output: { area: "Mirpur-2", rooms: 2, max_rent: 12000 }

const prompt = `
You are a search query parser for a Bangladeshi rental platform.
Parse the following mixed Bangla/English query into structured JSON filters.

Query: "${userQuery}"

Return ONLY valid JSON with these optional fields:
{
  "area": string | null,
  "rooms": number | null,
  "max_rent": number | null,
  "type": "student" | "family" | "professional" | null,
  "for_gender": "male" | "female" | "any" | null,
  "furnishing": "unfurnished" | "semi" | "fully" | null
}

Rules:
- "k" or "হাজার" means thousands (12k = 12000)
- Common area aliases: Mirpur-2, Dhanmondi, Mohakhali, Uttara
- Return null for fields not mentioned
`;
```

### 2. AI Bilingual Listing Generator
**Endpoint:** `POST /api/ai/generate-listing`

```typescript
// Input: structured form data from landlord
// Output: { title_en, title_bn, description_en, description_bn }

const prompt = `
You are a professional real estate copywriter for Bangladesh.
Generate a compelling bilingual listing description.

Property details:
- Area: ${area}
- Rent: ৳${rent}/month
- Rooms: ${rooms}, Bathrooms: ${bathrooms}
- Floor: ${floor}
- Furnishing: ${furnishing}
- Type: ${type} (student/family/professional)
- Utilities included: ${utilities}
- Landlord notes: "${notes}"

Generate:
1. title_en: Short English title (max 60 chars)
2. title_bn: Bengali title
3. description_en: 3-4 sentence English description (professional tone)
4. description_bn: Bengali description (same content)

Return ONLY valid JSON with these 4 fields.
`;
```

### 3. AI Trust Score (Hybrid: Rule-based + Gemini)
**Endpoint:** `POST /api/ai/trust-score`

```typescript
// Scoring breakdown (0-100):
// - Price anomaly check: 30 pts (compare vs area median from DB)
// - Photo count & quality heuristic: 20 pts
// - Description completeness: 20 pts
// - Duplicate description check (TF-IDF cosine similarity): 15 pts
// - Photo hash uniqueness (compare perceptual hash): 15 pts

function computeTrustScore(listing, areaMedianRent, allDescriptions) {
  let score = 0;
  const breakdown = {};

  // Price anomaly (rule-based)
  const priceRatio = listing.rent / areaMedianRent;
  if (priceRatio >= 0.6 && priceRatio <= 1.5) score += 30;
  else if (priceRatio >= 0.4) score += 15;
  breakdown.price = { score: ..., note: "..." };

  // Photo check
  const photoScore = Math.min(listing.photos.length * 5, 20);
  score += photoScore;

  // Description length & completeness
  const descScore = listing.description_en?.length > 100 ? 20 : 10;
  score += descScore;

  // TF-IDF duplicate check (compare against existing listings)
  const dupScore = checkDuplicates(listing.description_en, allDescriptions);
  score += dupScore; // 0 or 15

  // pHash photo reuse (compare against flagged stock photos)
  const photoHashScore = checkPhotoHashes(listing.photos);
  score += photoHashScore; // 0 or 15

  return { total: score, breakdown };
}
```

### 4. Neighborhood Q&A (Gemini RAG)
**Endpoint:** `POST /api/ai/neighborhood-qa`

```typescript
// Uses Gemini's grounding with Google Search
const response = await gemini.generateContent({
  contents: [{ parts: [{ text: userQuestion }] }],
  tools: [{ googleSearch: {} }],  // Grounding with real search
  systemInstruction: `
    You are a local area expert for Dhaka, Bangladesh.
    Answer questions about neighborhood safety, amenities, transport, 
    and suitability for students/families. 
    Base answers on search results. Be concise (3-4 sentences).
    Always mention the source of information.
    If unsure, say so rather than guessing.
  `
});
```

### 5. Smart Rent Estimator
**Endpoint:** `POST /api/ai/rent-estimate`

```typescript
// Pure DB query — no LLM needed
// SELECT PERCENTILE_CONT(0.25) WITHIN GROUP (ORDER BY rent_bdt) as p25,
//        PERCENTILE_CONT(0.75) WITHIN GROUP (ORDER BY rent_bdt) as p75
// FROM listings 
// WHERE area = $1 AND rooms = $2 AND furnishing = $3 AND is_available = true;
// Returns: { min: 9500, max: 13000, median: 11200 }
```

---

## 🗺️ Map Integration (Leaflet.js + Mapbox)

```typescript
// University coordinates seed data
const UNIVERSITIES = [
  { name: "IUT", lat: 23.9833, lng: 90.4167 },
  { name: "DUET", lat: 23.9827, lng: 90.4318 },
  { name: "DIU", lat: 23.7513, lng: 90.3576 },
  { name: "BUET", lat: 23.7264, lng: 90.3928 },
  { name: "DU", lat: 23.7279, lng: 90.3989 },
  { name: "NSU", lat: 23.8157, lng: 90.4292 },
];

// Distance calculation (Haversine formula — no API call needed)
function getDistanceKm(lat1, lng1, lat2, lng2): number { ... }

// Mapbox Geocoding: address → coordinates
async function geocodeAddress(address: string) {
  const res = await fetch(
    `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(address + ', Dhaka, Bangladesh')}.json?access_token=${MAPBOX_TOKEN}`
  );
  const data = await res.json();
  return data.features[0]?.center; // [lng, lat]
}
```

---

## 🎨 UI/UX Design Principles

### Color Palette
```css
/* Bengali-inspired, modern, trustworthy */
--primary: #16A34A;      /* Green — growth, trust */
--primary-dark: #14532D;
--accent: #F59E0B;       /* Amber — warmth, Bangladesh */
--background: #0F172A;   /* Dark slate — premium feel */
--surface: #1E293B;
--text: #F1F5F9;
--text-muted: #94A3B8;
--danger: #EF4444;
--success: #22C55E;
```

### Key Pages & Components
1. **Landing Page** — Hero with NL search bar (bilingual placeholder), feature highlights, social proof stats
2. **Listings Browse** — Split view: filter sidebar + map + listing grid (toggle between map/list)
3. **Listing Detail** — Photo gallery, trust score badge with breakdown, NL neighborhood Q&A, landlord info, contact CTA
4. **Landlord: New Listing** — Multi-step form → "Generate Description with AI" button → preview → publish
5. **Landlord: Payment Dashboard** — Tenant table with paid/unpaid status, quick-mark payments
6. **Student: Finance Toolkit** — Tabs: Rent Split | Bill Split | Budget Forecast

### Language Toggle
- Store preference in `localStorage` + cookie
- All UI strings in `messages/en.json` and `messages/bn.json` (next-intl)
- AI-generated content served in both languages simultaneously

---

## 📅 Development Timeline (Hackathon Sprint)

### Phase 1: Foundation (Day 1 — ~8 hours)
- [ ] `npx create-next-app@latest thikana --typescript --tailwind --app`
- [ ] Supabase project setup + schema migration
- [ ] Auth flow (signup/login with role selection: student/landlord)
- [ ] Shadcn/ui setup + design tokens (colors, fonts: Hind Siliguri for Bangla, Inter for English)
- [ ] Navbar + layout shell
- [ ] Seed universities table

### Phase 2: Core Listings (Day 1-2 — ~10 hours)
- [ ] Listing creation form (landlord)
- [ ] Mapbox geocoding on address input
- [ ] Supabase Storage photo upload
- [ ] Listings browse page (grid + basic filters)
- [ ] Listing detail page
- [ ] Leaflet map with listing pins

### Phase 3: AI Features (Day 2 — ~10 hours)
- [ ] Gemini API client setup (`lib/gemini.ts`)
- [ ] NL Search bar → `/api/ai/parse-query` → filter listings
- [ ] AI Listing Generator → `/api/ai/generate-listing`
- [ ] Trust Score computation + badge display
- [ ] Neighborhood Q&A chatbot (grounded Gemini)
- [ ] Rent Estimator (DB percentile query)

### Phase 4: Student & Landlord Tools (Day 3 — ~8 hours)
- [ ] Student Finance Toolkit (rent splitter, bill splitter, budget)
- [ ] Landlord Payment Ledger (tenant CRUD + payment status)
- [ ] Landlord dashboard overview cards
- [ ] Language toggle (EN/BN) with next-intl

### Phase 5: Polish & Deploy (Day 3 — ~4 hours)
- [ ] Responsive mobile layout audit
- [ ] Landing page hero + animated stats
- [ ] Loading skeletons + error states
- [ ] Vercel deployment + environment variables
- [ ] Final demo walkthrough rehearsal

---

## 🔐 Environment Variables

```env
# .env.local
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=      # Server-side only

GOOGLE_GEMINI_API_KEY=          # Server-side only (Edge Functions)

NEXT_PUBLIC_MAPBOX_TOKEN=       # Public (needed client-side for map)

NEXT_PUBLIC_APP_URL=https://thikana.vercel.app
```

---

## 🚀 Deployment Checklist

### Vercel
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod

# Set env vars via Vercel dashboard or:
vercel env add GOOGLE_GEMINI_API_KEY production
```

### Supabase
- Enable Row Level Security on all tables
- Set up auth email templates in Bangladeshi style
- Configure Storage bucket policies (public read for listing photos)
- Enable Realtime for payment updates (landlord dashboard)

### Domain (Optional but impressive)
- Free: `thikana.vercel.app`
- Custom: Purchase `thikana.com.bd` or `thikana.app` (~$10-15)

---

## 🏆 Hackathon Winning Strategy

### Demo Script (5-minute live demo)
1. **"The Problem"** — Show the Facebook group chaos (screenshot)
2. **Student POV** — Type "Mirpure 2 room 12k er niche" in NL search → AI parses → results appear on map
3. **Listing Detail** — Show trust score breakdown (judges love transparency)
4. **Neighborhood Q&A** — Ask "Is Mirpur-1 safe for female students?" → Gemini answers with sources
5. **Landlord POV** — Fill form → click "Generate Listing" → bilingual copy appears instantly
6. **Finance Toolkit** — Enter 3 flatmates, ৳15,000 rent → split calculation with icons

### Judge Appeal Points
- **Real problem, real data** — Cite the 84% / 71% survey stats
- **No hallucination risk** — Explain grounded RAG for neighborhood Q&A
- **AI only where needed** — Shows maturity; judges hate AI-washing
- **Production-ready** — Live deployed URL, real Supabase DB, real Gemini calls
- **Scalability story** — Same stack works for Chittagong, Rajshahi, etc.

---

## 📦 Key npm Packages

```json
{
  "dependencies": {
    "next": "14.x",
    "@supabase/supabase-js": "^2.x",
    "@supabase/ssr": "^0.x",
    "@google/generative-ai": "^0.x",
    "leaflet": "^1.9.x",
    "react-leaflet": "^4.x",
    "next-intl": "^3.x",
    "react-hook-form": "^7.x",
    "zod": "^3.x",
    "@hookform/resolvers": "^3.x",
    "lucide-react": "^0.x",
    "recharts": "^2.x",
    "date-fns": "^3.x",
    "clsx": "^2.x",
    "tailwind-merge": "^2.x"
  }
}
```

---

## ⚠️ Risk Mitigation

| Risk | Mitigation |
|---|---|
| Gemini API rate limits | Cache AI responses in Supabase; use `gemini-1.5-flash` (faster + cheaper) |
| Mapbox cost | Use free tier (50k loads/month); Leaflet renders free, only geocoding costs |
| Cold start on Vercel | Use Edge Runtime for AI routes (no cold start) |
| No real listing data | Pre-seed 20-30 realistic sample listings in Dhaka areas before demo |
| Bangla font rendering | Use `Hind Siliguri` from Google Fonts; test on mobile Chrome |
| Supabase free tier limits | 500MB DB + 1GB storage is enough for demo; upgrade only if needed |

---

*Plan Version: 1.0 | Created: 2026-06-24 | Team: IUT_TwinCoder*
