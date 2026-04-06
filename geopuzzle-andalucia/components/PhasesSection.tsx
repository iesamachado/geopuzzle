'use client';

import { motion } from 'framer-motion';
import styles from './PhasesSection.module.css';

const PHASES = [
  {
    num: '01',
    icon: '🗺️',
    title: 'Diseño y Preparación Digital',
    color: '#3B82F6',
    items: [
      'Descarga del archivo STL del cuadrante asignado desde la plataforma',
      'Configuración de parámetros en Cura/PrusaSlicer (resolución, relleno, capas)',
      'Revisión del modelo en CAD y ajuste de escalas',
      'Coordinación con el coordinador del proyecto vía el Foro',
    ],
  },
  {
    num: '02',
    icon: '🖨️',
    title: 'Impresión 3D en el Instituto',
    color: '#F59E0B',
    items: [
      'Impresión de las piezas con PLA o PETG en la impresora del centro',
      'Control de calidad: comprobación dimensional y del relieve',
      'Postprocesado opcional: lijado, relleno de imperfecciones',
      'Fotografía y registro de la pieza terminada',
    ],
  },
  {
    num: '03',
    icon: '🤝',
    title: 'Ensamblaje Intercentros',
    color: '#10B981',
    items: [
      'Encuentro físico en un centro coordinador o evento regional',
      'Ensamblaje del mapa completo con los conectores mecánicos (puzzle)',
      'Presentación pública del mapa a la comunidad educativa',
      'Documentación fotográfica y difusión del proyecto',
    ],
  },
];

export default function PhasesSection() {
  return (
    <section id="fases" style={{ background: 'var(--color-noche-light)', padding: '96px 0' }}>
      <div className="container">
        <div style={{ textAlign: 'center', marginBottom: '64px' }}>
          <p className="section-eyebrow">Metodología</p>
          <h2 className="section-title">Fases del Proyecto</h2>
          <p className="section-subtitle" style={{ margin: '0 auto' }}>
            Un proceso estructurado que lleva a los estudiantes desde el diseño digital
            hasta el ensamblaje físico colaborativo.
          </p>
        </div>

        <div className={styles.phasesGrid}>
          {PHASES.map((phase, i) => (
            <motion.div
              key={phase.num}
              className={`card ${styles.phaseCard}`}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15, duration: 0.5 }}
            >
              <div className={styles.phaseHeader}>
                <span className={styles.phaseNum} style={{ color: phase.color }}>
                  {phase.num}
                </span>
                <span className={styles.phaseIcon}>{phase.icon}</span>
              </div>

              <h3 className={styles.phaseTitle}>{phase.title}</h3>

              <ul className={styles.phaseList}>
                {phase.items.map((item, j) => (
                  <li key={j} className={styles.phaseItem}>
                    <span style={{ color: phase.color }}>→</span>
                    {item}
                  </li>
                ))}
              </ul>

              <div
                className={styles.phaseAccent}
                style={{ background: phase.color }}
              />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
