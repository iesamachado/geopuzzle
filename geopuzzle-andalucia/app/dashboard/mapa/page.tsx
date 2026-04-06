'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { obtenerCuadrantes, asignarCuadrante, liberarCuadrante } from '@/lib/firestore';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Cuadrante } from '@/lib/types';
import { CUADRANTES_INICIALES } from '@/lib/cuadrantes-data';

export default function MapaPage() {
  const { user, profile, isAdmin } = useAuth();
  const [cuadrantes, setCuadrantes] = useState<Cuadrante[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Cuadrante | null>(null);
  const [assigning, setAssigning] = useState(false);

  useEffect(() => {
    loadCuadrantes();
  }, []);

  async function loadCuadrantes() {
    setLoading(true);
    try {
      const data = await obtenerCuadrantes();
      if (data.length === 0) {
        // Inicializar cuadrantes en Firestore si no existen
        await initCuadrantes();
        const freshData = await obtenerCuadrantes();
        setCuadrantes(freshData);
      } else {
        setCuadrantes(data);
      }
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  }

  async function initCuadrantes() {
    for (const c of CUADRANTES_INICIALES) {
      await setDoc(doc(db, 'cuadrantes', c.id), {
        ...c,
        asignado: false,
        centroId: null,
        centroNombre: null,
        fechaAsignacion: null,
      });
    }
  }

  async function handleAsignar(cuadrante: Cuadrante) {
    if (!user || !profile) return;
    // Verificar que el centro no tiene ya asignado otro cuadrante
    const yaAsignado = cuadrantes.find(c => c.centroId === user.uid);
    if (yaAsignado && !isAdmin) {
      alert(`Tu instituto ya tiene asignado el cuadrante ${yaAsignado.id}. Un centro solo puede tener uno.`);
      return;
    }
    if (!confirm(`¿Confirmas asignarte el cuadrante "${cuadrante.etiqueta}" (${cuadrante.id})?`)) return;

    setAssigning(true);
    await asignarCuadrante(cuadrante.id, user.uid, profile.centroeducativo);
    await loadCuadrantes();
    setSelected(null);
    setAssigning(false);
  }

  async function handleLiberar(cuadrante: Cuadrante) {
    if (!isAdmin && cuadrante.centroId !== user?.uid) return;
    if (!confirm(`¿Liberar el cuadrante "${cuadrante.id}"?`)) return;

    setAssigning(true);
    await liberarCuadrante(cuadrante.id);
    await loadCuadrantes();
    setSelected(null);
    setAssigning(false);
  }

  const miCuadrante = cuadrantes.find(c => c.centroId === user?.uid);
  const libres = cuadrantes.filter(c => !c.asignado).length;
  const asignados = cuadrantes.filter(c => c.asignado).length;

  return (
    <div>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '4px' }}>🗺️ Gestor de Cuadrantes</h1>
        <p style={{ color: 'var(--color-text-muted)' }}>
          Consulta y reclama el cuadrante topográfico que tu instituto va a imprimir.
        </p>
      </div>

      {/* Stats */}
      <div style={{ display: 'flex', gap: '16px', marginBottom: '32px', flexWrap: 'wrap' }}>
        {[
          { label: 'Total cuadrantes', value: cuadrantes.length, color: 'var(--color-text)' },
          { label: 'Asignados', value: asignados, color: 'var(--color-acento)' },
          { label: 'Disponibles', value: libres, color: 'var(--color-verde)' },
        ].map(s => (
          <div key={s.label} className="card" style={{ flex: '1', minWidth: '140px', textAlign: 'center', padding: '20px' }}>
            <div style={{ fontSize: '2.5rem', fontWeight: 900, color: s.color, lineHeight: 1 }}>{s.value}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '4px' }}>{s.label}</div>
          </div>
        ))}
        {miCuadrante && (
          <div className="card" style={{ flex: '2', minWidth: '200px', padding: '20px', borderColor: 'var(--color-verde)' }}>
            <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-verde)', marginBottom: '4px' }}>
              Tu cuadrante asignado
            </div>
            <div style={{ fontWeight: 800, fontSize: '1.1rem' }}>{miCuadrante.id} — {miCuadrante.etiqueta}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{miCuadrante.provincia}</div>
          </div>
        )}
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: '16px', marginBottom: '16px', flexWrap: 'wrap', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ width: 12, height: 12, borderRadius: 3, background: 'var(--color-noche-light)', border: '2px solid #334155', display: 'inline-block' }} />
          Disponible (clic para asignar)
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ width: 12, height: 12, borderRadius: 3, background: 'rgba(245,158,11,0.15)', border: '2px solid rgba(245,158,11,0.5)', display: 'inline-block' }} />
          Asignado a otro centro
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ width: 12, height: 12, borderRadius: 3, background: 'rgba(16,185,129,0.15)', border: '2px solid var(--color-verde)', display: 'inline-block' }} />
          Tu cuadrante
        </span>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="spinner" style={{ marginTop: '40px' }} />
      ) : (
        <div className="andalucia-grid">
          {cuadrantes
            .sort((a, b) => a.fila - b.fila || a.columna - b.columna)
            .map((c) => {
              const esMio = c.centroId === user?.uid;
              return (
                <div
                  key={c.id}
                  className={`cuadrante-cell ${esMio ? 'propio' : c.asignado ? 'asignado' : 'libre'}`}
                  onClick={() => !c.asignado ? setSelected(c) : esMio && setSelected(c)}
                >
                  <div className="cuadrante-id">{c.id}</div>
                  <div className="cuadrante-label">{c.etiqueta}</div>
                  <div className="cuadrante-status">
                    {esMio ? '✅ Tu instituto' : c.asignado ? `🔒 ${c.centroNombre}` : '🟢 Disponible'}
                  </div>
                </div>
              );
            })}
        </div>
      )}

      {/* Side panel when selected */}
      {selected && (
        <div style={{
          position: 'fixed', top: 0, right: 0, bottom: 0, width: '340px',
          background: 'var(--color-noche-light)', borderLeft: '1px solid var(--color-border)',
          padding: '32px', zIndex: 150, overflowY: 'auto',
          boxShadow: '-8px 0 24px rgba(0,0,0,0.5)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
            <h2 style={{ fontSize: '1.3rem' }}>Cuadrante {selected.id}</h2>
            <button className="btn btn-secondary btn-sm" onClick={() => setSelected(null)}>✕</button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
            <div>
              <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Zona</div>
              <div style={{ fontWeight: 600, marginTop: '2px' }}>{selected.etiqueta}</div>
            </div>
            <div>
              <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Provincia(s)</div>
              <div style={{ fontWeight: 600, marginTop: '2px' }}>{selected.provincia}</div>
            </div>
            <div>
              <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Estado</div>
              <div style={{ marginTop: '4px' }}>
                {selected.centroId === user?.uid ? (
                  <span className="badge badge-approved">Tu instituto</span>
                ) : selected.asignado ? (
                  <span className="badge badge-pending">Asignado — {selected.centroNombre}</span>
                ) : (
                  <span className="badge badge-approved">Disponible</span>
                )}
              </div>
            </div>
          </div>

          {!selected.asignado && !miCuadrante && (
            <button
              className="btn btn-success"
              style={{ width: '100%' }}
              disabled={assigning}
              onClick={() => handleAsignar(selected)}
            >
              {assigning ? 'Asignando...' : '✅ Asignar a mi instituto'}
            </button>
          )}

          {(selected.centroId === user?.uid || isAdmin) && (
            <button
              className="btn btn-danger"
              style={{ width: '100%', marginTop: '8px' }}
              disabled={assigning}
              onClick={() => handleLiberar(selected)}
            >
              Liberar cuadrante
            </button>
          )}

          {miCuadrante && selected.id !== miCuadrante.id && !selected.asignado && (
            <div className="alert alert-info" style={{ marginTop: '16px', fontSize: '0.8rem' }}>
              Tu instituto ya tiene asignado el cuadrante <strong>{miCuadrante.id}</strong>. Libéralo primero si quieres cambiar.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
