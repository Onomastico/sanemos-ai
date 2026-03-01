'use client';

import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { createClient } from '@/lib/supabase/client';
import styles from '../letters.module.css';

const RichEditor = dynamic(() => import('@/components/journal/RichEditor'), { ssr: false });

const LOSS_TYPES = ['parent','child','partner','sibling','friend','pet','other','general'];
const WORLDVIEWS = ['secular','spiritual','christian','jewish','muslim','buddhist','hindu','universal'];

export default function NewLetterPage() {
    const pathname = usePathname();
    const router = useRouter();
    const locale = pathname.split('/')[1] || 'en';
    const es = locale === 'es';

    const [content, setContent] = useState('');
    const [lossType, setLossType] = useState('');
    const [worldview, setWorldview] = useState('');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const lossLabels = {
        parent: es ? 'Padre/madre' : 'Parent', child: es ? 'Hijo/a' : 'Child',
        partner: es ? 'Pareja' : 'Partner', sibling: es ? 'Hermano/a' : 'Sibling',
        friend: es ? 'Amigo/a' : 'Friend', pet: es ? 'Mascota' : 'Pet',
        other: es ? 'Otro' : 'Other', general: 'General',
    };
    const worldviewLabels = {
        secular: 'Secular', spiritual: es ? 'Espiritual' : 'Spiritual',
        christian: es ? 'Cristiano' : 'Christian', jewish: es ? 'Judío' : 'Jewish',
        muslim: es ? 'Musulmán' : 'Muslim', buddhist: es ? 'Budista' : 'Buddhist',
        hindu: es ? 'Hindú' : 'Hindu', universal: 'Universal',
    };

    useEffect(() => {
        const check = async () => {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) router.push(`/${locale}/auth/login`);
        };
        check();
    }, [locale, router]);

    const handleSubmit = async () => {
        if (!content.replace(/<[^>]*>/g, '').trim()) {
            setError(es ? 'La carta no puede estar vacía.' : 'Letter cannot be empty.');
            return;
        }
        setSaving(true); setError('');
        const res = await fetch('/api/letters', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ content, loss_type: lossType || null, worldview: worldview || null }),
        });
        const data = await res.json();
        setSaving(false);
        if (!res.ok) { setError(data.error || (es ? 'Error al guardar.' : 'Error saving.')); return; }
        router.push(`/${locale}/letters/${data.letter.id}`);
    };

    return (
        <div className={styles.newPage}>
            <div className={styles.detailHeader}>
                <button className={styles.backBtn} onClick={() => router.push(`/${locale}/letters`)}>
                    ← {es ? 'Cartas' : 'Letters'}
                </button>
                <h1 style={{ margin: 0, fontSize: 'var(--font-size-xl)', fontWeight: 700, color: 'var(--text-primary)' }}>
                    💌 {es ? 'Escribir una carta' : 'Write a letter'}
                </h1>
            </div>

            <div className={styles.hint}>
                {es
                    ? 'Las cartas son mensajes breves para quienes están atravesando el duelo. Comparte desde tu experiencia — tus palabras pueden acompañar a alguien que las necesita.'
                    : 'Letters are short messages for those going through grief. Share from your experience — your words may be exactly what someone needs to hear.'}
            </div>

            {error && <div style={{ color: 'var(--accent-alert)', fontSize: 'var(--font-size-sm)', marginBottom: 'var(--space-md)', marginTop: 'var(--space-md)' }}>{error}</div>}

            <div className={styles.form} style={{ marginTop: 'var(--space-lg)' }}>
                <div className="form-group">
                    <label className="form-label">
                        {es ? 'Tu carta' : 'Your letter'} *
                    </label>
                    <RichEditor
                        value={content}
                        onChange={setContent}
                        placeholder={es ? 'Escribe tu carta aquí...' : 'Write your letter here...'}
                    />
                </div>

                <div className={styles.formTagsGrid}>
                    <div className="form-group">
                        <label className="form-label">{es ? 'Tipo de pérdida (opcional)' : 'Type of loss (optional)'}</label>
                        <select className="form-input" value={lossType} onChange={e => setLossType(e.target.value)}>
                            <option value="">—</option>
                            {LOSS_TYPES.map(k => <option key={k} value={k}>{lossLabels[k]}</option>)}
                        </select>
                    </div>
                    <div className="form-group">
                        <label className="form-label">{es ? 'Cosmovisión (opcional)' : 'Worldview (optional)'}</label>
                        <select className="form-input" value={worldview} onChange={e => setWorldview(e.target.value)}>
                            <option value="">—</option>
                            {WORLDVIEWS.map(k => <option key={k} value={k}>{worldviewLabels[k]}</option>)}
                        </select>
                    </div>
                </div>

                <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', margin: 0 }}>
                    {es
                        ? '⚠️ Tu carta pasará por una revisión antes de ser visible para la comunidad.'
                        : '⚠️ Your letter will go through a review before becoming visible to the community.'}
                </p>

                <div className={styles.formActions}>
                    <button className="btn btn-secondary" onClick={() => router.push(`/${locale}/letters`)}>
                        {es ? 'Cancelar' : 'Cancel'}
                    </button>
                    <button className="btn btn-primary" onClick={handleSubmit} disabled={saving}>
                        {saving ? '...' : (es ? 'Enviar carta' : 'Send letter')}
                    </button>
                </div>
            </div>
        </div>
    );
}
