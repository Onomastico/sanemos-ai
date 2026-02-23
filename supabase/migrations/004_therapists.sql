-- ============================================================
-- sanemos.ai — Phase 3: Therapist Directory
-- ============================================================

-- Therapist profiles
CREATE TABLE therapists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    full_name TEXT NOT NULL,
    title TEXT,
    bio TEXT,
    photo_url TEXT,
    email TEXT,
    phone TEXT,
    website TEXT,
    city TEXT,
    country TEXT,
    modality TEXT NOT NULL DEFAULT 'both' CHECK (modality IN ('in_person','online','both')),
    languages TEXT[] DEFAULT ARRAY['en'],
    specializations TEXT[] DEFAULT '{}',
    license_number TEXT,
    is_verified BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    avg_rating NUMERIC(3,2) DEFAULT 0,
    review_count INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Therapist reviews
CREATE TABLE therapist_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    therapist_id UUID REFERENCES therapists(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    rating INT CHECK (rating BETWEEN 1 AND 5),
    comment TEXT,
    is_anonymous BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(therapist_id, user_id)
);

-- Indexes
CREATE INDEX idx_therapists_city ON therapists(city);
CREATE INDEX idx_therapists_country ON therapists(country);
CREATE INDEX idx_therapists_verified ON therapists(is_verified, is_active);
CREATE INDEX idx_therapist_reviews_therapist ON therapist_reviews(therapist_id);

-- ============================================================
-- Row Level Security
-- ============================================================

ALTER TABLE therapists ENABLE ROW LEVEL SECURITY;
ALTER TABLE therapist_reviews ENABLE ROW LEVEL SECURITY;

-- Therapists: everyone can view active ones
CREATE POLICY "Active therapists are viewable by everyone"
    ON therapists FOR SELECT USING (is_active = true);

CREATE POLICY "Authenticated users can create therapist profiles"
    ON therapists FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Therapists can update their own profile"
    ON therapists FOR UPDATE USING (auth.uid() = user_id);

-- Reviews: everyone can read, authenticated can create
CREATE POLICY "Therapist reviews are viewable by everyone"
    ON therapist_reviews FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create therapist reviews"
    ON therapist_reviews FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own therapist reviews"
    ON therapist_reviews FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own therapist reviews"
    ON therapist_reviews FOR DELETE USING (auth.uid() = user_id);

-- ============================================================
-- Trigger: Update avg_rating on review change
-- ============================================================

CREATE OR REPLACE FUNCTION public.update_therapist_rating()
RETURNS trigger AS $$
BEGIN
    UPDATE therapists SET
        avg_rating = (SELECT COALESCE(AVG(rating), 0) FROM therapist_reviews WHERE therapist_id = COALESCE(NEW.therapist_id, OLD.therapist_id)),
        review_count = (SELECT COUNT(*) FROM therapist_reviews WHERE therapist_id = COALESCE(NEW.therapist_id, OLD.therapist_id))
    WHERE id = COALESCE(NEW.therapist_id, OLD.therapist_id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_therapist_review_change
    AFTER INSERT OR UPDATE OR DELETE ON therapist_reviews
    FOR EACH ROW EXECUTE FUNCTION public.update_therapist_rating();
