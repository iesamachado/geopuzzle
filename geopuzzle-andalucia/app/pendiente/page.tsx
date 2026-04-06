import Link from 'next/link';
import Navbar from '@/components/Navbar';

export default function PendientePage() {
  return (
    <>
      <Navbar />
      <main style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '100px 24px',
        background: 'var(--color-noche)',
      }}>
        <div style={{
          background: 'var(--color-noche-light)',
          border: '1px solid rgba(245,158,11,0.3)',
          borderRadius: '16px',
          padding: '48px',
          maxWidth: '500px',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: '3rem', marginBottom: '16px' }}>⏳</div>
          <h1 style={{ fontSize: '1.6rem', marginBottom: '12px' }}>Solicitud en Revisión</h1>
          <p style={{ color: 'var(--color-text-muted)', lineHeight: 1.7, marginBottom: '24px' }}>
            Tu solicitud de participación en <strong style={{ color: 'var(--color-text)' }}>GeoPuzzle 3D Andalucía</strong> está
            siendo revisada por el equipo coordinador. Recibirás un email cuando sea aprobada (1–3 días hábiles).
          </p>
          <div className="alert alert-info" style={{ marginBottom: '24px', textAlign: 'left' }}>
            <strong>Mientras esperas puedes:</strong>
            <ul style={{ marginTop: '8px', paddingLeft: '20px' }}>
              <li>Revisar la <a href="#sa" style={{ color: 'var(--color-acento)' }}>Situación de Aprendizaje</a> públicamente</li>
              <li>Preparar los parámetros de impresión 3D (Cura/PrusaSlicer)</li>
              <li>Coordinar con tu departamento</li>
            </ul>
          </div>
          <Link href="/" className="btn btn-secondary">
            ← Volver al inicio
          </Link>
        </div>
      </main>
    </>
  );
}
