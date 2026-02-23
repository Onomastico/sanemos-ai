'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export function usePresence(userInfo) {
    const [onlineUsers, setOnlineUsers] = useState([]);
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

        const updateStateFromPresence = () => {
            const newState = room.presenceState();
            const usersArray = [];
            for (const key in newState) {
                if (newState[key] && newState[key].length > 0) {
                    usersArray.push(newState[key][0]); // Get the most recent state
                }
            }
            // Sort by name or keep default order
            setOnlineUsers(usersArray);
        };

        room
            .on('presence', { event: 'sync' }, () => {
                updateStateFromPresence();
            })
            .on('presence', { event: 'join' }, () => {
                updateStateFromPresence();
            })
            .on('presence', { event: 'leave' }, () => {
                updateStateFromPresence();
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

    return {
        onlineUsers: onlineUsers,
        onlineCount: onlineUsers.length,
    };
}
