'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV_ITEMS = [
  { href: '/dashboard', icon: '🏠', label: 'Inicio' },
  { href: '/dashboard/foro', icon: '💬', label: 'Foro' },
  { href: '/dashboard/mapa', icon: '🗺️', label: 'Mapa Cuadrantes' },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, profile, loading, isApproved, isAdmin } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !user) router.push('/login');
    if (!loading && user && !isApproved && !isAdmin) router.push('/pendiente');
  }, [loading, user, isApproved, isAdmin]);

  if (loading || !user) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <div className="spinner" />
      </div>
    );
  }

  return (
    <>
      {/* Top Bar */}
      <header style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        padding: '0 24px', height: '65px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: 'var(--color-noche-light)',
        borderBottom: '1px solid var(--color-border)',
      }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 800 }}>
          <span>🗺️</span>
          <span className="text-gradient">GeoPuzzle</span>
          <span style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem', fontWeight: 400 }}>Dashboard</span>
        </Link>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {isAdmin && (
            <Link href="/dashboard/admin" className="btn btn-secondary" style={{ padding: '6px 14px', fontSize: '0.8rem' }}>
              ⚙️ Admin
            </Link>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: '32px', height: '32px', borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--color-acento), #F97316)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 700, fontSize: '0.85rem', color: 'var(--color-noche)',
            }}>
              {profile?.nombre?.charAt(0) || user.email?.charAt(0)?.toUpperCase()}
            </div>
            <div>
              <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                {profile?.nombre || user.email}
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>
                {profile?.centroeducativo}
              </div>
            </div>
          </div>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => signOut(auth).then(() => router.push('/'))}
          >
            Salir
          </button>
        </div>
      </header>

      <div className="dashboard-layout">
        {/* Sidebar */}
        <aside className="dashboard-sidebar">
          <ul className="sidebar-nav">
            {NAV_ITEMS.map(item => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={pathname === item.href ? 'active' : ''}
                >
                  <span>{item.icon}</span>
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </aside>

        {/* Main Content */}
        <main className="dashboard-main">
          {children}
        </main>
      </div>
    </>
  );
}
