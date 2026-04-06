'use client';

import { useAuth } from '@/lib/auth-context';

export default function DashboardHomePage() {
  const { profile, user } = useAuth();

  return (
    <div>
      <div style={{ marginBottom: '40px' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '8px' }}>
          ¡Hola, {profile?.nombre?.split(' ')[0] || 'docente'}! 👋
        </h1>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '1.05rem' }}>
          Bienvenido/a al panel de coordinación de <strong style={{ color: 'var(--color-text)' }}>GeoPuzzle 3D Andalucía</strong>.
        </p>
      </div>

      {/* Quick Access Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '40px' }}>
        {[
          {
            href: '/dashboard/foro',
            icon: '💬',
            title: 'Foro de Coordinación',
            desc: 'Resuelve dudas, comparte parámetros Cura y coordina con otros institutos.',
            color: '#3B82F6',
          },
          {
            href: '/dashboard/mapa',
            icon: '🗺️',
            title: 'Gestor de Cuadrantes',
            desc: 'Consulta y reclama el cuadrante topográfico para tu instituto.',
            color: '#10B981',
          },
          {
            href: '/',
            icon: '📋',
            title: 'Situación de Aprendizaje',
            desc: 'Documentación pedagógica LOMLOE/BOJA y rúbricas de evaluación.',
            color: '#F59E0B',
          },
        ].map((item) => (
          <a
            key={item.title}
            href={item.href}
            className="card"
            style={{ display: 'flex', flexDirection: 'column', gap: '12px', textDecoration: 'none' }}
          >
            <div style={{ fontSize: '2rem' }}>{item.icon}</div>
            <h3 style={{ fontSize: '1.05rem', color: item.color }}>{item.title}</h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', lineHeight: 1.5 }}>
              {item.desc}
            </p>
          </a>
        ))}
      </div>

      {/* Info box */}
      <div className="card" style={{ background: 'rgba(245,158,11,0.05)', borderColor: 'rgba(245,158,11,0.2)' }}>
        <h3 style={{ marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>📦</span> Recursos para empezar
        </h3>
        <ul style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '8px', color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
          <li>Genera el archivo STL de tu cuadrante en <a href="http://localhost:8000" target="_blank" style={{ color: 'var(--color-acento)' }}>Maps3D Heightmaker</a></li>
          <li>Descarga la Guía de Montaje incluida en el ZIP para correctamente orientar la pieza</li>
          <li>Consulta en el Foro los parámetros Cura recomendados (PLA, 0.2mm, 20% relleno, soporte: no)</li>
          <li>Una vez impresa, fotografía la pieza y comparte la foto en el foro</li>
        </ul>
      </div>
    </div>
  );
}
