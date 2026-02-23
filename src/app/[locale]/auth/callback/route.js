import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request) {
    const { searchParams, origin } = new URL(request.url);
    const code = searchParams.get('code');
    const locale = searchParams.get('locale') || 'en';

    if (code) {
        const supabase = await createClient();
        const { error } = await supabase.auth.exchangeCodeForSession(code);

        if (!error) {
            // After email confirmation, create the profile
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                await supabase.from('profiles').upsert({
                    id: user.id,
                    display_name: user.user_metadata?.display_name || 'User',
                    role: 'user',
                    locale: user.user_metadata?.locale || 'en',
                });
            }
            return NextResponse.redirect(`${origin}/${locale}/dashboard`);
        }
    }

    return NextResponse.redirect(`${origin}/${locale}/auth/login`);
}
