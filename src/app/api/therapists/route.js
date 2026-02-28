import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { moderateTherapist } from '@/lib/moderation';

export async function POST(request) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
        fullName, title, bio, email, phone,
        city, country, modality, languages, specializations, licenseNumber,
    } = body;

    if (!fullName || !city || !modality) {
        return NextResponse.json({ error: 'Full name, city, and modality are required' }, { status: 400 });
    }

    const admin = createAdminClient();

    const { data: therapist, error: insertError } = await admin
        .from('therapists')
        .insert({
            user_id: user.id,
            full_name: fullName,
            title: title || null,
            bio: bio || null,
            email: email || null,
            phone: phone || null,
            city,
            country: country || null,
            modality,
            languages: Array.isArray(languages) ? languages : (languages ? [languages] : ['en']),
            specializations: Array.isArray(specializations) ? specializations : (specializations ? [specializations] : []),
            license_number: licenseNumber || null,
            status: 'pending',
        })
        .select()
        .single();

    if (insertError) {
        console.error('Therapist insert error:', insertError);
        return NextResponse.json({ error: 'Failed to save submission' }, { status: 500 });
    }

    // Run AI pre-screening
    const aiDecision = await moderateTherapist(therapist, admin);

    // Only auto-approve on very high confidence — never auto-reject
    const newStatus = aiDecision.autoApprove ? 'approved' : 'pending';

    await admin
        .from('therapists')
        .update({
            status: newStatus,
            ai_moderation_result: aiDecision,
            ...(aiDecision.autoApprove ? { is_verified: true } : {}),
        })
        .eq('id', therapist.id);

    return NextResponse.json({
        therapist: { ...therapist, status: newStatus },
        aiDecision: newStatus,
    });
}
