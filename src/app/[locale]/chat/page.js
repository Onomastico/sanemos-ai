'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { getAllAgents } from '@/lib/ai/agents';
import AgentCard from '@/components/chat/AgentCard';
import CommunityOnline from '@/components/chat/CommunityOnline';
import IncomingRequests from '@/components/chat/IncomingRequests';
import { usePresenceData } from '@/context/PresenceContext';
import styles from './chat.module.css';

export default function ChatPage() {
    const t = useTranslations('chat');
    const pathname = usePathname();
    const router = useRouter();
    const locale = pathname.split('/')[1] || 'en';

    const [user, setUser] = useState(null);
    const [profile, setProfile] = useState(null);
    const [conversations, setConversations] = useState([]);
    const [publicRooms, setPublicRooms] = useState([]);
    const [loading, setLoading] = useState(true);
    const agents = getAllAgents();

    // Global presence — reads from single shared channel (PresenceProvider in layout)
    const { onlineUsers } = usePresenceData();

    // Search state
    const [searchQuery, setSearchQuery] = useState('');
    const [agentFilter, setAgentFilter] = useState('');
    const [lossFilter, setLossFilter] = useState('');
    const [worldviewFilter, setWorldviewFilter] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [searching, setSearching] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);

    useEffect(() => {
        const init = async () => {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                router.push(`/${locale}/auth/login`);
                return;
            }
            setUser(user);

            // Fetch profile for presence
            const { data: profileData } = await supabase.from('profiles').select('*').eq('id', user.id).single();
            setProfile(profileData || { id: user.id, full_name: user.user_metadata?.full_name });

            // Fetch conversations
            const res = await fetch('/api/chat/conversations');
            if (res.ok) {
                const data = await res.json();
                setConversations(data.conversations || []);
            }

            // Fetch public rooms
            const fetchPublicRooms = async () => {
                const publicRes = await fetch('/api/chat/public');
                if (publicRes.ok) {
                    const pdata = await publicRes.json();
                    setPublicRooms(pdata.conversations || []);
                }
            };

            await fetchPublicRooms();
            setLoading(false);

            // Subscribe to public room updates
            const channel = supabase
                .channel('public-rooms-list')
                .on(
                    'postgres_changes',
                    { event: '*', schema: 'public', table: 'conversations', filter: "visibility=eq.public" },
                    () => {
                        fetchPublicRooms();
                    }
                )
                .subscribe();

            return () => {
                supabase.removeChannel(channel);
            };
        };

        const cleanup = init();
        return () => {
            cleanup.then(clean => {
                if (typeof clean === 'function') clean();
            });
        };
    }, [locale, router]);

    const startChat = async (agentId) => {
        const res = await fetch('/api/chat/conversations', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ agentType: agentId }),
        });

        if (res.ok) {
            const data = await res.json();
            router.push(`/${locale}/chat/${data.conversation.id}`);
        }
    };

    const startPublicChat = async () => {
        const title = prompt(t('publicRoomPrompt') || "Escribe un nombre o tema para la sala pública:");
        if (!title) return;

        const res = await fetch('/api/chat/conversations', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                agentType: null,
                title: title,
                visibility: 'public',
                lossType: profile?.loss_type || null
            }),
        });

        if (res.ok) {
            const data = await res.json();
            router.push(`/${locale}/chat/${data.conversation.id}`);
        }
    };

    // Search handler
    const handleSearch = async () => {
        if (!searchQuery && !lossFilter && !worldviewFilter) return;
        setSearching(true);
        setHasSearched(true);

        const params = new URLSearchParams();
        if (searchQuery) params.set('q', searchQuery);
        if (lossFilter) params.set('loss_type', lossFilter);
        if (worldviewFilter) params.set('worldview', worldviewFilter);
        // We aren't filtering by agent on the backend yet, but we will leave the UI filter if we want to filter on frontend
        // Assuming the backend handles the main ones

        const res = await fetch(`/api/chat/search?${params}`);
        if (res.ok) {
            const data = await res.json();
            setSearchResults(data.conversations || []);
        }
        setSearching(false);
    };

    const clearSearch = () => {
        setSearchQuery('');
        setAgentFilter('');
        setSearchResults([]);
        setHasSearched(false);
    };

    const highlightMatch = (text, query) => {
        if (!query || !text) return text;
        const idx = text.toLowerCase().indexOf(query.toLowerCase());
        if (idx === -1) return text.length > 120 ? text.slice(0, 120) + '...' : text;

        const start = Math.max(0, idx - 40);
        const end = Math.min(text.length, idx + query.length + 60);
        const snippet = (start > 0 ? '...' : '') + text.slice(start, end) + (end < text.length ? '...' : '');

        const parts = snippet.split(new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'));
        return parts.map((part, i) =>
            part.toLowerCase() === query.toLowerCase()
                ? <mark key={i} className={styles.highlight}>{part}</mark>
                : part
        );
    };

    const agentEmojis = {
        luna: '🫂', marco: '🧭', serena: '🧘', alma: '📖', faro: '🚨'
    };

    // Filter conversation history by agent
    const filteredConversations = agentFilter && !hasSearched
        ? conversations.filter(c => c.ai_agent_type === agentFilter)
        : conversations;

    const humanHistory = filteredConversations.filter(c => c.type !== 'ai');
    const aiHistory = filteredConversations.filter(c => c.type === 'ai');

    const humanSearchResults = searchResults.filter(c => c.type !== 'ai');
    const aiSearchResults = searchResults.filter(c => c.type === 'ai');

    if (!user) return null;

    return (
        <div className={styles.chatPage}>
            <IncomingRequests currentUser={user} />
            <div className={styles.container}>
                {/* Community / Human Connection Section */}
                <section className={styles.agentSection} style={{ textAlign: 'center', marginBottom: 'var(--space-xl)', background: 'var(--bg-secondary)', padding: 'var(--space-xl)', borderRadius: 'var(--radius-lg)' }}>
                    <h1 style={{ marginBottom: 'var(--space-sm)' }}>👥 {t('communityTitle') || 'Connect with Real People'}</h1>
                    <p className={styles.subtitle} style={{ marginBottom: 'var(--space-md)' }}>
                        {t('communitySubtitle') || 'Start a conversation with others who understand what you are going through.'}
                    </p>
                    <button className="btn btn-primary btn-lg" onClick={startPublicChat}>
                        {t('startCommunityChat') || 'Start a Public Room'}
                    </button>
                </section>

                {/* Community Online Section */}
                <section style={{ marginBottom: 'var(--space-xl)', height: '350px' }}>
                    <CommunityOnline
                        onlineUsers={onlineUsers}
                        currentUser={user}
                        onRequestChat={async (targetUser) => {
                            const res = await fetch('/api/chat/requests', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ receiverId: targetUser.id })
                            });
                            if (res.ok) {
                                alert(t('requestSent', { name: targetUser.name }) || `Solicitud enviada a ${targetUser.name}`);
                            } else {
                                alert(t('requestError') || 'Error al enviar solicitud.');
                            }
                        }}
                    />
                </section>

                {/* Public Rooms Section */}
                <section style={{ marginBottom: 'var(--space-xl)' }}>
                    <h2>🌐 {t('publicRoomsTitle') || 'Salas Públicas'}</h2>
                    {loading ? (
                        <div className="skeleton" style={{ height: '72px', borderRadius: 'var(--radius-md)' }} />
                    ) : publicRooms.length === 0 ? (
                        <p className={styles.emptyHistory}>{t('noPublicRooms') || 'No hay salas públicas creadas todavía. ¡Sé el primero en crear una!'}</p>
                    ) : (
                        <div className={styles.historyList}>
                            {publicRooms.map((room) => (
                                <button
                                    key={room.id}
                                    className={styles.historyItem}
                                    onClick={() => router.push(`/${locale}/chat/${room.id}`)}
                                >
                                    <span className={styles.historyEmoji}>🌐</span>
                                    <div className={styles.historyContent}>
                                        <span className={styles.historyTitle}>{room.title || t('publicRoomDefaultTitle') || 'Sala Pública'}</span>
                                        <div style={{ display: 'flex', gap: 'var(--space-xs)', flexWrap: 'wrap', marginTop: 'var(--space-xs)' }}>
                                            {room.loss_type && <span className="badge badge-warm">{room.loss_type}</span>}
                                            {room.worldview && <span className="badge badge-calm">{room.worldview}</span>}
                                        </div>
                                    </div>
                                    <span className={styles.historyTime}>
                                        {new Date(room.updated_at).toLocaleDateString()}
                                    </span>
                                </button>
                            ))}
                        </div>
                    )}
                </section>

                <section className={styles.searchSection}>
                    <h2>🔍 {t('searchTitle')}</h2>

                    <div className={styles.searchBar}>
                        <input
                            type="text"
                            className="form-input"
                            placeholder={t('searchPlaceholder')}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                        />
                        <select
                            className="form-input form-select"
                            value={lossFilter}
                            onChange={(e) => setLossFilter(e.target.value)}
                            style={{ maxWidth: '160px' }}
                        >
                            <option value="">{t('allLossTypes') || 'All Loss Types'}</option>
                            {['parent', 'child', 'partner', 'sibling', 'friend', 'pet', 'general', 'other'].map(lt => (
                                <option key={lt} value={lt}>{lt}</option>
                            ))}
                        </select>
                        <select
                            className="form-input form-select"
                            value={worldviewFilter}
                            onChange={(e) => setWorldviewFilter(e.target.value)}
                            style={{ maxWidth: '160px' }}
                        >
                            <option value="">{t('allWorldviews') || 'All Viewpoints'}</option>
                            {['secular', 'spiritual', 'christian', 'jewish', 'muslim', 'buddhist', 'hindu', 'universal'].map(wv => (
                                <option key={wv} value={wv}>{wv}</option>
                            ))}
                        </select>
                        <button className="btn btn-primary btn-sm" onClick={handleSearch} disabled={searching || (!searchQuery && !lossFilter && !worldviewFilter)}>
                            {searching ? '...' : t('searchBtn')}
                        </button>
                        {hasSearched && (
                            <button className="btn btn-sm" onClick={clearSearch}>✕</button>
                        )}
                    </div>

                    {/* Search Results */}
                    {hasSearched && (
                        <div className={styles.searchResults}>
                            {searchResults.length === 0 ? (
                                <p className={styles.noSearchResults}>{t('noSearchResults')}</p>
                            ) : (
                                <>
                                    <p className={styles.searchCount} style={{ marginBottom: 'var(--space-md)' }}>
                                        {searchResults.length} {t('matchesFound')}
                                    </p>

                                    {humanSearchResults.length > 0 && (
                                        <div style={{ marginBottom: 'var(--space-lg)' }}>
                                            <h3 style={{ marginBottom: 'var(--space-sm)' }}>👥 {t('realPeople') || 'Real People'}</h3>
                                            <div className={styles.historyList}>
                                                {humanSearchResults.map((conv) => (
                                                    <button
                                                        key={conv.id}
                                                        className={styles.historyItem}
                                                        onClick={() => router.push(`/${locale}/chat/${conv.id}`)}
                                                        style={{ textAlign: 'left', width: '100%', display: 'flex', flexDirection: 'column' }}
                                                    >
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', marginBottom: 'var(--space-xs)' }}>
                                                            <strong>
                                                                <span className={styles.historyEmoji}>👥</span>
                                                                {conv.title || t('untitledConversation') || 'Untitled Conversation'}
                                                            </strong>
                                                            <span className={styles.historyTime}>
                                                                {new Date(conv.updated_at).toLocaleDateString()}
                                                            </span>
                                                        </div>

                                                        {conv.summary && (
                                                            <span className={styles.historyPreview} style={{ marginBottom: 'var(--space-xs)' }}>
                                                                {highlightMatch(conv.summary, searchQuery)}
                                                            </span>
                                                        )}

                                                        <div style={{ display: 'flex', gap: 'var(--space-xs)', flexWrap: 'wrap', marginTop: 'var(--space-xs)' }}>
                                                            {conv.visibility === 'public' && <span className="badge badge-primary">🌐 Public</span>}
                                                            {conv.visibility === 'shared' && <span className="badge badge-sage">🤝 Shared</span>}
                                                            {conv.loss_type && <span className="badge badge-warm">{conv.loss_type}</span>}
                                                            {conv.worldview && <span className="badge badge-calm">{conv.worldview}</span>}
                                                        </div>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {aiSearchResults.length > 0 && (
                                        <div>
                                            <h3 style={{ marginBottom: 'var(--space-sm)' }}>🤖 {t('title') || 'AI Companions'}</h3>
                                            <div className={styles.historyList}>
                                                {aiSearchResults.map((conv) => (
                                                    <button
                                                        key={conv.id}
                                                        className={styles.historyItem}
                                                        onClick={() => router.push(`/${locale}/chat/${conv.id}`)}
                                                        style={{ textAlign: 'left', width: '100%', display: 'flex', flexDirection: 'column' }}
                                                    >
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', marginBottom: 'var(--space-xs)' }}>
                                                            <strong>
                                                                <span className={styles.historyEmoji}>
                                                                    {agentEmojis[conv.ai_agent_type]}
                                                                </span>
                                                                {conv.title || t('untitledConversation') || 'Untitled Conversation'}
                                                            </strong>
                                                            <span className={styles.historyTime}>
                                                                {new Date(conv.updated_at).toLocaleDateString()}
                                                            </span>
                                                        </div>

                                                        {conv.summary && (
                                                            <span className={styles.historyPreview} style={{ marginBottom: 'var(--space-xs)' }}>
                                                                {highlightMatch(conv.summary, searchQuery)}
                                                            </span>
                                                        )}

                                                        <div style={{ display: 'flex', gap: 'var(--space-xs)', flexWrap: 'wrap', marginTop: 'var(--space-xs)' }}>
                                                            {conv.loss_type && <span className="badge badge-warm">{conv.loss_type}</span>}
                                                            {conv.worldview && <span className="badge badge-calm">{conv.worldview}</span>}
                                                        </div>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    )}
                </section>

                {/* Conversation History */}
                <section className={styles.historySection} style={{ marginTop: 'var(--space-xl)' }}>
                    <h2>{t('history')} - Real Conversations</h2>

                    {loading ? (
                        <div className={styles.historyList}>
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="skeleton" style={{ height: '72px', borderRadius: 'var(--radius-md)' }} />
                            ))}
                        </div>
                    ) : humanHistory.length === 0 ? (
                        <div className={styles.emptyHistory}>
                            <p>{t('noConversations')}</p>
                        </div>
                    ) : (
                        <div className={styles.historyList}>
                            {humanHistory.map((conv) => (
                                <button
                                    key={conv.id}
                                    className={styles.historyItem}
                                    onClick={() => router.push(`/${locale}/chat/${conv.id}`)}
                                >
                                    <span className={styles.historyEmoji}>👥</span>
                                    <div className={styles.historyContent}>
                                        <span className={styles.historyTitle}>{conv.title}</span>
                                        <span className={styles.historyPreview}>
                                            {conv.lastMessage?.content?.slice(0, 60) || t('noMessages')}
                                            {conv.lastMessage?.content?.length > 60 ? '...' : ''}
                                        </span>
                                        <div style={{ display: 'flex', gap: 'var(--space-xs)', flexWrap: 'wrap', marginTop: 'var(--space-xs)' }}>
                                            {conv.visibility === 'public' && <span className="badge badge-primary">🌐 Public</span>}
                                            {conv.visibility === 'shared' && <span className="badge badge-sage">🤝 Shared</span>}
                                            {conv.loss_type && <span className="badge badge-warm">{conv.loss_type}</span>}
                                            {conv.worldview && <span className="badge badge-calm">{conv.worldview}</span>}
                                        </div>
                                    </div>
                                    <span className={styles.historyTime}>
                                        {new Date(conv.updated_at).toLocaleDateString()}
                                    </span>
                                </button>
                            ))}
                        </div>
                    )}
                </section>
            </div>
        </div>
    );
}
