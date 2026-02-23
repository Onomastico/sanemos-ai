'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export function usePresence(userInfo) {
    const [onlineUsers, setOnlineUsers] = useState(new Map());
    const supabase = createClient();

    useEffect(() => {
        if (!userInfo || !userInfo.id) return;

        // Use a global room for presence
        const room = supabase.channel('room:global', {
            config: {
                presence: {
                    key: userInfo.id,
                },
            },
        });

        room
            .on('presence', { event: 'sync' }, () => {
                const newState = room.presenceState();
                const users = new Map();
                // presenceState returns an object with arrays of state objects per key
                for (const key in newState) {
                    if (newState[key] && newState[key].length > 0) {
                        users.set(key, newState[key][0]); // Get the most recent state
                    }
                }
                setOnlineUsers(users);
            })
            .on('presence', { event: 'join' }, ({ key, newPresences }) => {
                setOnlineUsers((prev) => {
                    const next = new Map(prev);
                    next.set(key, newPresences[0]);
                    return next;
                });
            })
            .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
                setOnlineUsers((prev) => {
                    const next = new Map(prev);
                    next.delete(key);
                    return next;
                });
            })
            .subscribe(async (status) => {
                if (status === 'SUBSCRIBED') {
                    await room.track({
                        id: userInfo.id,
                        name: userInfo.display_name || userInfo.email?.split('@')[0] || 'Anonymous',
                        loss_type: userInfo.loss_type || null,
                        worldview: userInfo.worldview || null,
                        avatar: userInfo.avatar_url || null,
                        online_at: new Date().toISOString()
                    });
                }
            });

        return () => {
            room.untrack();
            supabase.removeChannel(room);
        };
    }, [userInfo, supabase]);

    // Convert Map to an array of users for the UI
    const usersArray = Array.from(onlineUsers.values());

    return {
        onlineUsers: usersArray,
        onlineCount: usersArray.length,
    };
}
