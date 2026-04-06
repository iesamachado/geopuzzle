'use client';

import { useState } from 'react';
import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import Navbar from '@/components/Navbar';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleGoogleLogin() {
    setLoading(true);
    setError('');
    try {
      await signInWithPopup(auth, googleProvider);
      router.push('/dashboard');
    } catch (err: any) {
      console.error(err);
      setError('Error al iniciar sesión con Google. Inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Navbar />
      <main style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '100px 24px 40px',
        background: 'radial-gradient(ellipse 60% 40% at 50% 0%, rgba(37,99,235,0.08) 0%, transparent 60%), var(--color-noche)',
      }}>
        <div style={{
          background: 'var(--color-noche-light)',
          border: '1px solid var(--color-border)',
          borderRadius: '16px',
          padding: '40px',
          width: '100%',
          maxWidth: '420px',
          textAlign: 'center'
        }}>
          <div style={{ marginBottom: '32px' }}>
            <div style={{ fontSize: '3.5rem', marginBottom: '16px' }}>🗺️</div>
            <h1 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '8px' }}>Plataforma Docente</h1>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.95rem' }}>
              Accede para coordinar tu cuadrante del mapa 3D
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <button
              onClick={handleGoogleLogin}
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
              disabled={loading}
            >
              {loading ? (
                <span className="spinner-sm"></span>
              ) : (
                <>
                  <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" width="18" height="18" />
                  Continuar con Google
                </>
              )}
            </button>
            
            {error && <div className="alert alert-error" style={{ fontSize: '0.85rem' }}>{error}</div>}
          </div>

          <div className="alert alert-info" style={{ marginTop: '32px', fontSize: '0.8rem', textAlign: 'left', lineHeight: '1.5' }}>
            ℹ️ <strong>Información:</strong> Solo los docentes cuya solicitud haya sido <strong>aprobada</strong> por el coordinador podrán acceder al dashboard.
          </div>

          <p style={{ marginTop: '24px', fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>
            ¿Aún no has solicitado participar?{' '}
            <Link href="/solicitar" style={{ color: 'var(--color-acento)', fontWeight: 600 }}>Solicitar aquí</Link>
          </p>
        </div>
      </main>
    </>
  );
}
