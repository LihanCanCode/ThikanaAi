-- Thikana initial schema — run in Supabase SQL Editor

-- Profiles (extends auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT CHECK (role IN ('student', 'landlord', 'professional')) NOT NULL DEFAULT 'student',
  full_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  university TEXT,
  monthly_budget INTEGER,
  verified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Listings
CREATE TABLE IF NOT EXISTS listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  landlord_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  title_en TEXT NOT NULL,
  title_bn TEXT,
  description_en TEXT,
  description_bn TEXT,
  area TEXT NOT NULL,
  address TEXT,
  lat NUMERIC(10,7),
  lng NUMERIC(10,7),
  rent_bdt INTEGER NOT NULL,
  rooms INTEGER DEFAULT 1,
  bathrooms INTEGER DEFAULT 1,
  floor INTEGER,
  furnishing TEXT CHECK (furnishing IN ('unfurnished','semi','fully')),
  type TEXT CHECK (type IN ('student','family','professional')),
  for_gender TEXT CHECK (for_gender IN ('male','female','any')) DEFAULT 'any',
  utilities_included BOOLEAN DEFAULT false,
  photos TEXT[] DEFAULT '{}',
  is_available BOOLEAN DEFAULT true,
  trust_score INTEGER,
  trust_score_breakdown JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Landlord tenants
CREATE TABLE IF NOT EXISTS tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  landlord_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  listing_id UUID REFERENCES listings(id) ON DELETE SET NULL,
  tenant_name TEXT NOT NULL,
  tenant_phone TEXT,
  room_label TEXT,
  monthly_rent INTEGER NOT NULL,
  move_in_date DATE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Rent payments ledger
CREATE TABLE IF NOT EXISTS rent_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE NOT NULL,
  month DATE NOT NULL,
  amount INTEGER NOT NULL,
  paid_on DATE,
  status TEXT CHECK (status IN ('paid','due','overdue')) DEFAULT 'due',
  notes TEXT,
  UNIQUE(tenant_id, month)
);

-- Flatmate profiles (user_id NULL = demo/seed profile)
CREATE TABLE IF NOT EXISTS flatmate_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  university TEXT NOT NULL,
  budget_min INTEGER NOT NULL,
  budget_max INTEGER NOT NULL,
  preferred_areas TEXT[] DEFAULT '{}',
  profile_data JSONB NOT NULL DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);
-- Standard unique constraint on user_id (allows multiple NULLs for seed profiles, but enforces 1-to-1 for users)
ALTER TABLE flatmate_profiles DROP CONSTRAINT IF EXISTS flatmate_profiles_user_id_key;
ALTER TABLE flatmate_profiles ADD CONSTRAINT flatmate_profiles_user_id_key UNIQUE (user_id);



-- Flatmate interest ("Flick")
CREATE TABLE IF NOT EXISTS flatmate_flicks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  to_profile_id UUID REFERENCES flatmate_profiles(id) ON DELETE CASCADE NOT NULL,
  status TEXT CHECK (status IN ('pending','accepted','declined')) DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(from_user_id, to_profile_id)
);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, role, full_name, phone, university)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'role', 'student'),
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'phone',
    NEW.raw_user_meta_data->>'university'
  )
  ON CONFLICT (id) DO UPDATE SET
    role = EXCLUDED.role,
    full_name = EXCLUDED.full_name,
    phone = EXCLUDED.phone,
    university = EXCLUDED.university;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE rent_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE flatmate_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE flatmate_flicks ENABLE ROW LEVEL SECURITY;

-- Profiles: read all, update own
DROP POLICY IF EXISTS "profiles_select" ON profiles;
CREATE POLICY "profiles_select" ON profiles FOR SELECT USING (true);
DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE USING (auth.uid() = id);
DROP POLICY IF EXISTS "profiles_insert_own" ON profiles;
CREATE POLICY "profiles_insert_own" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Listings: public read available, landlords manage own
DROP POLICY IF EXISTS "listings_select" ON listings;
CREATE POLICY "listings_select" ON listings FOR SELECT USING (is_available = true OR landlord_id = auth.uid());
DROP POLICY IF EXISTS "listings_insert" ON listings;
CREATE POLICY "listings_insert" ON listings FOR INSERT WITH CHECK (landlord_id = auth.uid() OR landlord_id IS NULL);
DROP POLICY IF EXISTS "listings_update_own" ON listings;
CREATE POLICY "listings_update_own" ON listings FOR UPDATE USING (landlord_id = auth.uid());
DROP POLICY IF EXISTS "listings_delete_own" ON listings;
CREATE POLICY "listings_delete_own" ON listings FOR DELETE USING (landlord_id = auth.uid());

-- Tenants: landlord only
DROP POLICY IF EXISTS "tenants_landlord_all" ON tenants;
CREATE POLICY "tenants_landlord_all" ON tenants FOR ALL USING (landlord_id = auth.uid());

-- Rent payments: via tenant ownership
DROP POLICY IF EXISTS "payments_landlord_select" ON rent_payments;
CREATE POLICY "payments_landlord_select" ON rent_payments FOR SELECT
  USING (EXISTS (SELECT 1 FROM tenants t WHERE t.id = tenant_id AND t.landlord_id = auth.uid()));
DROP POLICY IF EXISTS "payments_landlord_insert" ON rent_payments;
CREATE POLICY "payments_landlord_insert" ON rent_payments FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM tenants t WHERE t.id = tenant_id AND t.landlord_id = auth.uid()));
DROP POLICY IF EXISTS "payments_landlord_update" ON rent_payments;
CREATE POLICY "payments_landlord_update" ON rent_payments FOR UPDATE
  USING (EXISTS (SELECT 1 FROM tenants t WHERE t.id = tenant_id AND t.landlord_id = auth.uid()));

-- Flatmate profiles: public read active, users manage own
DROP POLICY IF EXISTS "flatmate_select" ON flatmate_profiles;
CREATE POLICY "flatmate_select" ON flatmate_profiles FOR SELECT USING (is_active = true);
DROP POLICY IF EXISTS "flatmate_insert_own" ON flatmate_profiles;
CREATE POLICY "flatmate_insert_own" ON flatmate_profiles FOR INSERT WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS "flatmate_update_own" ON flatmate_profiles;
CREATE POLICY "flatmate_update_own" ON flatmate_profiles FOR UPDATE USING (user_id = auth.uid());
DROP POLICY IF EXISTS "flatmate_delete_own" ON flatmate_profiles;
CREATE POLICY "flatmate_delete_own" ON flatmate_profiles FOR DELETE USING (user_id = auth.uid());

-- Flicks: users manage own sent flicks
DROP POLICY IF EXISTS "flicks_select" ON flatmate_flicks;
CREATE POLICY "flicks_select" ON flatmate_flicks FOR SELECT
  USING (from_user_id = auth.uid() OR to_profile_id IN (SELECT id FROM flatmate_profiles WHERE user_id = auth.uid()));
DROP POLICY IF EXISTS "flicks_insert" ON flatmate_flicks;
CREATE POLICY "flicks_insert" ON flatmate_flicks FOR INSERT WITH CHECK (from_user_id = auth.uid());
DROP POLICY IF EXISTS "flicks_update" ON flatmate_flicks;
CREATE POLICY "flicks_update" ON flatmate_flicks FOR UPDATE USING (from_user_id = auth.uid());

-- Room shares (Student room availability postings)
CREATE TABLE IF NOT EXISTS room_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title_en TEXT NOT NULL,
  title_bn TEXT,
  description_en TEXT,
  description_bn TEXT,
  area TEXT NOT NULL,
  address TEXT,
  lat NUMERIC(10,7),
  lng NUMERIC(10,7),
  rent_bdt INTEGER NOT NULL,
  current_roommates INTEGER DEFAULT 1,
  available_seats INTEGER DEFAULT 1,
  gender_restriction TEXT CHECK (gender_restriction IN ('male', 'female', 'any')) DEFAULT 'any',
  university_restriction TEXT,
  photos TEXT[] DEFAULT '{}',
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE room_shares ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "room_shares_select" ON room_shares;
CREATE POLICY "room_shares_select" ON room_shares FOR SELECT USING (is_available = true);
DROP POLICY IF EXISTS "room_shares_insert" ON room_shares;
CREATE POLICY "room_shares_insert" ON room_shares FOR INSERT WITH CHECK (creator_id = auth.uid());
DROP POLICY IF EXISTS "room_shares_update_own" ON room_shares;
CREATE POLICY "room_shares_update_own" ON room_shares FOR UPDATE USING (creator_id = auth.uid());
DROP POLICY IF EXISTS "room_shares_delete_own" ON room_shares;
CREATE POLICY "room_shares_delete_own" ON room_shares FOR DELETE USING (creator_id = auth.uid());

