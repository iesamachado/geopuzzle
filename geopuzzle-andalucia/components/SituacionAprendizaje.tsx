'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import styles from './SituacionAprendizaje.module.css';

const SECTIONS = [
  {
    id: 'marco',
    title: '📜 Marco Normativo de Referencia',
    content: `
**Ley Orgánica 3/2020, de 29 de diciembre (LOMLOE)** — Establece el marco general del sistema educativo español, introduciendo el enfoque competencial y las Situaciones de Aprendizaje como estrategia metodológica esencial.

**Real Decreto 217/2022, de 29 de marzo** (BOE nº 76, 30 de marzo de 2022) — Fija las enseñanzas mínimas de la ESO a nivel estatal: Perfil de Salida, ocho Competencias Clave, Descriptores Operativos y estructura curricular.

**Decreto 102/2023, de 9 de mayo** (BOJA nº 90, 12 de mayo de 2023) — Establece la ordenación y el currículo de la ESO en Andalucía, concretando los principios de la LOMLOE en el ámbito autonómico.

**Orden de 30 de mayo de 2023** (BOJA nº 104, 2 de junio de 2023) — Desarrolla el currículo correspondiente a la ESO en Andalucía. Sus Anexos contienen los saberes básicos, competencias específicas y criterios de evaluación de todas las materias.
    `,
  },
  {
    id: 'descripcion',
    title: '📌 Descripción de la Situación de Aprendizaje',
    content: `
**Título:** "Andalucía en Tus Manos: Creando un Mapa 3D Intercentros"

**Niveles:** 3º y 4º de ESO

**Duración estimada:** 6–8 sesiones por departamento (trabajo interdisciplinar coordinado)

**Contexto:** En el marco de un proyecto colaborativo entre diversos institutos de Andalucía, el alumnado participará en todas las fases de creación de un mapa topográfico tridimensional de la comunidad autónoma: desde el análisis geográfico del cuadrante asignado hasta la impresión física en 3D y el ensamblaje con el mapa general.

**Reto o Desafío:** ¿Cómo podemos representar con precisión y creatividad el territorio andaluz para que, al unir las piezas de todos los institutos, obtengamos un mapa tridimensional fiel y estéticamente atractivo de nuestra tierra?

**Producto Final:**
- Una pieza de puzle 3D impresa, que representa topográficamente el cuadrante geográfico asignado al centro.
- Una memoria de proceso en la que el alumnado documenta las decisiones técnicas, geográficas y estéticas tomadas.
- Una presentación oral ante el grupo sobre el territorio representado.
    `,
  },
  {
    id: 'competencias',
    title: '🧭 Competencias Clave y Descriptores Operativos',
    content: `
| Competencia Clave | Código | Descriptores Operativos Activados |
|---|---|---|
| **Competencia Digital** | CD | CD.1 (información digital), CD.2 (comunicación), CD.3 (creación de contenidos digitales con software 3D) |
| **Competencia Matemática y STEM** | STEM | STEM.1 (resolución problemas), STEM.2 (modelización), STEM.4 (pensamiento científico) |
| **Conciencia y Expresión Culturales** | CCEC | CCEC.2 (patrimonio cultural), CCEC.4 (creación y autoría) |
| **Comp. Personal, Social y de Aprender** | CPSAA | CPSAA.3 (autogestión y trabajo en equipo), CPSAA.5 (cooperación) |
| **Competencia Ciudadana** | CC | CC.2 (identidad territorial y pertenencia) |

*Referencia: Perfil de Salida, RD 217/2022, Anexo I*
    `,
  },
  {
    id: 'materias',
    title: '📚 Implicación por Materias (3º y 4º ESO)',
    content: `
### Geografía e Historia — 3º ESO
*(Orden 30 mayo 2023, BOJA nº 104 — Anexo II, Bloque B: El mundo en que vivimos)*

**Saberes básicos activados:**
- El relieve de la Península Ibérica y Andalucía: formas del relieve continental y litoral.
- La red hidrográfica: cuencas y ríos de Andalucía.
- Representación cartográfica: mapas topográficos, curvas de nivel, escala y proyecciones.
- Lectura e interpretación de imágenes del territorio.

**Competencias específicas trabajadas (CE):**
- CE3.GH3: "Analizar las características del territorio español y andaluz, identificando los principales elementos del relieve, la hidrografía y el clima, utilizando distintas fuentes de información geográfica."

---

### Tecnología y Digitalización
*(Bloque C: Tecnología Digital — Pensamiento computacional y diseño)*

**Saberes básicos activados:**
- Diseño asistido por ordenador (CAD): visualización, manipulación y preparación de archivos 3D.
- Fabricación digital: fundamentos del laminado (slicing) y la impresión 3D por deposición de filamento (FDM).
- Resolución iterativa de problemas técnicos: prueba y error en el proceso de impresión.
- Documentación técnica: elaboración de memorias de proyecto.

**Competencias específicas trabajadas:**
- CE4.TD: "Diseñar, crear y evaluar objetos y sistemas tecnológicos mediante procesos de fabricación digital, aplicando metodologías de diseño iterativo."

---

### Educación Plástica, Visual y Audiovisual
*(Bloque B: Expresión y comunicación visual)*

**Saberes básicos activados:**
- Escala y proporciones: relación entre el objeto real y su representación.
- Teoría del color: aplicada al postprocesado y pintura de la maqueta.
- Texturas: tratamiento de superficies, técnicas de acabado en materiales plásticos (PLA).
- Composición y visualización tridimensional: percepción del espacio y el volumen.
    `,
  },
  {
    id: 'rubrica',
    title: '📊 Rúbrica de Evaluación',
    content: `
La evaluación del proyecto se realiza mediante rúbricas basadas en los criterios de evaluación de la Orden de 30 de mayo de 2023 (BOJA nº 104).

| Criterio | Logro Inicial (1-4) | Logro Medio (5-6) | Logro Notable (7-8) | Logro Excelente (9-10) |
|---|---|---|---|---|
| **Identifica y describe el relieve del cuadrante asignado** | Identifica elementos básicos con ayuda | Describe los principales elementos con cierta precisión | Describe con precisión el relieve e hidrografía | Analiza con profundidad, vinculando relieve, clima e impacto humano |
| **Configura y utiliza el software 3D (Cura/CAD)** | Con supervisión constante del docente | Configura parámetros básicos de forma autónoma | Configura y justifica los parámetros de impresión | Optimiza el proceso y resuelve incidencias de forma creativa |
| **Calidad técnica de la pieza impresa** | Impresión fallida o con errores graves | Impresión funcional con defectos visibles | Buena calidad, encaje correcto con piezas adyacentes | Calidad excelente, postprocesado y acabado cuidados |
| **Aplica criterios de escala y proporción** | No aplica criterios de escala | Aplica escala con errores significativos | Aplica la escala correctamente | Reflexiona sobre la escala y las decisiones de diseño |
| **Trabajo colaborativo y participación en el foro** | Participación mínima o nula | Participa puntualmente y con orientación | Colabora activamente y ayuda a compañeros | Lidera la coordinación, genera valor para el grupo |
| **Memoria de proceso y presentación oral** | Incompleta o sin estructura | Describe el proceso con coherencia básica | Documenta con detalle y argumenta las decisiones | Presentación fluida, crítica y reflexiva del aprendizaje |

*Criterios adaptados de: Geografía e Historia (CE3.GH3), Tecnología y Digitalización (CE4.TD) y Educación Plástica (CE2.EPVA). Orden 30 mayo 2023, BOJA nº 104.*
    `,
  },
];

export default function SituacionAprendizaje() {
  const [open, setOpen] = useState<string | null>('descripcion');

  return (
    <section id="sa" className={styles.saSection}>
      <div className="container">
        <div style={{ textAlign: 'center', marginBottom: '64px' }}>
          <p className="section-eyebrow">Documentación Pedagógica · LOMLOE/BOJA</p>
          <h2 className="section-title">Situación de Aprendizaje</h2>
          <p className="section-subtitle" style={{ margin: '0 auto' }}>
            &quot;Andalucía en Tus Manos&quot; — Diseñada y referenciada según el currículo oficial
            andaluz (Orden 30 mayo 2023, BOJA nº 104) para 3º y 4º de ESO.
          </p>
        </div>

        <div className={styles.accordion}>
          {SECTIONS.map((sec) => (
            <div key={sec.id} className={styles.accordionItem}>
              <button
                className={`${styles.accordionTrigger} ${open === sec.id ? styles.open : ''}`}
                onClick={() => setOpen(open === sec.id ? null : sec.id)}
              >
                <span>{sec.title}</span>
                <span className={styles.chevron}>{open === sec.id ? '▲' : '▼'}</span>
              </button>

              <AnimatePresence initial={false}>
                {open === sec.id && (
                  <motion.div
                    className={styles.accordionContent}
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: 'easeInOut' }}
                  >
                    <div
                      className={styles.markdownContent}
                      dangerouslySetInnerHTML={{
                        __html: renderMarkdown(sec.content),
                      }}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>

        <div className={styles.saFooter}>
          <p>
            📄 Referencias: <strong>LOMLOE (LO 3/2020)</strong> · <strong>RD 217/2022</strong> ·{' '}
            <strong>Decreto 102/2023 (BOJA nº 90)</strong> · <strong>Orden 30 mayo 2023 (BOJA nº 104)</strong>
          </p>
        </div>
      </div>
    </section>
  );
}

// Minimal markdown renderer for tables, bold, headings, lists
function renderMarkdown(md: string): string {
  return md
    .trim()
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/^### (.+)$/gm, '<h4 style="margin: 20px 0 8px; color: var(--color-acento);">$1</h4>')
    .replace(/^---$/gm, '<hr style="border-color: var(--color-border); margin: 20px 0;">')
    // Table support
    .replace(/^\|(.+)\|$/gm, (line) => {
      const cells = line.split('|').filter(Boolean).map(c => c.trim());
      return `<tr>${cells.map(c => `<td>${c}</td>`).join('')}</tr>`;
    })
    .replace(/(<tr>.*<\/tr>\n?)+/gs, (tables) => {
      const rows = tables.match(/<tr>.*?<\/tr>/gs) || [];
      const [header, ...body] = rows;
      const th = (header || '').replace(/<td>/g, '<th>').replace(/<\/td>/g, '</th>');
      const bodyFiltered = body.filter(r => !r.includes('---'));
      return `<div class="${styles.tableWrapper}"><table><thead>${th}</thead><tbody>${bodyFiltered.join('')}</tbody></table></div>`;
    })
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    .replace(/(<li>.*<\/li>\n?)+/gs, '<ul>$&</ul>')
    .replace(/\n\n/g, '</p><p>')
    .replace(/^(.+)$/gm, (line) => {
      if (line.startsWith('<') || line === '') return line;
      return line;
    });
}
