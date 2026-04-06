'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import styles from './HeroSection.module.css';

// SVG simplificado de las 8 provincias andaluzas (cuadrícula representativa)
const GRID_PIECES = Array.from({ length: 20 }, (_, i) => ({
  id: i,
  delay: i * 0.08,
}));

export default function HeroSection() {
  return (
    <section className={styles.hero}>
      {/* Background */}
      <div className={styles.heroBg}>
        <div className={styles.bgGradient} />
        <div className={styles.bgGrid} />
      </div>

      <div className="container" style={{ position: 'relative', zIndex: 2 }}>
        <div className={styles.heroInner}>
          {/* Left: Copy */}
          <motion.div
            className={styles.heroText}
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          >
            <p className="section-eyebrow">Proyecto Intercentros · ESO · Andalucía</p>
            <h1 className={styles.heroTitle}>
              Construyendo<br />
              <span className="text-gradient">Andalucía</span><br />
              pieza a pieza
            </h1>
            <p className={styles.heroSubtitle}>
              Institutos de toda Andalucía imprimen en 3D cuadrantes topográficos
              para unirlos en un mapa colaborativo de la comunidad autónoma.
              Geografía, Tecnología y Arte en una sola experiencia.
            </p>

            <div className={styles.heroCta}>
              <Link href="/solicitar" className="btn btn-primary">
                ✋ Quiero participar
              </Link>
              <Link href="#sa" className="btn btn-secondary">
                📋 Situación de Aprendizaje
              </Link>
            </div>

            <div className={styles.heroStats}>
              <div className={styles.stat}>
                <span className={styles.statNum}>8</span>
                <span className={styles.statLabel}>Provincias</span>
              </div>
              <div className={styles.statDivider} />
              <div className={styles.stat}>
                <span className={styles.statNum}>20</span>
                <span className={styles.statLabel}>Cuadrantes</span>
              </div>
              <div className={styles.statDivider} />
              <div className={styles.stat}>
                <span className={styles.statNum}>3</span>
                <span className={styles.statLabel}>Materias</span>
              </div>
            </div>
          </motion.div>

          {/* Right: Animated puzzle grid */}
          <motion.div
            className={styles.heroVisual}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <div className={styles.puzzleLabel}>Mapa Topográfico 3D · Cuadrícula 5×4</div>
            <div className={styles.puzzleGrid}>
              {GRID_PIECES.map((piece) => (
                <motion.div
                  key={piece.id}
                  className={styles.puzzlePiece}
                  initial={{ opacity: 0, y: -30, scale: 0.8 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{
                    delay: 0.4 + piece.delay,
                    duration: 0.4,
                    ease: 'backOut',
                  }}
                  whileHover={{ scale: 1.05, zIndex: 10 }}
                  style={{
                    background: `hsl(${(piece.id * 18) % 60 + 100}, 40%, ${20 + (piece.id % 4) * 5}%)`,
                  }}
                >
                  <span className={styles.pieceId}>
                    F{Math.floor(piece.id / 5) + 1}-C{(piece.id % 5) + 1}
                  </span>
                </motion.div>
              ))}
            </div>
            <div className={styles.puzzleCaption}>
              🖨️ Cada instituto imprime su cuadrante asignado
            </div>
          </motion.div>
        </div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        className={styles.scrollIndicator}
        animate={{ y: [0, 8, 0] }}
        transition={{ repeat: Infinity, duration: 1.5 }}
      >
        ↓
      </motion.div>
    </section>
  );
}
