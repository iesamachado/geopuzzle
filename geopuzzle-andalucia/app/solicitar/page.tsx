'use client';

import { useState } from 'react';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { crearSolicitud } from '@/lib/firestore';
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
  const [step, setStep] = useState<1 | 2 | 'done'>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    email: '',
    password: '',
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

  const set = (k: string, v: string | boolean) => setForm(f => ({ ...f, [k]: v }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // 1. Crear usuario en Firebase Auth
      const { user } = await createUserWithEmailAndPassword(auth, form.email, form.password);

      // 2. Crear perfil del usuario en Firestore
      await setDoc(doc(db, 'usuarios', user.uid), {
        uid: user.uid,
        email: form.email,
        nombre: form.nombre,
        centroeducativo: form.centroeducativo,
        provincia: form.provincia,
        rol: 'pendiente',
        creadoEn: serverTimestamp(),
      });

      // 3. Crear solicitud visible para el admin
      await crearSolicitud({
        uid: user.uid,
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
    } catch (err: any) {
      const code = err?.code || '';
      if (code === 'auth/email-already-in-use') {
        setError('Este email ya está registrado. ¿Quizás ya enviaste una solicitud? Prueba a iniciar sesión.');
      } else if (code === 'auth/weak-password') {
        setError('La contraseña debe tener al menos 6 caracteres.');
      } else {
        setError(`Error al enviar la solicitud: ${err.message}`);
      }
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
              El equipo coordinador revisará tus datos y recibirás un email de confirmación cuando
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
            <div className={`${styles.stepItem} ${step >= 1 ? styles.active : ''}`}>
              <span className={styles.stepNum}>1</span> Acceso
            </div>
            <div className={styles.stepLine} />
            <div className={`${styles.stepItem} ${step >= 2 ? styles.active : ''}`}>
              <span className={styles.stepNum}>2</span> Centro y Datos
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            {step === 1 && (
              <div className={styles.formSection}>
                <h2>Datos de Acceso</h2>

                <div className="form-group">
                  <label>Email institucional *</label>
                  <input
                    type="email"
                    className="form-control"
                    required
                    value={form.email}
                    onChange={e => set('email', e.target.value)}
                    placeholder="tu@iescorreoprofesional.es"
                  />
                </div>

                <div className="form-group">
                  <label>Contraseña *</label>
                  <input
                    type="password"
                    className="form-control"
                    required
                    minLength={6}
                    value={form.password}
                    onChange={e => set('password', e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                  />
                </div>

                <div className="form-group">
                  <label>Nombre completo *</label>
                  <input
                    type="text"
                    className="form-control"
                    required
                    value={form.nombre}
                    onChange={e => set('nombre', e.target.value)}
                    placeholder="Ej. María García López"
                  />
                </div>

                <button
                  type="button"
                  className="btn btn-primary"
                  style={{ width: '100%', marginTop: '8px' }}
                  onClick={() => {
                    if (!form.email || !form.password || !form.nombre) {
                      setError('Completa todos los campos obligatorios.');
                      return;
                    }
                    setError('');
                    setStep(2);
                  }}
                >
                  Siguiente →
                </button>
              </div>
            )}

            {step === 2 && (
              <div className={styles.formSection}>
                <h2>Datos del Centro</h2>

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

                <label style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', cursor: 'pointer', fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>
                  <input
                    type="checkbox"
                    checked={form.experiencia3d}
                    onChange={e => set('experiencia3d', e.target.checked)}
                    style={{ marginTop: '3px' }}
                  />
                  Nuestro instituto dispone de impresora 3D operativa o prevé disponer de una para el proyecto.
                </label>

                {error && <div className="alert alert-error" style={{ marginTop: '16px' }}>{error}</div>}

                <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
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
