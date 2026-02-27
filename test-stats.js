const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(url, key);

async function test() {
    console.log("Testing profiles...");
    const { count: c1, error: e1 } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
    console.log("Profiles:", c1, e1);

    console.log("Testing resources...");
    const { count: c2, error: e2 } = await supabase.from('resources').select('*', { count: 'exact', head: true });
    console.log("Resources:", c2, e2);

    console.log("Testing therapists...");
    const { count: c3, error: e3 } = await supabase.from('therapists').select('*', { count: 'exact', head: true });
    console.log("Therapists:", c3, e3);
}

test();
