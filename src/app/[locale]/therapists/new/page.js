'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import styles from '@/app/[locale]/resources/resources.module.css';

export default function AddTherapistPage() {
    const tAuth = useTranslations('auth');
    const pathname = usePathname();
    const router = useRouter();
    const locale = pathname.split('/')[1] || 'en';

    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');

    const [fullName, setFullName] = useState('');
    const [title, setTitle] = useState('');
    const [bio, setBio] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [city, setCity] = useState('');
    const [country, setCountry] = useState('');
    const [modality, setModality] = useState('both');
    const [languages, setLanguages] = useState('es');
    const [specializations, setSpecializations] = useState('');
    const [licenseNumber, setLicenseNumber] = useState('');

    useEffect(() => {
        const supabase = createClient();
        supabase.auth.getUser().then(({ data: { user } }) => {
            if (!user) {
                router.push(`/${locale}/auth/login`);
            } else {
                setUser(user);
            }
        });
    }, [locale, router]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess(false);

        if (!fullName || !city || !modality) {
            setError(tAuth('genericError') || 'Missing required fields.');
            return;
        }

        setLoading(true);
        const supabase = createClient();

        const langArray = languages.split(',').map(s => s.trim()).filter(Boolean);
        const specArray = specializations.split(',').map(s => s.trim()).filter(Boolean);

        const { error: insertError } = await supabase
            .from('therapists')
            .insert({
                user_id: user.id,
                full_name: fullName,
                title: title || null,
                bio: bio || null,
                email: email || null,
                phone: phone || null,
                city,
                country: country || null,
                modality,
                languages: langArray.length ? langArray : ['es'],
                specializations: specArray,
                license_number: licenseNumber || null,
                status: 'pending' // As configured in the db schema migration
            });

        if (insertError) {
            console.error(insertError);
            setError(tAuth('genericError') || 'An error occurred.');
            setLoading(false);
            return;
        }

        setSuccess(true);
        setLoading(false);
        setTimeout(() => {
            router.push(`/${locale}/therapists`);
        }, 1500);
    };

    if (!user) return null;

    return (
        <div className={styles.addPage}>
            <div className={styles.addContainer}>
                <div className={styles.addCard}>
                    <div className={styles.addHeader}>
                        <h1>{locale === 'es' ? 'Añadir Terapeuta' : 'Add Therapist'}</h1>
                        <p>{locale === 'es' ? 'Ayuda a la comunidad sugiriendo un terapeuta.' : 'Help the community by suggesting a therapist.'}</p>
                    </div>

                    <form onSubmit={handleSubmit} className={styles.addForm}>
                        {error && <div className="form-error" style={{ textAlign: 'center' }}>{error}</div>}
                        {success && <div className={styles.successMessage}>📋 {locale === 'es' ? 'Tu solicitud ha sido enviada y está pendiente de revisión.' : 'Your submission is pending review.'}</div>}

                        <div className="form-group">
                            <label className="form-label">{locale === 'es' ? 'Nombre completo (*)' : 'Full Name (*)'}</label>
                            <input type="text" className="form-input" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
                        </div>

                        <div className="form-group">
                            <label className="form-label">{locale === 'es' ? 'Título profesional' : 'Professional Title'}</label>
                            <input type="text" className="form-input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ej. Psicólogo(a) Clínico(a)" />
                        </div>

                        <div className="form-group">
                            <label className="form-label">{locale === 'es' ? 'Biografía' : 'Bio'}</label>
                            <textarea className="form-input form-textarea" value={bio} onChange={(e) => setBio(e.target.value)} />
                        </div>

                        <div className="form-group" style={{ display: 'flex', gap: 'var(--space-md)' }}>
                            <div style={{ flex: 1 }}>
                                <label className="form-label">{locale === 'es' ? 'Email' : 'Email'}</label>
                                <input type="email" className="form-input" value={email} onChange={(e) => setEmail(e.target.value)} />
                            </div>
                            <div style={{ flex: 1 }}>
                                <label className="form-label">{locale === 'es' ? 'Teléfono' : 'Phone'}</label>
                                <input type="text" className="form-input" value={phone} onChange={(e) => setPhone(e.target.value)} />
                            </div>
                        </div>

                        <div className="form-group" style={{ display: 'flex', gap: 'var(--space-md)' }}>
                            <div style={{ flex: 1 }}>
                                <label className="form-label">{locale === 'es' ? 'Ciudad (*)' : 'City (*)'}</label>
                                <input type="text" className="form-input" value={city} onChange={(e) => setCity(e.target.value)} required />
                            </div>
                            <div style={{ flex: 1 }}>
                                <label className="form-label">{locale === 'es' ? 'País' : 'Country'}</label>
                                <input type="text" className="form-input" value={country} onChange={(e) => setCountry(e.target.value)} />
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="form-label">{locale === 'es' ? 'Modalidad (*)' : 'Modality (*)'}</label>
                            <select className="form-input form-select" value={modality} onChange={(e) => setModality(e.target.value)} required>
                                <option value="in_person">{locale === 'es' ? 'Presencial' : 'In Person'}</option>
                                <option value="online">{locale === 'es' ? 'En línea' : 'Online'}</option>
                                <option value="both">{locale === 'es' ? 'Presencial y en línea' : 'Both'}</option>
                            </select>
                        </div>

                        <div className="form-group">
                            <label className="form-label">{locale === 'es' ? 'Idiomas (separados por coma)' : 'Languages (comma separated)'}</label>
                            <input type="text" className="form-input" value={languages} onChange={(e) => setLanguages(e.target.value)} placeholder="es, en" />
                        </div>

                        <div className="form-group">
                            <label className="form-label">{locale === 'es' ? 'Especialidades (separadas por coma)' : 'Specializations (comma separated)'}</label>
                            <input type="text" className="form-input" value={specializations} onChange={(e) => setSpecializations(e.target.value)} placeholder="Duelo, Ansiedad..." />
                        </div>

                        <div className="form-group">
                            <label className="form-label">{locale === 'es' ? 'Número de Licencia' : 'License Number'}</label>
                            <input type="text" className="form-input" value={licenseNumber} onChange={(e) => setLicenseNumber(e.target.value)} />
                        </div>

                        <button type="submit" className="btn btn-primary btn-lg" disabled={loading} style={{ width: '100%', marginTop: 'var(--space-md)' }}>
                            {loading ? '...' : (locale === 'es' ? 'Enviar solicitud' : 'Submit')}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
