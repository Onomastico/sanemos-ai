'use client';

import { useState, useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { usePathname, useRouter, useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { getAgent } from '@/lib/ai/agents';
import styles from '../chat.module.css';

export default function ChatViewPage() {
    const t = useTranslations('chat');
    const tCommon = useTranslations('common');
    const pathname = usePathname();
    const router = useRouter();
    const params = useParams();
    const locale = pathname.split('/')[1] || 'en';
    const conversationId = params.id;

    const [user, setUser] = useState(null);
    const [conversation, setConversation] = useState(null);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [sending, setSending] = useState(false);
    const [loading, setLoading] = useState(true);
    const [participants, setParticipants] = useState([]);

    // Scroll state
    const [isNearBottom, setIsNearBottom] = useState(true);

    // Mentions state
    const [showMentions, setShowMentions] = useState(false);
    const [mentionSearch, setMentionSearch] = useState('');
    const [mentionIndex, setMentionIndex] = useState(-1);

    // Participants state
    const [showParticipants, setShowParticipants] = useState(false);

    // Settings modal state
    const [showSettings, setShowSettings] = useState(false);
    const [settingsForm, setSettingsForm] = useState({
        visibility: 'private',
        loss_type: '',
        worldview: '',
        shared_with_user_ids: ''
    });
    const [savingSettings, setSavingSettings] = useState(false);
    const [settingsMessage, setSettingsMessage] = useState('');

    const messagesEndRef = useRef(null);
    const messagesContainerRef = useRef(null);
    const inputRef = useRef(null);

    const agent = conversation?.ai_agent_type ? getAgent(conversation.ai_agent_type) : null;

    // Scroll to bottom
    const scrollToBottom = (force = false) => {
        if (force || isNearBottom) {
            if (messagesContainerRef.current) {
                messagesContainerRef.current.scrollTo({
                    top: messagesContainerRef.current.scrollHeight,
                    behavior: 'smooth'
                });
            }
        }
    };

    const handleScroll = () => {
        const container = messagesContainerRef.current;
        if (!container) return;
        const { scrollTop, scrollHeight, clientHeight } = container;
        const atBottom = scrollHeight - scrollTop - clientHeight < 100;
        setIsNearBottom(atBottom);
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Init: load user, conversation, messages
    useEffect(() => {
        const init = async () => {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                router.push(`/${locale}/auth/login`);
                return;
            }
            setUser(user);

            // Fetch current user's profile to add them to participants if needed
            const { data: userProfile } = await supabase
                .from('profiles')
                .select('display_name, avatar_url, loss_type, worldview')
                .eq('id', user.id)
                .single();

            // Load conversation
            const { data: conv } = await supabase
                .from('conversations')
                .select('*')
                .eq('id', conversationId)
                .single();

            setConversation(conv);

            if (!conv?.ai_agent_type) {
                // Load participants
                const { data: participantsData, error: partErr } = await supabase
                    .from('conversation_participants')
                    .select('user_id, profiles(*)')
                    .eq('conversation_id', conversationId);

                if (partErr) {
                    console.error("Error loading participants:", partErr.message || JSON.stringify(partErr));
                }

                if (participantsData) {
                    const loadedParticipants = participantsData.map(p => ({
                        user_id: p.user_id,
                        ...p.profiles
                    }));

                    if (!loadedParticipants.some(p => p.user_id === user.id) && userProfile) {
                        loadedParticipants.unshift({
                            user_id: user.id,
                            ...userProfile
                        });
                    }

                    setParticipants(loadedParticipants);
                }
            }

            // Load messages
            const { data: msgs } = await supabase
                .from('messages')
                .select('*')
                .eq('conversation_id', conversationId)
                .order('created_at', { ascending: true });

            setMessages(msgs || []);
            setLoading(false);

            // Subscribe to new messages via Supabase Realtime
            const channel = supabase
                .channel(`messages:${conversationId}`)
                .on(
                    'postgres_changes',
                    {
                        event: 'INSERT',
                        schema: 'public',
                        table: 'messages',
                        filter: `conversation_id=eq.${conversationId}`,
                    },
                    (payload) => {
                        setMessages((prev) => {
                            // If we already have the real ID, just return
                            if (prev.some((m) => m.id === payload.new.id)) return prev;

                            // If we have a temp message that matches content and sender, replace it with the real one
                            const tempIndex = prev.findIndex(m => m.id.startsWith('temp-') && m.content === payload.new.content && m.sender_type === payload.new.sender_type);

                            if (tempIndex !== -1) {
                                const newMessages = [...prev];
                                newMessages[tempIndex] = payload.new;
                                return newMessages;
                            }

                            // Otherwise, add it
                            return [...prev, payload.new];
                        });
                    }
                )
                .subscribe();

            return () => {
                supabase.removeChannel(channel);
            };
        };

        init();
    }, [conversationId, locale, router]);

    const handleSaveSettings = async (e) => {
        e.preventDefault();
        setSavingSettings(true);
        setSettingsMessage('');

        try {
            // Process comma-separated IDs if any
            let userIdsArray = [];
            if (settingsForm.visibility === 'shared' && settingsForm.shared_with_user_ids) {
                userIdsArray = settingsForm.shared_with_user_ids.split(',').map(id => id.trim()).filter(id => id);
            }

            const payload = {
                visibility: settingsForm.visibility,
                loss_type: settingsForm.loss_type || null,
                worldview: settingsForm.worldview || null,
                shared_with_user_ids: userIdsArray
            };

            const res = await fetch(`/api/chat/${conversationId}/share`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                const data = await res.json();
                setConversation(data.conversation);
                setSettingsMessage(t('settingsSaved') || 'Settings saved successfully');
                setTimeout(() => {
                    setShowSettings(false);
                    setSettingsMessage('');
                }, 2000);
            } else {
                const err = await res.json();
                setSettingsMessage(`Error: ${err.error}`);
            }
        } catch (err) {
            setSettingsMessage(`Error: ${err.message}`);
        }
        setSavingSettings(false);
    };

    const handleSend = async (e) => {
        e.preventDefault();
        if (!input.trim() || sending) return;

        const content = input.trim();
        setInput('');
        setSending(true);

        // Optimistic UI — add user message immediately
        const tempUserMsg = {
            id: `temp-${Date.now()}`,
            conversation_id: conversationId,
            sender_id: user?.id,
            content,
            sender_type: 'user',
            created_at: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, tempUserMsg]);
        setTimeout(() => scrollToBottom(true), 50); // Force scroll when user sends

        try {
            const res = await fetch('/api/chat/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ conversationId, content }),
            });

            if (res.ok) {
                const data = await res.json();
                // If we got an AI response and Realtime didn't catch it yet, add it
                if (data.aiResponse) {
                    const tempAiMsg = {
                        id: `temp-ai-${Date.now()}`,
                        conversation_id: conversationId,
                        content: data.aiResponse.content,
                        sender_type: 'ai',
                        ai_agent_type: data.aiResponse.agent,
                        created_at: new Date().toISOString(),
                    };
                    setMessages((prev) => {
                        if (prev.some((m) => m.content === tempAiMsg.content && m.sender_type === 'ai')) return prev;
                        return [...prev, tempAiMsg];
                    });
                }
            }
        } catch (err) {
            console.error('Send error:', err);
        }

        setSending(false);
        inputRef.current?.focus();
        scrollToBottom(true);
    };

    const handleInputChange = (e) => {
        const val = e.target.value;
        setInput(val);

        const cursorPosition = e.target.selectionStart;
        const textBeforeCursor = val.substring(0, cursorPosition);
        const lastAtSymbolIndex = textBeforeCursor.lastIndexOf('@');

        if (lastAtSymbolIndex !== -1) {
            if (lastAtSymbolIndex === 0 || val[lastAtSymbolIndex - 1] === ' ' || val[lastAtSymbolIndex - 1] === '\n') {
                const searchStr = textBeforeCursor.substring(lastAtSymbolIndex + 1);
                if (!searchStr.includes(' ')) {
                    setMentionSearch(searchStr);
                    setShowMentions(true);
                    setMentionIndex(lastAtSymbolIndex);
                    return;
                }
            }
        }
        setShowMentions(false);
    };

    const insertMention = (displayName) => {
        const textBefore = input.substring(0, mentionIndex);
        const cursorPosition = inputRef.current?.selectionStart || input.length;
        const textAfter = input.substring(cursorPosition);

        const alias = displayName.replace(/\s+/g, '');
        const newText = textBefore + `@${alias} ` + textAfter;
        setInput(newText);
        setShowMentions(false);
        inputRef.current?.focus();
    };

    const renderMessageContent = (content) => {
        if (!content) return null;
        const parts = content.split(/(@\S+)/g);
        return parts.map((part, i) => {
            if (part.startsWith('@')) {
                return <span key={i} className={styles.mention}>{part}</span>;
            }
            return <span key={i}>{part}</span>;
        });
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend(e);
        }
    };

    if (loading) {
        return (
            <div className={styles.chatViewPage}>
                <div className={styles.messagesContainer}>
                    <div className="skeleton" style={{ height: '100%', borderRadius: 'var(--radius-lg)' }} />
                </div>
            </div>
        );
    }

    return (
        <div className={styles.chatViewPage}>
            {/* Header */}
            <div className={styles.chatHeader} style={{ position: 'relative' }}>
                <button
                    className={styles.chatBackBtn}
                    onClick={() => {
                        if (agent) {
                            router.push(`/${locale}/companions`);
                        } else {
                            router.push(`/${locale}/chat`);
                        }
                    }}
                >
                    ←
                </button>
                {agent ? (
                    <div className={`${styles.chatAgentInfo} ${styles.agentTooltipContainer}`} style={{ flexGrow: 1 }}>
                        <span className={styles.chatAgentEmoji}>{agent.emoji}</span>
                        <div>
                            <div className={styles.chatAgentName}>{agent.name}</div>
                            <div className={styles.chatAgentFocus}>{agent.focus[locale] || agent.focus.en}</div>
                        </div>
                        <div className={styles.agentTooltip}>
                            <strong>{agent.name}</strong>
                            <p>{agent.description[locale] || agent.description.en}</p>
                        </div>
                    </div>
                ) : (
                    <div className={styles.chatAgentInfo} style={{ flexGrow: 1 }}>
                        <span className={styles.chatAgentEmoji}>👥</span>
                        <div className={styles.chatAgentName}>{conversation?.title || 'Chat'}</div>
                    </div>
                )}

                {!agent && (
                    <button
                        className={`btn btn-sm ${styles.mobileOnlyBtn} ${showParticipants ? 'btn-primary' : ''}`}
                        onClick={() => setShowParticipants(!showParticipants)}
                        title={t('participants') || 'Participants'}
                    >
                        👥
                    </button>
                )}

                <button
                    className="btn btn-sm"
                    onClick={() => {
                        setSettingsForm({
                            visibility: conversation?.visibility || 'private',
                            loss_type: conversation?.loss_type || '',
                            worldview: conversation?.worldview || '',
                            shared_with_user_ids: '' // We don't fetch existing shares for simplicity yet
                        });
                        setShowSettings(!showSettings);
                    }}
                    title={t('settings') || 'Settings'}
                >
                    ⚙️
                </button>

                {/* Settings Dropdown */}
                {showSettings && (
                    <>
                        <div className={styles.settingsOverlay} onClick={() => setShowSettings(false)}></div>
                        <div className={styles.settingsDropdown}>
                            <h2>⚙️ {t('settings') || 'Settings & Sharing'}</h2>
                            <form onSubmit={handleSaveSettings} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)', marginTop: 'var(--space-md)' }}>
                                <div className="form-group">
                                    <label className="form-label">{t('visibility') || 'Visibility'}</label>
                                    <select
                                        className="form-input form-select"
                                        value={settingsForm.visibility}
                                        onChange={(e) => setSettingsForm({ ...settingsForm, visibility: e.target.value })}
                                    >
                                        <option value="private">{t('visibilityPrivate') || 'Private'}</option>
                                        <option value="public">{t('visibilityPublic') || 'Public'}</option>
                                        <option value="shared">{t('visibilityShared') || 'Shared'}</option>
                                    </select>
                                </div>

                                {settingsForm.visibility === 'shared' && (
                                    <div className="form-group">
                                        <label className="form-label">{t('shareUsers') || 'Share with users (IDs, comma separated)'}</label>
                                        <input
                                            type="text"
                                            className="form-input"
                                            value={settingsForm.shared_with_user_ids}
                                            onChange={(e) => setSettingsForm({ ...settingsForm, shared_with_user_ids: e.target.value })}
                                            placeholder="e.g. 123e4567-e89b-12d3... , ..."
                                        />
                                    </div>
                                )}

                                <div className="form-group">
                                    <label className="form-label">{t('lossTypeTag') || 'Loss Type Tag'}</label>
                                    <select
                                        className="form-input form-select"
                                        value={settingsForm.loss_type}
                                        onChange={(e) => setSettingsForm({ ...settingsForm, loss_type: e.target.value })}
                                    >
                                        <option value="">-- None --</option>
                                        {['parent', 'child', 'partner', 'sibling', 'friend', 'pet', 'general', 'other'].map(lt => (
                                            <option key={lt} value={lt}>{lt}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label className="form-label">{t('worldviewTag') || 'Perspective Tag'}</label>
                                    <select
                                        className="form-input form-select"
                                        value={settingsForm.worldview}
                                        onChange={(e) => setSettingsForm({ ...settingsForm, worldview: e.target.value })}
                                    >
                                        <option value="">-- None --</option>
                                        {['secular', 'spiritual', 'christian', 'jewish', 'muslim', 'buddhist', 'hindu', 'universal'].map(wv => (
                                            <option key={wv} value={wv}>{wv}</option>
                                        ))}
                                    </select>
                                </div>

                                {settingsMessage && (
                                    <div style={{ color: settingsMessage.includes('Error') ? 'var(--error)' : 'var(--primary)', fontSize: 'var(--font-sm)', textAlign: 'center' }}>
                                        {settingsMessage}
                                    </div>
                                )}

                                <div style={{ display: 'flex', gap: 'var(--space-md)', justifyContent: 'flex-end', marginTop: 'var(--space-sm)' }}>
                                    <button type="button" className="btn" onClick={() => setShowSettings(false)}>
                                        {tCommon('cancel') || 'Cancel'}
                                    </button>
                                    <button type="submit" className="btn btn-primary" disabled={savingSettings}>
                                        {savingSettings ? '...' : (tCommon('save') || 'Save')}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </>
                )}
            </div>

            {/* Body Wrapper */}
            <div className={styles.chatBodyWrapper}>
                <div className={styles.chatMain}>
                    {/* Messages */}
                    <div className={styles.messagesContainer} ref={messagesContainerRef} onScroll={handleScroll}>
                        {messages.length === 0 && agent && (
                            <div className={styles.welcomeMessage}>
                                <span className={styles.welcomeEmoji}>{agent.emoji}</span>
                                <h2>{t('welcomeAgent', { name: agent.name })}</h2>
                                <p>{agent.description[locale] || agent.description.en}</p>
                            </div>
                        )}

                        {messages.map((msg) => {
                            const isOwnMessage = msg.sender_id === user?.id;

                            return (
                                <div
                                    key={msg.id}
                                    className={`${styles.messageRow} ${isOwnMessage ? styles.messageRowUser : styles.messageRowAi}`}
                                >
                                    {msg.sender_type !== 'user' && (
                                        <span className={styles.messageAvatar}>
                                            {agent?.emoji || '🤖'}
                                        </span>
                                    )}
                                    {msg.sender_type === 'user' && (
                                        <span className={styles.messageAvatar}>
                                            {participants.find(p => p.user_id === msg.sender_id)?.avatar_url ? (
                                                <img src={participants.find(p => p.user_id === msg.sender_id).avatar_url} alt="" style={{ width: '24px', height: '24px', borderRadius: '50%', objectFit: 'cover' }} />
                                            ) : '👤'}
                                        </span>
                                    )}
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: isOwnMessage ? 'flex-end' : 'flex-start' }}>
                                        {!isOwnMessage && msg.sender_type === 'user' && !agent && (
                                            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px', marginLeft: '4px' }}>
                                                {participants.find(p => p.user_id === msg.sender_id)?.display_name || 'Anonymous'}
                                            </div>
                                        )}
                                        <div
                                            className={`${styles.messageBubble} ${isOwnMessage ? styles.messageBubbleUser : styles.messageBubbleAi}`}
                                        >
                                            {renderMessageContent(msg.content)}
                                        </div>
                                        <div className={`${styles.messageTime} ${isOwnMessage ? styles.messageTimeUser : ''}`}>
                                            {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                    </div>
                                </div>
                            )
                        })}

                        {sending && (
                            <div className={styles.typingIndicator}>
                                <div className={styles.typingDot} />
                                <div className={styles.typingDot} />
                                <div className={styles.typingDot} />
                            </div>
                        )}

                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input */}
                    <div className={styles.chatInputArea} style={{ position: 'relative' }}>
                        {showMentions && participants.length > 0 && (
                            <div className={styles.mentionDropdown}>
                                {participants
                                    .filter(p => p.display_name?.toLowerCase().replace(/\s+/g, '').includes(mentionSearch.toLowerCase()))
                                    .map(p => (
                                        <div
                                            key={p.user_id}
                                            className={styles.mentionItem}
                                            onClick={() => insertMention(p.display_name)}
                                        >
                                            <div className={styles.participantAvatar}>
                                                {p.avatar_url ? <img src={p.avatar_url} alt={p.display_name} /> : "👤"}
                                            </div>
                                            <span className={styles.participantName}>{p.display_name || 'Anonymous'}</span>
                                        </div>
                                    ))
                                }
                            </div>
                        )}
                        <form onSubmit={handleSend} className={styles.chatInputForm}>
                            <textarea
                                ref={inputRef}
                                className={styles.chatInput}
                                value={input}
                                onChange={handleInputChange}
                                onKeyDown={handleKeyDown}
                                placeholder={t('inputPlaceholder')}
                                rows={1}
                                disabled={sending}
                            />
                            <button
                                type="submit"
                                className={styles.chatSendBtn}
                                disabled={!input.trim() || sending}
                            >
                                ↑
                            </button>
                        </form>
                    </div>
                </div>

                {/* Participants Panel */}
                {!agent && (
                    <>
                        {/* Mobile Overlay */}
                        {showParticipants && (
                            <div
                                className={`${styles.participantsOverlay} ${styles.mobileOnlyOverlay}`}
                                onClick={() => setShowParticipants(false)}
                            />
                        )}
                        <div className={`${styles.participantsPanel} ${showParticipants ? styles.participantsPanelOpen : ''}`}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-sm)' }}>
                                <h3>👥 {t('participants') || 'Participantes'}</h3>
                                <button
                                    className={`${styles.chatBackBtn} ${styles.participantsCloseBtn}`}
                                    onClick={() => setShowParticipants(false)}
                                >
                                    ✕
                                </button>
                            </div>
                            <div className={styles.participantList}>
                                {participants.map(p => (
                                    <div key={p.user_id} className={styles.participantCard}>
                                        <div className={styles.participantAvatar}>
                                            {p.avatar_url ? <img src={p.avatar_url} alt={p.display_name} /> : "👤"}
                                        </div>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div className={styles.participantName}>{p.display_name || 'Anonymous'}</div>
                                        </div>
                                        <div className={styles.participantActions}>
                                            <button
                                                className={styles.participantActionBtn}
                                                onClick={() => router.push(`/${locale}/profile/${p.user_id}`)}
                                                title={t('viewProfile') || "Ver perfil"}
                                            >
                                                👁️
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
