const { createClient } = require('@supabase/supabase-js');
const { loadEnvConfig } = require('@next/env');

const projectDir = process.cwd();
loadEnvConfig(projectDir);

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error("❌ Missing Supabase URL or Service Role Key in .env.local");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function cleanDatabase() {
    console.log("🧹 Inciando limpieza de la base de datos de chats...");

    try {
        // 1. Delete all messages
        console.log("-> Eliminando mensajes...");
        const { error: msgError } = await supabase
            .from('messages')
            .delete()
            .not('id', 'is', null);

        if (msgError) throw msgError;

        // 2. Delete all chat participants
        console.log("-> Eliminando participantes de las conversaciones...");
        const { error: partError } = await supabase
            .from('conversation_participants')
            .delete()
            .not('conversation_id', 'is', null);

        if (partError) throw partError;

        // 3. Delete all chat requests (if any exist)
        console.log("-> Eliminando solicitudes de chat pendientes...");
        const { error: reqError } = await supabase
            .from('chat_requests')
            .delete()
            .not('id', 'is', null);

        if (reqError && reqError.code !== '42P01') {
            // Ignoramos el error si la tabla no existe (42P01)
            throw reqError;
        }

        // 4. Delete all conversations
        console.log("-> Eliminando conversaciones...");
        const { error: convError } = await supabase
            .from('conversations')
            .delete()
            .not('id', 'is', null);

        if (convError) throw convError;

        console.log("✅ ¡Limpieza completada con éxito! Todos los chats han sido borrados.");

    } catch (error) {
        console.error("❌ Error durante la limpieza:", error.message || error);
    }
}

cleanDatabase();
