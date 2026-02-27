'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export function usePresence(userInfo) {
    const [onlineUsers, setOnlineUsers] = useState([]);

    useEffect(() => {
        if (!userInfo || !userInfo.id) return;

        // Create client inside effect so it never changes across renders
        const supabase = createClient();

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
    }, [userInfo?.id]); // Solo depende del ID, no del objeto completo ni del cliente

    return {
        onlineUsers: onlineUsers,
        onlineCount: onlineUsers.length,
    };
}
