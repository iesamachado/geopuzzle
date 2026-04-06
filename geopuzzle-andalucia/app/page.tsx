import Navbar from '@/components/Navbar';
import HeroSection from '@/components/HeroSection';
import PhasesSection from '@/components/PhasesSection';
import SituacionAprendizaje from '@/components/SituacionAprendizaje';
import Link from 'next/link';

export default function HomePage() {
  return (
    <>
      <Navbar />
      <main>
        <HeroSection />

        {/* Proyecto Section */}
        <section id="proyecto" style={{ padding: '96px 0' }}>
          <div className="container">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '64px', alignItems: 'center' }}>
              <div>
                <p className="section-eyebrow">¿Qué es GeoPuzzle 3D?</p>
                <h2 className="section-title">Un mapa colaborativo<br /><span className="text-gradient-green">construido por los institutos</span></h2>
                <p style={{ color: 'var(--color-text-muted)', lineHeight: 1.8, marginBottom: '24px', fontSize: '1.05rem' }}>
                  GeoPuzzle 3D Andalucía es un proyecto de aprendizaje-servicio intercentros donde cada
                  instituto recibe la asignación de un cuadrante topográfico de la comunidad autónoma.
                  Usando la herramienta <strong style={{ color: 'var(--color-text)' }}>Maps3D</strong>, los docentes
                  generan los archivos STL de su cuadrante y sus alumnos se encargan de imprimirlo en 3D.
                </p>
                <p style={{ color: 'var(--color-text-muted)', lineHeight: 1.8, fontSize: '1.05rem' }}>
                  El resultado final es un mapa tridimensional de Andalucía que las piezas de todos
                  los centros participantes ensamblan conjuntamente, creando una obra colectiva de
                  orgullo territorial y aprendizaje significativo.
                </p>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                {[
                  { icon: '🏔️', title: 'Topografía Real', desc: 'Datos de altitud reales de Andalucía convertidos en relieve imprimible.' },
                  { icon: '🤝', title: 'Intercentros', desc: 'Coordinación y comunicación entre institutos de toda la comunidad.' },
                  { icon: '🔬', title: 'STEM + Humanidades', desc: 'Geografía, Tecnología y Arte: aprendizaje interdisciplinar real.' },
                  { icon: '🎯', title: 'LOMLOE', desc: 'Situación de Aprendizaje alineada con el currículo andaluz vigente.' },
                ].map((item) => (
                  <div key={item.title} className="card" style={{ padding: '20px' }}>
                    <div style={{ fontSize: '2rem', marginBottom: '8px' }}>{item.icon}</div>
                    <h4 style={{ fontSize: '0.95rem', marginBottom: '4px' }}>{item.title}</h4>
                    <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', lineHeight: 1.5 }}>{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <PhasesSection />
        <SituacionAprendizaje />

        {/* CTA Final */}
        <section style={{ padding: '96px 0', background: 'var(--color-noche-light)' }}>
          <div className="container" style={{ textAlign: 'center' }}>
            <h2 className="section-title">¿Quieres participar con tu instituto?</h2>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '1.1rem', marginBottom: '40px', maxWidth: '500px', margin: '16px auto 40px' }}>
              Solicita acceso a la plataforma, recibe tu cuadrante asignado y accede
              al foro de coordinación con el resto de centros.
            </p>
            <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link href="/solicitar" className="btn btn-primary" style={{ fontSize: '1.05rem', padding: '14px 32px' }}>
                ✋ Enviar solicitud de participación
              </Link>
              <Link href="/login" className="btn btn-secondary" style={{ fontSize: '1.05rem', padding: '14px 32px' }}>
                Ya tengo cuenta — Acceder
              </Link>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer style={{
          padding: '32px 0',
          borderTop: '1px solid var(--color-border)',
          textAlign: 'center',
          color: 'var(--color-text-muted)',
          fontSize: '0.85rem'
        }}>
          <div className="container">
            <p>
              <strong style={{ color: 'var(--color-text)' }}>GeoPuzzle 3D Andalucía</strong> — Proyecto educativo intercentros · ESO
            </p>
            <p style={{ marginTop: '8px' }}>
              Situación de Aprendizaje diseñada bajo LOMLOE (LO 3/2020), RD 217/2022 y Decreto 102/2023 / Orden 30 mayo 2023 (Junta de Andalucía, BOJA)
            </p>
          </div>
        </footer>
      </main>
    </>
  );
}
