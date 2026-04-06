import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { AuthProvider } from '@/lib/auth-context';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'GeoPuzzle 3D Andalucía — Proyecto Intercentros',
  description:
    'Proyecto educativo colaborativo para imprimir y ensamblar un mapa tridimensional de Andalucía entre institutos. Situación de aprendizaje LOMLOE para ESO.',
  keywords: ['3D', 'Andalucía', 'impresión 3D', 'geografía', 'educación', 'LOMLOE', 'ESO'],
  openGraph: {
    title: 'GeoPuzzle 3D Andalucía',
    description: 'Construyendo Andalucía pieza a pieza en los institutos.',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className={inter.className}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
