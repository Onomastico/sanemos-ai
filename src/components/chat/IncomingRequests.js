'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import styles from './IncomingRequests.module.css';

export default function IncomingRequests({ currentUser }) {
    const [requests, setRequests] = useState([]);
    const router = useRouter();
    const supabase = createClient();

    useEffect(() => {
        if (!currentUser) return;

        // Fetch initial pending requests
        const fetchRequests = async () => {
            const { data, error } = await supabase
                .from('chat_requests')
                .select(`
                    id, 
                    message, 
                    sender_id,
                    profiles!chat_requests_sender_id_fkey(full_name, avatar_url)
                `)
                .eq('receiver_id', currentUser.id)
                .eq('status', 'pending');

            if (!error && data) {
                setRequests(data);
            }
        };

        fetchRequests();

        // Subscribe to changes
        const channel = supabase
            .channel('public:chat_requests')
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'chat_requests', filter: `receiver_id=eq.${currentUser.id}` },
                async (payload) => {
                    const newReq = payload.new;
                    if (newReq.status === 'pending') {
                        // Fetch sender profile details to display
                        const { data: profile } = await supabase.from('profiles').select('full_name, avatar_url').eq('id', newReq.sender_id).single();

                        setRequests(prev => [...prev, {
                            ...newReq,
                            profiles: profile || null
                        }]);
                    }
                }
            )
            .on(
                'postgres_changes',
                { event: 'UPDATE', schema: 'public', table: 'chat_requests', filter: `receiver_id=eq.${currentUser.id}` },
                (payload) => {
                    if (payload.new.status !== 'pending') {
                        // Remove from list if status changes
                        setRequests(prev => prev.filter(r => r.id !== payload.new.id));
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [currentUser, supabase]);

    const handleRespond = async (id, status) => {
        // Optimistically remove from UI
        setRequests(prev => prev.filter(r => r.id !== id));

        const res = await fetch(`/api/chat/requests/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status })
        });

        if (res.ok) {
            const data = await res.json();
            if (status === 'accepted' && data.conversation) {
                // Redirect to the newly created conversation
                // Determine locale from path or default to en
                const locale = window.location.pathname.split('/')[1] || 'en';
                router.push(`/${locale}/chat/${data.conversation.id}`);
            }
        } else {
            // Error handling could recreate the request in the list but keeping it simple for now
            console.error('Error responding to request');
        }
    };

    if (requests.length === 0) return null;

    return (
        <div className={styles.container}>
            {requests.map(req => {
                const senderName = req.profiles?.full_name || 'Alguien';
                return (
                    <div key={req.id} className={styles.requestCard}>
                        <div className={styles.header}>
                            <span>👋</span>
                            <span>{senderName} quiere chatear contigo</span>
                        </div>
                        <div className={styles.body}>
                            {req.message ? `"${req.message}"` : `Te han enviado una solicitud de chat privado.`}
                        </div>
                        <div className={styles.actions}>
                            <button
                                className={`${styles.btn} ${styles.rejectBtn}`}
                                onClick={() => handleRespond(req.id, 'rejected')}
                            >
                                Rechazar
                            </button>
                            <button
                                className={`${styles.btn} ${styles.acceptBtn}`}
                                onClick={() => handleRespond(req.id, 'accepted')}
                            >
                                Aceptar
                            </button>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
