import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { sendVolunteerApplicationReceived } from '@/lib/email';

export async function POST(request) {
    try {
        const body = await request.json();
        const { name, email, motivation, availability_notes } = body;

        if (!name?.trim()) {
            return NextResponse.json({ error: 'El nombre es requerido.' }, { status: 400 });
        }
        if (!email?.trim() || !email.includes('@')) {
            return NextResponse.json({ error: 'El email es requerido.' }, { status: 400 });
        }

        // Check if already applied with this email
        const admin = createAdminClient();
        const { data: existing } = await admin
            .from('volunteer_applications')
            .select('id, status')
            .eq('email', email.toLowerCase().trim())
            .maybeSingle();

        if (existing) {
            return NextResponse.json(
                { error: 'Ya existe una solicitud con ese correo electrónico.' },
                { status: 409 }
            );
        }

        // Get logged-in user if any
        let userId = null;
        try {
            const supabase = await createClient();
            const { data: { user } } = await supabase.auth.getUser();
            if (user) userId = user.id;
        } catch {
            // Not logged in — that's fine
        }

        const { data: application, error } = await admin
            .from('volunteer_applications')
            .insert({
                user_id: userId,
                name: name.trim(),
                email: email.toLowerCase().trim(),
                motivation: motivation?.trim() || null,
                availability_notes: availability_notes?.trim() || null,
                status: 'pending',
            })
            .select()
            .single();

        if (error) {
            console.error('Error creating volunteer application:', error);
            return NextResponse.json({ error: 'Error al enviar la solicitud.' }, { status: 500 });
        }

        // Send confirmation email (non-blocking)
        sendVolunteerApplicationReceived({ name: name.trim(), email: email.toLowerCase().trim() })
            .catch(err => console.error('Email error (application received):', err));

        return NextResponse.json({ application }, { status: 201 });
    } catch (err) {
        console.error('Unexpected error in volunteer apply:', err);
        return NextResponse.json({ error: 'Error inesperado.' }, { status: 500 });
    }
}
