'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

const PresenceContext = createContext({ onlineUsers: [], onlineCount: 0 });

// Single presence provider for the entire app.
// Ensures only ONE room:global channel is ever open per session,
// preventing channel removal conflicts when multiple components called usePresence.
export function PresenceProvider({ children }) {
    const [onlineUsers, setOnlineUsers] = useState([]);
    const [profileId, setProfileId] = useState(null);
    const [profileData, setProfileData] = useState(null);

    // Fetch profile once on auth state change
    useEffect(() => {
        const supabase = createClient();

        const loadProfile = async (user) => {
            if (!user) { setProfileId(null); setProfileData(null); return; }
            const { data } = await supabase
                .from('profiles')
                .select('id, display_name, avatar_url, loss_type, worldview')
                .eq('id', user.id)
                .single();
            const profile = data || { id: user.id };
            // Fallback name from auth metadata (email prefix or full_name)
            profile._authName = user.user_metadata?.full_name || user.email?.split('@')[0];
            setProfileData(profile);
            setProfileId(profile.id);
        };

        supabase.auth.getUser().then(({ data: { user } }) => loadProfile(user));

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            loadProfile(session?.user ?? null);
        });

        return () => subscription.unsubscribe();
    }, []);

    // Single presence channel — only recreated when the user's ID changes (login/logout)
    useEffect(() => {
        if (!profileId) return;

        const supabase = createClient();
        const room = supabase.channel('room:global', {
            config: { presence: { key: profileId } },
        });

        const updateState = () => {
            const state = room.presenceState();
            const users = [];
            for (const key in state) {
                if (state[key]?.length > 0) users.push(state[key][0]);
            }
            setOnlineUsers(users);
        };

        room
            .on('presence', { event: 'sync' }, updateState)
            .on('presence', { event: 'join' }, updateState)
            .on('presence', { event: 'leave' }, updateState)
            .subscribe(async (status) => {
                if (status === 'SUBSCRIBED') {
                    await room.track({
                        id: profileId,
                        name: profileData?.display_name || profileData?._authName || 'Anonymous',
                        loss_type: profileData?.loss_type || null,
                        worldview: profileData?.worldview || null,
                        avatar: profileData?.avatar_url || null,
                        online_at: new Date().toISOString(),
                    });
                }
            });

        return () => {
            room.untrack();
            supabase.removeChannel(room);
        };
    }, [profileId]); // eslint-disable-line react-hooks/exhaustive-deps

    return (
        <PresenceContext.Provider value={{ onlineUsers, onlineCount: onlineUsers.length }}>
            {children}
        </PresenceContext.Provider>
    );
}

export function usePresenceData() {
    return useContext(PresenceContext);
}
