'use client';

import { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import styles from '../journal.module.css';

const RichEditor = dynamic(() => import('@/components/journal/RichEditor'), { ssr: false });

const LOSS_TYPES = ['parent','child','partner','sibling','friend','pet','other','general'];
const WORLDVIEWS = ['secular','spiritual','christian','jewish','muslim','buddhist','hindu','universal'];
const EMOTIONS = ['sadness','anger','nostalgia','gratitude','confusion','hope','peace','other'];
const GRIEF_STAGES = ['denial','anger','bargaining','depression','acceptance'];

export default function NewJournalEntry() {
    const pathname = usePathname();
    const router = useRouter();
    const locale = pathname.split('/')[1] || 'en';
    const es = locale === 'es';

    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [loss_type, setLossType] = useState('');
    const [worldview, setWorldview] = useState('');
    const [emotion, setEmotion] = useState('');
    const [grief_stage, setGriefStage] = useState('');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const lossLabels = {
        parent: es ? 'Padre/madre' : 'Parent', child: es ? 'Hijo/a' : 'Child',
        partner: es ? 'Pareja' : 'Partner', sibling: es ? 'Hermano/a' : 'Sibling',
        friend: es ? 'Amigo/a' : 'Friend', pet: es ? 'Mascota' : 'Pet',
        other: es ? 'Otro' : 'Other', general: es ? 'General' : 'General',
    };

    const worldviewLabels = {
        secular: es ? 'Secular' : 'Secular', spiritual: es ? 'Espiritual' : 'Spiritual',
        christian: es ? 'Cristiano' : 'Christian', jewish: es ? 'Judío' : 'Jewish',
        muslim: es ? 'Musulmán' : 'Muslim', buddhist: es ? 'Budista' : 'Buddhist',
        hindu: es ? 'Hindú' : 'Hindu', universal: es ? 'Universal' : 'Universal',
    };

    const emotionLabels = {
        sadness: es ? 'Tristeza 😢' : 'Sadness 😢', anger: es ? 'Enojo 😠' : 'Anger 😠',
        nostalgia: es ? 'Nostalgia 🥹' : 'Nostalgia 🥹', gratitude: es ? 'Gratitud 🙏' : 'Gratitude 🙏',
        confusion: es ? 'Confusión 😵' : 'Confusion 😵', hope: es ? 'Esperanza ✨' : 'Hope ✨',
        peace: es ? 'Paz 🌿' : 'Peace 🌿', other: es ? 'Otro 💭' : 'Other 💭',
    };

    const griefLabels = {
        denial: es ? 'Negación 🙈' : 'Denial 🙈', anger: es ? 'Ira 🔥' : 'Anger 🔥',
        bargaining: es ? 'Negociación 🙏' : 'Bargaining 🙏',
        depression: es ? 'Depresión 🌧️' : 'Depression 🌧️',
        acceptance: es ? 'Aceptación 🌱' : 'Acceptance 🌱',
    };

    const handleSave = async () => {
        if (!content.replace(/<[^>]*>/g, '').trim()) {
            setError(es ? 'El contenido no puede estar vacío.' : 'Content cannot be empty.');
            return;
        }
        setSaving(true);
        setError('');
        const res = await fetch('/api/journal', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title, content, loss_type, worldview, emotion, grief_stage }),
        });
        const data = await res.json();
        setSaving(false);
        if (!res.ok) {
            setError(data.error || (es ? 'Error al guardar.' : 'Error saving.'));
            return;
        }
        router.push(`/${locale}/journal/${data.entry.id}`);
    };

    return (
        <div className={styles.detailPage}>
            <div className={styles.detailHeader}>
                <button className={styles.backBtn} onClick={() => router.push(`/${locale}/journal`)}>
                    ← {es ? 'Mi Diario' : 'My Journal'}
                </button>
            </div>

            <div className={styles.form}>
                {error && <div className="authError" style={{ color: 'var(--accent-alert)', fontSize: 'var(--font-size-sm)' }}>{error}</div>}

                <div className="form-group">
                    <label className="form-label">{es ? 'Título (opcional)' : 'Title (optional)'}</label>
                    <input
                        type="text"
                        className="form-input"
                        value={title}
                        onChange={e => setTitle(e.target.value)}
                        placeholder={es ? 'Dale un nombre a esta entrada...' : 'Give this entry a name...'}
                    />
                </div>

                <div className="form-group">
                    <label className="form-label">{es ? 'Qué quieres escribir hoy' : 'What do you want to write today'} *</label>
                    <RichEditor
                        value={content}
                        onChange={setContent}
                        placeholder={es ? 'Escribe lo que sientes, lo que recuerdas, lo que quieres dejar salir...' : 'Write what you feel, what you remember, what you need to let out...'}
                    />
                </div>

                <div className={styles.formTagsGrid}>
                    <div className="form-group">
                        <label className="form-label">{es ? 'Tipo de pérdida' : 'Type of loss'}</label>
                        <select className="form-input" value={loss_type} onChange={e => setLossType(e.target.value)}>
                            <option value="">—</option>
                            {LOSS_TYPES.map(k => <option key={k} value={k}>{lossLabels[k]}</option>)}
                        </select>
                    </div>
                    <div className="form-group">
                        <label className="form-label">{es ? 'Cosmovisión' : 'Worldview'}</label>
                        <select className="form-input" value={worldview} onChange={e => setWorldview(e.target.value)}>
                            <option value="">—</option>
                            {WORLDVIEWS.map(k => <option key={k} value={k}>{worldviewLabels[k]}</option>)}
                        </select>
                    </div>
                    <div className="form-group">
                        <label className="form-label">{es ? 'Emoción' : 'Emotion'}</label>
                        <select className="form-input" value={emotion} onChange={e => setEmotion(e.target.value)}>
                            <option value="">—</option>
                            {EMOTIONS.map(k => <option key={k} value={k}>{emotionLabels[k]}</option>)}
                        </select>
                    </div>
                    <div className="form-group">
                        <label className="form-label">{es ? 'Etapa del duelo' : 'Grief stage'}</label>
                        <select className="form-input" value={grief_stage} onChange={e => setGriefStage(e.target.value)}>
                            <option value="">—</option>
                            {GRIEF_STAGES.map(k => <option key={k} value={k}>{griefLabels[k]}</option>)}
                        </select>
                    </div>
                </div>

                <div className={styles.formActions}>
                    <button className="btn btn-secondary" onClick={() => router.push(`/${locale}/journal`)}>
                        {es ? 'Cancelar' : 'Cancel'}
                    </button>
                    <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                        {saving ? '...' : (es ? 'Guardar entrada' : 'Save entry')}
                    </button>
                </div>
            </div>
        </div>
    );
}
