'use client';

import { useState, useEffect } from 'react';
import { signInWithPopup } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db, googleProvider } from '@/lib/firebase';
import { crearSolicitud } from '@/lib/firestore';
import { useAuth } from '@/lib/auth-context';
import Navbar from '@/components/Navbar';
import Link from 'next/link';
import styles from './solicitar.module.css';

const PROVINCIAS = [
  'Almería', 'Cádiz', 'Córdoba', 'Granada',
  'Huelva', 'Jaén', 'Málaga', 'Sevilla',
];

const DEPARTAMENTOS = [
  { value: 'geografia', label: 'Geografía e Historia' },
  { value: 'tecnologia', label: 'Tecnología y Digitalización / Informática' },
  { value: 'plastica', label: 'Educación Plástica, Visual y Audiovisual' },
  { value: 'otro', label: 'Otro (especificar en motivación)' },
];

export default function SolicitarPage() {
  const { user: currentUser } = useAuth();
  const [step, setStep] = useState<1 | 2 | 'done'>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    email: '',
    nombre: '',
    telefono: '',
    centroeducativo: '',
    codigoCentro: '',
    localidad: '',
    provincia: 'Sevilla',
    departamento: 'tecnologia',
    motivacion: '',
    experiencia3d: false,
  });

  // Si ya está logueado, pre-rellenar
  useEffect(() => {
    if (currentUser) {
      setForm(f => ({
        ...f,
        email: currentUser.email || '',
        nombre: currentUser.displayName || f.nombre,
      }));
    }
  }, [currentUser]);

  const set = (k: string, v: string | boolean) => setForm(f => ({ ...f, [k]: v }));

  async function handleGoogleIdentify() {
    setLoading(true);
    setError('');
    try {
      const { user } = await signInWithPopup(auth, googleProvider);
      setForm(f => ({
        ...f,
        email: user.email || '',
        nombre: user.displayName || '',
      }));
      setStep(2);
    } catch (err: unknown) {
      console.error(err);
      setError('Error al identificarte con Google.');
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!currentUser) return; // No debería pasar si estamos en el step 2

    setLoading(true);
    setError('');

    try {
      // 1. El usuario ya ha sido creado/autenticado por Google en Step 1
      
      // 2. Crear/Actualizar perfil del usuario en Firestore (en estado pendiente)
      await setDoc(doc(db, 'usuarios', currentUser.uid), {
        uid: currentUser.uid,
        email: currentUser.email,
        nombre: form.nombre,
        centroeducativo: form.centroeducativo,
        provincia: form.provincia,
        rol: 'pendiente',
        creadoEn: serverTimestamp(),
      });

      // 3. Crear solicitud visible para el admin
      await crearSolicitud({
        uid: currentUser.uid,
        nombre: form.nombre,
        email: form.email,
        telefono: form.telefono,
        centroeducativo: form.centroeducativo,
        codigoCentro: form.codigoCentro,
        localidad: form.localidad,
        provincia: form.provincia,
        departamento: form.departamento as 'geografia' | 'tecnologia' | 'plastica' | 'otro',
        motivacion: form.motivacion,
        experiencia3d: form.experiencia3d,
      });

      setStep('done');
    } catch (err: unknown) {
      console.error(err);
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(`Error al enviar la solicitud: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  }

  if (step === 'done') {
    return (
      <>
        <Navbar />
        <main className={styles.pageWrapper}>
          <div className={styles.successCard}>
            <div style={{ fontSize: '4rem', marginBottom: '16px' }}>✅</div>
            <h1>¡Solicitud Enviada!</h1>
            <p>
              Hemos recibido tu solicitud de participación en el proyecto <strong>GeoPuzzle 3D Andalucía</strong>.
            </p>
            <p>
              El equipo coordinador revisará tus datos y recibirás una confirmación cuando
              tu acceso sea aprobado. Esto suele tardar 1–3 días hábiles.
            </p>
            <Link href="/" className="btn btn-primary" style={{ marginTop: '24px' }}>
              Volver al inicio
            </Link>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main className={styles.pageWrapper}>
        <div className={styles.formCard}>
          <div className={styles.formHeader}>
            <h1>Solicitud de Participación</h1>
            <p>Completa el formulario para unirte al proyecto <strong>GeoPuzzle 3D Andalucía</strong> con tu instituto.</p>
          </div>

          {/* Steps indicator */}
          <div className={styles.steps}>
            <div className={`${styles.stepItem} ${step === 1 ? styles.active : ''}`}>
              <span className={styles.stepNum}>1</span> Identificación
            </div>
            <div className={styles.stepLine} />
            <div className={`${styles.stepItem} ${step === 2 ? styles.active : ''}`}>
              <span className={styles.stepNum}>2</span> Centro y Datos
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            {step === 1 && (
              <div className={styles.formSection} style={{ textAlign: 'center' }}>
                <div style={{ marginBottom: '24px' }}>
                  <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" width="60" height="60" style={{ marginBottom: '16px' }} />
                  <h2>Identificación Docente</h2>
                  <p style={{ color: 'var(--color-text-muted)', fontSize: '0.95rem' }}>
                    Utiliza tu cuenta institucional o personal facilitada por el centro.
                  </p>
                </div>

                {!currentUser ? (
                  <button
                    type="button"
                    className="btn btn-primary"
                    style={{ 
                      width: '100%', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      gap: '12px',
                      padding: '12px',
                      fontSize: '1rem'
                    }}
                    onClick={handleGoogleIdentify}
                    disabled={loading}
                  >
                    {loading ? <span className="spinner-sm"></span> : 'Identificarse con Google'}
                  </button>
                ) : (
                  <div className="card" style={{ padding: '20px', border: '1px solid var(--color-acento)' }}>
                    <div style={{ fontSize: '0.85rem', color: 'var(--color-acento)', marginBottom: '8px', fontWeight: 600 }}>
                      YA IDENTIFICADO COMO:
                    </div>
                    <div style={{ fontWeight: 600, fontSize: '1.1rem' }}>{currentUser.displayName}</div>
                    <div style={{ color: 'var(--color-text-muted)', marginBottom: '16px' }}>{currentUser.email}</div>
                    <button
                      type="button"
                      className="btn btn-primary"
                      style={{ width: '100%' }}
                      onClick={() => setStep(2)}
                    >
                      Continuar al Paso 2 →
                    </button>
                    <button 
                      type="button"
                      onClick={() => auth.signOut()}
                      style={{ background: 'none', border: 'none', color: 'var(--color-rojo)', fontSize: '0.8rem', marginTop: '12px', cursor: 'pointer' }}
                    >
                      Cerrar sesión e identificarme con otra cuenta
                    </button>
                  </div>
                )}

                {error && <div className="alert alert-error" style={{ marginTop: '16px' }}>{error}</div>}
              </div>
            )}

            {step === 2 && (
              <div className={styles.formSection}>
                <h2>Datos del Centro y Docente</h2>

                <div className="form-group">
                  <label>Tu nombre completo (para certificados) *</label>
                  <input
                    type="text"
                    className="form-control"
                    required
                    value={form.nombre}
                    onChange={e => set('nombre', e.target.value)}
                    placeholder="Ej. María García López"
                  />
                </div>

                <div className={styles.formRow}>
                  <div className="form-group">
                    <label>Centro educativo *</label>
                    <input
                      type="text"
                      className="form-control"
                      required
                      value={form.centroeducativo}
                      onChange={e => set('centroeducativo', e.target.value)}
                      placeholder="IES Nombre del Instituto"
                    />
                  </div>
                  <div className="form-group">
                    <label>Código de centro</label>
                    <input
                      type="text"
                      className="form-control"
                      value={form.codigoCentro}
                      onChange={e => set('codigoCentro', e.target.value)}
                      placeholder="41XXXXX"
                    />
                  </div>
                </div>

                <div className={styles.formRow}>
                  <div className="form-group">
                    <label>Localidad *</label>
                    <input
                      type="text"
                      className="form-control"
                      required
                      value={form.localidad}
                      onChange={e => set('localidad', e.target.value)}
                      placeholder="Ej. Dos Hermanas"
                    />
                  </div>
                  <div className="form-group">
                    <label>Provincia *</label>
                    <select
                      className="form-control"
                      value={form.provincia}
                      onChange={e => set('provincia', e.target.value)}
                    >
                      {PROVINCIAS.map(p => (
                        <option key={p} value={p}>{p}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className={styles.formRow}>
                  <div className="form-group">
                    <label>Teléfono de contacto</label>
                    <input
                      type="tel"
                      className="form-control"
                      value={form.telefono}
                      onChange={e => set('telefono', e.target.value)}
                      placeholder="600 000 000"
                    />
                  </div>
                  <div className="form-group">
                    <label>Departamento *</label>
                    <select
                      className="form-control"
                      value={form.departamento}
                      onChange={e => set('departamento', e.target.value)}
                      required
                    >
                      {DEPARTAMENTOS.map(d => (
                        <option key={d.value} value={d.value}>{d.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label>Motivación y experiencia *</label>
                  <textarea
                    className="form-control"
                    rows={4}
                    required
                    style={{ resize: 'vertical' }}
                    value={form.motivacion}
                    onChange={e => set('motivacion', e.target.value)}
                    placeholder="¿Por qué quieres participar? ¿Qué experiencia tienes con proyectos STEM o impresión 3D?"
                  />
                </div>

                <label style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', cursor: 'pointer', fontSize: '0.9rem', color: 'var(--color-text-muted)', marginBottom: '24px' }}>
                  <input
                    type="checkbox"
                    checked={form.experiencia3d}
                    onChange={e => set('experiencia3d', e.target.checked)}
                    style={{ marginTop: '3px' }}
                  />
                  Nuestro instituto dispone de impresora 3D operativa o prevé disponer de una para el proyecto.
                </label>

                {error && <div className="alert alert-error" style={{ marginBottom: '16px' }}>{error}</div>}

                <div style={{ display: 'flex', gap: '12px' }}>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setStep(1)}
                  >
                    ← Atrás
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    style={{ flex: 1 }}
                    disabled={loading}
                  >
                    {loading ? 'Enviando...' : '✅ Enviar Solicitud'}
                  </button>
                </div>
              </div>
            )}
          </form>

          <p style={{ textAlign: 'center', marginTop: '16px', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
            ¿Ya tienes cuenta aprobada?{' '}
            <Link href="/login" style={{ color: 'var(--color-acento)' }}>Iniciar sesión</Link>
          </p>
        </div>
      </main>
    </>
  );
}
