'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { obtenerHilos, crearHilo, obtenerRespuestas, crearRespuesta, eliminarHilo } from '@/lib/firestore';
import { ForumThread, ForumReply } from '@/lib/types';
import styles from './foro.module.css';

const TAGS = ['general', 'cura', 'parámetros', 'impresión', 'material', 'error', 'diseño', 'coordinación'];

export default function ForoPage() {
  const { user, profile, isAdmin } = useAuth();
  const [hilos, setHilos] = useState<ForumThread[]>([]);
  const [selectedHilo, setSelectedHilo] = useState<ForumThread | null>(null);
  const [respuestas, setRespuestas] = useState<ForumReply[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterTag, setFilterTag] = useState('');

  // Nuevo hilo
  const [showNewThread, setShowNewThread] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newTags, setNewTags] = useState<string[]>([]);
  const [creatingThread, setCreatingThread] = useState(false);

  // Nueva respuesta
  const [newReply, setNewReply] = useState('');
  const [sendingReply, setSendingReply] = useState(false);

  useEffect(() => {
    loadHilos();
  }, []);

  async function loadHilos() {
    setLoading(true);
    const data = await obtenerHilos();
    setHilos(data);
    setLoading(false);
  }

  async function openHilo(hilo: ForumThread) {
    setSelectedHilo(hilo);
    const replies = await obtenerRespuestas(hilo.id!);
    setRespuestas(replies);
  }

  async function handleCreateThread(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !profile) return;
    setCreatingThread(true);
    await crearHilo({
      titulo: newTitle,
      contenido: newContent,
      autorId: user.uid,
      autorNombre: profile.nombre,
      centroeducativo: profile.centroeducativo,
      tags: newTags,
    });
    setNewTitle(''); setNewContent(''); setNewTags([]); setShowNewThread(false);
    await loadHilos();
    setCreatingThread(false);
  }

  async function handleSendReply(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !profile || !selectedHilo?.id) return;
    setSendingReply(true);
    await crearRespuesta(selectedHilo.id, {
      contenido: newReply,
      autorId: user.uid,
      autorNombre: profile.nombre,
      centroeducativo: profile.centroeducativo,
    });
    setNewReply('');
    const replies = await obtenerRespuestas(selectedHilo.id);
    setRespuestas(replies);
    setSendingReply(false);
  }

  const filteredHilos = filterTag
    ? hilos.filter(h => h.tags?.includes(filterTag))
    : hilos;

  if (selectedHilo) {
    return (
      <div>
        <button
          className="btn btn-secondary btn-sm"
          style={{ marginBottom: '24px' }}
          onClick={() => setSelectedHilo(null)}
        >
          ← Volver al Foro
        </button>

        <div className="card" style={{ marginBottom: '24px' }}>
          <h1 style={{ fontSize: '1.5rem', marginBottom: '8px' }}>{selectedHilo.titulo}</h1>
          <div style={{ display: 'flex', gap: '12px', color: 'var(--color-text-muted)', fontSize: '0.8rem', marginBottom: '16px', flexWrap: 'wrap' }}>
            <span>👤 {selectedHilo.autorNombre}</span>
            <span>🏫 {selectedHilo.centroeducativo}</span>
            {selectedHilo.creadoEn && <span>📅 {formatDate(selectedHilo.creadoEn)}</span>}
            {selectedHilo.tags?.map(t => (
              <span key={t} className="badge badge-pending">{t}</span>
            ))}
          </div>
          <p style={{ lineHeight: 1.7, color: 'var(--color-text-muted)', whiteSpace: 'pre-wrap' }}>
            {selectedHilo.contenido}
          </p>
        </div>

        {/* Replies */}
        <h3 style={{ marginBottom: '16px', color: 'var(--color-text-muted)', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          {respuestas.length} Respuesta{respuestas.length !== 1 ? 's' : ''}
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '32px' }}>
          {respuestas.map((r, i) => (
            <div key={r.id || i} className="card" style={{ borderLeft: '3px solid var(--color-acento)', borderRadius: '0 8px 8px 0' }}>
              <div style={{ display: 'flex', gap: '12px', marginBottom: '8px', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                <span>👤 {r.autorNombre}</span>
                <span>🏫 {r.centroeducativo}</span>
                {r.creadoEn && <span>📅 {formatDate(r.creadoEn)}</span>}
              </div>
              <p style={{ lineHeight: 1.7, whiteSpace: 'pre-wrap', fontSize: '0.95rem' }}>{r.contenido}</p>
            </div>
          ))}
        </div>

        {/* Reply form */}
        <div className="card">
          <h3 style={{ marginBottom: '16px', fontSize: '1rem' }}>💬 Añadir una respuesta</h3>
          <form onSubmit={handleSendReply} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <textarea
              className="form-control"
              rows={4}
              required
              style={{ resize: 'vertical' }}
              value={newReply}
              onChange={e => setNewReply(e.target.value)}
              placeholder="Escribe tu respuesta aquí... (parámetros útiles, soluciones, etc.)"
            />
            <button type="submit" className="btn btn-primary" style={{ alignSelf: 'flex-end' }} disabled={sendingReply}>
              {sendingReply ? 'Enviando...' : 'Enviar Respuesta'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '4px' }}>💬 Foro de Coordinación</h1>
          <p style={{ color: 'var(--color-text-muted)' }}>
            Comparte dudas, parámetros de Cura y coordinación con otros institutos.
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowNewThread(true)}>
          + Nuevo Hilo
        </button>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '24px' }}>
        <button
          className={`btn btn-sm ${!filterTag ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setFilterTag('')}
        >
          Todos
        </button>
        {TAGS.map(tag => (
          <button
            key={tag}
            className={`btn btn-sm ${filterTag === tag ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setFilterTag(tag)}
          >
            {tag}
          </button>
        ))}
      </div>

      {/* New Thread Modal */}
      {showNewThread && (
        <div className={styles.modal}>
          <div className={styles.modalCard}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2>Nuevo Hilo</h2>
              <button className="btn btn-secondary btn-sm" onClick={() => setShowNewThread(false)}>✕</button>
            </div>
            <form onSubmit={handleCreateThread} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="form-group">
                <label>Título *</label>
                <input
                  type="text"
                  className="form-control"
                  required
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  placeholder="Ej. ¿Qué velocidad de impresión recomendáis para PLA?"
                />
              </div>
              <div className="form-group">
                <label>Contenido *</label>
                <textarea
                  className="form-control"
                  rows={5}
                  required
                  style={{ resize: 'vertical' }}
                  value={newContent}
                  onChange={e => setNewContent(e.target.value)}
                  placeholder="Describe tu duda, comparte tu experiencia o parámetros..."
                />
              </div>
              <div className="form-group">
                <label>Etiquetas</label>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {TAGS.map(tag => (
                    <button
                      key={tag}
                      type="button"
                      className={`btn btn-sm ${newTags.includes(tag) ? 'btn-primary' : 'btn-secondary'}`}
                      onClick={() => setNewTags(prev =>
                        prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
                      )}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
              <button type="submit" className="btn btn-primary" disabled={creatingThread}>
                {creatingThread ? 'Publicando...' : 'Publicar Hilo'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Thread List */}
      {loading ? (
        <div className="spinner" />
      ) : filteredHilos.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '48px', color: 'var(--color-text-muted)' }}>
          <div style={{ fontSize: '3rem', marginBottom: '12px' }}>💬</div>
          <p>Aún no hay hilos. ¡Sé el primero en publicar!</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {filteredHilos.map(hilo => (
            <div
              key={hilo.id}
              className="card"
              style={{ cursor: 'pointer' }}
              onClick={() => openHilo(hilo)}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px' }}>
                <div style={{ flex: 1 }}>
                  <h3 style={{ fontSize: '1.05rem', marginBottom: '6px', color: 'var(--color-acento)' }}>
                    {hilo.titulo}
                  </h3>
                  <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', marginBottom: '10px', lineHeight: 1.5 }}>
                    {hilo.contenido.slice(0, 150)}{hilo.contenido.length > 150 ? '...' : ''}
                  </p>
                  <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>👤 {hilo.autorNombre}</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>🏫 {hilo.centroeducativo}</span>
                    {hilo.tags?.map(t => <span key={t} className="badge badge-pending" style={{ fontSize: '0.65rem' }}>{t}</span>)}
                  </div>
                </div>
                <div style={{ textAlign: 'center', flexShrink: 0 }}>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--color-cielo)' }}>
                    {hilo.numRespuestas || 0}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>respuestas</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function formatDate(d: any): string {
  const date = d?.toDate ? d.toDate() : new Date(d);
  return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
}
