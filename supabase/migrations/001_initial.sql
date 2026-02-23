-- ============================================================
-- sanemos.ai — Initial Database Schema
-- ============================================================

-- Users profile (extends Supabase Auth)
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    display_name TEXT NOT NULL,
    avatar_url TEXT,
    role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('admin','moderator','specialist','user')),
    locale TEXT DEFAULT 'en',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Loss types for user categorization
CREATE TABLE user_losses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    loss_type TEXT CHECK (loss_type IN ('parent','child','partner','sibling','friend','pet','other')),
    description TEXT,
    loss_date DATE,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Resources (series, movies, books, comics, manga)
CREATE TABLE resources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    description TEXT,
    type TEXT NOT NULL CHECK (type IN ('series','movie','book','comic','manga')),
    cover_url TEXT,
    external_url TEXT,
    avg_rating NUMERIC(3,2) DEFAULT 0,
    review_count INT DEFAULT 0,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Which loss types a resource helps with
CREATE TABLE resource_loss_types (
    resource_id UUID REFERENCES resources(id) ON DELETE CASCADE,
    loss_type TEXT CHECK (loss_type IN ('parent','child','partner','sibling','friend','pet','other')),
    PRIMARY KEY (resource_id, loss_type)
);

-- User reviews of resources
CREATE TABLE resource_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    resource_id UUID REFERENCES resources(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    rating INT CHECK (rating BETWEEN 1 AND 5),
    comment TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(resource_id, user_id)
);

-- ============================================================
-- Row Level Security
-- ============================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_losses ENABLE ROW LEVEL SECURITY;
ALTER TABLE resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE resource_loss_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE resource_reviews ENABLE ROW LEVEL SECURITY;

-- Profiles: anyone can read, users can update their own
CREATE POLICY "Profiles are viewable by everyone"
    ON profiles FOR SELECT USING (true);

CREATE POLICY "Users can update own profile"
    ON profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
    ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- User Losses: own data only
CREATE POLICY "Users can view own losses"
    ON user_losses FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own losses"
    ON user_losses FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own losses"
    ON user_losses FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own losses"
    ON user_losses FOR DELETE USING (auth.uid() = user_id);

-- Resources: anyone can read, authenticated can create
CREATE POLICY "Resources are viewable by everyone"
    ON resources FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create resources"
    ON resources FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update own resources"
    ON resources FOR UPDATE USING (auth.uid() = created_by);

CREATE POLICY "Users can delete own resources"
    ON resources FOR DELETE USING (auth.uid() = created_by);

-- Resource Loss Types: anyone can read, resource owner can manage
CREATE POLICY "Resource loss types are viewable by everyone"
    ON resource_loss_types FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert resource loss types"
    ON resource_loss_types FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Resource loss types can be deleted by resource owner"
    ON resource_loss_types FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM resources WHERE resources.id = resource_loss_types.resource_id
            AND resources.created_by = auth.uid()
        )
    );

-- Resource Reviews: anyone can read, authenticated can create own
CREATE POLICY "Reviews are viewable by everyone"
    ON resource_reviews FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create reviews"
    ON resource_reviews FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own reviews"
    ON resource_reviews FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own reviews"
    ON resource_reviews FOR DELETE USING (auth.uid() = user_id);

-- ============================================================
-- Trigger: Auto-create profile on sign up
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
    INSERT INTO public.profiles (id, display_name, role, locale)
    VALUES (
        new.id,
        COALESCE(new.raw_user_meta_data->>'display_name', 'User'),
        'user',
        COALESCE(new.raw_user_meta_data->>'locale', 'en')
    );
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- Trigger: Update avg_rating on review change
-- ============================================================

CREATE OR REPLACE FUNCTION public.update_resource_rating()
RETURNS trigger AS $$
BEGIN
    UPDATE resources SET
        avg_rating = (SELECT COALESCE(AVG(rating), 0) FROM resource_reviews WHERE resource_id = COALESCE(NEW.resource_id, OLD.resource_id)),
        review_count = (SELECT COUNT(*) FROM resource_reviews WHERE resource_id = COALESCE(NEW.resource_id, OLD.resource_id))
    WHERE id = COALESCE(NEW.resource_id, OLD.resource_id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_review_change
    AFTER INSERT OR UPDATE OR DELETE ON resource_reviews
    FOR EACH ROW EXECUTE FUNCTION public.update_resource_rating();
