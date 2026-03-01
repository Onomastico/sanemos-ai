-- Migration 022: Volunteer System
-- Tables: volunteer_applications, volunteer_shifts, volunteer_checkins

-- ============================================================
-- 1. VOLUNTEER APPLICATIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS volunteer_applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,  -- NULL if applied without login
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    motivation TEXT,
    availability_notes TEXT,  -- general availability (e.g. "afternoons and weekends")
    status TEXT NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'approved', 'rejected')),
    rejection_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS: only admins manage applications; applicants cannot self-read (no auth link needed)
ALTER TABLE volunteer_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage volunteer applications"
    ON volunteer_applications
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND (profiles.is_admin = true OR profiles.role IN ('admin', 'moderator'))
        )
    );

-- Volunteers can read their own application (via user_id)
CREATE POLICY "Volunteers can view own application"
    ON volunteer_applications
    FOR SELECT
    USING (user_id = auth.uid());


-- ============================================================
-- 2. VOLUNTEER SHIFTS
-- ============================================================
CREATE TABLE IF NOT EXISTS volunteer_shifts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    volunteer_id UUID NOT NULL REFERENCES volunteer_applications(id) ON DELETE CASCADE,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    notes TEXT,
    status TEXT NOT NULL DEFAULT 'scheduled'
        CHECK (status IN ('scheduled', 'confirmed', 'declined', 'completed', 'cancelled')),
    confirmation_token UUID DEFAULT gen_random_uuid() UNIQUE NOT NULL,
    notified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS: only admins manage shifts directly; volunteers read via API (service role)
ALTER TABLE volunteer_shifts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage volunteer shifts"
    ON volunteer_shifts
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND (profiles.is_admin = true OR profiles.role IN ('admin', 'moderator'))
        )
    );

-- Volunteers can view their own shifts (via volunteer_applications.user_id)
CREATE POLICY "Volunteers can view own shifts"
    ON volunteer_shifts
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM volunteer_applications va
            WHERE va.id = volunteer_shifts.volunteer_id
            AND va.user_id = auth.uid()
        )
    );


-- ============================================================
-- 3. VOLUNTEER CHECKINS
-- ============================================================
CREATE TABLE IF NOT EXISTS volunteer_checkins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shift_id UUID NOT NULL REFERENCES volunteer_shifts(id) ON DELETE CASCADE,
    volunteer_id UUID NOT NULL REFERENCES volunteer_applications(id) ON DELETE CASCADE,
    checked_in_at TIMESTAMPTZ DEFAULT now(),
    checked_out_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Only one checkin per shift
CREATE UNIQUE INDEX IF NOT EXISTS idx_checkins_unique_shift
    ON volunteer_checkins(shift_id);

ALTER TABLE volunteer_checkins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all checkins"
    ON volunteer_checkins
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND (profiles.is_admin = true OR profiles.role IN ('admin', 'moderator'))
        )
    );

-- Volunteers can manage their own checkins
CREATE POLICY "Volunteers can manage own checkins"
    ON volunteer_checkins
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM volunteer_applications va
            WHERE va.id = volunteer_checkins.volunteer_id
            AND va.user_id = auth.uid()
        )
    );


-- ============================================================
-- 4. INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_volunteer_apps_status ON volunteer_applications(status);
CREATE INDEX IF NOT EXISTS idx_volunteer_apps_email ON volunteer_applications(email);
CREATE INDEX IF NOT EXISTS idx_volunteer_shifts_volunteer ON volunteer_shifts(volunteer_id);
CREATE INDEX IF NOT EXISTS idx_volunteer_shifts_time ON volunteer_shifts(start_time, end_time);
CREATE INDEX IF NOT EXISTS idx_volunteer_shifts_token ON volunteer_shifts(confirmation_token);
CREATE INDEX IF NOT EXISTS idx_volunteer_checkins_shift ON volunteer_checkins(shift_id);


-- ============================================================
-- 5. UPDATED_AT TRIGGERS
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_volunteer_applications_updated_at
    BEFORE UPDATE ON volunteer_applications
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_volunteer_shifts_updated_at
    BEFORE UPDATE ON volunteer_shifts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
