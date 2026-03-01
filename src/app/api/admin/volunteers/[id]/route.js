import { NextResponse } from 'next/server';
import { checkStaff } from '@/lib/supabase/auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { sendVolunteerApproved } from '@/lib/email';

export async function PATCH(request, { params }) {
    const { isStaff } = await checkStaff();
    if (!isStaff) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });

    const { id } = await params;
    const body = await request.json();
    const { status, rejection_reason } = body;

    if (!['approved', 'rejected'].includes(status)) {
        return NextResponse.json({ error: 'Estado inválido.' }, { status: 400 });
    }

    const admin = createAdminClient();

    // Get the application first
    const { data: application, error: fetchError } = await admin
        .from('volunteer_applications')
        .select('*')
        .eq('id', id)
        .single();

    if (fetchError || !application) {
        return NextResponse.json({ error: 'Solicitud no encontrada.' }, { status: 404 });
    }

    const { data: updated, error } = await admin
        .from('volunteer_applications')
        .update({
            status,
            rejection_reason: status === 'rejected' ? (rejection_reason || null) : null,
        })
        .eq('id', id)
        .select()
        .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Send approval email
    if (status === 'approved') {
        const hasAccount = application.user_id !== null;
        sendVolunteerApproved({
            name: application.name,
            email: application.email,
            hasAccount,
        }).catch(err => console.error('Email error (volunteer approved):', err));
    }

    return NextResponse.json({ volunteer: updated });
}

export async function DELETE(request, { params }) {
    const { isStaff } = await checkStaff();
    if (!isStaff) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });

    const { id } = await params;
    const admin = createAdminClient();

    const { error } = await admin
        .from('volunteer_applications')
        .delete()
        .eq('id', id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
}
