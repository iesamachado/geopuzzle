'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { obtenerSolicitudes, actualizarEstadoSolicitud } from '@/lib/firestore';
import { seedCuadrantes } from '@/lib/seed-firestore';
import { Solicitud } from '@/lib/types';

export default function AdminPage() {
  const { isAdmin, loading } = useAuth();
  const router = useRouter();
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([]);
  const [loadingSols, setLoadingSols] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [filter, setFilter] = useState<'todos' | 'pendiente' | 'aprobado' | 'rechazado'>('pendiente');
  const [seeding, setSeeding] = useState(false);

  useEffect(() => {
    if (!loading && !isAdmin) router.push('/dashboard');
    else loadSolicitudes();
  }, [loading, isAdmin]);

  async function loadSolicitudes() {
    setLoadingSols(true);
    const data = await obtenerSolicitudes();
    setSolicitudes(data);
    setLoadingSols(false);
  }

  async function handleUpdate(id: string, estado: 'aprobado' | 'rechazado', uid?: string) {
    setUpdating(id);
    await actualizarEstadoSolicitud(id, estado, uid);
    await loadSolicitudes();
    setUpdating(null);
  }

  async function handleSeed() {
    if (!confirm('¿Seguro que quieres inicializar los cuadrantes? Esto sobreescribirá los datos existentes.')) return;
    setSeeding(true);
    try {
      await seedCuadrantes();
      alert('Cuadrantes inicializados con éxito.');
    } catch (error) {
      console.error(error);
      alert('Error al inicializar cuadrantes.');
    } finally {
      setSeeding(false);
    }
  }

  const filtered = filter === 'todos' ? solicitudes : solicitudes.filter(s => s.estado === filter);
  const pendientes = solicitudes.filter(s => s.estado === 'pendiente').length;

  return (
    <div>
      <div style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800 }}>⚙️ Panel de Administración</h1>
          {pendientes > 0 && (
            <span className="badge badge-pending">{pendientes} pendiente{pendientes !== 1 ? 's' : ''}</span>
          )}
        </div>
        <p style={{ color: 'var(--color-text-muted)' }}>
          Gestiona las solicitudes de acceso de los docentes al proyecto.
        </p>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '32px' }}>
        {[
          { label: 'Total', value: solicitudes.length, color: 'var(--color-text)' },
          { label: 'Pendientes', value: solicitudes.filter(s => s.estado === 'pendiente').length, color: 'var(--color-acento)' },
          { label: 'Aprobados', value: solicitudes.filter(s => s.estado === 'aprobado').length, color: 'var(--color-verde)' },
          { label: 'Rechazados', value: solicitudes.filter(s => s.estado === 'rechazado').length, color: 'var(--color-rojo)' },
        ].map(s => (
          <div key={s.label} className="card" style={{ padding: '16px', textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', fontWeight: 900, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
        {(['todos', 'pendiente', 'aprobado', 'rechazado'] as const).map(f => (
          <button
            key={f}
            className={`btn btn-sm ${filter === f ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setFilter(f)}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {loadingSols ? (
        <div className="spinner" />
      ) : filtered.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '48px', color: 'var(--color-text-muted)' }}>
          No hay solicitudes con el filtro seleccionado.
        </div>
      ) : (
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Docente</th>
                <th>Centro</th>
                <th>Provincia</th>
                <th>Departamento</th>
                <th>Experiencia 3D</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(s => (
                <tr key={s.id}>
                  <td>
                    <div style={{ fontWeight: 600 }}>{s.nombre}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{s.email}</div>
                  </td>
                  <td>
                    <div>{s.centroeducativo}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{s.localidad}</div>
                  </td>
                  <td>{s.provincia}</td>
                  <td style={{ fontSize: '0.85rem' }}>{s.departamento}</td>
                  <td style={{ textAlign: 'center' }}>{s.experiencia3d ? '✅' : '—'}</td>
                  <td>
                    <span className={`badge badge-${s.estado === 'pendiente' ? 'pending' : s.estado === 'aprobado' ? 'approved' : 'rejected'}`}>
                      {s.estado}
                    </span>
                  </td>
                  <td>
                    {s.estado === 'pendiente' && (
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          className="btn btn-success btn-sm"
                          disabled={updating === s.id}
                          onClick={() => handleUpdate(s.id!, 'aprobado', s.uid)}
                        >
                          Aprobar
                        </button>
                        <button
                          className="btn btn-danger btn-sm"
                          disabled={updating === s.id}
                          onClick={() => handleUpdate(s.id!, 'rechazado', s.uid)}
                        >
                          Rechazar
                        </button>
                      </div>
                    )}
                    {s.estado !== 'pendiente' && (
                      <span style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Motivaciones expandible */}
      <div style={{ marginTop: '32px' }}>
        <h2 style={{ fontSize: '1.2rem', marginBottom: '16px' }}>📝 Motivaciones de los Docentes</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {filtered.filter(s => s.motivacion).map(s => (
            <div key={s.id} className="card" style={{ padding: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontWeight: 600 }}>{s.nombre}</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{s.centroeducativo}</span>
              </div>
              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', lineHeight: 1.6 }}>
                &quot;{s.motivacion}&quot;
              </p>
            </div>
          ))}
        </div>
      </div>
      {/* Seeding Section */}
      <div style={{ marginTop: '48px', padding: '24px', border: '1px dashed var(--color-border)', borderRadius: '12px' }}>
        <h2 style={{ fontSize: '1.2rem', marginBottom: '8px' }}>🛠️ Mantenimiento</h2>
        <p style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', marginBottom: '16px' }}>
          Solo usar en la configuración inicial o para reiniciar el mapa.
        </p>
        <button 
          className="btn btn-secondary" 
          onClick={handleSeed}
          disabled={seeding}
        >
          {seeding ? 'Inicializando...' : 'Inicializar Cuadrantes (20 piezas)'}
        </button>
      </div>

    </div>
  );
}
