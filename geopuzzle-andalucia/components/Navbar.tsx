'use client';

import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import styles from './Navbar.module.css';

export default function Navbar() {
  const { user, profile, isApproved } = useAuth();

  return (
    <nav className="navbar">
      <Link href="/" className="navbar-brand">
        <span style={{ fontSize: '1.4rem' }}>🗺️</span>
        <span className="text-gradient">GeoPuzzle 3D</span>
        <span style={{ color: 'var(--color-text-muted)', fontWeight: 400, fontSize: '0.85rem' }}>Andalucía</span>
      </Link>

      <ul className="navbar-nav">
        <li><Link href="#proyecto">El Proyecto</Link></li>
        <li><Link href="#sa">Situación de Aprendizaje</Link></li>
        <li><Link href="#fases">Fases</Link></li>

        {user && isApproved ? (
          <>
            <li>
              <Link href="/dashboard" className="btn btn-secondary" style={{ padding: '8px 16px', fontSize: '0.85rem' }}>
                Dashboard
              </Link>
            </li>
          </>
        ) : user ? (
          <li>
            <Link href="/solicitar" className="btn btn-secondary" style={{ padding: '8px 16px', fontSize: '0.85rem' }}>
              Solicitud Pendiente
            </Link>
          </li>
        ) : (
          <>
            <li>
              <Link href="/login" className="btn btn-secondary" style={{ padding: '8px 16px', fontSize: '0.85rem' }}>
                Acceder
              </Link>
            </li>
            <li>
              <Link href="/solicitar" className="btn btn-primary" style={{ padding: '8px 20px', fontSize: '0.85rem' }}>
                Participar
              </Link>
            </li>
          </>
        )}
      </ul>
    </nav>
  );
}
